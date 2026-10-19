"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, ChevronRight, Info, Keyboard, Lightbulb, Loader2, Mic, Pencil, RotateCcw, SkipForward, Square, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { MirAvatar, type AvatarState } from "@/components/mir-avatar";
import { Waveform } from "@/components/waveform";
import type { InterviewAI } from "@/lib/ai/provider";
import { getProvider } from "@/lib/ai/provider";
import type { AnswerRecord, InterviewConfig, PlannedQuestion, QuestionCategory } from "@/lib/types";
import { getLastConfig, saveSession, takePendingConfig } from "@/lib/storage";
import { questionMeta } from "@/lib/analysis/analyze";
import { interviewTitle } from "@/lib/data/options";
import { inAppBrowser, speak, srSupported, stopSpeaking, ttsSupported, useSpeechRecognition } from "@/lib/speech";
import { cn, formatClock, uid } from "@/lib/utils";
import { T, getLang } from "@/lib/i18n";

type Phase = "loading" | "ready" | "asking" | "answering" | "thinking" | "finishing" | "error";
type AnswerSub = "idle" | "recording" | "review";

interface CurrentQ {
  id: string;
  baseId: string;
  text: string;
  isFollowUp: boolean;
  category: QuestionCategory;
  idealSec: [number, number];
  /** 追問時：原本的題目 */
  parentText?: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isTouchDevice() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function InterviewRoom() {
  const router = useRouter();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [questions, setQuestions] = useState<PlannedQuestion[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [current, setCurrent] = useState<CurrentQ | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [mirLine, setMirLine] = useState("");
  const [avatar, setAvatar] = useState<AvatarState>("idle");
  const [sub, setSub] = useState<AnswerSub>("idle");
  const [typed, setTyped] = useState("");
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [ttsOn, setTtsOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [answerCount, setAnswerCount] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  const aiRef = useRef<InterviewAI | null>(null);
  const answersRef = useRef<AnswerRecord[]>([]);
  const followRef = useRef(0);
  const qIndexRef = useRef(0);
  const ttsRef = useRef(true);
  const recStartRef = useRef<number | null>(null);
  const recAccRef = useRef(0);
  const shownAtRef = useRef(0);
  const camStreamRef = useRef<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  const micBtnRef = useRef<HTMLButtonElement>(null);
  const typedRef = useRef<HTMLTextAreaElement>(null);

  const lang = config?.lang ?? "zh";
  const tr = (zh: string, en: string) => (lang === "en" ? en : zh);
  const sr = useSpeechRecognition(lang);

  /* ── 載入設定與題目 ── */
  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const c = takePendingConfig() ?? { ...getLastConfig(), lang: getLang() };
      setConfig(c);
      setMode(c.mode);
      const ai = await getProvider();
      aiRef.current = ai;
      const qs = await ai.planQuestions(c);
      if (!qs.length) throw new Error("no questions");
      setQuestions(qs);
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      cancelledRef.current = true;
      stopSpeaking();
    };
  }, [load]);

  /* ── 輪到使用者回答時，把焦點移到主要操作（鍵盤與讀屏使用者） ── */
  useEffect(() => {
    if (phase !== "answering") return;
    const t = setTimeout(() => (mode === "text" ? typedRef.current : micBtnRef.current)?.focus({ preventScroll: true }), 50);
    return () => clearTimeout(t);
  }, [phase, mode, current?.id]);

  /* ── 計時 ── */
  useEffect(() => {
    if (phase === "loading" || phase === "ready" || phase === "finishing" || phase === "error") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  /* ── 語音辨識錯誤 → 切換打字模式 ── */
  useEffect(() => {
    if (!sr.error) return;
    const msg =
      sr.error === "denied"
        ? tr("沒有取得麥克風權限，已切換成打字模式。想用語音，請允許麥克風後重新整理。", "Microphone access was blocked, so we switched to typing. To use voice, allow the microphone and reload.")
        : sr.error === "no-mic"
          ? tr("找不到麥克風，已切換成打字模式。", "No microphone found, so we switched to typing.")
          : sr.error === "network"
            ? tr("語音辨識連線不穩，已切換成打字模式。你剛剛說的內容還在。", "Speech recognition lost connection, so we switched to typing. What you said is kept.")
            : tr("這個瀏覽器不支援語音辨識，已切換成打字模式。", "This browser doesn't support speech recognition, so we switched to typing.");
    setNotice(msg);
    setMode("text");
    setTyped((t) => t || sr.text);
    setSub("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tr only depends on the session language, fixed for the session
  }, [sr.error, sr.text]);

  /* ── 鏡頭（只在本機顯示） ── */
  useEffect(() => {
    if (!camOn) {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
      setCamStream(null);
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        camStreamRef.current = s;
        setCamStream(s);
        setCamError(false);
      })
      .catch(() => {
        setCamError(true);
        setCamOn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [camOn]);

  useEffect(
    () => () => {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  useEffect(() => () => micStream?.getTracks().forEach((t) => t.stop()), [micStream]);

  useEffect(() => {
    ttsRef.current = ttsOn;
    if (!ttsOn) stopSpeaking();
  }, [ttsOn]);

  /* ── Mir 說話 ── */
  const say = useCallback(
    async (line: string) => {
      setMirLine(line);
      setAvatar("speaking");
      if (ttsRef.current && ttsSupported()) await speak(line, lang);
      else await wait(Math.min(1400, 400 + line.length * 15));
      if (!cancelledRef.current) setAvatar("idle");
    },
    [lang],
  );

  const ask = useCallback(
    async (q: CurrentQ, prefix?: string) => {
      setCurrent(q);
      setPhase("asking");
      setSub("idle");
      setTyped("");
      setEditing(false);
      sr.reset();
      recAccRef.current = 0;
      recStartRef.current = null;
      setShowHint(config?.difficulty === "warmup");
      await say(prefix ? `${prefix}${q.text}` : q.text);
      if (cancelledRef.current) return;
      shownAtRef.current = Date.now();
      setAvatar(mode === "text" ? "listening" : "idle");
      setPhase("answering");
    },
    [config?.difficulty, mode, say, sr],
  );

  /* ── 結束並產生報告 ── */
  const finish = useCallback(
    async (all: AnswerRecord[]) => {
      if (!config || !aiRef.current) return;
      sr.stop();
      stopSpeaking();
      setPhase("finishing");
      micStream?.getTracks().forEach((t) => t.stop());
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      const report = await aiRef.current.evaluate({ ...config, mode }, all);
      const id = uid();
      saveSession({ id, createdAt: new Date().toISOString(), config: { ...config, mode }, answers: all, report });
      router.replace(`/report/?id=${id}`);
    },
    [config, micStream, mode, router, sr],
  );

  const goNext = useCallback(
    async (all: AnswerRecord[]) => {
      if (!config || !aiRef.current) return;
      const ni = qIndexRef.current + 1;
      if (ni >= questions.length) return finish(all);
      qIndexRef.current = ni;
      setQIndex(ni);
      followRef.current = 0;
      const q = questions[ni];
      await ask(
        { id: q.id, baseId: q.baseId, text: q.text, isFollowUp: false, category: q.category, idealSec: q.idealSec },
        aiRef.current.acknowledge(config, ni) + (lang === "zh" ? "" : " "),
      );
    },
    [ask, config, finish, lang, questions],
  );

  /* ── 開始 ── */
  const begin = async () => {
    if (!config) return;
    // iOS 需要在使用者手勢內先呼叫一次語音合成
    if (ttsSupported()) {
      try {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
      } catch {
        /* ignore */
      }
    }
    let m = mode;
    if (m === "voice" && !srSupported()) {
      const app = inAppBrowser();
      setNotice(
        app
          ? tr(`${app} 內建瀏覽器不支援語音辨識，已切換成打字模式。想用語音請用 Chrome 或 Safari 開啟。`, `${app}'s in-app browser doesn't support speech recognition, so we switched to typing. Open this page in Chrome or Safari to use voice.`)
          : tr("這個瀏覽器不支援語音辨識，已切換成打字模式。建議使用 Chrome 或 Safari。", "This browser doesn't support speech recognition, so we switched to typing. Chrome or Safari work best."),
      );
      m = "text";
      setMode("text");
    }
    if (m === "voice" && !isTouchDevice() && navigator.mediaDevices?.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(s);
      } catch {
        setNotice(tr("沒有取得麥克風權限，已切換成打字模式。想用語音，請允許麥克風後重新整理。", "Microphone access was blocked, so we switched to typing. To use voice, allow the microphone and reload."));
        m = "text";
        setMode("text");
      }
    }
    setSessionStart(Date.now());
    setNow(Date.now());
    const ai = aiRef.current!;
    setPhase("asking");
    await say(ai.greeting(config, questions.length));
    if (cancelledRef.current) return;
    const q = questions[0];
    qIndexRef.current = 0;
    await ask({ id: q.id, baseId: q.baseId, text: q.text, isFollowUp: false, category: q.category, idealSec: q.idealSec });
  };

  /* ── 錄音控制 ── */
  const startRecording = () => {
    stopSpeaking();
    if (sub === "idle") {
      sr.reset();
      recAccRef.current = 0;
    }
    const ok = sr.start();
    if (!ok) return;
    recStartRef.current = Date.now();
    setEditing(false);
    setSub("recording");
    setAvatar("listening");
  };

  const stopRecording = () => {
    sr.stop();
    if (recStartRef.current) recAccRef.current += Date.now() - recStartRef.current;
    recStartRef.current = null;
    setSub("review");
    setAvatar("idle");
  };

  const reRecord = () => {
    sr.stop();
    sr.reset();
    recAccRef.current = 0;
    recStartRef.current = null;
    setEditing(false);
    setSub("idle");
  };

  const submit = async (skipped = false) => {
    if (!current || !config || !aiRef.current) return;
    if (sub === "recording") {
      sr.stop();
      if (recStartRef.current) recAccRef.current += Date.now() - recStartRef.current;
    }
    const transcript = skipped ? "" : (mode === "text" ? typed : sr.text).trim();
    const durationSec = mode === "voice" ? Math.round(recAccRef.current / 1000) : Math.round((Date.now() - shownAtRef.current) / 1000);
    const rec: AnswerRecord = {
      questionId: current.id,
      baseId: current.baseId,
      questionText: current.text,
      isFollowUp: current.isFollowUp,
      transcript,
      durationSec,
      skipped: skipped || !transcript,
    };
    const all = [...answersRef.current, rec];
    answersRef.current = all;
    setAnswerCount(all.length);
    setSub("idle");
    setPhase("thinking");
    setAvatar("thinking");

    if (!rec.skipped) {
      const fu = await aiRef.current.followUp({
        config,
        question: { id: current.id, baseId: current.baseId, text: current.text, category: current.category, idealSec: current.idealSec },
        answer: transcript,
        durationSec,
        followUpsSoFar: followRef.current,
      });
      if (cancelledRef.current) return;
      if (fu) {
        followRef.current += 1;
        await ask({
          id: `${current.baseId}-f${followRef.current}`,
          baseId: current.baseId,
          text: fu,
          isFollowUp: true,
          category: current.category,
          idealSec: [20, 75],
          parentText: current.parentText ?? current.text,
        });
        return;
      }
    } else {
      await wait(300);
    }
    await goNext(all);
  };

  const endEarly = () => {
    setConfirmExit(false);
    if (answersRef.current.filter((a) => !a.skipped).length === 0) {
      stopSpeaking();
      sr.stop();
      router.push("/setup/");
      return;
    }
    finish(answersRef.current);
  };

  /* ───────────── 畫面 ───────────── */

  if (phase === "loading") {
    // 與準備畫面同樣的外框，讓第一屏不用等 JS 就有內容（也避免版面跳動）
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6" role="status" aria-live="polite">
        <Card>
          <CardContent className="flex flex-col items-center text-center">
            <MirAvatar state="thinking" size={104} />
            <h1 className="mt-4 text-2xl font-bold">
              <T zh="準備好了嗎？" en="Ready?" />
            </h1>
            <p className="mt-2 text-ink-2">
              <T zh="Mir 正在準備題目…" en="Mir is preparing your questions…" />
            </p>
            <div className="mt-5 w-full space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-canvas" />
              ))}
            </div>
            <Button size="xl" className="mt-6 w-full" disabled>
              <Loader2 className="animate-spin" aria-hidden />
              <T zh="準備中" en="Preparing" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "error" || !config) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <MirAvatar size={96} />
        <h1 className="text-xl font-bold">{tr("題目沒有載入成功", "Couldn't load the questions")}</h1>
        <p className="text-ink-2">{tr("可能是網路不穩。你的設定還在，再試一次就好。", "Your connection may have dropped. Your settings are saved, so just try again.")}</p>
        <div className="flex gap-2">
          <Button onClick={load}>
            <RotateCcw aria-hidden />
            {tr("再試一次", "Try again")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/setup/">{tr("回到設定", "Back to setup")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "finishing") {
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center" role="status" aria-live="polite">
        <MirAvatar state="thinking" size={110} />
        <div>
          <p className="text-lg font-bold text-ink">{tr("Mir 正在整理你的回饋報告", "Mir is writing your feedback")}</p>
          <p className="mt-1 text-sm text-muted">{tr("通常只要幾秒鐘", "This takes a few seconds")}</p>
        </div>
        <ul className="w-full space-y-2 text-left text-sm">
          {(lang === "en" ? ["Measuring pace and filler words", "Checking STAR structure and numbers", "Checking for red flags", "Writing examples and your plan"] : ["計算語速與口頭禪", "檢查 STAR 結構和具體數字", "對照台灣 HR 的紅旗清單", "產生改寫範例與練習計畫"]).map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line-soft bg-white px-4 py-2.5" style={{ animation: `fadeIn .4s ${i * 0.25}s both` }}>
              <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
              {s}
            </li>
          ))}
        </ul>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
      </div>
    );
  }

  /* ── 準備畫面 ── */
  if (phase === "ready") {
    const app = inAppBrowser();
    const voiceUnsupported = config.mode === "voice" && !srSupported();
    return (
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="flex flex-col items-center text-center">
            <MirAvatar size={104} />
            <h1 className="mt-4 text-2xl font-bold">{config.singleQuestionId ? tr("單題練習", "Single question") : config.quick ? tr("3 分鐘暖身", "3-minute warm-up") : tr("準備好了嗎？", "Ready?")}</h1>
            <p className="mt-2 text-ink-2">
              {config.quick
                ? tr("三題常見問題，不追問。", "Three common questions, no follow-ups.")
                : config.singleQuestionId
                  ? questions[0]?.text
                  : `${interviewTitle(config, lang, true)}${tr(`，共 ${questions.length} 題`, `, ${questions.length} questions`)}`}
            </p>

            <div className="mt-5 w-full space-y-3 text-left">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-bold">
                    {mode === "voice" ? <Mic className="size-5 text-brand" aria-hidden /> : <Keyboard className="size-5 text-brand" aria-hidden />}
                    {mode === "voice" ? tr("用說的回答", "Answer by voice") : tr("用打字回答", "Answer by typing")}
                  </span>
                  {mode === "voice" && <span className="pl-7 text-xs text-muted">{tr("MirWork 不保存錄音", "MirWork doesn't store recordings")}</span>}
                </span>
                <button type="button" onClick={() => setMode(mode === "voice" ? "text" : "voice")} className="cursor-pointer text-sm font-bold text-brand underline-offset-4 hover:underline">
                  {mode === "voice" ? tr("改成打字", "Switch to typing") : tr("改成語音", "Switch to voice")}
                </button>
              </div>
              <label className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                <span className="flex items-center gap-2 font-bold">
                  <Volume2 className="size-5 text-brand" aria-hidden />
                  {tr("Mir 朗讀題目", "Mir reads questions aloud")}
                </span>
                <Switch checked={ttsOn} onCheckedChange={setTtsOn} aria-label={tr("Mir 朗讀題目", "Mir reads questions aloud")} />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-bold">
                    <Camera className="size-5 text-brand" aria-hidden />
                    {tr("看自己的表情", "See yourself on camera")}
                  </span>
                  <span className="pl-7 text-xs text-muted">{tr("只在本機顯示，不錄影", "Shown only on your device, never recorded")}</span>
                </span>
                <Switch checked={camOn} onCheckedChange={setCamOn} aria-label={tr("開啟鏡頭", "Camera")} />
              </label>
              {camError && <p className="text-sm text-warn">{tr("無法開啟鏡頭，可能沒有權限。不開也可以練習。", "Couldn't open the camera. You can practise without it.")}</p>}
              {(voiceUnsupported || app) && mode === "voice" && (
                <p className="rounded-xl bg-warn-tint px-4 py-3 text-sm text-warn">
                  {app ? tr(`你正在用 ${app} 內建瀏覽器，語音辨識可能無法使用。建議改用 Chrome 或 Safari 開啟。`, `You're in ${app}'s in-app browser, where voice may not work. Open this page in Chrome or Safari.`) : tr("這個瀏覽器不支援語音辨識，開始後會改用打字。建議使用 Chrome 或 Safari。", "This browser doesn't support speech recognition, so you'll type instead. Chrome or Safari work best.")}
                </p>
              )}
            </div>

            <p className="mt-4 text-sm text-muted">{tr("緊張很正常，隨時可以暫停或結束。", "Nerves are normal. You can stop at any time.")}</p>
            <Button size="xl" className="mt-6 w-full" onClick={begin}>
              {tr("開始面試", "Start interview")}
            </Button>
            <Link href="/setup/" className="mt-3 text-sm font-bold text-muted hover:text-ink hover:underline">
              {tr("修改設定", "Change settings")}
            </Link>
          </CardContent>
        </Card>
        {camOn && camStream && <SelfView stream={camStream} />}
      </div>
    );
  }

  /* ── 面試進行中 ── */
  const meta = current ? questionMeta(current.baseId) : null;
  const totalElapsed = sessionStart ? (now - sessionStart) / 1000 : 0;
  const answerSec = mode === "voice" ? (recAccRef.current + (recStartRef.current ? now - recStartRef.current : 0)) / 1000 : phase === "answering" ? (now - shownAtRef.current) / 1000 : 0;
  const [minSec, maxSec] = current?.idealSec ?? [30, 90];
  const progressPct = questions.length ? ((qIndex + (phase === "thinking" ? 1 : 0)) / questions.length) * 100 : 0;
  const busy = phase === "asking" || phase === "thinking";
  const liveText = mode === "voice" ? sr.text : typed;
  const allowHint = config.difficulty !== "pressure";

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-canvas">
      {/* 面試狀態列 */}
      <div className="sticky top-14 z-30 border-b border-line-soft bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-ink-2">
              <span>
                {tr(`第 ${Math.min(qIndex + 1, questions.length)} / ${questions.length} 題`, `Question ${Math.min(qIndex + 1, questions.length)} of ${questions.length}`)}
                {current?.isFollowUp ? <span className="text-warn">{tr("（追問）", " (follow-up)")}</span> : null}
              </span>
              <span className="tabular-nums" aria-label={tr(`已進行 ${formatClock(totalElapsed)}`, `Elapsed ${formatClock(totalElapsed)}`)}>
                {formatClock(totalElapsed)}
              </span>
            </div>
            <Progress value={progressPct} className="mt-1.5 h-1.5" aria-label={tr("面試進度", "Interview progress")} />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTtsOn(!ttsOn)} aria-label={ttsOn ? tr("關閉朗讀", "Mute Mir") : tr("開啟朗讀", "Unmute Mir")} aria-pressed={ttsOn}>
            {ttsOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCamOn(!camOn)} aria-label={camOn ? tr("關閉鏡頭", "Turn camera off") : tr("開啟鏡頭", "Turn camera on")} aria-pressed={camOn}>
            {camOn ? <Camera aria-hidden /> : <CameraOff aria-hidden />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmExit(true)}>
            <X aria-hidden />
            {tr("結束", "End")}
          </Button>
        </div>
      </div>

      {confirmExit && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="exit-title" className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="exit-title" className="text-lg font-bold">{tr("要結束這次面試嗎？", "End this interview?")}</h2>
            <p className="mt-2 text-sm text-ink-2">
              {answerCount > 0 ? tr(`你已經回答 ${answerCount} 題，結束後會用這些回答產生報告。`, `You've answered ${answerCount}. We'll build your report from those answers.`) : tr("你還沒有回答任何題目，結束後會回到設定頁。", "You haven't answered anything yet, so you'll go back to setup.")}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Button onClick={endEarly}>{answerCount > 0 ? tr("結束並看報告", "End and see report") : tr("回到設定", "Back to setup")}</Button>
              <Button variant="outline" onClick={() => setConfirmExit(false)} autoFocus>
                {tr("繼續面試", "Keep going")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 pb-44 pt-5 sm:px-6">
        {notice && (
          <div role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-warn-tint px-4 py-3 text-sm text-warn">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="flex-1">{notice}</span>
            <button type="button" className="cursor-pointer font-bold underline" onClick={() => setNotice(null)}>
              {tr("知道了", "OK")}
            </button>
          </div>
        )}

        {/* Mir */}
        <div className="flex items-start gap-3 sm:gap-4">
          <MirAvatar state={avatar} size={72} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">{tr("面試官 Mir", "Mir, your interviewer")}</p>
            <div className="mt-1 rounded-2xl rounded-tl-sm border border-line-soft bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-2" aria-live="polite">
              {phase === "thinking" ? (
                <span className="text-muted">{tr("（Mir 正在想…）", "(Mir is thinking…)")}</span>
              ) : current && mirLine.includes(current.text) ? (
                // 題目已顯示在下方卡片，泡泡只留開場／銜接語，避免同一句出現兩次
                mirLine.replace(current.text, "").trim() || tr("請作答。", "Over to you.")
              ) : (
                mirLine
              )}
            </div>
            {avatar === "speaking" && (
              <button type="button" onClick={stopSpeaking} className="mt-1.5 cursor-pointer text-xs font-bold text-brand hover:underline">
                {tr("略過朗讀", "Skip reading")}
              </button>
            )}
          </div>
        </div>

        {/* 題目 */}
        {current && (
          <Card className="mt-5 shadow-[0_24px_48px_-28px_rgba(16,24,40,0.30),0_6px_14px_-10px_rgba(16,24,40,0.10)]">
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {current.isFollowUp ? <Badge variant="warn">{tr("追問", "Follow-up")}</Badge> : <Badge>{tr(`第 ${qIndex + 1} 題`, `Question ${qIndex + 1}`)}</Badge>}
                {meta?.trap && !current.isFollowUp && <Badge variant="outline">{tr("常見陷阱題", "Common trap")}</Badge>}
                <span className="text-xs text-muted">
                  {tr("建議 ", "Aim for ")}
                  {minSec < 60 ? `${minSec}${tr(" 秒", "s")}` : `${Math.round(minSec / 60)}${tr(" 分鐘", " min")}`}–{maxSec < 60 ? `${maxSec}${tr(" 秒", "s")}` : `${Math.round((maxSec / 60) * 10) / 10}${tr(" 分鐘", " min")}`}
                </span>
              </div>
              {current.isFollowUp && current.parentText && <p className="mt-3 text-sm text-muted">{tr(`延續：「${current.parentText}」`, `Following up on: "${current.parentText}"`)}</p>}
              <h1 className="mt-3 text-[22px] leading-snug text-ink sm:text-[26px]">{current.text}</h1>
              {allowHint && meta && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowHint((s) => !s)}
                    aria-expanded={showHint}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-brand hover:underline"
                  >
                    <Lightbulb className="size-4" aria-hidden />
                    {showHint ? tr("收起提示", "Hide hint") : tr("看提示：HR 想知道什麼？", "Hint: what is the interviewer looking for?")}
                  </button>
                  {showHint && (
                    <div className="mt-2 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-2">
                      <p>{meta.intent}</p>
                      {meta.tip && <p className="mt-1.5 font-bold text-ink">{meta.tip}</p>}
                      {config.difficulty === "warmup" && !current.isFollowUp && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-bold text-brand">{tr("看範例回答", "See an example answer")}</summary>
                          <p className="mt-1.5 leading-relaxed">{meta.modelAnswer}</p>
                          <p className="mt-1 text-xs text-muted">{tr("看完用你自己的經驗講一次，不用照背。", "Then say it with your own experience; don't memorise it.")}</p>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 作答區 */}
        {phase === "answering" && (
          <div className="mt-5">
            {mode === "voice" ? (
              <div className="rounded-2xl border border-line-soft bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 text-sm font-bold", sub === "recording" ? "text-bad" : "text-muted")}>
                    {sub === "recording" && <span className="size-2.5 animate-pulse rounded-full bg-bad" aria-hidden />}
                    {sub === "recording" ? tr("錄音中", "Recording") : sub === "review" ? tr("確認你的回答", "Review your answer") : tr("按下麥克風開始回答", "Tap the mic to answer")}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums", answerSec > maxSec ? "text-warn" : "text-ink-2")}>{formatClock(answerSec)}</span>
                </div>
                {sub !== "review" && <Waveform stream={micStream} active={sub === "recording"} className="mt-3 h-12 w-full" />}
                {answerSec > maxSec && sub === "recording" && <p className="mt-2 text-sm font-bold text-warn">{tr("已超過建議時間，可以準備收尾了。", "You're over the suggested time. Start wrapping up.")}</p>}
                {sub === "review" && editing ? (
                  <>
                    <label htmlFor="edit-transcript" className="sr-only">
                      {tr("修改辨識文字", "Edit transcript")}
                    </label>
                    <textarea
                      id="edit-transcript"
                      value={sr.text}
                      onChange={(e) => sr.setManual(e.target.value)}
                      rows={5}
                      className="mt-3 w-full rounded-xl border border-brand bg-white px-3 py-2 text-[16px] outline-none"
                      autoFocus
                    />
                  </>
                ) : (
                  <div className="mt-3 min-h-20 rounded-xl bg-canvas px-3 py-2 text-[15px] leading-relaxed text-ink" aria-live="polite" aria-label={tr("即時逐字稿", "Live transcript")}>
                    {liveText || <span className="text-muted">{sub === "recording" ? tr("請開始說話，逐字稿會出現在這裡…", "Start speaking. Your words will appear here…") : tr("（還沒有內容）", "(Nothing yet)")}</span>}
                  </div>
                )}
                {sub === "review" && !editing && liveText && (
                  <button type="button" onClick={() => setEditing(true)} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand hover:underline">
                    <Pencil className="size-3.5" aria-hidden />
                    {tr("辨識有錯字？直接修改", "Fix transcription errors")}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-line-soft bg-white p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="typed-answer" className="text-sm font-bold text-ink-2">
                    {tr("輸入你的回答", "Your answer")}
                  </label>
                  <span className="text-xs text-muted">{lang === "en" ? `${typed.trim() ? typed.trim().split(/\s+/).length : 0} words` : `${typed.length} 字`}</span>
                </div>
                <textarea
                  id="typed-answer"
                  ref={typedRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  rows={6}
                  placeholder={lang === "en" ? "Type your answer as you would say it…" : "用你平常說話的方式打出來就好，不用寫成文章。"}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-[16px] outline-none focus:border-brand"
                />
              </div>
            )}
          </div>
        )}

        {phase === "thinking" && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {tr("Mir 正在聽你的回答…", "Mir is listening to your answer…")}
          </p>
        )}
      </div>

      {/* 底部操作列 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {mode === "voice" ? (
            sub === "recording" ? (
              <>
                <Button variant="ghost" onClick={reRecord} disabled={busy}>
                  <RotateCcw aria-hidden />
                  {tr("重來", "Restart")}
                </Button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="grid size-16 cursor-pointer place-items-center rounded-full bg-bad text-white shadow-lg transition-transform active:scale-95"
                  aria-label={tr("完成回答（停止錄音）", "Finish answer (stop recording)")}
                >
                  <Square className="size-6 fill-current" aria-hidden />
                </button>
                <span className="w-[76px] text-right text-xs font-bold text-muted">{tr("按方塊完成", "Tap to finish")}</span>
              </>
            ) : sub === "review" ? (
              <>
                <Button variant="ghost" onClick={reRecord}>
                  <RotateCcw aria-hidden />
                  {tr("重答", "Redo")}
                </Button>
                <Button variant="outline" onClick={startRecording} aria-label={tr("繼續錄音補充", "Record more")}>
                  <Mic aria-hidden />
                  {tr("補充", "Add more")}
                </Button>
                <Button onClick={() => submit(false)} disabled={!sr.text.trim()}>
                  {tr("送出", "Submit")}
                  <ChevronRight aria-hidden />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => submit(true)} disabled={phase !== "answering"}>
                  <SkipForward aria-hidden />
                  {tr("略過", "Skip")}
                </Button>
                <button
                  ref={micBtnRef}
                  type="button"
                  onClick={startRecording}
                  disabled={phase !== "answering"}
                  className="relative grid size-16 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={tr("開始回答（開始錄音）", "Start answering (record)")}
                >
                  {phase === "answering" && <span aria-hidden className="absolute inset-0 rounded-full bg-brand/40 animate-pulse-ring" />}
                  <Mic className="relative size-7" aria-hidden />
                </button>
                <Button variant="ghost" onClick={() => setMode("text")} disabled={phase !== "answering"}>
                  <Keyboard aria-hidden />
                  {tr("打字", "Type")}
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="ghost" onClick={() => submit(true)} disabled={phase !== "answering"}>
                <SkipForward aria-hidden />
                {tr("略過", "Skip")}
              </Button>
              {srSupported() && config.mode === "voice" && (
                <Button variant="ghost" onClick={() => setMode("voice")} disabled={phase !== "answering"}>
                  <Mic aria-hidden />
                  {tr("改用語音", "Use voice")}
                </Button>
              )}
              <Button onClick={() => submit(false)} disabled={phase !== "answering" || !typed.trim()}>
                {tr("送出", "Submit")}
                <ChevronRight aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>

      {camOn && camStream && <SelfView stream={camStream} />}
    </div>
  );
}

function SelfView({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="fixed bottom-28 right-4 z-30 overflow-hidden rounded-2xl border-2 border-white shadow-lg sm:bottom-24">
      <video ref={videoRef} autoPlay muted playsInline className="h-28 w-[150px] -scale-x-100 bg-ink object-cover" aria-label="Camera preview" />
    </div>
  );
}

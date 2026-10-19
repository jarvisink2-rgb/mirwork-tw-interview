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
import { companyLabel, difficultyLabel, roleLabel } from "@/lib/data/options";
import { inAppBrowser, speak, srSupported, stopSpeaking, ttsSupported, useSpeechRecognition } from "@/lib/speech";
import { cn, formatClock, uid } from "@/lib/utils";

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
  const sr = useSpeechRecognition(lang);

  /* ── 載入設定與題目 ── */
  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const c = takePendingConfig() ?? getLastConfig();
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
        ? "沒有取得麥克風權限，已切換成打字模式。想用語音的話，請在瀏覽器網址列旁允許麥克風後重新整理。"
        : sr.error === "no-mic"
          ? "找不到麥克風，已切換成打字模式。"
          : sr.error === "network"
            ? "語音辨識連線不穩，已切換成打字模式。你剛剛說的內容還在，可以直接修改後送出。"
            : "這個瀏覽器不支援語音辨識，已切換成打字模式。";
    setNotice(msg);
    setMode("text");
    setTyped((t) => t || sr.text);
    setSub("idle");
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
          ? `${app} 內建瀏覽器不支援語音辨識，已切換成打字模式。想用語音請點右上角「⋯」用 Chrome 或 Safari 開啟。`
          : "這個瀏覽器不支援語音辨識，已切換成打字模式。建議使用 Chrome 或 Safari。",
      );
      m = "text";
      setMode("text");
    }
    if (m === "voice" && !isTouchDevice() && navigator.mediaDevices?.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicStream(s);
      } catch {
        setNotice("沒有取得麥克風權限，已切換成打字模式。想用語音的話，請允許麥克風後重新整理。");
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
            <h1 className="mt-4 text-2xl font-bold">準備好了嗎？</h1>
            <p className="mt-2 text-ink-2">Mir 正在準備題目…</p>
            <div className="mt-5 w-full space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-canvas" />
              ))}
            </div>
            <Button size="xl" className="mt-6 w-full" disabled>
              <Loader2 className="animate-spin" aria-hidden />
              準備中
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
        <h1 className="text-xl font-bold">題目沒有載入成功</h1>
        <p className="text-ink-2">可能是網路不穩。你的設定還在，再試一次就好。</p>
        <div className="flex gap-2">
          <Button onClick={load}>
            <RotateCcw aria-hidden />
            再試一次
          </Button>
          <Button asChild variant="outline">
            <Link href="/setup/">回到設定</Link>
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
          <p className="text-lg font-bold text-ink">Mir 正在整理你的回饋報告</p>
          <p className="mt-1 text-sm text-muted">通常只要幾秒鐘</p>
        </div>
        <ul className="w-full space-y-2 text-left text-sm">
          {["計算語速與口頭禪", "檢查 STAR 結構和具體數字", "對照台灣 HR 的紅旗清單", "產生改寫範例與練習計畫"].map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm" style={{ animation: `fadeIn .4s ${i * 0.25}s both` }}>
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
            <h1 className="mt-4 text-2xl font-bold">{config.singleQuestionId ? "單題練習" : config.quick ? "3 分鐘暖身" : "準備好了嗎？"}</h1>
            <p className="mt-2 text-ink-2">
              {config.quick
                ? "三題常見問題，不追問。"
                : config.singleQuestionId
                  ? questions[0]?.text
                  : `${config.companyName || companyLabel(config.companyType)}・${roleLabel(config.role)}・${difficultyLabel(config.difficulty)}・${questions.length} 題`}
            </p>

            <div className="mt-5 w-full space-y-3 text-left">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-bold">
                    {mode === "voice" ? <Mic className="size-5 text-brand" aria-hidden /> : <Keyboard className="size-5 text-brand" aria-hidden />}
                    {mode === "voice" ? "用說的回答" : "用打字回答"}
                  </span>
                  {mode === "voice" && <span className="pl-7 text-xs text-muted">MirWork 不保存錄音</span>}
                </span>
                <button type="button" onClick={() => setMode(mode === "voice" ? "text" : "voice")} className="cursor-pointer text-sm font-bold text-brand underline-offset-4 hover:underline">
                  改成{mode === "voice" ? "打字" : "語音"}
                </button>
              </div>
              <label className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                <span className="flex items-center gap-2 font-bold">
                  <Volume2 className="size-5 text-brand" aria-hidden />
                  Mir 朗讀題目
                </span>
                <Switch checked={ttsOn} onCheckedChange={setTtsOn} aria-label="Mir 朗讀題目" />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-bold">
                    <Camera className="size-5 text-brand" aria-hidden />
                    看自己的表情
                  </span>
                  <span className="pl-7 text-xs text-muted">只在本機顯示，不錄影</span>
                </span>
                <Switch checked={camOn} onCheckedChange={setCamOn} aria-label="開啟鏡頭" />
              </label>
              {camError && <p className="text-sm text-warn">無法開啟鏡頭，可能沒有權限。沒關係，不開也可以練習。</p>}
              {(voiceUnsupported || app) && mode === "voice" && (
                <p className="rounded-xl bg-warn-tint px-4 py-3 text-sm text-warn">
                  {app ? `你正在用 ${app} 內建瀏覽器，語音辨識可能無法使用。建議點右上角「⋯」改用 Chrome 或 Safari 開啟。` : "這個瀏覽器不支援語音辨識，開始後會自動改用打字模式。建議使用 Chrome 或 Safari。"}
                </p>
              )}
            </div>

            <p className="mt-4 text-sm text-muted">緊張很正常，隨時可以暫停或結束。</p>
            <Button size="xl" className="mt-6 w-full" onClick={begin}>
              開始面試
            </Button>
            <Link href="/setup/" className="mt-3 text-sm font-bold text-muted hover:text-ink hover:underline">
              修改設定
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
    <div className="min-h-[calc(100dvh-3.5rem)] bg-gradient-to-b from-brand-tint via-canvas to-canvas">
      {/* 面試狀態列 */}
      <div className="sticky top-14 z-30 border-b border-line-soft bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-ink-2">
              <span>
                第 {Math.min(qIndex + 1, questions.length)} / {questions.length} 題{current?.isFollowUp ? "・追問" : ""}
              </span>
              <span className="tabular-nums" aria-label={`已進行 ${formatClock(totalElapsed)}`}>
                {formatClock(totalElapsed)}
              </span>
            </div>
            <Progress value={progressPct} className="mt-1.5 h-1.5" aria-label="面試進度" />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTtsOn(!ttsOn)} aria-label={ttsOn ? "關閉朗讀" : "開啟朗讀"} aria-pressed={ttsOn}>
            {ttsOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCamOn(!camOn)} aria-label={camOn ? "關閉鏡頭" : "開啟鏡頭"} aria-pressed={camOn}>
            {camOn ? <Camera aria-hidden /> : <CameraOff aria-hidden />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmExit(true)}>
            <X aria-hidden />
            結束
          </Button>
        </div>
      </div>

      {confirmExit && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="exit-title" className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="exit-title" className="text-lg font-bold">要結束這次面試嗎？</h2>
            <p className="mt-2 text-sm text-ink-2">
              {answerCount > 0 ? `你已經回答 ${answerCount} 題，結束後會用這些回答產生報告。` : "你還沒有回答任何題目，結束後會回到設定頁。"}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Button onClick={endEarly}>{answerCount > 0 ? "結束並看報告" : "回到設定"}</Button>
              <Button variant="outline" onClick={() => setConfirmExit(false)} autoFocus>
                繼續面試
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
              知道了
            </button>
          </div>
        )}

        {/* Mir */}
        <div className="flex items-start gap-3 sm:gap-4">
          <MirAvatar state={avatar} size={72} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-muted">面試官 Mir</p>
            <div className="mt-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[15px] leading-relaxed text-ink-2 shadow-sm" aria-live="polite">
              {phase === "thinking" ? <span className="text-muted">（Mir 正在想…）</span> : mirLine}
            </div>
            {avatar === "speaking" && (
              <button type="button" onClick={stopSpeaking} className="mt-1.5 cursor-pointer text-xs font-bold text-brand hover:underline">
                略過朗讀 ›
              </button>
            )}
          </div>
        </div>

        {/* 題目 */}
        {current && (
          <Card className="mt-5">
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {current.isFollowUp ? <Badge variant="warn">追問</Badge> : <Badge>第 {qIndex + 1} 題</Badge>}
                {meta?.trap && !current.isFollowUp && <Badge variant="outline">常見陷阱題</Badge>}
                <span className="text-xs text-muted">建議 {minSec < 60 ? `${minSec} 秒` : `${Math.round(minSec / 60)} 分鐘`}–{maxSec < 60 ? `${maxSec} 秒` : `${Math.round((maxSec / 60) * 10) / 10} 分鐘`}</span>
              </div>
              {current.isFollowUp && current.parentText && <p className="mt-3 text-sm text-muted">延續：「{current.parentText}」</p>}
              <h1 className="mt-3 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">{current.text}</h1>
              {allowHint && meta && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowHint((s) => !s)}
                    aria-expanded={showHint}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-brand hover:underline"
                  >
                    <Lightbulb className="size-4" aria-hidden />
                    {showHint ? "收起提示" : "看提示：HR 想知道什麼？"}
                  </button>
                  {showHint && (
                    <div className="mt-2 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-2">
                      <p>{meta.intent}</p>
                      {meta.tip && <p className="mt-1.5 font-bold text-ink">💡 {meta.tip}</p>}
                      {config.difficulty === "warmup" && !current.isFollowUp && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-bold text-brand">暖身限定：偷看範例回答</summary>
                          <p className="mt-1.5 leading-relaxed">{meta.modelAnswer}</p>
                          <p className="mt-1 text-xs text-muted">看完用你自己的經驗講一次，不用照背。</p>
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
              <div className="rounded-2xl border border-line-soft bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 text-sm font-bold", sub === "recording" ? "text-bad" : "text-muted")}>
                    {sub === "recording" && <span className="size-2.5 animate-pulse rounded-full bg-bad" aria-hidden />}
                    {sub === "recording" ? "錄音中" : sub === "review" ? "確認你的回答" : "按下麥克風開始回答"}
                  </span>
                  <span className={cn("text-sm font-bold tabular-nums", answerSec > maxSec ? "text-warn" : "text-ink-2")}>{formatClock(answerSec)}</span>
                </div>
                <Waveform stream={micStream} active={sub === "recording"} className="mt-3 h-12 w-full" />
                {answerSec > maxSec && sub === "recording" && <p className="mt-2 text-sm font-bold text-warn">已超過建議時間，可以準備收尾了。</p>}
                {sub === "review" && editing ? (
                  <>
                    <label htmlFor="edit-transcript" className="sr-only">
                      修改辨識文字
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
                  <div className="mt-3 min-h-20 rounded-xl bg-canvas px-3 py-2 text-[15px] leading-relaxed text-ink" aria-live="polite" aria-label="即時逐字稿">
                    {liveText || <span className="text-muted">{sub === "recording" ? "請開始說話，逐字稿會出現在這裡…" : "（還沒有內容）"}</span>}
                  </div>
                )}
                {sub === "review" && !editing && liveText && (
                  <button type="button" onClick={() => setEditing(true)} className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-brand hover:underline">
                    <Pencil className="size-3.5" aria-hidden />
                    辨識有錯字？直接修改
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-line-soft bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label htmlFor="typed-answer" className="text-sm font-bold text-ink-2">
                    輸入你的回答
                  </label>
                  <span className="text-xs text-muted">{typed.length} 字</span>
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
            Mir 正在聽你的回答…
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
                  重來
                </Button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="grid size-16 cursor-pointer place-items-center rounded-full bg-bad text-white shadow-lg transition-transform active:scale-95"
                  aria-label="完成回答（停止錄音）"
                >
                  <Square className="size-6 fill-current" aria-hidden />
                </button>
                <span className="w-[76px] text-right text-xs font-bold text-muted">按方塊完成</span>
              </>
            ) : sub === "review" ? (
              <>
                <Button variant="ghost" onClick={reRecord}>
                  <RotateCcw aria-hidden />
                  重答
                </Button>
                <Button variant="outline" onClick={startRecording} aria-label="繼續錄音補充">
                  <Mic aria-hidden />
                  補充
                </Button>
                <Button onClick={() => submit(false)} disabled={!sr.text.trim()}>
                  送出
                  <ChevronRight aria-hidden />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => submit(true)} disabled={phase !== "answering"}>
                  <SkipForward aria-hidden />
                  略過
                </Button>
                <button
                  ref={micBtnRef}
                  type="button"
                  onClick={startRecording}
                  disabled={phase !== "answering"}
                  className="relative grid size-16 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="開始回答（開始錄音）"
                >
                  {phase === "answering" && <span aria-hidden className="absolute inset-0 rounded-full bg-brand/40 animate-pulse-ring" />}
                  <Mic className="relative size-7" aria-hidden />
                </button>
                <Button variant="ghost" onClick={() => setMode("text")} disabled={phase !== "answering"}>
                  <Keyboard aria-hidden />
                  打字
                </Button>
              </>
            )
          ) : (
            <>
              <Button variant="ghost" onClick={() => submit(true)} disabled={phase !== "answering"}>
                <SkipForward aria-hidden />
                略過
              </Button>
              {srSupported() && config.mode === "voice" && (
                <Button variant="ghost" onClick={() => setMode("voice")} disabled={phase !== "answering"}>
                  <Mic aria-hidden />
                  改用語音
                </Button>
              )}
              <Button onClick={() => submit(false)} disabled={phase !== "answering" || !typed.trim()}>
                送出
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
      <video ref={videoRef} autoPlay muted playsInline className="h-28 w-[150px] -scale-x-100 bg-ink object-cover" aria-label="你的鏡頭畫面（僅本機顯示）" />
    </div>
  );
}

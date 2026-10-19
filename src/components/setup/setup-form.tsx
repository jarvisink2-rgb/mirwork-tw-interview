"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, FileUp, Keyboard, Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_TYPES, DIFFICULTIES, FOCUS_TOPICS, ROLES, SITUATIONS, interviewTitle } from "@/lib/data/options";
import type { AnswerMode, CompanyType, Difficulty, FocusTopic, InterviewConfig, RoleId, Situation } from "@/lib/types";
import { getLastConfig, setLastConfig, setPendingConfig } from "@/lib/storage";
import { extractKeywords, extractPdfText } from "@/lib/resume";
import { resumeQuestions } from "@/lib/ai/resume-questions";
import { cn } from "@/lib/utils";
import { T, getLang, setLang as setGlobalLang, useLang } from "@/lib/i18n";

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="text-sm font-bold text-muted">{title}</legend>
      <div className="mt-2.5">{children}</div>
    </fieldset>
  );
}

function Chip({ selected, onClick, children, role = "radio" }: { selected: boolean; onClick: () => void; children: React.ReactNode; role?: "radio" | "checkbox" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-left text-sm font-bold transition-colors",
        selected ? "border-brand bg-brand-tint text-brand-strong" : "border-line bg-white text-ink-2 hover:border-brand-line",
      )}
    >
      {selected && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export function SetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const lang = useLang();
  const [config, setConfig] = useState<InterviewConfig>(() => getLastConfig());
  const [hydrated, setHydrated] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeState, setResumeState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [resumeError, setResumeError] = useState<"size" | "read" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const en = lang === "en";

  useEffect(() => {
    let c: InterviewConfig = { ...getLastConfig(), lang: getLang() };
    const preset = params.get("preset");
    if (preset === "gentle") c = { ...c, difficulty: "warmup", mode: "text", length: 3 };
    const focus = params.get("focus") as FocusTopic | null;
    if (focus && FOCUS_TOPICS.some((f) => f.id === focus)) {
      c = { ...c, focus: Array.from(new Set([...c.focus, focus])) };
      if (focus === "gap") c = { ...c, situation: "unemployed" };
    }
    setConfig({ ...c, quick: false, singleQuestionId: undefined });
    setHydrated(true);
  }, [params]);

  // 介面語言＝面試語言
  useEffect(() => {
    setConfig((c) => ({ ...c, lang }));
  }, [lang]);

  const update = <K extends keyof InterviewConfig>(key: K, value: InterviewConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const toggleFocus = (f: FocusTopic) => setConfig((c) => ({ ...c, focus: c.focus.includes(f) ? c.focus.filter((x) => x !== f) : [...c.focus, f] }));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResumeError(null);
    if (file.size > 8 * 1024 * 1024) {
      setResumeState("error");
      setResumeError("size");
      return;
    }
    setResumeState("reading");
    try {
      const text = await extractPdfText(file);
      if (text.replace(/\s/g, "").length < 20) throw new Error("empty");
      const kws = extractKeywords(text);
      setConfig((c) => ({ ...c, resumeKeywords: kws, resumeFileName: file.name }));
      setResumeState("done");
    } catch {
      setResumeState("error");
      setResumeError("read");
    }
  };

  const onPaste = (text: string) => {
    setResumeText(text);
    const kws = extractKeywords(text);
    setConfig((c) => ({ ...c, resumeKeywords: kws, resumeFileName: c.resumeFileName && kws.length ? c.resumeFileName : undefined }));
    if (text) setResumeState("done");
  };

  const clearResume = () => {
    setConfig((c) => ({ ...c, resumeKeywords: [], resumeFileName: undefined }));
    setResumeText("");
    setResumeState("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const start = () => {
    const final: InterviewConfig = { ...config, lang, quick: false, singleQuestionId: undefined };
    setLastConfig(final);
    setPendingConfig(final);
    router.push("/interview/");
  };

  const tailored = resumeQuestions(config.resumeKeywords, lang)[0];
  const minutes = { 3: 7, 5: 12, 7: 17 }[config.length];
  const difficulty = DIFFICULTIES.find((d) => d.id === config.difficulty)!;
  const focusOptions = FOCUS_TOPICS.filter((f) => !(en && ["english", "military", "salary", "gap", "overtime"].includes(f.id)));

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      aria-busy={!hydrated}
    >
      <Card>
        <CardContent className="space-y-6">
          <Section title={<T zh="你的狀況" en="Your situation" />}>
            <div role="radiogroup" aria-label={en ? "Your situation" : "你的狀況"} className="flex flex-wrap gap-2">
              {SITUATIONS.map((s) => (
                <Chip key={s.id} selected={config.situation === s.id} onClick={() => update("situation", s.id as Situation)}>
                  <T zh={s.label} en={s.en} />
                </Chip>
              ))}
            </div>
          </Section>

          <Section title={<T zh="公司類型" en="Company type" />}>
            <div role="radiogroup" aria-label={en ? "Company type" : "公司類型"} className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((c) => (
                <Chip key={c.id} selected={config.companyType === c.id} onClick={() => update("companyType", c.id as CompanyType)}>
                  <T zh={c.short} en={c.en} />
                </Chip>
              ))}
            </div>
          </Section>

          <Section title={<T zh="職缺" en="Role" />}>
            <div role="radiogroup" aria-label={en ? "Role" : "職缺"} className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip key={r.id} selected={config.role === r.id} onClick={() => update("role", r.id as RoleId)}>
                  <T zh={r.label} en={r.en} />
                </Chip>
              ))}
            </div>
          </Section>
        </CardContent>
      </Card>

      <details className="group rounded-2xl border border-line-soft bg-white" open={config.focus.length > 0 || undefined}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
          <T zh="更多設定" en="More options" />
          <span className="text-sm font-normal text-muted group-open:hidden">
            {en
              ? `${difficulty.en}, ${config.length} questions, ${config.mode === "voice" ? "voice" : "typing"}`
              : `${difficulty.label}，${config.length} 題，${config.mode === "voice" ? "語音" : "打字"}`}
          </span>
        </summary>
        <div className="space-y-6 border-t border-line-soft px-5 py-5 sm:px-6">
          <Section title={<T zh="難度" en="Difficulty" />}>
            <div role="radiogroup" aria-label={en ? "Difficulty" : "難度"} className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Chip key={d.id} selected={config.difficulty === d.id} onClick={() => update("difficulty", d.id as Difficulty)}>
                  <T zh={d.label} en={d.en} />
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              <T zh={difficulty.desc} en={difficulty.descEn} />
            </p>
          </Section>

          <Section title={<T zh="特別想練" en="Focus on" />}>
            <div role="group" aria-label={en ? "Focus on" : "特別想練的題目"} className="flex flex-wrap gap-2">
              {focusOptions.map((f) => (
                <Chip key={f.id} role="checkbox" selected={config.focus.includes(f.id)} onClick={() => toggleFocus(f.id)}>
                  <T zh={f.label} en={f.en} />
                </Chip>
              ))}
            </div>
          </Section>

          <div className="grid gap-6 sm:grid-cols-3">
            <Section title={<T zh="語言" en="Language" />}>
              <div role="radiogroup" aria-label={en ? "Language" : "語言"} className="flex flex-wrap gap-2">
                <Chip selected={lang === "zh"} onClick={() => setGlobalLang("zh")}>中文</Chip>
                <Chip selected={lang === "en"} onClick={() => setGlobalLang("en")}>English</Chip>
              </div>
            </Section>
            <Section title={<T zh="回答方式" en="Answer by" />}>
              <div role="radiogroup" aria-label={en ? "Answer by" : "回答方式"} className="flex flex-wrap gap-2">
                <Chip selected={config.mode === "voice"} onClick={() => update("mode", "voice" as AnswerMode)}>
                  <Mic className="size-4" aria-hidden />
                  <T zh="語音" en="Voice" />
                </Chip>
                <Chip selected={config.mode === "text"} onClick={() => update("mode", "text" as AnswerMode)}>
                  <Keyboard className="size-4" aria-hidden />
                  <T zh="打字" en="Typing" />
                </Chip>
              </div>
            </Section>
            <Section title={<T zh="題數" en="Questions" />}>
              <div role="radiogroup" aria-label={en ? "Number of questions" : "題數"} className="flex flex-wrap gap-2">
                {([3, 5, 7] as const).map((n) => (
                  <Chip key={n} selected={config.length === n} onClick={() => update("length", n)}>
                    {n}
                    <T zh=" 題" en="" />
                  </Chip>
                ))}
              </div>
            </Section>
          </div>

          <Section title={<T zh="公司名稱（選填）" en="Company name (optional)" />}>
            <input
              id="company-name"
              aria-label={en ? "Company name" : "公司名稱"}
              value={config.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value.slice(0, 30))}
              placeholder={en ? "e.g. TSMC" : "例如：台積電"}
              className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[16px] outline-none focus:border-brand"
            />
          </Section>

          <Section title={<T zh="履歷或自傳（選填）" en="Résumé (optional)" />}>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} id="resume-file" aria-label={en ? "Upload résumé PDF" : "上傳履歷或自傳 PDF"} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              <Button type="button" variant="soft" onClick={() => fileRef.current?.click()} disabled={resumeState === "reading"}>
                {resumeState === "reading" ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
                {resumeState === "reading" ? <T zh="讀取中…" en="Reading…" /> : <T zh="上傳 PDF" en="Upload PDF" />}
              </Button>
              {config.resumeFileName && (
                <span className="inline-flex items-center gap-1 text-sm text-ink-2">
                  {config.resumeFileName}
                  <button type="button" onClick={clearResume} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-canvas" aria-label={en ? "Remove résumé" : "移除履歷"}>
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              )}
            </div>
            <textarea
              id="resume-text"
              aria-label={en ? "Or paste your résumé text" : "或貼上自傳文字"}
              value={resumeText}
              onChange={(e) => onPaste(e.target.value)}
              rows={2}
              placeholder={en ? "Or paste your résumé text" : "或直接貼上自傳文字"}
              className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] outline-none focus:border-brand"
            />
            <div aria-live="polite">
              {resumeError === "size" && <p className="mt-2 text-sm font-bold text-bad"><T zh="檔案超過 8 MB，請壓縮後再試，或直接貼上文字。" en="The file is over 8 MB. Compress it or paste the text instead." /></p>}
              {resumeError === "read" && <p className="mt-2 text-sm font-bold text-bad"><T zh="讀不到這份 PDF 的文字（可能是掃描檔），請直接貼上文字。" en="Couldn't read text from this PDF (it may be a scan). Paste the text instead." /></p>}
              {resumeState === "done" && (config.resumeKeywords?.length ?? 0) === 0 && (
                <p className="mt-2 text-sm text-warn"><T zh="沒有找到可以追問的經驗，寫具體一點（專題、實習、社團幹部…）。" en="No experiences found to ask about. Mention projects, internships or leadership roles." /></p>
              )}
              {tailored && <p className="mt-2 text-sm text-good">{en ? `Mir may ask: "${tailored.text}"` : `Mir 會問：「${tailored.text}」`}</p>}
            </div>
          </Section>
        </div>
      </details>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-line-soft bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 md:bottom-0">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm leading-snug">
            <b className="block truncate text-ink">
              <T zh={interviewTitle({ ...config, quick: false, singleQuestionId: undefined }, "zh")} en={interviewTitle({ ...config, quick: false, singleQuestionId: undefined }, "en")} />
            </b>
            <span className="text-xs text-muted">
              <T zh={`約 ${minutes} 分鐘`} en={`About ${minutes} min`} />
            </span>
          </p>
          <Button type="submit" size="lg" className="shrink-0">
            {config.mode === "voice" ? <Mic aria-hidden /> : <Keyboard aria-hidden />}
            <T zh="開始" en="Start" />
          </Button>
        </div>
      </div>
    </form>
  );
}

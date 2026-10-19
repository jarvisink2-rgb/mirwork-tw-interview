"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, FileUp, Keyboard, Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COMPANY_TYPES, DIFFICULTIES, FOCUS_TOPICS, ROLES, SITUATIONS } from "@/lib/data/options";
import type { AnswerMode, CompanyType, Difficulty, FocusTopic, InterviewConfig, InterviewLang, RoleId, Situation } from "@/lib/types";
import { getLastConfig, setLastConfig, setPendingConfig } from "@/lib/storage";
import { extractKeywords, extractPdfText } from "@/lib/resume";
import { resumeQuestions } from "@/lib/ai/resume-questions";
import { cn, safeStorage } from "@/lib/utils";
import { PREF_LANG_EVENT, PREF_LANG_KEY } from "@/components/lang-toggle";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  const [config, setConfig] = useState<InterviewConfig>(() => getLastConfig());
  const [hydrated, setHydrated] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [resumeState, setResumeState] = useState<"idle" | "reading" | "done" | "error">("idle");
  const [resumeError, setResumeError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let c = getLastConfig();
    const pref = safeStorage.get<"zh" | "en">(PREF_LANG_KEY, "zh");
    if (pref === "en") c = { ...c, lang: "en", companyType: "foreign" };
    const preset = params.get("preset");
    if (preset === "foreign") c = { ...c, lang: "en", companyType: "foreign" };
    if (preset === "gentle") c = { ...c, difficulty: "warmup", mode: "text", length: 3 };
    const focus = params.get("focus") as FocusTopic | null;
    if (focus && FOCUS_TOPICS.some((f) => f.id === focus)) {
      c = { ...c, focus: Array.from(new Set([...c.focus, focus])) };
      if (focus === "gap") c = { ...c, situation: "unemployed" };
    }
    setConfig({ ...c, quick: false, singleQuestionId: undefined });
    setHydrated(true);

    const onLang = (e: Event) => {
      const l = (e as CustomEvent<"zh" | "en">).detail;
      setConfig((prev) => ({ ...prev, lang: l, companyType: l === "en" ? "foreign" : prev.companyType === "foreign" ? "tech" : prev.companyType }));
    };
    window.addEventListener(PREF_LANG_EVENT, onLang);
    return () => window.removeEventListener(PREF_LANG_EVENT, onLang);
  }, [params]);

  const update = <K extends keyof InterviewConfig>(key: K, value: InterviewConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const toggleFocus = (f: FocusTopic) => setConfig((c) => ({ ...c, focus: c.focus.includes(f) ? c.focus.filter((x) => x !== f) : [...c.focus, f] }));

  const setLang = (l: InterviewLang) => {
    update("lang", l);
    safeStorage.set(PREF_LANG_KEY, l);
    window.dispatchEvent(new CustomEvent(PREF_LANG_EVENT, { detail: l }));
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResumeError("");
    if (file.size > 8 * 1024 * 1024) {
      setResumeState("error");
      setResumeError("檔案超過 8 MB，請壓縮後再試，或直接把自傳貼在下面。");
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
      setResumeError("讀不到這份 PDF 的文字（可能是掃描圖片檔）。可以直接把履歷或自傳貼在下面。");
    }
  };

  const onPaste = (text: string) => {
    setResumeText(text);
    const kws = extractKeywords(text);
    setConfig((c) => ({ ...c, resumeKeywords: kws, resumeFileName: c.resumeFileName && kws.length ? c.resumeFileName : text ? "貼上的文字" : undefined }));
    if (text) setResumeState("done");
  };

  const clearResume = () => {
    setConfig((c) => ({ ...c, resumeKeywords: [], resumeFileName: undefined }));
    setResumeText("");
    setResumeState("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const start = () => {
    const final: InterviewConfig = { ...config, quick: false, singleQuestionId: undefined };
    setLastConfig(final);
    setPendingConfig(final);
    router.push("/interview/");
  };

  const tailored = resumeQuestions(config.resumeKeywords)[0];
  const minutes = { 3: 7, 5: 12, 7: 17 }[config.length];
  const company = COMPANY_TYPES.find((c) => c.id === config.companyType)!;
  const role = ROLES.find((r) => r.id === config.role)!;
  const difficulty = DIFFICULTIES.find((d) => d.id === config.difficulty)!;
  const focusOptions = FOCUS_TOPICS.filter((f) => !(config.lang === "en" && ["english", "military", "salary", "gap", "overtime"].includes(f.id)));

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
          <Section title="你的狀況">
            <div role="radiogroup" aria-label="你的狀況" className="flex flex-wrap gap-2">
              {SITUATIONS.map((s) => (
                <Chip key={s.id} selected={config.situation === s.id} onClick={() => update("situation", s.id as Situation)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="公司類型">
            <div role="radiogroup" aria-label="公司類型" className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((c) => (
                <Chip
                  key={c.id}
                  selected={config.companyType === c.id}
                  onClick={() => {
                    update("companyType", c.id as CompanyType);
                    if (c.id === "foreign" && config.lang === "zh") update("lang", "en");
                  }}
                >
                  {c.short}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="職缺">
            <div role="radiogroup" aria-label="職缺" className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip key={r.id} selected={config.role === r.id} onClick={() => update("role", r.id as RoleId)}>
                  {r.label}
                </Chip>
              ))}
            </div>
          </Section>
        </CardContent>
      </Card>

      <details className="group rounded-2xl border border-line-soft bg-white" open={config.focus.length > 0 || undefined}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-bold text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
          更多設定
          <span className="text-sm font-normal text-muted group-open:hidden">
            {difficulty.label}・{config.length} 題・{config.mode === "voice" ? "語音" : "打字"}
          </span>
        </summary>
        <div className="space-y-6 border-t border-line-soft px-5 py-5 sm:px-6">
          <Section title="難度">
            <div role="radiogroup" aria-label="難度" className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <Chip key={d.id} selected={config.difficulty === d.id} onClick={() => update("difficulty", d.id as Difficulty)}>
                  {d.label}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">{difficulty.desc}</p>
          </Section>

          <Section title="特別想練">
            <div role="group" aria-label="特別想練的題目" className="flex flex-wrap gap-2">
              {focusOptions.map((f) => (
                <Chip key={f.id} role="checkbox" selected={config.focus.includes(f.id)} onClick={() => toggleFocus(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
          </Section>

          <div className="grid gap-6 sm:grid-cols-3">
            <Section title="語言">
              <div role="radiogroup" aria-label="面試語言" className="flex flex-wrap gap-2">
                <Chip selected={config.lang === "zh"} onClick={() => setLang("zh")}>中文</Chip>
                <Chip selected={config.lang === "en"} onClick={() => setLang("en")}>English</Chip>
              </div>
            </Section>
            <Section title="回答方式">
              <div role="radiogroup" aria-label="回答方式" className="flex flex-wrap gap-2">
                <Chip selected={config.mode === "voice"} onClick={() => update("mode", "voice" as AnswerMode)}>
                  <Mic className="size-4" aria-hidden />語音
                </Chip>
                <Chip selected={config.mode === "text"} onClick={() => update("mode", "text" as AnswerMode)}>
                  <Keyboard className="size-4" aria-hidden />打字
                </Chip>
              </div>
            </Section>
            <Section title="題數">
              <div role="radiogroup" aria-label="題數" className="flex flex-wrap gap-2">
                {([3, 5, 7] as const).map((n) => (
                  <Chip key={n} selected={config.length === n} onClick={() => update("length", n)}>
                    {n} 題
                  </Chip>
                ))}
              </div>
            </Section>
          </div>

          <Section title="公司名稱（選填）">
            <input
              id="company-name"
              aria-label="公司名稱"
              value={config.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value.slice(0, 30))}
              placeholder="例如：台積電"
              className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[16px] outline-none focus:border-brand"
            />
          </Section>

          <Section title="履歷或自傳（選填）">
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} id="resume-file" aria-label="上傳履歷或自傳 PDF" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              <Button type="button" variant="soft" onClick={() => fileRef.current?.click()} disabled={resumeState === "reading"}>
                {resumeState === "reading" ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
                {resumeState === "reading" ? "讀取中…" : "上傳 PDF"}
              </Button>
              {config.resumeFileName && (
                <span className="inline-flex items-center gap-1 text-sm text-ink-2">
                  {config.resumeFileName}
                  <button type="button" onClick={clearResume} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-canvas" aria-label="移除履歷">
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              )}
            </div>
            <textarea
              id="resume-text"
              aria-label="或貼上自傳文字"
              value={resumeText}
              onChange={(e) => onPaste(e.target.value)}
              rows={2}
              placeholder="或直接貼上自傳文字"
              className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] outline-none focus:border-brand"
            />
            <div aria-live="polite">
              {resumeError && <p className="mt-2 text-sm font-bold text-bad">{resumeError}</p>}
              {resumeState === "done" && (config.resumeKeywords?.length ?? 0) === 0 && <p className="mt-2 text-sm text-warn">沒有找到可以追問的經驗，寫具體一點（專題、實習、社團幹部…）。</p>}
              {config.lang === "zh" && tailored && <p className="mt-2 text-sm text-good">Mir 會問：「{tailored.text}」</p>}
            </div>
          </Section>
        </div>
      </details>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-line-soft bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 md:bottom-0">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-ink-2">
            <b className="text-ink">{company.short}・{role.label}</b>・約 {minutes} 分鐘
          </p>
          <Button type="submit" size="lg" className="shrink-0">
            {config.mode === "voice" ? <Mic aria-hidden /> : <Keyboard aria-hidden />}
            開始
          </Button>
        </div>
      </div>
    </form>
  );
}

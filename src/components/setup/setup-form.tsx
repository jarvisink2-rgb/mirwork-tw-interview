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

function Section({ title, hint, children, id }: { title: string; hint?: string; children: React.ReactNode; id?: string }) {
  return (
    <fieldset className="border-0 p-0" id={id}>
      <legend className="font-display text-lg font-semibold text-ink">{title}</legend>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
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

  const tailored = resumeQuestions(config.resumeKeywords).slice(0, config.length >= 7 ? 2 : 1);
  const minutes = { 3: 7, 5: 12, 7: 17 }[config.length];
  const company = COMPANY_TYPES.find((c) => c.id === config.companyType)!;

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      aria-busy={!hydrated}
    >
      <Card>
        <CardContent className="space-y-7">
          <Section title="你現在的狀況" hint="Mir 會依你的狀況調整題目，例如待業中會練到空窗期。">
            <div role="radiogroup" aria-label="你現在的狀況" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SITUATIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={config.situation === s.id}
                  onClick={() => update("situation", s.id as Situation)}
                  className={cn(
                    "min-h-16 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors",
                    config.situation === s.id ? "border-brand bg-brand-tint" : "border-line bg-white hover:border-brand-line",
                  )}
                >
                  <span className={cn("block text-sm font-bold", config.situation === s.id ? "text-brand-strong" : "text-ink")}>{s.label}</span>
                  <span className="block text-xs text-muted">{s.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="公司類型" hint="台灣不同類型的公司，面試重點差很多。">
            <div role="radiogroup" aria-label="公司類型" className="grid gap-2 sm:grid-cols-2">
              {COMPANY_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={config.companyType === c.id}
                  onClick={() => {
                    update("companyType", c.id as CompanyType);
                    if (c.id === "foreign" && config.lang === "zh") update("lang", "en");
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors",
                    config.companyType === c.id ? "border-brand bg-brand-tint" : "border-line bg-white hover:border-brand-line",
                  )}
                >
                  <span className={cn("block font-bold", config.companyType === c.id ? "text-brand-strong" : "text-ink")}>{c.label}</span>
                  <span className="block text-xs text-muted">例：{c.examples}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-2">
              <b>{company.short}面試重點：</b>
              {company.style}
            </p>
          </Section>

          <Section title="應徵職缺">
            <div role="radiogroup" aria-label="應徵職缺" className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Chip key={r.id} selected={config.role === r.id} onClick={() => update("role", r.id as RoleId)}>
                  {r.label}
                </Chip>
              ))}
            </div>
            <label className="mt-4 block text-sm font-bold text-ink" htmlFor="company-name">
              公司名稱（選填）
            </label>
            <input
              id="company-name"
              value={config.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value.slice(0, 30))}
              placeholder="例如：台積電、全聯、玉山銀行"
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-4 text-[16px] outline-none focus:border-brand"
            />
          </Section>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-7">
          <Section title="難度">
            <div role="radiogroup" aria-label="難度" className="grid gap-2 sm:grid-cols-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={config.difficulty === d.id}
                  onClick={() => update("difficulty", d.id as Difficulty)}
                  className={cn(
                    "cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors",
                    config.difficulty === d.id ? "border-brand bg-brand-tint" : "border-line bg-white hover:border-brand-line",
                  )}
                >
                  <span className={cn("block font-bold", config.difficulty === d.id ? "text-brand-strong" : "text-ink")}>{d.label}</span>
                  <span className="block text-xs text-muted">{d.desc}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="想特別練的題目（選填）" hint="台灣面試最常卡關的題目，選了就一定會練到。">
            <div role="group" aria-label="想特別練的題目" className="flex flex-wrap gap-2">
              {FOCUS_TOPICS.filter((f) => !(config.lang === "en" && (f.id === "english" || f.id === "military" || f.id === "salary" || f.id === "gap" || f.id === "overtime"))).map((f) => (
                <Chip key={f.id} role="checkbox" selected={config.focus.includes(f.id)} onClick={() => toggleFocus(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            {config.focus.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {config.focus.map((f) => {
                  const t = FOCUS_TOPICS.find((x) => x.id === f)!;
                  return (
                    <li key={f}>
                      <b className="text-ink-2">{t.label}</b>：{t.desc}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 sm:grid-cols-3">
            <Section title="面試語言">
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
          {config.lang === "en" && <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-2">English 模式：Mir 會用英文提問和朗讀，題目以外商常見的 6 大題為主；回饋說明仍用中文。</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Section title="上傳履歷或自傳（選填）" hint="Mir 會從你寫的經驗挑一題追問，就像真的面試官一樣。檔案只在你的瀏覽器讀取，不會上傳。">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input ref={fileRef} id="resume-file" aria-label="上傳履歷或自傳 PDF" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              <Button type="button" variant="soft" onClick={() => fileRef.current?.click()} disabled={resumeState === "reading"}>
                {resumeState === "reading" ? <Loader2 className="animate-spin" aria-hidden /> : <FileUp aria-hidden />}
                {resumeState === "reading" ? "讀取中…" : "選擇 PDF"}
              </Button>
              {config.resumeFileName && (
                <span className="inline-flex items-center gap-2 text-sm text-ink-2">
                  {config.resumeFileName}
                  <button type="button" onClick={clearResume} className="grid size-8 cursor-pointer place-items-center rounded-full hover:bg-canvas" aria-label="移除履歷">
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              )}
            </div>
            <label htmlFor="resume-text" className="mt-4 block text-sm font-bold text-ink">
              或直接貼上自傳／履歷文字
            </label>
            <textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => onPaste(e.target.value)}
              rows={3}
              placeholder="例如：大三擔任系學會公關，負責迎新活動社群宣傳…"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] outline-none focus:border-brand"
            />
            <div aria-live="polite">
              {resumeError && <p className="mt-2 text-sm font-bold text-bad">{resumeError}</p>}
              {resumeState === "done" && (config.resumeKeywords?.length ?? 0) === 0 && (
                <p className="mt-2 text-sm text-warn">沒有找到可以追問的經驗關鍵字（例如專題、實習、社團幹部、證照）。寫得具體一點，Mir 才問得出來。</p>
              )}
              {(config.resumeKeywords?.length ?? 0) > 0 && (
                <div className="mt-3 rounded-xl bg-good-tint p-4 text-sm">
                  <p className="font-bold text-good">找到 {config.resumeKeywords!.length} 個可以追問的經驗：{config.resumeKeywords!.join("、")}</p>
                  {config.lang === "zh" && tailored[0] && <p className="mt-1 text-ink-2">Mir 可能會問：「{tailored[0].text}」</p>}
                </div>
              )}
            </div>
          </Section>
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-line-soft bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 md:bottom-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">
            <b className="text-ink">{company.short}・{ROLES.find((r) => r.id === config.role)?.label}</b>・{DIFFICULTIES.find((d) => d.id === config.difficulty)?.label}・{config.length} 題（約 {minutes} 分鐘）・{config.lang === "en" ? "English" : "中文"}・{config.mode === "voice" ? "語音" : "打字"}
          </p>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {config.mode === "voice" ? <Mic aria-hidden /> : <Keyboard aria-hidden />}
            開始面試
          </Button>
        </div>
      </div>
    </form>
  );
}

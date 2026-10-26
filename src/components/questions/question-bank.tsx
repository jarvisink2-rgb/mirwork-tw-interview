"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Lightbulb, Mic, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUESTIONS } from "@/lib/data/questions";
import { COMPANY_TYPES, FOCUS_TOPICS } from "@/lib/data/options";
import type { CompanyType, FocusTopic, Question } from "@/lib/types";
import { getLastConfig, setPendingConfig } from "@/lib/storage";
import { T, setLang, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Kind = "all" | "trap" | "behavioral" | "en" | "group";

const KINDS: { id: Kind; zh: string; en: string; zhOnly?: boolean }[] = [
  { id: "all", zh: "全部", en: "All" },
  { id: "trap", zh: "陷阱題", en: "Trap questions" },
  { id: "behavioral", zh: "行為題（STAR）", en: "Behavioral (STAR)" },
  { id: "en", zh: "英文面試", en: "English", zhOnly: true },
  { id: "group", zh: "群面", en: "Group", zhOnly: true },
];

const PAGE = 12;

function QuestionCard({ q, open, onToggle, onPractice, className }: { q: Question; open: boolean; onToggle: () => void; onPractice: () => void; className?: string }) {
  const en = q.lang === "en";
  const tr = (zh: string, enText: string) => (en ? enText : zh);
  const companies =
    q.companyTypes === "all"
      ? tr("所有公司", "All companies")
      : q.companyTypes.map((c) => COMPANY_TYPES.find((x) => x.id === c)?.[en ? "en" : "short"]).join(en ? ", " : "、");
  return (
    <li className={cn("-mb-px border-b border-line-soft", className)} id={`q-${q.id}`}>
      <h2 className="m-0 text-base">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full cursor-pointer items-start gap-3 p-4 text-left hover:bg-canvas/60 sm:px-5">
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-base font-bold leading-snug text-ink [text-wrap:pretty]">{q.text}</span>
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {q.trap && <Badge variant="bad">{tr("陷阱題", "Trap")}</Badge>}
              {q.category === "group" && <Badge variant="ink">群面</Badge>}
              {en && <Badge className="i18n-zh">English</Badge>}
              <span>{companies}</span>
            </span>
          </span>
          <ChevronDown className={cn("mt-1 size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </h2>
      {open && (
        <div className="space-y-5 px-4 pb-6 pt-1 sm:px-5">
          <div>
            <h3 className="text-sm font-bold text-muted">{tr("HR 真正想知道", "What the interviewer wants to know")}</h3>
            <p className="mt-1 text-ink-2">{q.intent}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="border-l-2 border-good/50 pl-3.5">
              <h3 className="text-sm font-bold text-good">{tr("加分", "Strong answers")}</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2 marker:text-good/60">
                {q.goodSignals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div className="border-l-2 border-bad/50 pl-3.5">
              <h3 className="text-sm font-bold text-bad">{tr("扣分", "Red flags")}</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2 marker:text-bad/60">
                {q.redFlags.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
          {q.tip && (
            <p className="flex gap-2 rounded-xl bg-brand-tint px-4 py-3 text-sm font-bold text-brand-strong">
              <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
              {q.tip}
            </p>
          )}
          <details className="group rounded-xl border border-line-soft px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              {tr("看範例回答", "Example answer")}
              <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 leading-relaxed text-ink-2">{q.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">{tr("參考結構就好，換成你自己的經驗。", "Use the structure, not the words.")}</p>
          </details>
          {q.followUps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-muted">{tr("可能的追問", "Likely follow-ups")}</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
                {q.followUps.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {q.category !== "group" ? (
              <Button variant="soft" onClick={onPractice}>
                <Mic aria-hidden />
                {tr("用這題練習", "Practise this question")}
              </Button>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Users className="size-4" aria-hidden />
                群面需要多人，建議找 3–5 位同學一起練。
              </p>
            )}
            {q.source && (
              <a href={q.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink hover:underline">
                {tr("參考：", "Source: ")}
                {q.source.label}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function QuestionBank() {
  const router = useRouter();
  const lang = useLang();
  const [company, setCompany] = useState<CompanyType | "all">("all");
  const [kind, setKind] = useState<Kind>("all");
  const [focus, setFocus] = useState<FocusTopic | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("focus") as FocusTopic | null;
    if (f && FOCUS_TOPICS.some((x) => x.id === f)) {
      setFocus(f);
      const first = QUESTIONS.find((q) => q.focus === f && q.lang === "zh");
      if (first) setOpenId(first.id);
    }
    const id = params.get("q");
    if (id) {
      setOpenId(id);
      setShowAll(true);
    }
  }, []);

  const filtered = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return QUESTIONS.filter((q) => {
      if (company !== "all" && q.companyTypes !== "all" && !q.companyTypes.includes(company)) return false;
      if (kind === "trap" && !q.trap) return false;
      if (kind === "behavioral" && q.category !== "behavioral") return false;
      if (kind === "en" && q.lang !== "en" && q.focus !== "english") return false;
      if (kind === "group" && q.category !== "group") return false;
      if (kind !== "group" && kind !== "all" && q.category === "group") return false;
      if (focus && q.focus !== focus) return false;
      if (ql && !(q.text.toLowerCase().includes(ql) || q.intent.toLowerCase().includes(ql) || q.modelAnswer.toLowerCase().includes(ql))) return false;
      return true;
    });
  }, [company, kind, focus, query]);

  const enCount = filtered.filter((q) => q.lang === "en").length;
  const visibleCount = lang === "en" ? enCount : filtered.length;

  const practice = (q: Question) => {
    const last = getLastConfig();
    setPendingConfig({ ...last, lang: q.lang, singleQuestionId: q.id, quick: false, difficulty: last.difficulty === "warmup" ? "standard" : last.difficulty });
    router.push("/interview/");
  };

  const reset = () => {
    setCompany("all");
    setKind("all");
    setFocus(null);
    setQuery("");
  };

  const chip = (active: boolean) =>
    cn(
      "h-9 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold transition-colors",
      active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2 hover:border-ink-2",
    );

  return (
    <div className="mt-6">
      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">{lang === "en" ? "Search questions" : "搜尋題目"}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === "en" ? "Search questions" : "搜尋：薪資、空窗期、加班…"}
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[16px] outline-none focus:border-brand"
          />
        </label>
        <div role="group" aria-label={lang === "en" ? "Question type" : "題型"} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {KINDS.map((k) => (
            <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className={cn(chip(kind === k.id), k.zhOnly && "i18n-zh")}>
              <T zh={k.zh} en={k.en} />
            </button>
          ))}
        </div>
        <div role="group" aria-label="公司類型" className="i18n-zh flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button type="button" aria-pressed={company === "all"} onClick={() => setCompany("all")} className={chip(company === "all")}>
            所有公司
          </button>
          {COMPANY_TYPES.map((c) => (
            <button key={c.id} type="button" aria-pressed={company === c.id} onClick={() => setCompany(c.id)} className={chip(company === c.id)}>
              {c.short}
            </button>
          ))}
        </div>
        {focus && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <T zh="只顯示：" en="Showing: " />
            <Badge variant="bad">
              <T zh={FOCUS_TOPICS.find((f) => f.id === focus)?.label} en={FOCUS_TOPICS.find((f) => f.id === focus)?.en} />
            </Badge>
            <button type="button" className="cursor-pointer font-bold text-brand underline" onClick={() => setFocus(null)}>
              <T zh="顯示全部" en="Show all" />
            </button>
          </p>
        )}
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">
        <T
          zh={`共 ${filtered.length} 題`}
          en={
            enCount === 0
              ? ""
              : `${enCount} English question${enCount === 1 ? "" : "s"}.${filtered.length > enCount ? ` Switch to 中文 for ${filtered.length - enCount} more, including Taiwan-specific ones.` : ""}`
          }
        />
      </p>

      {visibleCount === 0 ? (
        <div className="mt-3 rounded-xl bg-white p-8 text-center">
          <p className="font-bold text-ink">
            <T zh="沒有符合的題目" en={filtered.length ? "These questions are in Chinese only" : "No matching questions"} />
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {lang === "en" && filtered.length > 0 && (
              <Button onClick={() => setLang("zh")}>
                Switch to 中文 ({filtered.length})
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              <T zh="清除篩選" en="Clear filters" />
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-3 overflow-hidden rounded-2xl border border-line-soft bg-white">
          {filtered.map((q, i) => {
            const beyond = !showAll && i >= PAGE;
            // zh UI: first 12 (any language). en UI: English questions only.
            const cls = q.lang === "zh" ? cn("i18n-zh", beyond && "hidden") : beyond ? "i18n-en" : undefined;
            return <QuestionCard key={q.id} className={cls} q={q} open={openId === q.id} onToggle={() => setOpenId(openId === q.id ? null : q.id)} onPractice={() => practice(q)} />;
          })}
        </ul>
      )}
      {!showAll && filtered.length > PAGE && (
        <div className="i18n-zh mt-4 text-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            顯示全部 {filtered.length} 題
          </Button>
        </div>
      )}
    </div>
  );
}

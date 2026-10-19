"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, Mic, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUESTIONS } from "@/lib/data/questions";
import { COMPANY_TYPES, FOCUS_TOPICS } from "@/lib/data/options";
import type { CompanyType, FocusTopic, Question } from "@/lib/types";
import { getLastConfig, setPendingConfig } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Kind = "all" | "trap" | "behavioral" | "en" | "group";

const KINDS: { id: Kind; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "trap", label: "陷阱題" },
  { id: "behavioral", label: "行為題（STAR）" },
  { id: "en", label: "英文面試" },
  { id: "group", label: "群面" },
];

function QuestionCard({ q, open, onToggle, onPractice }: { q: Question; open: boolean; onToggle: () => void; onPractice: () => void }) {
  const companies = q.companyTypes === "all" ? "所有公司" : q.companyTypes.map((c) => COMPANY_TYPES.find((x) => x.id === c)?.short).join("、");
  return (
    <li className="rounded-2xl border border-line-soft bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]" id={`q-${q.id}`}>
      <h2 className="m-0 text-base">
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full cursor-pointer items-start gap-3 rounded-2xl p-4 text-left sm:p-5">
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap gap-1.5">
              {q.trap && <Badge variant="bad">陷阱題</Badge>}
              {q.category === "group" && <Badge variant="ink">群面</Badge>}
              {q.lang === "en" && <Badge>English</Badge>}
              <Badge variant="outline">{companies}</Badge>
            </span>
            <span className="mt-1.5 block font-sans text-base font-bold leading-snug text-ink [text-wrap:pretty]">{q.text}</span>
          </span>
          <ChevronDown className={cn("mt-1 size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </h2>
      {open && (
        <div className="space-y-4 border-t border-line-soft px-4 pb-5 pt-4 sm:px-5">
          <div>
            <h3 className="text-sm font-bold text-muted">HR 真正想知道</h3>
            <p className="mt-1 text-ink-2">{q.intent}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-good-tint px-4 py-3">
              <h3 className="text-sm font-bold text-good">加分</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
                {q.goodSignals.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div className="rounded-xl bg-bad-tint px-4 py-3">
              <h3 className="text-sm font-bold text-bad">扣分／紅旗</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
                {q.redFlags.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          </div>
          {q.tip && <p className="rounded-xl bg-brand-tint px-4 py-3 text-sm font-bold text-brand-strong">💡 {q.tip}</p>}
          <details className="group rounded-xl border border-line-soft px-4 py-3">
            <summary className="cursor-pointer text-sm font-bold text-ink">看範例回答</summary>
            <p className="mt-2 leading-relaxed text-ink-2">{q.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">請參考結構，換成你自己的經驗和數字。</p>
          </details>
          {q.followUps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-muted">面試官可能的追問</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
                {q.followUps.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {q.category !== "group" ? (
              <Button variant="soft" onClick={onPractice}>
                <Mic aria-hidden />
                用這題練習
              </Button>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Users className="size-4" aria-hidden />
                群面需要多人，建議找 3–5 位同學一起，用計時器照五個步驟練。
              </p>
            )}
            {q.source && (
              <a href={q.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
                參考：{q.source.label}
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
  const params = useSearchParams();
  const [company, setCompany] = useState<CompanyType | "all">("all");
  const [kind, setKind] = useState<Kind>("all");
  const [focus, setFocus] = useState<FocusTopic | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const f = params.get("focus") as FocusTopic | null;
    if (f && FOCUS_TOPICS.some((x) => x.id === f)) {
      setFocus(f);
      const first = QUESTIONS.find((q) => q.focus === f && q.lang === "zh");
      if (first) setOpenId(first.id);
    }
    const id = params.get("q");
    if (id) setOpenId(id);
  }, [params]);

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

  return (
    <div className="mt-6">
      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">搜尋題目</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋：薪資、空窗期、加班、台積電…"
            className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-[16px] outline-none focus:border-brand"
          />
        </label>
        <div role="group" aria-label="題型" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              aria-pressed={kind === k.id}
              onClick={() => setKind(k.id)}
              className={cn("h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold", kind === k.id ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-2")}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="公司類型" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button type="button" aria-pressed={company === "all"} onClick={() => setCompany("all")} className={cn("h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold", company === "all" ? "border-brand bg-brand-tint text-brand-strong" : "border-line bg-white text-ink-2")}>
            所有公司
          </button>
          {COMPANY_TYPES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={company === c.id}
              onClick={() => setCompany(c.id)}
              className={cn("h-10 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold", company === c.id ? "border-brand bg-brand-tint text-brand-strong" : "border-line bg-white text-ink-2")}
            >
              {c.short}
            </button>
          ))}
        </div>
        {focus && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            只顯示：<Badge variant="bad">{FOCUS_TOPICS.find((f) => f.id === focus)?.label}</Badge>
            <button type="button" className="cursor-pointer font-bold text-brand underline" onClick={() => setFocus(null)}>
              顯示全部
            </button>
          </p>
        )}
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">共 {filtered.length} 題</p>
      {filtered.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-white p-8 text-center">
          <p className="font-bold text-ink">沒有符合的題目</p>
          <p className="mt-1 text-sm text-ink-2">換個關鍵字，或清除篩選條件看看。</p>
          <Button variant="outline" className="mt-4" onClick={reset}>清除篩選</Button>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {filtered.map((q) => (
            <QuestionCard key={q.id} q={q} open={openId === q.id} onToggle={() => setOpenId(openId === q.id ? null : q.id)} onPractice={() => practice(q)} />
          ))}
        </ul>
      )}
    </div>
  );
}

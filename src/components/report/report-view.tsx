"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Flag, Lightbulb, MessageCircle, Repeat, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/charts/radar-chart";
import { ScoreRing } from "@/components/charts/score-ring";
import type { AnswerFeedback, Session } from "@/lib/types";
import { companyLabel, difficultyLabel, roleLabel } from "@/lib/data/options";
import { FILLERS_EN, FILLERS_ZH } from "@/lib/analysis/lexicon";
import { getLastConfig, setLastConfig, setPendingConfig } from "@/lib/storage";
import { cn, formatDate } from "@/lib/utils";

function scoreTone(n: number) {
  return n >= 80 ? "good" : n >= 60 ? "default" : "warn";
}

function Highlighted({ text, en }: { text: string; en: boolean }) {
  const words = (en ? FILLERS_EN : FILLERS_ZH).slice().sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${words.map((w) => (en ? `\\b${w}\\b` : w)).join("|")})`, en ? "gi" : "g");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        words.some((w) => w.toLowerCase() === p.toLowerCase()) ? (
          <mark key={i} className="rounded-sm bg-warn-tint text-warn" title="filler">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function AnswerItem({ a, index, onRetry, defaultOpen, tr }: { a: AnswerFeedback; index: string; onRetry: (baseId: string) => void; defaultOpen: boolean; tr: (zh: string, en: string) => string }) {
  const [open, setOpen] = useState(defaultOpen);
  const en = a.paceUnit === "wpm";
  const canRetry = !a.baseId.startsWith("resume-");
  return (
    <li className="rounded-2xl border border-line-soft bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-start gap-3 rounded-2xl p-4 text-left sm:p-5"
        >
          <span className="mt-0.5 shrink-0 text-sm font-bold text-muted">{index}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              {a.isFollowUp && <Badge variant="warn">{tr("追問", "Follow-up")}</Badge>}
              {a.redFlagIds.length > 0 && (
                <Badge variant="bad">
                  <Flag className="size-3" aria-hidden />
                  {tr(`${a.redFlagIds.length} 個紅旗`, `${a.redFlagIds.length} red flag${a.redFlagIds.length > 1 ? "s" : ""}`)}
                </Badge>
              )}
            </span>
            <span className="mt-1 block font-sans text-base font-bold text-ink [text-wrap:pretty]">{a.questionText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {a.skipped ? <Badge variant="outline">{tr("略過", "Skipped")}</Badge> : <Badge variant={scoreTone(a.score)}>{a.score}</Badge>}
            <ChevronDown className={cn("size-5 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </span>
        </button>
      </h3>
      {open && (
        <div className="space-y-5 border-t border-line-soft px-4 pb-5 pt-4 sm:px-5">
          {/* 逐字稿 */}
          {!a.skipped && (
            <section>
              <h4 className="text-sm font-bold text-muted">{tr("你的逐字稿", "Your answer")}</h4>
              <p className="mt-1.5 rounded-xl bg-canvas px-4 py-3 leading-relaxed text-ink">
                <Highlighted text={a.transcript} en={en} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{a.durationSec > 0 ? `${a.durationSec}${tr(" 秒", "s")} · ` : ""}{a.charCount} {en ? "words" : "字"}</Badge>
                <Badge variant="outline">{tr("語速", "Pace")} {a.pace !== null ? `${a.pace} ${a.paceUnit}` : tr("打字不計", "n/a (typed)")}</Badge>
                <Badge variant={a.fillerTotal >= 4 ? "warn" : "outline"}>
                  {tr("贅字", "Fillers")} {a.fillerTotal}{a.fillers.length ? ` (${a.fillers.slice(0, 3).map((f) => `${f.word}×${f.count}`).join(", ")})` : ""}
                </Badge>
                {a.numbers.length > 0 && <Badge variant="good">{tr("具體數字：", "Numbers: ")}{a.numbers.slice(0, 3).join(", ")}</Badge>}
              </div>
              {a.story && <ul className="mt-2 flex flex-wrap gap-2 text-xs" aria-label="STAR">
                {(
                  [
                    ["s", tr("情境", "Situation")],
                    ["t", tr("任務", "Task")],
                    ["a", tr("行動", "Action")],
                    ["r", tr("結果", "Result")],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold", a.star[k] ? "bg-good-tint text-good" : "bg-line-soft text-muted")}>
                    {a.star[k] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                    {label}
                    <span className="sr-only">{a.star[k] ? "✓" : "✗"}</span>
                  </li>
                ))}
              </ul>}
            </section>
          )}

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <MessageCircle className="size-4 text-brand" aria-hidden />
              {tr("HR 怎麼看", "What the interviewer thinks")}
            </h4>
            <ul className="mt-1.5 space-y-1.5">
              {a.hrThinks.map((t, i) => (
                <li key={i} className="rounded-xl border-l-4 border-brand-line bg-brand-tint/60 px-4 py-2.5 text-[15px] text-ink-2">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Lightbulb className="size-4 text-warn" aria-hidden />
              {tr("怎麼改", "How to improve")}
            </h4>
            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[15px] text-ink-2">
              {a.improve.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </section>

          <details className="rounded-xl bg-good-tint px-4 py-3">
            <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-good">
              <Sparkles className="size-4" aria-hidden />
              {tr("看範例回答", "See an example answer")}
            </summary>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{a.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">{tr("參考結構就好，換成你自己的經驗。", "Use the structure, not the words. Swap in your own experience.")}</p>
          </details>

          {canRetry && (
            <Button variant="soft" onClick={() => onRetry(a.baseId)}>
              <Repeat aria-hidden />
              {tr("再練這一題", "Practise this question")}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function ReportView({ session, previous, idPrefix = "" }: { session: Session; previous: Session | null; idPrefix?: string }) {
  const router = useRouter();
  const { report, config } = session;
  const lang = config.lang;
  const tr = (zh: string, en: string) => (lang === "en" ? en : zh);
  const delta = previous ? report.total - previous.report.total : null;

  const retryOne = (baseId: string) => {
    setPendingConfig({ ...config, singleQuestionId: baseId, quick: false, difficulty: config.difficulty === "pressure" ? "pressure" : "standard" });
    router.push("/interview/");
  };
  const again = () => {
    const c = { ...(session.demo ? getLastConfig() : config), quick: false, singleQuestionId: undefined };
    setLastConfig(c);
    setPendingConfig(c);
    router.push("/interview/");
  };

  // 題號：主題 1, 2…；追問 1-1
  let main = 0;
  let follow = 0;
  const labels = report.answers.map((a) => {
    if (!a.isFollowUp) {
      main += 1;
      follow = 0;
      return `Q${main}`;
    }
    follow += 1;
    return `Q${main}-${follow}`;
  });
  const firstWeak = report.answers.findIndex((a) => !a.skipped && (a.redFlagIds.length || a.score < 65));

  const planItems = Array.from(new Set([report.plan[0], ...report.plan.filter((p) => p.day === "這週" || p.day === "This week"), report.plan[report.plan.length - 1]])).filter(Boolean).slice(0, 3);

  const configLabel = config.quick
    ? tr("3 分鐘暖身", "3-minute warm-up")
    : config.singleQuestionId
      ? tr("單題練習", "Single question")
      : `${config.companyName || companyLabel(config.companyType, lang)} · ${roleLabel(config.role, lang)} · ${difficultyLabel(config.difficulty, lang)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {session.demo && (
        <p className="mb-5 rounded-xl bg-brand-tint px-4 py-2.5 text-sm text-ink-2">
          <b className="text-brand-strong">{tr("示範報告", "Example report")}</b>
          {tr("：範例回答，由同一套分析器產生。", ": sample answers, scored by the same analyser.")}
          <Link href="/setup/" className="ml-1 font-bold text-brand-strong underline">{tr("換你試試 →", "Try it yourself →")}</Link>
        </p>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{tr("回饋報告", "Your feedback")}</h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(session.createdAt, lang)} · {configLabel}
          </p>
        </div>
        <Button onClick={again} className="shrink-0">
          <Repeat aria-hidden />
          {tr("再練一次", "Practise again")}
        </Button>
      </header>

      {/* 總分＋五項能力 */}
      <Card className="mt-6">
        <CardContent className="grid items-center gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={report.total} label={tr("總分", "Score")} />
            {delta !== null && (
              <span className={cn("mt-2 inline-flex items-center gap-1 text-sm font-bold", delta >= 0 ? "text-good" : "text-warn")}>
                {delta >= 0 ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
                {tr("比上次 ", "vs last time ")}{delta >= 0 ? `+${delta}` : delta}
              </span>
            )}
            <p className="mt-3 font-display text-lg font-semibold text-ink">{report.headline}</p>
            <p className="mt-1 text-xs text-muted">
              {tr(`口頭禪 ${report.totalFillers} 次`, `${report.totalFillers} filler word${report.totalFillers === 1 ? "" : "s"}`)}{report.avgPace !== null ? tr(`・平均語速 ${report.avgPace} 字/分`, ` · ${report.avgPace} wpm average`) : ""}
            </p>
          </div>
          <RadarChart dims={report.dims} previous={previous?.report.dims} size={280} lang={lang} />
        </CardContent>
      </Card>

      {/* 紅旗 */}
      {report.redFlags.length > 0 && (
        <section className="mt-8" aria-labelledby={`${idPrefix}flags-title`}>
          <h2 id={`${idPrefix}flags-title`} className="flex items-center gap-2 text-lg font-bold">
            <Flag className="size-5 text-bad" aria-hidden />
            {tr("台灣 HR 眼中的紅旗", "Red flags for interviewers")}
          </h2>
          <ul className="mt-3 space-y-2">
            {report.redFlags.map((f) => (
              <li key={f.id} className="rounded-xl border border-bad/20 bg-white px-4 py-3">
                <p className="font-bold text-bad">{f.title}</p>
                {f.quote && <p className="mt-1 text-sm text-muted">{tr(`你說：「${f.quote}」`, `You said: "${f.quote}"`)}</p>}
                <p className="mt-1.5 text-sm text-ink"><b>{tr("改：", "Fix: ")}</b>{f.fix}</p>
                <details className="mt-1 text-sm text-ink-2">
                  <summary className="cursor-pointer text-xs font-bold text-muted">{tr("為什麼扣分", "Why it matters")}</summary>
                  <p className="mt-1">{f.why}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 逐題回饋 */}
      <section className="mt-8" aria-labelledby={`${idPrefix}answers-title`}>
        <h2 id={`${idPrefix}answers-title`} className="text-lg font-bold">{tr("逐題回饋", "Answer by answer")}</h2>
        <ul className="mt-3 space-y-2">
          {report.answers.map((a, i) => (
            <AnswerItem key={`${a.questionId}-${i}`} a={a} index={labels[i]} onRetry={retryOne} tr={tr} defaultOpen={i === (firstWeak === -1 ? 0 : firstWeak)} />
          ))}
        </ul>
      </section>

      {/* 練習計畫 */}
      <section className="mt-8" aria-labelledby={`${idPrefix}plan-title`}>
        <h2 id={`${idPrefix}plan-title`} className="text-lg font-bold">{tr("下一步", "Next steps")}</h2>
        <ol className="mt-3 divide-y divide-line-soft rounded-2xl border border-line-soft bg-white">
          {planItems.map((p, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="w-12 shrink-0 text-xs font-bold text-brand">{p.day}</span>
              <span className="min-w-0 flex-1 text-sm font-bold text-ink">{p.title}</span>
              {p.href === "/setup/?again=1" ? (
                <Button variant="soft" size="sm" onClick={again}>
                  {p.cta}
                </Button>
              ) : (
                <Button asChild variant="soft" size="sm">
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

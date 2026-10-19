"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Flag, Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/charts/radar-chart";
import { ScoreRing } from "@/components/charts/score-ring";
import type { AnswerFeedback, Session } from "@/lib/types";
import { interviewTitle } from "@/lib/data/options";
import { Transcript, TranscriptLegend } from "@/components/transcript";
import { getLastConfig, setLastConfig, setPendingConfig } from "@/lib/storage";
import { cn, formatDate } from "@/lib/utils";

function scoreTone(n: number) {
  return n >= 80 ? "good" : n >= 60 ? "default" : "warn";
}

function AnswerItem({ a, index, onRetry, defaultOpen, tr }: { a: AnswerFeedback; index: string; onRetry: (baseId: string) => void; defaultOpen: boolean; tr: (zh: string, en: string) => string }) {
  const [open, setOpen] = useState(defaultOpen);
  const en = a.paceUnit === "wpm";
  const canRetry = !a.baseId.startsWith("resume-");
  return (
    <li>
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-start gap-3 p-4 text-left hover:bg-canvas/60 sm:px-5"
        >
          <span className="mt-0.5 w-9 shrink-0 text-sm font-bold tabular-nums text-muted">{index}</span>
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
            <span className="phrase mt-1 block font-sans text-base font-bold text-ink [text-wrap:pretty]">{a.questionText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {a.skipped ? <Badge variant="outline">{tr("略過", "Skipped")}</Badge> : <Badge variant={scoreTone(a.score)}>{a.score}</Badge>}
            <ChevronDown className={cn("size-5 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </span>
        </button>
      </h3>
      {open && (
        <div className="space-y-6 px-4 pb-6 pt-1 sm:pl-[68px] sm:pr-5">
          {/* 逐字稿 */}
          {!a.skipped && (
            <section>
              <h4 className="sr-only">{tr("你的逐字稿", "Your answer")}</h4>
              <Transcript
                text={a.transcript}
                en={en}
                flags={a.flagMarks}
                numbers={a.numbers}
                className="rounded-xl bg-canvas px-4 py-3.5 text-[17px] leading-[1.9] text-ink"
              />
              <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <TranscriptLegend en={en} fillers={a.fillerTotal} flags={a.redFlagIds.length} numbers={a.numbers.length} />
                <p className="flex gap-4 text-xs text-muted">
                  <span className="tabular-nums">
                    {a.durationSec > 0 ? `${a.durationSec}${tr(" 秒，", "s, ")}` : ""}
                    {a.charCount} {en ? "words" : "字"}
                  </span>
                  <span className="tabular-nums">
                    {tr("語速 ", "Pace ")}
                    {a.pace !== null ? `${a.pace} ${a.paceUnit}` : tr("打字不計", "n/a (typed)")}
                  </span>
                </p>
              </div>
              {a.story && <ul className="mt-3 flex flex-wrap gap-1.5 text-xs" aria-label="STAR">
                {(
                  [
                    ["s", tr("情境", "Situation")],
                    ["t", tr("任務", "Task")],
                    ["a", tr("行動", "Action")],
                    ["r", tr("結果", "Result")],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-bold", a.star[k] ? "border-good/30 bg-good-tint text-good" : "border-line-soft bg-white text-muted")}>
                    {a.star[k] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                    {label}
                    <span className="sr-only">{a.star[k] ? "✓" : "✗"}</span>
                  </li>
                ))}
              </ul>}
            </section>
          )}

          <section>
            <h4 className="text-sm font-bold text-ink">{tr("HR 怎麼看", "What the interviewer thinks")}</h4>
            <ul className="mt-2 space-y-2">
              {a.hrThinks.map((t, i) => (
                <li key={i} className="border-l-2 border-brand-line pl-3.5 text-[15px] text-ink-2">
                  {t}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-bold text-ink">{tr("怎麼改", "How to improve")}</h4>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[15px] text-ink-2 marker:font-bold marker:text-muted">
              {a.improve.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </section>

          <details className="group rounded-xl border border-line-soft px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
              {tr("看範例回答", "See an example answer")}
              <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
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

  const configLabel = interviewTitle(config, lang, true);
  const allFlagMarks = Array.from(new Set(report.answers.flatMap((a) => a.flagMarks ?? [])));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {session.demo && (
        <p className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-brand-line/70 bg-brand-tint/70 px-4 py-2.5 text-sm text-ink-2">
          <span>
            <b className="text-brand-strong">{tr("示範報告", "Example report")}</b>
            {tr("：範例回答，由同一套分析器產生。", ": sample answers, scored by the same analyser.")}
          </span>
          <Link href="/setup/" className="font-bold text-brand-strong underline-offset-4 hover:underline">
            {tr("換你試試", "Try it yourself")}
          </Link>
        </p>
      )}

      <header>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{tr("回饋報告", "Your feedback")}</h1>
          <Button onClick={again} className="shrink-0">
            <Repeat aria-hidden />
            {tr("再練一次", "Practise again")}
          </Button>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-ink-2">
          <span>{configLabel}</span>
          <time className="text-muted" dateTime={session.createdAt}>
            {formatDate(session.createdAt, lang)}
          </time>
        </p>
      </header>

      {/* 總分＋五項能力 */}
      <Card className="mt-6">
        <CardContent className="grid items-center gap-6 sm:grid-cols-2 sm:gap-4">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={report.total} label={tr("總分", "Score")} />
            {delta !== null && (
              <span className={cn("mt-2 inline-flex items-center gap-1 text-sm font-bold", delta >= 0 ? "text-good" : "text-warn")}>
                {delta >= 0 ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
                {tr("比上次 ", "vs last time ")}{delta >= 0 ? `+${delta}` : delta}
              </span>
            )}
            <p className="mt-4 max-w-[19rem] font-display text-lg font-bold leading-snug text-ink">{report.headline}</p>
            <p className="mt-1.5 flex gap-3 text-xs text-muted">
              <span>{tr(`口頭禪 ${report.totalFillers} 次`, `${report.totalFillers} filler word${report.totalFillers === 1 ? "" : "s"}`)}</span>
              {report.avgPace !== null && <span>{tr(`平均語速 ${report.avgPace} 字/分`, `${report.avgPace} wpm average`)}</span>}
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
          <ul className="mt-3 divide-y divide-line-soft rounded-2xl border border-line-soft bg-white">
            {report.redFlags.map((f) => (
              <li key={f.id} className="relative px-5 py-4 before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full before:bg-bad">
                <p className="font-bold text-bad">{f.title}</p>
                {f.quote && (
                  <Transcript
                    text={lang === "en" ? `You said: “${f.quote}”` : `你說：「${f.quote}」`}
                    en={lang === "en"}
                    flags={allFlagMarks}
                    className="mt-1 text-[15px] text-ink-2"
                  />
                )}
                <p className="mt-1.5 text-[15px] text-ink">
                  <b>{tr("改：", "Fix: ")}</b>
                  {f.fix}
                </p>
                <details className="mt-1.5 text-sm text-ink-2">
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
        <ul className="mt-3 divide-y divide-line-soft overflow-hidden rounded-2xl border border-line-soft bg-white">
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

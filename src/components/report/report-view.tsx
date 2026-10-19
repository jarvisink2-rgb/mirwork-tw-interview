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
          <mark key={i} className="rounded-sm bg-warn-tint text-warn" title="口頭禪／贅字">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function AnswerItem({ a, index, onRetry, defaultOpen }: { a: AnswerFeedback; index: string; onRetry: (baseId: string) => void; defaultOpen: boolean }) {
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
              {a.isFollowUp && <Badge variant="warn">追問</Badge>}
              {a.redFlagIds.length > 0 && (
                <Badge variant="bad">
                  <Flag className="size-3" aria-hidden />
                  {a.redFlagIds.length} 個紅旗
                </Badge>
              )}
            </span>
            <span className="mt-1 block font-sans text-base font-bold text-ink [text-wrap:pretty]">{a.questionText}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {a.skipped ? <Badge variant="outline">略過</Badge> : <Badge variant={scoreTone(a.score)}>{a.score} 分</Badge>}
            <ChevronDown className={cn("size-5 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </span>
        </button>
      </h3>
      {open && (
        <div className="space-y-5 border-t border-line-soft px-4 pb-5 pt-4 sm:px-5">
          {/* 逐字稿 */}
          {!a.skipped && (
            <section>
              <h4 className="text-sm font-bold text-muted">你的逐字稿</h4>
              <p className="mt-1.5 rounded-xl bg-canvas px-4 py-3 leading-relaxed text-ink">
                <Highlighted text={a.transcript} en={en} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{a.durationSec > 0 ? `${a.durationSec} 秒` : "—"}・{a.charCount} {en ? "words" : "字"}</Badge>
                <Badge variant="outline">語速 {a.pace !== null ? `${a.pace} ${a.paceUnit}` : "打字不計"}</Badge>
                <Badge variant={a.fillerTotal >= 4 ? "warn" : "outline"}>
                  贅字 {a.fillerTotal} 次{a.fillers.length ? `（${a.fillers.slice(0, 3).map((f) => `${f.word}×${f.count}`).join("、")}）` : ""}
                </Badge>
                {a.numbers.length > 0 && <Badge variant="good">具體數字：{a.numbers.slice(0, 3).join("、")}</Badge>}
              </div>
              {a.story && <ul className="mt-2 flex flex-wrap gap-2 text-xs" aria-label="STAR 結構檢查">
                {(
                  [
                    ["s", "情境"],
                    ["t", "任務"],
                    ["a", "行動"],
                    ["r", "結果"],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold", a.star[k] ? "bg-good-tint text-good" : "bg-line-soft text-muted")}>
                    {a.star[k] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                    {label}
                    <span className="sr-only">{a.star[k] ? "有" : "沒有"}</span>
                  </li>
                ))}
              </ul>}
            </section>
          )}

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <MessageCircle className="size-4 text-brand" aria-hidden />
              HR 內心 OS
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
              具體改法
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
              看改寫範例
            </summary>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">{a.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">參考結構就好，換成你自己的經驗。</p>
          </details>

          {canRetry && (
            <Button variant="soft" onClick={() => onRetry(a.baseId)}>
              <Repeat aria-hidden />
              再練這一題
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function ReportView({ session, previous }: { session: Session; previous: Session | null }) {
  const router = useRouter();
  const { report, config } = session;
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

  const planItems = Array.from(new Set([report.plan[0], ...report.plan.filter((p) => p.day === "這週"), report.plan[report.plan.length - 1]])).filter(Boolean).slice(0, 3);

  const configLabel = config.quick
    ? "3 分鐘暖身"
    : config.singleQuestionId
      ? "單題練習"
      : `${config.companyName || companyLabel(config.companyType)}・${roleLabel(config.role)}・${difficultyLabel(config.difficulty)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {session.demo && (
        <p className="mb-5 rounded-xl bg-brand-tint px-4 py-2.5 text-sm text-ink-2">
          <b className="text-brand-strong">示範報告</b>：範例回答，由同一套分析器產生。
          <Link href="/setup/" className="ml-1 font-bold text-brand-strong underline">換你試試 →</Link>
        </p>
      )}

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">回饋報告</h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(session.createdAt)}・{configLabel}・{config.lang === "en" ? "English" : "中文"}
          </p>
        </div>
        <Button onClick={again} className="shrink-0">
          <Repeat aria-hidden />
          再練一次
        </Button>
      </header>

      {/* 總分＋五項能力 */}
      <Card className="mt-6">
        <CardContent className="grid items-center gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center text-center">
            <ScoreRing value={report.total} />
            {delta !== null && (
              <span className={cn("mt-2 inline-flex items-center gap-1 text-sm font-bold", delta >= 0 ? "text-good" : "text-warn")}>
                {delta >= 0 ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
                比上次 {delta >= 0 ? `+${delta}` : delta}
              </span>
            )}
            <p className="mt-3 font-display text-lg font-semibold text-ink">{report.headline}</p>
            <p className="mt-1 text-xs text-muted">
              口頭禪 {report.totalFillers} 次{report.avgPace !== null ? `・平均語速 ${report.avgPace} ${config.lang === "en" ? "wpm" : "字/分"}` : ""}
            </p>
          </div>
          <RadarChart dims={report.dims} previous={previous?.report.dims} size={280} />
        </CardContent>
      </Card>

      {/* 紅旗 */}
      {report.redFlags.length > 0 && (
        <section className="mt-8" aria-labelledby="flags-title">
          <h2 id="flags-title" className="flex items-center gap-2 text-lg font-bold">
            <Flag className="size-5 text-bad" aria-hidden />
            台灣 HR 眼中的紅旗
          </h2>
          <ul className="mt-3 space-y-2">
            {report.redFlags.map((f) => (
              <li key={f.id} className="rounded-xl border border-bad/20 bg-white px-4 py-3">
                <p className="font-bold text-bad">🚩 {f.title}</p>
                {f.quote && <p className="mt-1 text-sm text-muted">你說：「{f.quote}」</p>}
                <p className="mt-1.5 text-sm text-ink"><b>改：</b>{f.fix}</p>
                <details className="mt-1 text-sm text-ink-2">
                  <summary className="cursor-pointer text-xs font-bold text-muted">為什麼扣分</summary>
                  <p className="mt-1">{f.why}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 逐題回饋 */}
      <section className="mt-8" aria-labelledby="answers-title">
        <h2 id="answers-title" className="text-lg font-bold">逐題回饋</h2>
        <ul className="mt-3 space-y-2">
          {report.answers.map((a, i) => (
            <AnswerItem key={`${a.questionId}-${i}`} a={a} index={labels[i]} onRetry={retryOne} defaultOpen={i === (firstWeak === -1 ? 0 : firstWeak)} />
          ))}
        </ul>
      </section>

      {/* 練習計畫 */}
      <section className="mt-8" aria-labelledby="plan-title">
        <h2 id="plan-title" className="text-lg font-bold">下一步</h2>
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

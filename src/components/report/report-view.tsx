"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, Flag, Lightbulb, MessageCircle, Repeat, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarChart } from "@/components/charts/radar-chart";
import { ScoreRing } from "@/components/charts/score-ring";
import type { AnswerFeedback, Session } from "@/lib/types";
import { DIM_LABELS, DIM_ORDER, companyLabel, difficultyLabel, roleLabel } from "@/lib/data/options";
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

          <section>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <Sparkles className="size-4 text-good" aria-hidden />
              改寫範例
            </h4>
            <p className="mt-1.5 rounded-xl bg-good-tint px-4 py-3 text-[15px] leading-relaxed text-ink">{a.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">範例是結構參考。照抄會被聽出來，請換成你自己的經驗和數字。</p>
          </section>

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {session.demo && (
        <div className="mb-5 rounded-2xl border border-brand-line bg-brand-tint px-4 py-3 text-sm text-ink-2">
          <b className="text-brand-strong">這是示範報告。</b>內容是一位資工應屆生的範例回答，分數和回饋由同一套分析器即時產生。
          <Link href="/setup/" className="ml-1 font-bold text-brand-strong underline">換你試試看 →</Link>
        </div>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-muted">{formatDate(session.createdAt)}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">回饋報告</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {config.quick ? (
              <Badge variant="outline">3 分鐘暖身</Badge>
            ) : config.singleQuestionId ? (
              <Badge variant="outline">單題練習</Badge>
            ) : (
              <>
                <Badge variant="outline">{config.companyName || companyLabel(config.companyType)}</Badge>
                <Badge variant="outline">{roleLabel(config.role)}</Badge>
                <Badge variant="outline">{difficultyLabel(config.difficulty)}</Badge>
              </>
            )}
            <Badge variant="outline">{config.lang === "en" ? "English" : "中文"}・{config.mode === "voice" ? "語音" : "打字"}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={again}>
            <Repeat aria-hidden />
            再練一次
          </Button>
        </div>
      </header>

      {/* 總分 */}
      <Card className="mt-6">
        <CardContent className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing value={report.total} />
            {delta !== null && (
              <span className={cn("inline-flex items-center gap-1 text-sm font-bold", delta >= 0 ? "text-good" : "text-warn")}>
                {delta >= 0 ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
                比上次 {delta >= 0 ? `+${delta}` : delta} 分
              </span>
            )}
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-ink">{report.headline}</p>
            {report.strengths.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-ink-2">
                    <Check className="mt-1 size-4 shrink-0 text-good" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["回答", `${report.answers.filter((a) => !a.skipped).length} 題`],
                ["紅旗", `${report.redFlags.length} 個`],
                ["口頭禪", `${report.totalFillers} 次`],
                ["平均語速", report.avgPace !== null ? `${report.avgPace} ${config.lang === "en" ? "wpm" : "字/分"}` : "打字不計"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-canvas px-3 py-2">
                  <dt className="text-xs font-bold text-muted">{k}</dt>
                  <dd className="font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      </Card>

      {/* 雷達圖 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>五項能力</CardTitle>
          <CardDescription>依台灣企業 HR 常用的評估面向計分。{previous ? "虛線是上一次練習。" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-6 md:grid-cols-2">
          <RadarChart dims={report.dims} previous={previous?.report.dims} />
          <table className="w-full text-sm">
            <caption className="sr-only">五項能力分數</caption>
            <tbody>
              {DIM_ORDER.map((d) => (
                <tr key={d} className="border-b border-line-soft last:border-0">
                  <th scope="row" className="py-2.5 pr-3 text-left align-top font-normal">
                    <span className="block font-bold text-ink">{DIM_LABELS[d].label}</span>
                    <span className="block text-xs text-muted">{DIM_LABELS[d].desc}</span>
                  </th>
                  <td className="w-28 py-2.5 align-top">
                    <div className="flex items-center gap-2">
                      <Progress value={report.dims[d]} className="h-1.5" aria-label={`${DIM_LABELS[d].label} ${report.dims[d]} 分`} />
                      <span className="w-7 text-right font-bold tabular-nums">{report.dims[d]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 紅旗 */}
      <section className="mt-8" aria-labelledby="flags-title">
        <h2 id="flags-title" className="flex items-center gap-2 text-xl font-bold">
          <Flag className="size-5 text-bad" aria-hidden />
          台灣 HR 眼中的紅旗
        </h2>
        {report.redFlags.length > 0 && (
          <p className="mt-1 text-sm text-muted">紅旗不代表你不好，而是台灣 HR 很常誤解的說法。多半改一句話就能修好。</p>
        )}
        {report.redFlags.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-good-tint px-4 py-4 text-ink-2">
            這次沒有踩到常見紅旗：薪資答太早、批評前公司、反問說沒有、缺點太假、空窗期沒說收穫…都沒有出現。
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {report.redFlags.map((f) => (
              <li key={f.id} className="rounded-2xl border border-bad/20 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="flex items-center gap-1.5 font-bold text-bad">🚩 {f.title}</p>
                <p className="mt-1 text-xs text-muted">出現在：{f.questionText}</p>
                {f.quote && <p className="mt-2 rounded-lg bg-bad-tint px-3 py-2 text-sm text-ink">你說：「{f.quote}」</p>}
                <p className="mt-2 text-sm text-ink-2"><b className="text-ink">為什麼扣分：</b>{f.why}</p>
                <p className="mt-1 text-sm text-ink-2"><b className="text-ink">怎麼改：</b>{f.fix}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 逐題回饋 */}
      <section className="mt-8" aria-labelledby="answers-title">
        <h2 id="answers-title" className="text-xl font-bold">逐題回饋</h2>
        <p className="mt-1 text-sm text-muted">點開每一題，看逐字稿、HR 內心 OS、具體改法和改寫範例。黃色標示的是口頭禪。</p>
        <ul className="mt-3 space-y-3">
          {report.answers.map((a, i) => (
            <AnswerItem key={`${a.questionId}-${i}`} a={a} index={labels[i]} onRetry={retryOne} defaultOpen={i === (firstWeak === -1 ? 0 : firstWeak)} />
          ))}
        </ul>
      </section>

      {/* 練習計畫 */}
      <section className="mt-8" aria-labelledby="plan-title">
        <h2 id="plan-title" className="text-xl font-bold">接下來的練習計畫</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-2">
          {report.plan.map((p, i) => (
            <li key={i} className="flex flex-col rounded-2xl border border-line-soft bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="text-xs font-bold text-brand">{p.day}</span>
              <span className="mt-1 font-bold text-ink">{p.title}</span>
              <span className="mt-1 flex-1 text-sm text-ink-2">{p.detail}</span>
              {p.href === "/setup/?again=1" ? (
                <Button variant="soft" size="sm" className="mt-3 self-start" onClick={again}>
                  {p.cta}
                </Button>
              ) : (
                <Button asChild variant="soft" size="sm" className="mt-3 self-start">
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="font-bold text-ink">每練一次，報告都會跟上一次比較。</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={again}>
            <Repeat aria-hidden />
            用同樣設定再練
          </Button>
          <Button asChild variant="outline">
            <Link href="/progress/">看我的進度</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

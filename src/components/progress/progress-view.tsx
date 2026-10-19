"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChartLine, ChevronRight, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendChart } from "@/components/charts/trend-chart";
import { QuickStartButton } from "@/components/quick-start-button";
import type { Dim, Session } from "@/lib/types";
import { DIM_LABELS, DIM_ORDER, interviewTitle } from "@/lib/data/options";
import { deleteSessions, listSessions } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface Row {
  id: string | null;
  date: string;
  total: number;
  dims: Record<Dim, number>;
  title: string;
  flags: number;
}

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export function ProgressView() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const lang = useLang();
  const tr = (zh: string, en: string) => (lang === "en" ? en : zh);

  useEffect(() => {
    setSessions(listSessions().filter((s) => !s.demo && s.report.answers.some((a) => !a.skipped)));
  }, []);

  const rows: Row[] = useMemo(() => {
    return (sessions ?? []).map((s) => ({
      id: s.id,
      date: s.createdAt,
      total: s.report.total,
      dims: s.report.dims,
      title: s.config.singleQuestionId && s.answers[0] ? `${s.answers[0].questionText.slice(0, 24)}…` : interviewTitle(s.config, lang),
      flags: s.report.redFlags.length,
    }));
  }, [sessions, lang]);

  if (sessions === null) {
    return <div className="mt-6 min-h-[22rem] animate-pulse rounded-2xl bg-white" role="status" aria-label="Loading" />;
  }

  if (!rows.length) {
    return (
      <Card className="mt-6 flex min-h-[22rem] items-center justify-center">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <ChartLine className="size-8 text-brand" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">{tr("還沒有練習紀錄", "No practice yet")}</h2>
          <p className="mt-1 text-sm text-muted">{tr("練完一次，分數就會出現在這裡。", "Your scores will show up here after your first session.")}</p>
          <div className="mt-5">
            <QuickStartButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = rows[rows.length - 1];
  const first = rows[0];
  const avgDims = DIM_ORDER.reduce((acc, d) => ({ ...acc, [d]: Math.round(rows.slice(-3).reduce((s, r) => s + r.dims[d], 0) / Math.min(rows.length, 3)) }), {} as Record<Dim, number>);
  const weakest = [...DIM_ORDER].sort((a, b) => avgDims[a] - avgDims[b])[0];

  return (
    <div className="mt-6 space-y-4">
      <dl className="grid grid-cols-3 divide-x divide-line-soft rounded-2xl border border-line-soft bg-white">
        {[
          [tr("最新分數", "Latest score"), `${latest.total}`],
          [tr("進步", "Change"), rows.length > 1 ? `${latest.total - first.total >= 0 ? "+" : ""}${latest.total - first.total}` : "—"],
          [tr("練習", "Sessions"), `${rows.length}`],
        ].map(([k, v]) => (
          <div key={k} className="px-4 py-4 sm:px-5">
            <dt className="text-xs font-bold text-muted">{k}</dt>
            <dd className="mt-1 font-brand text-[28px] font-semibold leading-none tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader>
          <CardTitle>{tr("總分趨勢", "Score over time")}</CardTitle>
          {rows.length === 1 && <CardDescription>{tr("再練一次就能看到趨勢。", "Practise again to see a trend.")}</CardDescription>}
        </CardHeader>
        <CardContent>
          <TrendChart
            points={rows.map((r) => ({ label: shortDate(r.date), value: r.total, sub: r.title }))}
            ariaLabel={rows.map((r) => `${shortDate(r.date)} ${r.total}`).join(", ")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tr(`最近 ${Math.min(rows.length, 3)} 次的平均`, `Average of last ${Math.min(rows.length, 3)}`)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DIM_ORDER.map((d) => (
            <div key={d} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="font-bold text-ink">{lang === "en" ? DIM_LABELS[d].en : DIM_LABELS[d].short}</span>
              <Progress value={avgDims[d]} className="h-1.5" aria-label={`${lang === "en" ? DIM_LABELS[d].en : DIM_LABELS[d].label} ${avgDims[d]}`} indicatorClassName={d === weakest ? "bg-warn" : undefined} />
              <span className="text-right font-bold tabular-nums">{avgDims[d]}</span>
            </div>
          ))}
          <p className="flex items-start gap-1.5 pt-2 text-sm text-ink-2">
            <Target className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            <span>
              {tr("下次專心練：", "Focus next on: ")}<b className="text-ink">{lang === "en" ? DIM_LABELS[weakest].en : DIM_LABELS[weakest].short}</b>{" "}({lang === "en" ? DIM_LABELS[weakest].descEn : DIM_LABELS[weakest].desc})
            </span>
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/setup/?again=1">{tr("再練一次", "Practise again")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tr("練習紀錄", "History")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="divide-y divide-line-soft">
            {[...rows].reverse().map((r, i) => {
              const inner = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{r.title}</span>
                    <span className="flex gap-3 text-xs text-muted">
                      <time dateTime={r.date}>{formatDate(r.date, lang)}</time>
                      {r.flags > 0 && <span className="text-bad">{tr(`${r.flags} 個紅旗`, `${r.flags} red flag${r.flags > 1 ? "s" : ""}`)}</span>}
                    </span>
                  </span>
                  <Badge variant={r.total >= 80 ? "good" : r.total >= 60 ? "default" : "warn"}>{r.total}</Badge>
                  {r.id && <ChevronRight className="size-4 text-muted" aria-hidden />}
                </>
              );
              return (
                <li key={`${r.date}-${i}`}>
                  {r.id ? (
                    <Link href={r.id === "demo" ? "/report/demo/" : `/report/?id=${r.id}`} className="flex items-center gap-3 rounded-xl px-1 py-3 hover:bg-canvas">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-1 py-3">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {(
            <div className="mt-4 border-t border-line-soft pt-4">
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-2">{tr("確定要刪除這台裝置上的所有練習紀錄？刪除後無法復原。", "Delete all practice history on this device? This cannot be undone.")}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteSessions(() => true);
                      setSessions([]);
                      setConfirmClear(false);
                    }}
                  >
                    {tr("確定刪除", "Delete")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>{tr("取消", "Cancel")}</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                  <Trash2 aria-hidden />
                  {tr("清除練習紀錄", "Clear history")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

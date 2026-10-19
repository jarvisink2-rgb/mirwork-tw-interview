"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChartLine, ChevronRight, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendChart } from "@/components/charts/trend-chart";
import { QuickStartButton } from "@/components/quick-start-button";
import type { Dim, Session } from "@/lib/types";
import { DIM_LABELS, DIM_ORDER, companyLabel, roleLabel } from "@/lib/data/options";
import { deleteSessions, listSessions } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

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

  useEffect(() => {
    setSessions(listSessions().filter((s) => !s.demo && s.report.answers.some((a) => !a.skipped)));
  }, []);

  const rows: Row[] = useMemo(() => {
    return (sessions ?? []).map((s) => ({
      id: s.id,
      date: s.createdAt,
      total: s.report.total,
      dims: s.report.dims,
      title: s.config.quick ? "3 分鐘暖身" : s.config.singleQuestionId ? `單題：${s.answers[0]?.questionText.slice(0, 14) ?? ""}…` : `${s.config.companyName || companyLabel(s.config.companyType)}・${roleLabel(s.config.role)}`,
      flags: s.report.redFlags.length,
    }));
  }, [sessions]);

  if (sessions === null) {
    return <div className="mt-6 min-h-[70vh] animate-pulse rounded-2xl bg-white" role="status" aria-label="載入中" />;
  }

  if (!rows.length) {
    return (
      <Card className="mt-6 flex min-h-[70vh] items-center justify-center">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <ChartLine className="size-8 text-brand" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">還沒有練習紀錄</h2>
          <p className="mt-1 text-sm text-muted">練完一次，分數就會出現在這裡。</p>
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
      <div className="grid grid-cols-3 gap-3">
        {[
          ["最新分數", `${latest.total}`],
          ["進步", rows.length > 1 ? `${latest.total - first.total >= 0 ? "+" : ""}${latest.total - first.total}` : "—"],
          ["練習", `${rows.length} 次`],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardContent className="p-4 sm:p-4">
              <p className="text-xs font-bold text-muted">{k}</p>
              <p className="mt-0.5 font-display text-2xl font-bold text-ink">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>總分趨勢</CardTitle>
          <CardDescription>{rows.length > 1 ? "把滑鼠移到點上（或用 Tab）看每次的分數。" : "再練一次，就能看到趨勢線。"}</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart
            points={rows.map((r) => ({ label: shortDate(r.date), value: r.total, sub: r.title }))}
            ariaLabel={`總分趨勢：${rows.map((r) => `${shortDate(r.date)} ${r.total} 分`).join("，")}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近 {Math.min(rows.length, 3)} 次的平均</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DIM_ORDER.map((d) => (
            <div key={d} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="font-bold text-ink">{DIM_LABELS[d].short}</span>
              <Progress value={avgDims[d]} className="h-1.5" aria-label={`${DIM_LABELS[d].label} 平均 ${avgDims[d]} 分`} indicatorClassName={d === weakest ? "bg-warn" : undefined} />
              <span className="text-right font-bold tabular-nums">{avgDims[d]}</span>
            </div>
          ))}
          <p className="flex items-center gap-1.5 pt-2 text-sm text-ink-2">
            <Flame className="size-4 text-warn" aria-hidden />
            下次專心練「<b className="text-ink">{DIM_LABELS[weakest].short}</b>」：{DIM_LABELS[weakest].desc}。
          </p>
          <Button asChild size="sm" className="mt-1">
            <Link href="/setup/?again=1">再練一次</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>練習紀錄</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="divide-y divide-line-soft">
            {[...rows].reverse().map((r, i) => {
              const inner = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink">{r.title}</span>
                    <span className="block text-xs text-muted">{formatDate(r.date)}{r.flags ? `・${r.flags} 個紅旗` : ""}</span>
                  </span>
                  <Badge variant={r.total >= 80 ? "good" : r.total >= 60 ? "default" : "warn"}>{r.total} 分</Badge>
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
                  <span className="text-ink-2">確定要刪除這台裝置上的所有練習紀錄？刪除後無法復原。</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      deleteSessions(() => true);
                      setSessions([]);
                      setConfirmClear(false);
                    }}
                  >
                    確定刪除
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>取消</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
                  <Trash2 aria-hidden />
                  清除練習紀錄
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

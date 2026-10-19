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
import { DEMO_TREND } from "@/lib/data/demo";
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
  const [demo, setDemo] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSessions(listSessions().filter((s) => !s.demo && s.report.answers.some((a) => !a.skipped)));
  }, []);

  const rows: Row[] = useMemo(() => {
    if (demo) return DEMO_TREND.map((d, i) => ({ id: i === DEMO_TREND.length - 1 ? "demo" : null, date: d.date, total: d.total, dims: d.dims, title: "示範：科技業・軟體工程師", flags: 0 }));
    return (sessions ?? []).map((s) => ({
      id: s.id,
      date: s.createdAt,
      total: s.report.total,
      dims: s.report.dims,
      title: s.config.quick ? "3 分鐘暖身" : s.config.singleQuestionId ? `單題：${s.answers[0]?.questionText.slice(0, 14) ?? ""}…` : `${s.config.companyName || companyLabel(s.config.companyType)}・${roleLabel(s.config.role)}`,
      flags: s.report.redFlags.length,
    }));
  }, [sessions, demo]);

  if (sessions === null) {
    return <div className="mt-6 min-h-[110vh] animate-pulse rounded-2xl bg-white" role="status" aria-label="載入中" />;
  }

  if (!rows.length) {
    return (
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-tint text-brand-strong">
            <ChartLine className="size-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-bold">還沒有練習紀錄</h2>
          <p className="mt-2 max-w-sm text-ink-2">第一次不用設定什麼，3 分鐘、三題就好。練完分數會出現在這裡。</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <QuickStartButton />
            <Button variant="outline" size="lg" onClick={() => setDemo(true)}>
              先看示範長什麼樣
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = rows[rows.length - 1];
  const first = rows[0];
  const avgDims = DIM_ORDER.reduce((acc, d) => ({ ...acc, [d]: Math.round(rows.slice(-3).reduce((s, r) => s + r.dims[d], 0) / Math.min(rows.length, 3)) }), {} as Record<Dim, number>);
  const weakest = [...DIM_ORDER].sort((a, b) => avgDims[a] - avgDims[b])[0];
  const best = Math.max(...rows.map((r) => r.total));
  const days = new Set(rows.map((r) => r.date.slice(0, 10))).size;

  return (
    <div className="mt-6 space-y-4">
      {demo && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-line bg-brand-tint px-4 py-3 text-sm text-ink-2">
          <span><b className="text-brand-strong">示範資料</b>：這是假想的四次練習，讓你先看看圖表長相。</span>
          <button type="button" className="cursor-pointer font-bold text-brand underline" onClick={() => setDemo(false)}>關閉示範</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["最新分數", `${latest.total}`],
          ["進步", rows.length > 1 ? `${latest.total - first.total >= 0 ? "+" : ""}${latest.total - first.total}` : "—"],
          ["最高分", `${best}`],
          ["練習", `${rows.length} 次・${days} 天`],
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近 {Math.min(rows.length, 3)} 次的平均能力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DIM_ORDER.map((d) => (
              <div key={d}>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-ink">{DIM_LABELS[d].label}{d === weakest && <Badge variant="warn" className="ml-2">最需要練</Badge>}</span>
                  <span className="font-bold tabular-nums">{avgDims[d]}</span>
                </div>
                <Progress value={avgDims[d]} className="mt-1.5 h-1.5" aria-label={`${DIM_LABELS[d].label} 平均 ${avgDims[d]} 分`} indicatorClassName={d === weakest ? "bg-warn" : undefined} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="size-5 text-warn" aria-hidden />下一步</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink-2">
              你的「<b className="text-ink">{DIM_LABELS[weakest].label}</b>」平均 {avgDims[weakest]} 分，是目前最弱的一項。{DIM_LABELS[weakest].desc}。
            </p>
            <p className="mt-2 text-ink-2">建議下一次選「標準」難度，專心把這一項練到 {Math.min(90, avgDims[weakest] + 10)} 分。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/setup/?again=1">再練一次</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/questions/">去題庫</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {!demo && (
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

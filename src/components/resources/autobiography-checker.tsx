"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkAutobiography } from "@/lib/analysis/autobiography";
import { cn } from "@/lib/utils";

const SAMPLE = `我出生在台中一個小康家庭，家中有四個人，父母從小就教導我做人要誠實負責。

我大學就讀企管系，在學期間參加了很多社團活動，也有打工經驗，讓我學到很多。我個性認真負責、細心、抗壓性高，也很喜歡學習新事物。

希望貴公司可以給我一個機會，我一定會努力學習。`;

export function AutobiographyChecker() {
  const [text, setText] = useState("");
  const [job, setJob] = useState("");
  const [company, setCompany] = useState("");
  const result = useMemo(() => checkAutobiography(text, job, company), [text, job, company]);
  const hasText = text.trim().length > 0;

  return (
    <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-ink">
            應徵職缺
            <input value={job} onChange={(e) => setJob(e.target.value)} placeholder="例如：行銷企劃" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] font-normal outline-none focus:border-brand" />
          </label>
          <label className="block text-sm font-bold text-ink">
            公司名稱
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="例如：統一企業" className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[16px] font-normal outline-none focus:border-brand" />
          </label>
        </div>
        <label htmlFor="auto-text" className="mt-3 block text-sm font-bold text-ink">
          貼上你的自傳
        </label>
        <textarea
          id="auto-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="把 104 或 1111 上的自傳貼進來，馬上看到企業會在哪裡扣分。文字只在你的瀏覽器分析。"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] leading-relaxed outline-none focus:border-brand"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
            放一篇常見的範例試試
          </Button>
          {hasText && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setText("")}>
              清除
            </Button>
          )}
        </div>
      </div>
      <div aria-live="polite">
        {!hasText ? (
          <div className="rounded-2xl bg-canvas p-5 text-sm text-ink-2">
            <p className="font-bold text-ink">企業怎麼看自傳？</p>
            <p className="mt-2">yes123 在 2026 年 7 月調查 1,110 家企業：新鮮人自傳平均只拿到 <b>48.1 分</b>，HR 平均花 <b>116 秒</b>看一份。</p>
            <p className="mt-2">這個健檢依照企業最常抱怨的問題，逐項檢查你的自傳。</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line-soft bg-white p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-bold text-ink">健檢結果</p>
              <p className="font-display text-3xl font-bold text-brand-strong">
                {result.score}
                <span className="text-sm font-bold text-muted"> / 100</span>
              </p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {result.checks.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", c.pass ? "bg-good-tint text-good" : "bg-bad-tint text-bad")}>
                    {c.pass ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                  </span>
                  <span className="text-sm">
                    <span className="font-bold text-ink">{c.label}</span>
                    <span className="sr-only">{c.pass ? "：通過" : "：未通過"}</span>
                    <span className="block text-ink-2">{c.detail}</span>
                    {!c.pass && c.employerSays && <span className="block text-xs text-muted">企業調查：{c.employerSays}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

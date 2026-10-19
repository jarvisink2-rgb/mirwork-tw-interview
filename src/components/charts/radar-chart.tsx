"use client";

import { useState } from "react";
import type { Dim } from "@/lib/types";
import { DIM_LABELS, DIM_ORDER } from "@/lib/data/options";

const CURRENT = "#0A6FD6";
const PREVIOUS = "#8E8E93";

/** 五維雷達圖：本次（實線）＋上次（虛線，若有）。每個頂點可 hover / focus 看分數。 */
export function RadarChart({ dims, previous, size = 300 }: { dims: Record<Dim, number>; previous?: Record<Dim, number> | null; size?: number }) {
  const [hover, setHover] = useState<Dim | null>(null);
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = size / 2 - 56;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / DIM_ORDER.length;
  const pt = (i: number, v: number) => [cx + Math.cos(angle(i)) * r * (v / 100), cy + Math.sin(angle(i)) * r * (v / 100)] as const;
  const poly = (d: Record<Dim, number>) => DIM_ORDER.map((k, i) => pt(i, d[k]).join(",")).join(" ");

  return (
    <figure className="relative mx-auto w-full" style={{ maxWidth: size }}>
      <svg viewBox={`-24 0 ${size + 48} ${size + 12}`} className="h-auto w-full overflow-visible" role="img" aria-label={`五項能力：${DIM_ORDER.map((k) => `${DIM_LABELS[k].label} ${dims[k]} 分`).join("，")}`}>
        {[20, 40, 60, 80, 100].map((lvl) => (
          <polygon key={lvl} points={DIM_ORDER.map((_, i) => pt(i, lvl).join(",")).join(" ")} fill="none" stroke="#E5E5EA" strokeWidth={lvl === 100 ? 1.2 : 1} />
        ))}
        {DIM_ORDER.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E5EA" />;
        })}
        {previous && <polygon points={poly(previous)} fill="none" stroke={PREVIOUS} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />}
        <polygon points={poly(dims)} fill={CURRENT} fillOpacity={0.16} stroke={CURRENT} strokeWidth={2} strokeLinejoin="round" />
        {DIM_ORDER.map((k, i) => {
          const [x, y] = pt(i, dims[k]);
          return (
            <g key={k}>
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${DIM_LABELS[k].label}：${dims[k]} 分${previous ? `，上次 ${previous[k]} 分` : ""}`}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(k)}
                onBlur={() => setHover(null)}
                className="cursor-pointer outline-none"
              />
              <circle cx={x} cy={y} r={hover === k ? 6 : 4.5} fill={CURRENT} stroke="#fff" strokeWidth={2} pointerEvents="none" />
            </g>
          );
        })}
        {DIM_ORDER.map((k, i) => {
          const [x, y] = pt(i, 128);
          const anchor = Math.abs(x - cx) < 4 ? "middle" : x > cx ? "start" : "end";
          return (
            <text key={k} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="15" fontWeight={700} fill="#1D1D1F">
              {DIM_LABELS[k].short}
              <tspan x={x} dy="18" fontSize="14" fontWeight={400} fill="#616166">
                {dims[k]}
              </tspan>
            </text>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-ink px-3 py-1.5 text-xs text-white shadow">
          <b>{DIM_LABELS[hover].label}</b> {dims[hover]} 分{previous ? `（上次 ${previous[hover]}）` : ""}
          <span className="block text-white/80">{DIM_LABELS[hover].desc}</span>
        </div>
      )}
      {previous && (
        <figcaption className="mt-1 flex items-center justify-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-brand" />本次</span>
          <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-[#8E8E93]" />上次</span>
        </figcaption>
      )}
    </figure>
  );
}

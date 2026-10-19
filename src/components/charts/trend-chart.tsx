"use client";

import { useEffect, useRef, useState } from "react";

export interface TrendPoint {
  label: string;
  value: number;
  sub?: string;
}

/** 單一序列的分數趨勢折線圖，含 hover / 鍵盤 tooltip。 */
export function TrendChart({ points, height = 220, ariaLabel }: { points: TrendPoint[]; height?: number; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = height;
  const pad = { l: 36, r: 16, t: 16, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / 100) * ih;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");

  return (
    <div className="relative" ref={boxRef}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full" role="img" aria-label={ariaLabel}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#E5E5EA" strokeDasharray={v === 0 ? undefined : "3 4"} />
            <text x={pad.l - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="#616166">
              {v}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#0A6FD6" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={i}>
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="12" fill="#616166">
              {p.label}
            </text>
            <circle cx={x(i)} cy={y(p.value)} r={hover === i ? 7 : 5} fill="#0A6FD6" stroke="#fff" strokeWidth={2} />
            <rect
              x={x(i) - 22}
              y={pad.t}
              width={44}
              height={ih}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${p.label}：${p.value} 分`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="cursor-pointer outline-none"
            />
          </g>
        ))}
        {points.length > 0 && (
          <text x={x(points.length - 1) + (points.length > 1 ? -2 : 12)} y={y(points[points.length - 1].value) - 14} textAnchor={points.length > 1 ? "end" : "start"} fontSize="13" fontWeight={700} fill="#1D1D1F">
            {points[points.length - 1].value}
          </text>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-3 py-1.5 text-xs text-white shadow"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].value) / H) * 100}%`, marginTop: -10 }}
        >
          <b>{points[hover].value} 分</b> · {points[hover].label}
          {points[hover].sub && <span className="block text-white/80">{points[hover].sub}</span>}
        </div>
      )}
    </div>
  );
}

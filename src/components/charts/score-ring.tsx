export function ScoreRing({ value, size = 132, label = "總分" }: { value: number; size?: number; label?: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5EA" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0A6FD6" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div className="absolute text-center">
        <div className="font-brand text-4xl font-bold leading-none text-ink">{value}</div>
        <div className="mt-1 text-xs font-bold text-muted">{label} / 100</div>
      </div>
    </div>
  );
}

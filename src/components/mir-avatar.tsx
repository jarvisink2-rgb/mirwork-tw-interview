import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

/** Mir：MirWork 風格的扁平插畫面試官（原創繪製）。 */
export function MirAvatar({ state = "idle", className, size = 120 }: { state?: AvatarState; className?: string; size?: number }) {
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      {(state === "speaking" || state === "listening") && (
        <span
          aria-hidden
          className={cn("absolute inset-0 rounded-full animate-pulse-ring", state === "speaking" ? "bg-brand-sky/40" : "bg-good/30")}
        />
      )}
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`面試官 Mir（${stateLabel(state)}）`} className="relative">
        <defs>
          <clipPath id="mir-clip">
            <circle cx="60" cy="60" r="58" />
          </clipPath>
        </defs>
        <circle cx="60" cy="60" r="58" fill="#EAF4FF" stroke="#9ED2FF" strokeWidth="2" />
        <g clipPath="url(#mir-clip)">
          {/* body */}
          <path d="M22 120c2-22 16-34 38-34s36 12 38 34z" fill="#004AAD" />
          <path d="M50 87l10 15 10-15" fill="#fff" />
          <path d="M56 92l4 14 4-14-4-4z" fill="#0A84FF" />
          <rect x="72" y="98" width="12" height="8" rx="1.5" fill="#fff" />
          <text x="78" y="104.6" fontSize="5.5" fontWeight="700" textAnchor="middle" fill="#004AAD" fontFamily="Lato, sans-serif">HR</text>
          {/* neck */}
          <rect x="54" y="74" width="12" height="13" rx="5" fill="#EDC2A6" />
          {/* head */}
          <ellipse cx="60" cy="56" rx="19" ry="21" fill="#F6D5BE" />
          {/* hair */}
          <path d="M40 54c-2-17 9-27 21-27 13 0 22 9 20 25-3-7-8-12-17-13-7-1-15 3-20 9-2 2-3 4-4 6z" fill="#1F2A44" />
          <path d="M80 50c2 8 1 18-3 25 4-3 6-10 6-17 0-3-1-6-3-8z" fill="#1F2A44" />
          {/* eyes */}
          <g className={state === "thinking" ? "origin-center" : ""}>
            <ellipse cx="52.5" cy="57" rx="2" ry={state === "thinking" ? 0.9 : 2.3} fill="#1F2A44" />
            <ellipse cx="67.5" cy="57" rx="2" ry={state === "thinking" ? 0.9 : 2.3} fill="#1F2A44" />
          </g>
          <path d="M49 51.5q3.5-2 7 0M64 51.5q3.5-2 7 0" stroke="#1F2A44" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx="48" cy="63" rx="3" ry="1.8" fill="#F2A9A0" opacity=".55" />
          <ellipse cx="72" cy="63" rx="3" ry="1.8" fill="#F2A9A0" opacity=".55" />
          {/* mouth */}
          {state === "speaking" ? (
            <ellipse cx="60" cy="67" rx="4" ry="3" fill="#B5473F">
              <animate attributeName="ry" values="1.2;3.2;1.6;2.8;1.2" dur="0.7s" repeatCount="indefinite" />
            </ellipse>
          ) : (
            <path d="M55 66q5 4.5 10 0" stroke="#B5473F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          )}
        </g>
      </svg>
      {state === "thinking" && (
        <span aria-hidden className="absolute -right-1 top-2 flex gap-1 rounded-full bg-white px-2 py-1 shadow">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      )}
    </div>
  );
}

function stateLabel(s: AvatarState) {
  return { idle: "待命", speaking: "說話中", listening: "聆聽中", thinking: "思考中" }[s];
}

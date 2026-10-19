import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

const LABEL = {
  idle: ["待命", "idle"],
  speaking: ["說話中", "speaking"],
  listening: ["聆聽中", "listening"],
  thinking: ["思考中", "thinking"],
} as const;

/**
 * Mir, the interviewer: MirWork's own "M" on a calm disc.
 * States borrow the video-call vocabulary people already know —
 * a blue ring when Mir is talking, a quiet ring while listening,
 * a slow dashed ring while thinking.
 */
export function MirAvatar({ state = "idle", className, size = 120 }: { state?: AvatarState; className?: string; size?: number }) {
  const disc = Math.round(size * 0.8);
  const ring = size >= 64 ? 3 : 2;
  return (
    <div
      role="img"
      aria-label={`Mir（${LABEL[state][0]} / ${LABEL[state][1]}）`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {state === "speaking" && (
        <span aria-hidden className="absolute rounded-full bg-brand-sky/20 animate-pulse-ring" style={{ width: disc, height: disc }} />
      )}
      {state === "thinking" && (
        <span
          aria-hidden
          className="absolute rounded-full border-2 border-dashed border-brand/60 animate-spin-slow"
          style={{ width: disc + ring * 2 + 4, height: disc + ring * 2 + 4 }}
        />
      )}
      <span
        aria-hidden
        className="relative grid place-items-center rounded-full border border-brand-line bg-brand-tint text-brand-strong transition-shadow duration-300"
        style={{
          width: disc,
          height: disc,
          boxShadow:
            state === "speaking"
              ? `0 0 0 ${ring}px var(--color-brand)`
              : state === "listening"
                ? `0 0 0 ${ring - 1}px var(--color-brand-line)`
                : undefined,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" style={{ width: disc * 0.46, height: disc * 0.46 }}>
          <path d="M5 18V6l7 6 7-6v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

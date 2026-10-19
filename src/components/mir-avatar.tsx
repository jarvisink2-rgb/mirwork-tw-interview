import { cn } from "@/lib/utils";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

const LABEL = {
  idle: ["待命", "idle"],
  speaking: ["說話中", "speaking"],
  listening: ["聆聽中", "listening"],
  thinking: ["思考中", "thinking"],
} as const;

/** Mir：AI 面試官的語音球。狀態用動態表現，不用卡通人像。 */
export function MirAvatar({ state = "idle", className, size = 120 }: { state?: AvatarState; className?: string; size?: number }) {
  const active = state === "speaking" || state === "listening";
  return (
    <div
      role="img"
      aria-label={`Mir（${LABEL[state][0]} / ${LABEL[state][1]}）`}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {active && (
        <>
          <span aria-hidden className="absolute inset-0 rounded-full bg-brand-sky/25 animate-pulse-ring" />
          <span aria-hidden className="absolute inset-0 rounded-full bg-brand-sky/20 animate-pulse-ring [animation-delay:0.6s]" />
        </>
      )}
      <span
        aria-hidden
        className={cn(
          "relative block rounded-full shadow-[0_8px_24px_-8px_rgba(0,74,173,0.55),inset_0_-6px_14px_rgba(0,40,110,0.35)]",
          state === "speaking" && "animate-breathe",
        )}
        style={{
          width: size * 0.78,
          height: size * 0.78,
          background:
            state === "listening"
              ? "radial-gradient(circle at 32% 28%, #ffffff 0%, #bfe6ff 18%, #3aa0ff 52%, #0a6fd6 78%, #004aad 100%)"
              : "radial-gradient(circle at 32% 28%, #ffffff 0%, #cfe8ff 16%, #4ea7ff 48%, #0a6fd6 76%, #003b8a 100%)",
        }}
      >
        {state === "thinking" && (
          <span
            className="absolute inset-0 rounded-full animate-spin-slow opacity-70"
            style={{ background: "conic-gradient(from 0deg, transparent 0 70%, rgba(255,255,255,0.75) 85%, transparent 100%)" }}
          />
        )}
      </span>
    </div>
  );
}

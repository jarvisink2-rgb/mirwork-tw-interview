import { FILLERS_EN, FILLERS_ZH } from "@/lib/analysis/lexicon";
import { cn } from "@/lib/utils";

type Kind = "flag" | "filler" | "good";

const ORDER: Record<Kind, number> = { flag: 0, filler: 1, good: 2 };
const TITLE: Record<Kind, [string, string]> = {
  flag: ["紅旗", "Red flag"],
  filler: ["贅字", "Filler word"],
  good: ["具體數字", "Concrete number"],
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Your answer, marked up the way an interviewer would read it:
 * filler words get a highlighter, red-flag phrases a wavy red underline,
 * concrete numbers a green underline.
 */
export function Transcript({
  text,
  en,
  flags = [],
  numbers = [],
  className,
}: {
  text: string;
  en: boolean;
  flags?: string[];
  numbers?: string[];
  className?: string;
}) {
  const items = [
    ...flags.map((s) => ({ s, kind: "flag" as Kind })),
    ...(en ? FILLERS_EN : FILLERS_ZH).map((s) => ({ s, kind: "filler" as Kind })),
    ...numbers.map((s) => ({ s, kind: "good" as Kind })),
  ]
    .filter((x) => x.s.trim().length > 0)
    .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || b.s.length - a.s.length);

  const pattern = items.map((x) => (en && x.kind === "filler" ? `\\b${esc(x.s)}\\b` : esc(x.s))).join("|");
  const parts = pattern ? text.split(new RegExp(`(${pattern})`, en ? "gi" : "g")) : [text];

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (i % 2 === 0 || !part) return <span key={i}>{part}</span>;
        const kind = items.find((x) => x.s.toLowerCase() === part.toLowerCase())?.kind ?? "filler";
        const title = TITLE[kind][en ? 1 : 0];
        if (kind === "filler")
          return (
            <mark key={i} className="mark-filler" title={title}>
              {part}
            </mark>
          );
        return (
          <span key={i} className={kind === "flag" ? "mark-flag" : "mark-good"} title={title}>
            {part}
          </span>
        );
      })}
    </p>
  );
}

/** A legend that is also the count: each label is drawn in the mark it explains. */
export function TranscriptLegend({
  en,
  fillers,
  flags,
  numbers,
  className,
}: {
  en: boolean;
  fillers: number;
  flags: number;
  numbers: number;
  className?: string;
}) {
  const t = (zh: string, e: string) => (en ? e : zh);
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2", className)}>
      <li>
        <mark className="mark-filler">{t("贅字", "Fillers")}</mark> <span className="tabular-nums">{fillers}</span>
      </li>
      {flags > 0 && (
        <li>
          <span className="mark-flag">{t("紅旗", "Red flags")}</span> <span className="tabular-nums">{flags}</span>
        </li>
      )}
      <li>
        <span className="mark-good">{t("具體數字", "Numbers")}</span> <span className="tabular-nums">{numbers}</span>
      </li>
    </ul>
  );
}

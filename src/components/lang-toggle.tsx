"use client";

import { setLang, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** 中文／English：切換整個介面、面試與回饋的語言。 */
export function LangToggle() {
  const lang = useLang();
  return (
    <div role="group" aria-label="Language / 語言" className="flex items-center rounded-lg border border-line bg-white p-0.5 text-xs font-bold">
      {(
        [
          ["zh", "中文"],
          ["en", "EN"],
        ] as const
      ).map(([l, label]) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn("h-8 min-w-11 cursor-pointer rounded-md px-2.5 transition-colors", lang === l ? "bg-ink text-white" : "text-muted hover:text-ink")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

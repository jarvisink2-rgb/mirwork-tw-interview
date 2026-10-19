"use client";

import { useEffect, useState } from "react";
import { safeStorage } from "@/lib/utils";

export const PREF_LANG_KEY = "mw.prefLang.v1";
export const PREF_LANG_EVENT = "mw:preflang";

/** 中／EN：EN = 外商英文面試模式。只影響面試語言與預設公司類型，介面維持繁體中文。 */
export function LangToggle() {
  const [lang, setLang] = useState<"zh" | "en">("zh");

  useEffect(() => {
    setLang(safeStorage.get<"zh" | "en">(PREF_LANG_KEY, "zh"));
    const onChange = (e: Event) => setLang((e as CustomEvent<"zh" | "en">).detail);
    window.addEventListener(PREF_LANG_EVENT, onChange);
    return () => window.removeEventListener(PREF_LANG_EVENT, onChange);
  }, []);

  const set = (next: "zh" | "en") => {
    setLang(next);
    safeStorage.set(PREF_LANG_KEY, next);
    window.dispatchEvent(new CustomEvent(PREF_LANG_EVENT, { detail: next }));
  };

  return (
    <div role="group" aria-label="面試語言：中文或英文（外商模式）" className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-bold">
      <button
        type="button"
        aria-pressed={lang === "zh"}
        onClick={() => set("zh")}
        className={`h-8 min-w-11 cursor-pointer rounded-full px-2.5 ${lang === "zh" ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
      >
        中文
      </button>
      <button
        type="button"
        aria-pressed={lang === "en"}
        onClick={() => set("en")}
        title="外商英文面試模式"
        className={`h-8 min-w-11 cursor-pointer rounded-full px-2.5 ${lang === "en" ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
      >
        EN<span className="hidden sm:inline"> 外商</span>
      </button>
    </div>
  );
}

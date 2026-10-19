import type { ReactNode } from "react";

export type Lang = "zh" | "en";
export const LANG_KEY = "mw.prefLang.v1";
export const LANG_EVENT = "mw:preflang";

/**
 * Runs in <head> before first paint so the page never flashes the wrong language.
 * Static text is rendered in both languages and CSS hides one (see globals.css).
 */
export const LANG_INIT_SCRIPT = `try{var l=JSON.parse(localStorage.getItem("${LANG_KEY}")||'"zh"');if(l==="en"){document.documentElement.dataset.lang="en";document.documentElement.lang="en"}}catch(e){}`;

/** Bilingual static text. Works in server and client components with no flash. */
export function T({ zh, en }: { zh: ReactNode; en: ReactNode }) {
  return (
    <>
      <span className="i18n-zh">{zh}</span>
      <span className="i18n-en">{en}</span>
    </>
  );
}

/** Pick a string by language. */
export const pick = (lang: Lang, zh: string, en: string) => (lang === "en" ? en : zh);

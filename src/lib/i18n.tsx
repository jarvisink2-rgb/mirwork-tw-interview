"use client";

import { useEffect, useState } from "react";
import { LANG_EVENT, LANG_KEY, type Lang } from "./i18n-shared";

export { T, pick, LANG_KEY, LANG_EVENT, type Lang } from "./i18n-shared";

export function getLang(): Lang {
  if (typeof document === "undefined") return "zh";
  return document.documentElement.dataset.lang === "en" ? "en" : "zh";
}

export function setLang(l: Lang) {
  const el = document.documentElement;
  if (l === "en") el.dataset.lang = "en";
  else delete el.dataset.lang;
  el.lang = l === "en" ? "en" : "zh-Hant-TW";
  try {
    localStorage.setItem(LANG_KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
}

/** Current language for dynamic strings (placeholders, aria labels, generated text). */
export function useLang(): Lang {
  const [lang, set] = useState<Lang>("zh");
  useEffect(() => {
    set(getLang());
    const on = (e: Event) => set((e as CustomEvent<Lang>).detail);
    window.addEventListener(LANG_EVENT, on);
    return () => window.removeEventListener(LANG_EVENT, on);
  }, []);
  return lang;
}

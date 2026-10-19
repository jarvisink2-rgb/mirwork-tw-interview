"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { LANG_EVENT, LANG_KEY, type Lang } from "./i18n-shared";

export { T, pick, LANG_KEY, LANG_EVENT, type Lang } from "./i18n-shared";

function storedLang(): Lang | null {
  try {
    const v = JSON.parse(localStorage.getItem(LANG_KEY) || "null");
    return v === "en" || v === "zh" ? v : null;
  } catch {
    return null;
  }
}

/** Saved preference is the source of truth; the <html> flag is only how CSS shows it. */
export function getLang(): Lang {
  if (typeof document === "undefined") return "zh";
  return storedLang() ?? (document.documentElement.dataset.lang === "en" ? "en" : "zh");
}

function applyToHtml(l: Lang) {
  const el = document.documentElement;
  if (l === "en") {
    if (el.dataset.lang !== "en") el.dataset.lang = "en";
  } else if (el.dataset.lang) delete el.dataset.lang;
  const htmlLang = l === "en" ? "en" : "zh-Hant-TW";
  if (el.lang !== htmlLang) el.lang = htmlLang;
}

export function setLang(l: Lang) {
  try {
    localStorage.setItem(LANG_KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
  applyToHtml(l);
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

/**
 * Keeps <html data-lang> in sync with the saved preference. If React has to
 * re-render the root after a hydration mismatch (e.g. a browser extension
 * edited the page), it resets <html> attributes; this puts the language back.
 */
export function LangSync() {
  useLayoutEffect(() => {
    applyToHtml(getLang());
    const mo = new MutationObserver(() => applyToHtml(getLang()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang", "lang"] });
    return () => mo.disconnect();
  }, []);
  return null;
}

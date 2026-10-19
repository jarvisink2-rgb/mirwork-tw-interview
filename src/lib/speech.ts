"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ───────────── 語音合成（Mir 說話） ───────────── */

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve([]);
    const v = window.speechSynthesis.getVoices();
    if (v.length) {
      cachedVoices = v;
      return resolve(v);
    }
    const t = setTimeout(() => resolve(window.speechSynthesis.getVoices()), 800);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(t);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: "zh" | "en") {
  if (lang === "zh") {
    return (
      voices.find((v) => /zh[-_]TW/i.test(v.lang)) ||
      voices.find((v) => /台灣|臺灣|Taiwan|Mei-?Jia/i.test(v.name)) ||
      voices.find((v) => /zh[-_]HK/i.test(v.lang)) ||
      voices.find((v) => /^zh/i.test(v.lang))
    );
  }
  return voices.find((v) => /en[-_]US/i.test(v.lang) && /Google|Samantha|Natural/i.test(v.name)) || voices.find((v) => /^en/i.test(v.lang));
}

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let skipCurrent: (() => void) | null = null;

/** 朗讀文字。不支援、沒有對應語言的聲音或出錯時直接 resolve，不卡住面試流程。 */
export async function speak(text: string, lang: "zh" | "en", opts: { rate?: number } = {}): Promise<void> {
  if (!ttsSupported()) return;
  const voices = cachedVoices.length ? cachedVoices : await loadVoices();
  const voice = pickVoice(voices, lang);
  if (!voice) return; // 這台裝置沒有中文（或英文）語音，改成只顯示文字
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      skipCurrent = null;
      resolve();
    };
    // 部分瀏覽器長句不會觸發 onend，用估計時間當保險
    const fallback = setTimeout(finish, Math.max(3000, text.length * (lang === "zh" ? 260 : 85) + 1500));
    skipCurrent = finish;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "zh" ? "zh-TW" : "en-US";
      u.voice = voice;
      u.rate = opts.rate ?? (lang === "zh" ? 1.0 : 0.95);
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
    } catch {
      finish();
    }
  });
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel();
  skipCurrent?.();
}

/* ───────────── 語音辨識（使用者回答） ───────────── */

interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative; length: number }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SRErrorEvent { error: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getSR(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function inAppBrowser() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/\bLine\//i.test(ua)) return "LINE";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  return null;
}

export function srSupported() {
  return !!getSR();
}

export type SRError = "denied" | "network" | "no-mic" | "unsupported" | null;

export function useSpeechRecognition(lang: "zh" | "en") {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<SRError>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const wantRef = useRef(false);

  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) {
      setError("unsupported");
      return false;
    }
    setError(null);
    wantRef.current = true;
    const rec = new SR();
    rec.lang = lang === "zh" ? "zh-TW" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const piece = r[0].transcript.trim();
        if (!piece) continue;
        if (r.isFinal) {
          const sep = finalRef.current ? (lang === "zh" ? "，" : " ") : "";
          finalRef.current += sep + piece;
        } else {
          interim += (finalRef.current || interim ? (lang === "zh" ? "" : " ") : "") + piece;
        }
      }
      setText((finalRef.current + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setError("denied");
      } else if (e.error === "audio-capture") {
        wantRef.current = false;
        setError("no-mic");
      } else if (e.error === "network") {
        wantRef.current = false;
        setError("network");
      }
      // "no-speech" / "aborted" → 交給 onend 自動重啟
    };
    rec.onend = () => {
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through */
        }
      }
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      return true;
    } catch {
      setError("unsupported");
      return false;
    }
  }, [lang]);

  const reset = useCallback(() => {
    finalRef.current = "";
    setText("");
  }, []);

  /** 讓使用者手動修正辨識結果後，接著錄音時從修正後的文字繼續 */
  const setManual = useCallback((t: string) => {
    finalRef.current = t;
    setText(t);
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return { listening, text, error, start, stop, reset, setManual };
}

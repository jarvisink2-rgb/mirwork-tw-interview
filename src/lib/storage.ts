"use client";

import type { InterviewConfig, Session } from "@/lib/types";
import { safeStorage } from "@/lib/utils";

const SESSIONS = "mw.sessions.v1";
const LAST_CONFIG = "mw.lastConfig.v1";
const PENDING = "mw.pendingConfig.v1";

export const DEFAULT_CONFIG: InterviewConfig = {
  companyType: "tech",
  role: "software",
  difficulty: "warmup",
  lang: "zh",
  mode: "voice",
  length: 3,
  situation: "fresh",
  focus: [],
};

export function listSessions(): Session[] {
  return safeStorage.get<Session[]>(SESSIONS, []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** 瀏覽器封鎖儲存空間時（無痕模式等），至少讓剛完成的報告在這次瀏覽中看得到 */
let memoryCache: Session | null = null;

export function getSession(id: string): Session | undefined {
  if (memoryCache?.id === id) return memoryCache;
  return listSessions().find((s) => s.id === id);
}

export function saveSession(session: Session) {
  memoryCache = session;
  const all = listSessions().filter((s) => s.id !== session.id);
  all.push(session);
  // 只保留最近 30 次
  return safeStorage.set(SESSIONS, all.slice(-30));
}

export function deleteSessions(predicate: (s: Session) => boolean) {
  safeStorage.set(SESSIONS, listSessions().filter((s) => !predicate(s)));
}

export function getLastConfig(): InterviewConfig {
  return { ...DEFAULT_CONFIG, ...safeStorage.get<Partial<InterviewConfig>>(LAST_CONFIG, {}) };
}

export function setLastConfig(c: InterviewConfig) {
  safeStorage.set(LAST_CONFIG, c);
}

/** setup → interview 之間傳遞設定（sessionStorage 不可靠時退回 localStorage） */
export function setPendingConfig(c: InterviewConfig) {
  try {
    window.sessionStorage.setItem(PENDING, JSON.stringify(c));
  } catch {
    safeStorage.set(PENDING, c);
  }
}

export function takePendingConfig(): InterviewConfig | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING);
    if (raw) return JSON.parse(raw) as InterviewConfig;
  } catch {
    /* fall through */
  }
  const fromLocal = safeStorage.get<InterviewConfig | null>(PENDING, null);
  return fromLocal;
}

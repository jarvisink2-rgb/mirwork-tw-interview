import type { FocusTopic, InterviewConfig, PlannedQuestion, Question } from "@/lib/types";
import { QUESTIONS } from "@/lib/data/questions";
import { companyLabel, roleLabel } from "@/lib/data/options";
import { buildReport, measureLength, questionMeta } from "@/lib/analysis/analyze";
import { NUMBER_RE, RESEARCH_SIGNALS, STAR_EN, STAR_ZH, TRIVIAL_NUMBER } from "@/lib/analysis/lexicon";
import type { InterviewAI } from "./provider";
import { resumeQuestions } from "./resume-questions";

export { resumeQuestions };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FOCUS_TO_QUESTION: Record<FocusTopic, { zh: string; en?: string }> = {
  salary: { zh: "salary" },
  gap: { zh: "gap" },
  leaving: { zh: "leaving", en: "en-leaving" },
  overtime: { zh: "overtime" },
  military: { zh: "military" },
  weakness: { zh: "strength-weakness", en: "en-strength-weakness" },
  english: { zh: "tech-english-intro" },
};

function toPlanned(q: Question): PlannedQuestion {
  return { id: q.id, baseId: q.id, text: q.text, category: q.category, idealSec: q.idealSec };
}

const matchesCompany = (q: Question, c: InterviewConfig) => q.companyTypes === "all" || q.companyTypes.includes(c.companyType);

function planZh(config: InterviewConfig): PlannedQuestion[] {
  const zh = QUESTIONS.filter((q) => q.lang === "zh" && q.category !== "group");
  const byId = (id: string) => zh.find((q) => q.id === id);
  const middleSlots = config.length - 2;
  const picked: Question[] = [];
  const add = (q?: Question) => {
    if (q && !picked.some((p) => p.id === q.id) && q.id !== "intro" && q.id !== "closing") picked.push(q);
  };

  if (!config.quick) {
    // 1) 使用者主動選的情境題（最優先，答應過的就要練到）
    for (const f of config.focus) add(byId(FOCUS_TO_QUESTION[f].zh));
    // 2) 身分情境
    if (config.situation === "unemployed") add(byId("gap"));
    if (config.situation === "career-change") add(byId("career-change-why"));
  }
  // 3) 動機
  add(byId("motivation"));
  // 4) 職缺專屬
  for (const q of shuffle(zh.filter((q) => q.roles?.includes(config.role) && matchesCompany(q, config)))) add(q);
  // 5) 公司類型專屬
  for (const q of shuffle(zh.filter((q) => q.companyTypes !== "all" && q.companyTypes.includes(config.companyType) && !q.roles))) add(q);
  // 6) 行為題
  for (const q of shuffle(zh.filter((q) => q.category === "behavioral" && q.companyTypes === "all"))) add(q);
  // 7) 其他共通題
  for (const q of shuffle(zh.filter((q) => q.companyTypes === "all" && !q.situations && !q.focus))) add(q);

  const resume = resumeQuestions(config.resumeKeywords).slice(0, config.length >= 7 ? 2 : 1);
  const middleCount = Math.max(0, middleSlots - resume.length);
  const chosen = picked.slice(0, middleCount);

  // 排序：動機 → 履歷 → 職缺/行為 → 陷阱題（薪資等放後面，貼近真實面試）
  const rank = (q: Question) => (q.category === "motivation" ? 0 : q.trap || q.focus ? 3 : q.category === "situational" ? 2 : 1);
  chosen.sort((a, b) => rank(a) - rank(b));
  const motivation = chosen.filter((q) => rank(q) === 0).map(toPlanned);
  const rest = chosen.filter((q) => rank(q) !== 0).map(toPlanned);

  return [toPlanned(byId("intro")!), ...motivation, ...resume, ...rest, toPlanned(byId("closing")!)];
}

function planEn(config: InterviewConfig): PlannedQuestion[] {
  const en = QUESTIONS.filter((q) => q.lang === "en");
  const byId = (id: string) => en.find((q) => q.id === id)!;
  const middle: Question[] = [byId("en-why-company")];
  if (!config.quick) {
    if (config.situation === "career-change" || config.situation === "unemployed" || config.focus.includes("leaving")) middle.push(byId("en-leaving"));
    if (config.focus.includes("weakness")) middle.push(byId("en-strength-weakness"));
  }
  for (const id of shuffle(["en-mistake", "en-diversity", "en-why-hire", "en-strength-weakness"])) if (!middle.some((q) => q.id === id)) middle.push(byId(id));
  const resume = config.quick ? [] : resumeQuestions(config.resumeKeywords, "en").slice(0, config.length >= 7 ? 2 : 1);
  const middleCount = Math.max(0, config.length - 2 - resume.length);
  const [first, ...rest] = middle.slice(0, middleCount).map(toPlanned);
  return [toPlanned(byId("en-intro")), ...(first ? [first] : []), ...resume, ...rest, toPlanned(byId("en-questions"))];
}

const ACK_ZH = ["好，謝謝你的分享。", "了解。", "嗯，我明白了。", "好的，我記下來了。", "謝謝，我們繼續。"];
const ACK_EN = ["Thank you.", "Got it.", "Okay, I see.", "Thanks for sharing.", "Alright, let's move on."];

export const mockProvider: InterviewAI = {
  async planQuestions(config) {
    if (config.singleQuestionId) {
      const q = QUESTIONS.find((x) => x.id === config.singleQuestionId);
      if (q) return [toPlanned(q)];
    }
    return config.lang === "en" ? planEn(config) : planZh(config);
  },

  greeting(config, n) {
    const minutes = Math.round(n * 2.2);
    if (config.singleQuestionId) {
      return config.lang === "en"
        ? "Hi, I'm Mir. Let's practise just this one question. Take your time."
        : "你好，我是 Mir。我們今天只練這一題，想清楚再開始也沒關係。";
    }
    if (config.quick) {
      return config.lang === "en"
        ? "Hi, I'm Mir. This is a 3-minute warm-up with three common questions. There are no wrong answers, so just talk to me like a person."
        : "你好，我是 Mir。這是 3 分鐘暖身，只有三題最常見的問題，答不好也完全沒關係，把我當成一個普通人聊天就好。";
    }
    if (config.lang === "en") {
      return `Hi, I'm Mir, and I'll be your interviewer today for the ${roleLabel(config.role, "en")} role${config.companyName ? ` at ${config.companyName}` : ""}. We'll go through ${n} questions, about ${minutes} minutes. ${config.difficulty === "warmup" ? "This is a warm-up, so there's no pressure. " : ""}Whenever you're ready, let's begin.`;
    }
    const company = config.companyName ? `「${config.companyName}」` : `一間${companyLabel(config.companyType)}公司`;
    const round = config.difficulty === "pressure" ? "主管面試" : "第一輪面試";
    const warm = config.difficulty === "warmup" ? "今天是暖身練習，答不好也完全沒關係，放輕鬆就好。" : "";
    return `你好，我是 Mir。今天模擬的是${company}「${roleLabel(config.role)}」的${round}，我們會聊 ${n} 個問題，大約 ${minutes} 分鐘。${warm}準備好了就開始吧。`;
  },

  acknowledge(config, index) {
    const list = config.lang === "en" ? ACK_EN : ACK_ZH;
    return list[index % list.length];
  },

  async followUp({ config, question, answer, followUpsSoFar }) {
    await wait(500 + Math.random() * 500);
    const text = answer.trim();
    if (!text || question.category === "closing") return null;
    const en = config.lang === "en";
    const len = measureLength(text, en);
    // 英文以字數計，約為中文字數的 0.45 倍
    const n = (zh: number) => (en ? Math.round(zh * 0.45) : zh);
    const limit = config.difficulty === "pressure" ? 2 : 1;
    if (followUpsSoFar >= limit) return null;

    const meta = questionMeta(question.baseId);
    const isTrap = !!(meta.trap || meta.focus);

    // 3 分鐘暖身承諾「不追問」
    if (config.quick) return null;

    // 暖身難度：只在回答非常短的時候，依題型溫和地邀請多說一點
    if (config.difficulty === "warmup") {
      if (len >= n(25) || isTrap) return null;
      if (question.category === "intro")
        return en ? "No rush. Could you tell me a bit more, like what you're working on now or something you did well?" : "沒關係，慢慢來。可以多說一點嗎？例如你最近在做的事，或做得最好的一件事。";
      if (question.category === "motivation")
        return en ? "No rush. What do you know about us so far?" : "沒關係，慢慢來。你對我們公司目前有什麼印象？";
      if (["behavioral", "role", "resume"].includes(question.category))
        return en ? "No rush. Could you tell me a bit more, for example what you did yourself?" : "沒關係，慢慢來。可以再多說一點嗎？例如當時你自己做了什麼？";
      return null;
    }

    // 陷阱題的追問很有壓迫感，只在高壓模式出現
    if (isTrap && config.difficulty !== "pressure") return null;
    const cat = question.category;
    const story = ["behavioral", "role", "resume"].includes(cat);
    const star = en ? STAR_EN : STAR_ZH;
    const hasNumber = (text.match(NUMBER_RE) || []).some((n) => !TRIVIAL_NUMBER.test(n.trim()) && !/^\d$/.test(n.trim()));

    if (cat === "intro" && (len < n(60) || !hasNumber) && followUpsSoFar === 0) {
      return en
        ? "Among the experiences you mentioned, which one are you most proud of? Can you tell me more?"
        : "你剛剛提到的經驗裡，有沒有一件你最有成就感的事？可以具體說說嗎？";
    }
    if (cat === "motivation" && !RESEARCH_SIGNALS.test(text) && followUpsSoFar === 0) {
      if (/(薪水|待遇|福利|離家|穩定|年終|salary|benefit)/i.test(text))
        return en ? "Apart from the benefits, what else makes you want to work here?" : "除了福利和距離，還有什麼原因讓你想來這裡？";
      return en ? "How much do you know about our products or services?" : "你對我們公司的產品或服務了解多少？";
    }
    if (story && len < n(40)) return en ? "Could you expand on that with a specific example?" : "可以多說一點嗎？舉一個具體的例子。";
    if (story && !star.r.test(text)) return en ? "And what was the result? What did you learn from it?" : "那最後結果怎麼樣？你從中學到什麼？";
    if (story && !hasNumber && followUpsSoFar === 0) return en ? "Can you put a number on that, like how many people or how much improvement?" : "可以給我一個具體的數字嗎？例如多少人、提升了多少？";

    const pool = meta.followUps.filter(Boolean);
    if (!pool.length) return null;
    if (config.difficulty === "standard" && Math.random() < 0.45) return null;
    return pool[followUpsSoFar % pool.length];
  },

  async evaluate(config, answers) {
    await wait(1200);
    return buildReport(answers, config);
  },
};

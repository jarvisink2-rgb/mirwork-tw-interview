import type { AnswerRecord, InterviewConfig, Report } from "@/lib/types";
import { interviewTitle } from "@/lib/data/options";
import type { InterviewAI } from "./provider";
import { mockProvider } from "./mock-provider";

/**
 * Claude-backed provider. Scores always come from the rule-based analyser;
 * Claude adds live follow-up questions and written feedback.
 * Any failure (no key, timeout, rate limit) silently falls back to the mock.
 */

const context = (c: InterviewConfig) => `${interviewTitle(c, c.lang, true)}${c.quick ? " (warm-up, no follow-ups)" : ""}`;

async function post<T>(body: unknown, timeoutMs: number): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("/api/mir/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export function makeClaudeProvider(model: string, slow = false): InterviewAI {
  // The local Claude Code CLI takes longer per call than the API.
  const followUpMs = slow ? 45000 : 8000;
  const feedbackMs = slow ? 150000 : 30000;
  return {
    ...mockProvider,
    poweredBy: model,

    async followUp(args) {
      const { config, question, answer, followUpsSoFar } = args;
      // Same pacing rules as before: no follow-ups in the warm-up, one per question (two under pressure).
      const limit = config.difficulty === "pressure" ? 2 : 1;
      if (config.quick || followUpsSoFar >= limit || !answer.trim() || question.category === "closing") return null;
      const out = await post<{ followUp: string | null }>({ task: "followup", lang: config.lang, context: context(config), question: question.text, answer }, followUpMs);
      if (out) return out.followUp;
      return mockProvider.followUp(args);
    },

    async evaluate(config: InterviewConfig, answers: AnswerRecord[]): Promise<Report> {
      const report = await mockProvider.evaluate(config, answers);
      const out = await post<{ model: string; summary: string; answers: { comment: string; rewrite: string }[] }>(
        {
          task: "feedback",
          lang: config.lang,
          context: context(config),
          answers: report.answers.map((a) => ({ question: a.questionText, transcript: a.skipped ? "" : a.transcript, score: a.score })),
        },
        feedbackMs,
      );
      if (!out) return report;
      return {
        ...report,
        ai: { model: out.model, summary: out.summary },
        answers: report.answers.map((a, i) => (out.answers[i]?.comment && !a.skipped ? { ...a, ai: out.answers[i] } : a)),
      };
    },
  };
}

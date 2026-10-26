import type { AnswerRecord, InterviewConfig, PlannedQuestion, Report } from "@/lib/types";
import { mockProvider } from "./mock-provider";

/**
 * The single seam between the UI and "the AI".
 *
 * Today `mockProvider` runs fully in the browser: question planning from the
 * curated question bank, rule-based follow-ups, and a deterministic analyser
 * that produces the report from the real transcript.
 *
 * To plug in a real LLM / voice stack later, implement this interface (e.g.
 * `httpProvider` calling `/api/interview/*` route handlers that talk to an LLM)
 * and swap it in `getProvider()`. The UI never imports the mock directly.
 */
export interface InterviewAI {
  /** Pick and order the questions for this session. */
  planQuestions(config: InterviewConfig): Promise<PlannedQuestion[]>;
  /** Interviewer's opening line. */
  greeting(config: InterviewConfig, questionCount: number): string;
  /** Short neutral acknowledgement before the next question. */
  acknowledge(config: InterviewConfig, index: number): string;
  /** Decide whether to ask a follow-up (追問). Return null to move on. */
  followUp(args: {
    config: InterviewConfig;
    question: PlannedQuestion;
    answer: string;
    durationSec: number;
    followUpsSoFar: number;
  }): Promise<string | null>;
  /** Score the whole session and write the feedback report. */
  evaluate(config: InterviewConfig, answers: AnswerRecord[]): Promise<Report>;
  /** Model name when a real LLM is connected (shown to the user). */
  poweredBy?: string;
}

let cached: Promise<InterviewAI> | null = null;

/** Uses Claude when the server has an API key; otherwise the in-browser mock. */
export function getProvider(): Promise<InterviewAI> {
  cached ??= (async () => {
    try {
      const res = await fetch("/api/mir/", { cache: "no-store" });
      const s = res.ok ? ((await res.json()) as { enabled: boolean; model: string | null }) : null;
      if (s?.enabled && s.model) {
        const { makeClaudeProvider } = await import("./claude-provider");
        return makeClaudeProvider(s.model);
      }
    } catch {
      /* offline or static host: fall back */
    }
    return mockProvider;
  })();
  return cached;
}

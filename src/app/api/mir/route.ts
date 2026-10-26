import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "node:child_process";
import os from "node:os";

/**
 * Mir's live brain: Claude writes follow-up questions and personal feedback.
 * The API key stays on the server (Vercel env var ANTHROPIC_API_KEY).
 * Scores are still computed by the rule-based analyser in the browser.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const key = process.env.ANTHROPIC_API_KEY;
const client = key ? new Anthropic({ apiKey: key }) : null;
/** Local demo without an API key: use the Claude Code CLI on this computer (your Claude login). */
const useCli = !client && process.env.MIR_CLAUDE_CLI === "1";
const enabled = !!client || useCli;

/* Basic abuse protection for a public demo: per-IP limit (per server instance). */
const hits = new Map<string, number[]>();
function limited(ip: string, max = 40, windowMs = 10 * 60_000) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");

function persona(lang: "zh" | "en") {
  return lang === "en"
    ? "You are Mir, a friendly but honest interviewer for MirWork, practising job interviews with students and new graduates in Taiwan. Write in natural English."
    : "你是 Mir，MirWork 的模擬面試官，正在陪台灣的大學生、應屆畢業生和待業者練習面試。你友善但誠實，熟悉台灣企業 HR 的標準。請用台灣用語的繁體中文。";
}

function parseJSON(text: string) {
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
}

function askCli(system: string, user: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      process.env.MIR_CLAUDE_BIN || "claude",
      ["-p", `${system}\n\n${user}\n\nReply with the JSON only, no other text.`],
      { cwd: os.tmpdir(), timeout: 120_000, maxBuffer: 1 << 20 },
      (err, stdout) => (err ? reject(err) : resolve(stdout)),
    );
  });
}

async function ask(system: string, user: string, maxTokens: number) {
  if (useCli) return askCli(system, user);
  const res = await client!.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

export async function GET() {
  return Response.json({ enabled, model: client ? MODEL : useCli ? "Claude (Claude Code on this computer)" : null, slow: useCli });
}

export async function POST(req: Request) {
  if (!enabled) return Response.json({ error: "not-configured" }, { status: 503 });
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return Response.json({ error: "forbidden" }, { status: 403 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return Response.json({ error: "rate-limited" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const lang = body.lang === "en" ? "en" : "zh";
  const context = clip(body.context, 300);

  try {
    if (body.task === "followup") {
      const user =
        `${lang === "en" ? "Interview context" : "面試情境"}: ${context}\n` +
        `${lang === "en" ? "Question" : "題目"}: ${clip(body.question, 300)}\n` +
        `${lang === "en" ? "Candidate's answer" : "求職者的回答"}: ${clip(body.answer, 2000)}\n\n` +
        (lang === "en"
          ? 'Decide whether a real interviewer would ask ONE short follow-up here (e.g. the answer is vague, lacks a concrete example, result or number, or raises a concern). If the answer is already complete, do not follow up. Reply with JSON only: {"followUp": "<one question, max 30 words>"} or {"followUp": null}.'
          : '判斷真正的面試官會不會在這裡追問「一個」簡短的問題（例如回答太空泛、缺具體例子、結果或數字，或讓人有疑慮）。如果回答已經完整就不要追問。只回 JSON：{"followUp": "<一個問題，40 字以內>"} 或 {"followUp": null}。');
      const out = parseJSON(await ask(persona(lang), user, 200));
      const f = typeof out?.followUp === "string" ? out.followUp.trim().slice(0, 200) : null;
      return Response.json({ followUp: f || null });
    }

    if (body.task === "feedback") {
      const answers = (Array.isArray(body.answers) ? body.answers : []).slice(0, 12) as Record<string, unknown>[];
      const list = answers
        .map((a, i) => `#${i + 1}\nQ: ${clip(a.question, 300)}\nA: ${clip(a.transcript, 2000) || "(skipped)"}\nRule-based score: ${Number(a.score) || 0}/100`)
        .join("\n\n");
      const user =
        `${lang === "en" ? "Interview context" : "面試情境"}: ${context}\n\n${list}\n\n` +
        (lang === "en"
          ? `For each answer, write (1) "comment": 1–2 sentences on how an interviewer would react, quoting the candidate's own words where useful, and (2) "rewrite": a stronger version of THEIR answer in their voice, keeping their real experiences and not inventing facts (use ___ for details they should fill in), max 90 words. Also write "summary": 2 sentences on the single most important thing to improve. Reply with JSON only: {"summary": "...", "answers": [{"comment": "...", "rewrite": "..."}]} with exactly ${answers.length} items in order.`
          : `針對每一題寫：(1)「comment」：1–2 句，說面試官聽到會怎麼想，適當引用求職者的原話；(2)「rewrite」：用求職者自己的口吻改寫成更好的版本，保留他真實的經驗、不要捏造事實（需要他補的細節用 ___），150 字以內。另外寫「summary」：2 句話，點出最該先改的一件事。只回 JSON：{"summary": "...", "answers": [{"comment": "...", "rewrite": "..."}]}，answers 必須剛好 ${answers.length} 項並依序。`);
      const out = parseJSON(await ask(persona(lang), user, 3000));
      if (!out || !Array.isArray(out.answers)) return Response.json({ error: "bad-output" }, { status: 502 });
      return Response.json({
        model: useCli ? "Claude" : MODEL,
        summary: clip(out.summary, 600),
        answers: answers.map((_, i) => ({ comment: clip(out.answers[i]?.comment, 600), rewrite: clip(out.answers[i]?.rewrite, 1200) })),
      });
    }
    return Response.json({ error: "unknown-task" }, { status: 400 });
  } catch (e) {
    console.error("mir api", e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}

# MirWork 模擬面試 · 台灣版原型

A voice-first AI mock-interview prototype for Taiwanese university students, new graduates and job seekers (大學生／應屆畢業生／待業者), built on MirWork's brand and product direction.

- **Live research page:** `/research` (all sources cited)
- **Stack:** Next.js 15 (App Router, static export) · Tailwind CSS v4 · shadcn/ui-style components on Radix · TypeScript
- **Language:** 繁體中文 (台灣用語) UI, with an English interview mode for 外商

## What it does

| Page | Route | What's in it |
|---|---|---|
| 首頁 | `/` | Value prop for 新鮮人 & 待業者, social proof, one-click 3-minute warm-up |
| 設定面試 | `/setup` | 狀況, 公司類型 (7), 職缺 (9), 難度, 陷阱題 focus, 中/英, 語音/打字, 題數, résumé/自傳 PDF → tailored questions |
| 面試室 | `/interview` | Voice-first: AI interviewer avatar, live mic waveform, live transcript (Web Speech API, zh-TW), timer, 追問 follow-ups, hints, optional webcam self-view, text fallback |
| 回饋報告 | `/report?id=…`, `/report/demo` | Total score + radar (表達・邏輯 STAR・專業度・自信・企業文化契合), per-answer transcript with filler highlighting, pace, STAR check, "HR 內心 OS", concrete fixes, model answer, 台灣 HR 紅旗, practice plan |
| 題庫 | `/questions` | 52 questions by company type, trap questions, STAR, English, 群面, with HR intent / red flags / model answers / follow-ups / sources |
| 進度追蹤 | `/progress` | Score trend, per-dimension average, weakest area, session history |
| 資源 | `/resources` | 自傳健檢 (8 checks based on employer complaints, incl. simplified-character detection), interview-day checklist, salary benchmarks, 5 youth employment subsidies, career exploration tools |
| 研究 | `/research` | Market data, pain points, interview styles, top-5 problems → feature mapping, method & limits, 24 cited sources |

## Architecture

```
src/
  app/                 # routes (all statically exported)
  components/          # UI (shadcn-style primitives in components/ui)
  lib/
    ai/provider.ts     # ← the single seam between UI and "the AI"
    ai/mock-provider.ts# question planning, follow-ups, evaluation (in-browser)
    analysis/          # deterministic analyser: fillers, pace, STAR, numbers, red flags, scoring
    data/              # question bank, options, demo session
    speech.ts          # Web Speech API: TTS (zh-TW voice) + recognition hook
    storage.ts         # localStorage sessions (never throws)
```

All AI behaviour goes through the `InterviewAI` interface in `src/lib/ai/provider.ts`:

```ts
planQuestions(config) → PlannedQuestion[]
greeting(config, n) / acknowledge(config, i) → string
followUp({ config, question, answer, … }) → string | null   // 追問
evaluate(config, answers) → Report                           // the feedback report
```

### Plugging in a real LLM / voice API later

1. Switch `next.config.ts` from `output: "export"` to a normal build.
2. Add route handlers, e.g. `src/app/api/interview/follow-up/route.ts` and `…/evaluate/route.ts`, that call your LLM with the question-bank metadata (`intent`, `goodSignals`, `redFlags`) as rubric.
3. Implement an `httpProvider` that satisfies `InterviewAI` by calling those routes, and return it from `getProvider()`.
4. For voice, replace `useSpeechRecognition` / `speak` in `src/lib/speech.ts` with a streaming STT/TTS service. The `Report` and `AnswerRecord` types stay the same, so the report UI needs no changes.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Deploy to Vercel

Import the repo in Vercel (framework preset: Next.js). It works with no environment variables.

### Turn on Claude (optional)

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your key from console.anthropic.com |
| `ANTHROPIC_MODEL` (optional) | defaults to `claude-sonnet-5-5` |

Then redeploy. Claude then writes Mir's follow-up questions and the written feedback in each report (`src/app/api/mir/route.ts`). Scores stay rule-based. Without a key, or if a call fails, the app falls back to the built-in rules. Set a monthly spend limit in the Anthropic console, because the site is public.

## Honest limits of this prototype

- Scores are rule-based (pace, fillers, STAR keywords, numbers, red-flag phrases) and not yet calibrated against real HR ratings. With an API key, Claude writes follow-ups and feedback text but does not change scores.
- Speech recognition uses the browser's built-in service (Chrome sends audio to Google's speech service). In-app browsers (LINE, IG, FB) usually don't support it, so the app falls back to typing.
- Practice history lives only in the browser's localStorage.

See `CHANGELOG.md` for every design iteration and what each persona review changed.

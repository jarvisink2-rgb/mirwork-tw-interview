import Link from "next/link";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MirAvatar } from "@/components/mir-avatar";
import { QuickStartButton } from "@/components/quick-start-button";
import { Transcript, TranscriptLegend } from "@/components/transcript";
import { analyzeAnswer } from "@/lib/analysis/analyze";
import type { InterviewConfig } from "@/lib/types";
import { T } from "@/lib/i18n-shared";

const BARS = [6, 14, 22, 12, 28, 18, 34, 20, 26, 10, 30, 16, 24, 12, 20, 8, 14, 26, 18, 10];

/* The example below is produced by the same analyser the app uses, at build time. */
const SAMPLE_CONFIG: InterviewConfig = { companyType: "tech", role: "marketing", difficulty: "standard", lang: "zh", mode: "text", length: 5, situation: "fresh", focus: [] };
const SAMPLES = {
  zh: analyzeAnswer(
    { questionId: "motivation", baseId: "motivation", questionText: "為什麼想應徵我們公司？", isFollowUp: false, durationSec: 0, transcript: "因為貴公司很大，然後福利很好，年終也不錯，而且離家近，所以想來應徵。" },
    SAMPLE_CONFIG,
    false,
  ),
  en: analyzeAnswer(
    { questionId: "en-why-company", baseId: "en-why-company", questionText: "Why do you want to join our company?", isFollowUp: false, durationSec: 0, transcript: "Um, the benefits are good, and it's close to home, so I applied." },
    { ...SAMPLE_CONFIG, companyType: "foreign", lang: "en" },
    false,
  ),
};

function Specimen({ lang }: { lang: "zh" | "en" }) {
  const a = SAMPLES[lang];
  const en = lang === "en";
  const flag = a.flags[0];
  return (
    <div className="grid overflow-hidden rounded-2xl border border-line-soft bg-white md:grid-cols-[1.35fr_1fr]">
      <div className="p-6 sm:p-8">
        <p className="text-sm font-bold text-muted">{a.questionText}</p>
        <Transcript
          text={en ? `“${a.transcript}”` : `「${a.transcript}」`}
          en={en}
          flags={a.flagMarks}
          numbers={a.numbers}
          className="mt-3 text-xl leading-[1.9] text-ink sm:text-2xl sm:leading-[1.8]"
        />
        <TranscriptLegend en={en} fillers={a.fillerTotal} flags={a.redFlagIds.length} numbers={a.numbers.length} className="mt-5" />
      </div>
      <div className="flex flex-col gap-5 border-t border-line-soft bg-canvas/60 p-6 sm:p-8 md:border-l md:border-t-0">
        {flag && (
          <>
            <div>
              <h3 className="text-sm font-bold text-bad">{flag.title}</h3>
              <p className="mt-1 text-ink-2">{flag.why}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">{en ? "How to fix it" : "怎麼改"}</h3>
              <p className="mt-1 text-ink-2">{flag.fix}</p>
            </div>
          </>
        )}
        <Link href="/report/demo/" className="mt-auto text-sm font-bold text-brand underline-offset-4 hover:underline">
          {en ? "See a full example report" : "看完整範例報告"}
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-20 md:pt-20">
        <div>
          <h1 className="text-[38px] leading-[1.18] text-ink sm:text-[56px] sm:leading-[1.12]">
            <T
              zh={
                <>
                  面試前，
                  <br />
                  先跟 Mir 練一次。
                </>
              }
              en={
                <>
                  Practise your interview
                  <br />
                  before it counts.
                </>
              }
            />
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-2">
            <T
              zh="台灣企業常問的面試題，用說的練習，每一題都有具體回饋。"
              en="Answer real interview questions out loud and get specific feedback on every answer."
            />
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <QuickStartButton />
            <Button asChild variant="outline" size="lg">
              <Link href="/setup/">
                <T zh="自訂設定" en="Customise" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 產品畫面：這一頁唯一浮起來的東西 */}
        <div aria-hidden className="overflow-hidden rounded-2xl border border-line-soft bg-white shadow-[0_32px_64px_-32px_rgba(16,24,40,0.32),0_8px_20px_-12px_rgba(16,24,40,0.10)]">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-3 text-xs font-bold text-muted">
            <span>
              <T zh="第 1 題 / 5" en="Question 1 of 5" />
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <span className="size-2 rounded-full bg-bad" />
              00:42
            </span>
          </div>
          <div className="px-5 pb-6 pt-5">
            <div className="flex items-center gap-3">
              <MirAvatar state="listening" size={48} />
              <div>
                <p className="text-xs font-bold text-muted">Mir</p>
                <p className="font-bold text-ink">
                  <T zh="請先簡單自我介紹一下。" en="Tell me about yourself." />
                </p>
              </div>
            </div>
            <div className="mt-6 flex h-12 items-center justify-center gap-[3px]">
              {BARS.map((h, i) => (
                <span key={i} className="w-[4px] rounded-full bg-brand" style={{ height: h + 6, opacity: 0.3 + (h / 34) * 0.7 }} />
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-[15px] leading-relaxed text-ink-2">
              <T
                zh="我是今年畢業的企管系學生，大三時負責系學會的迎新宣傳…"
                en="I just graduated in business. In my third year I ran the orientation campaign for…"
              />
            </p>
            <div className="mt-5 flex justify-center">
              <span className="grid size-14 place-items-center rounded-full bg-bad text-white">
                <span className="size-4 rounded-[3px] bg-white" />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line-soft bg-white" aria-labelledby="feedback-title">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20">
          <h2 id="feedback-title" className="text-2xl text-ink sm:text-[32px]">
            <T zh="回饋直接標在你說的話上" en="Feedback, marked on your own words" />
          </h2>
          <p className="mt-2 max-w-xl text-ink-2">
            <T zh="下面是分析器對一段真實回答的輸出，你練習時拿到的報告也長這樣。" en="Below is the analyser's output for one answer. Your own report looks the same." />
          </p>
          <div className="mt-8">
            <div className="i18n-zh">
              <Specimen lang="zh" />
            </div>
            <div className="i18n-en">
              <Specimen lang="en" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-line-soft bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl text-ink">
              <T zh="待業中？" en="Between jobs?" />
            </h2>
            <p className="mt-1 text-ink-2">
              <T zh="練習「空窗期」怎麼說，也看看你符合哪些青年就業補助。" en="Practise explaining an employment gap, and check Taiwan's youth employment subsidies." />
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/setup/?focus=gap">
                <Mic aria-hidden />
                <T zh="練空窗期題目" en="Practise the gap question" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resources/#subsidy">
                <T zh="看補助" en="Subsidies" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

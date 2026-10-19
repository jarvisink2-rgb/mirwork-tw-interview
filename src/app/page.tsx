import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MirAvatar } from "@/components/mir-avatar";
import { QuickStartButton } from "@/components/quick-start-button";
import { T } from "@/lib/i18n-shared";

const STEPS = [
  { zh: ["選公司和職缺", "或直接開始暖身"], en: ["Pick a company and role", "Or jump straight into a warm-up"] },
  { zh: ["用說的回答", "Mir 會像面試官一樣追問"], en: ["Answer out loud", "Mir follows up like a real interviewer"] },
  { zh: ["看回饋報告", "哪句要改、怎麼改"], en: ["Read your report", "What to change, and how"] },
];

const BARS = [6, 14, 22, 12, 28, 18, 34, 20, 26, 10, 30, 16, 24, 12, 20, 8, 14, 26, 18, 10];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-24">
        <div>
          <p className="text-sm font-bold text-brand">
            <T zh="AI 語音模擬面試" en="AI voice interview practice" />
          </p>
          <h1 className="mt-3 text-[36px] leading-[1.15] text-ink sm:text-[52px]">
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
          <Link href="/report/demo/" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
            <T zh="看示範報告" en="See an example report" />
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {/* 產品畫面預覽 */}
        <div aria-hidden className="relative">
          <div className="absolute -inset-x-3 -inset-y-6 -z-10 sm:-inset-6 rounded-[40px] bg-[radial-gradient(60%_60%_at_60%_40%,#d9ecff_0%,transparent_70%)]" />
          <div className="overflow-hidden rounded-2xl border border-line-soft bg-white shadow-[0_24px_48px_-24px_rgba(16,24,40,0.25)]">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-3 text-xs font-bold text-muted">
              <span>
                <T zh="第 1 題 / 5" en="Question 1 of 5" />
              </span>
              <span className="tabular-nums">00:42</span>
            </div>
            <div className="px-5 pb-6 pt-5">
              <div className="flex items-center gap-3">
                <MirAvatar state="listening" size={44} />
                <div>
                  <p className="text-xs font-bold text-muted">Mir</p>
                  <p className="font-bold text-ink">
                    <T zh="請先簡單自我介紹一下。" en="Tell me about yourself." />
                  </p>
                </div>
              </div>
              <div className="mt-6 flex h-12 items-center justify-center gap-[3px]">
                {BARS.map((h, i) => (
                  <span key={i} className="w-[5px] rounded-full bg-brand" style={{ height: h + 6, opacity: 0.35 + (h / 34) * 0.65 }} />
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm leading-relaxed text-ink-2">
                <T
                  zh="我是今年畢業的企管系學生，大三時負責系學會的迎新宣傳…"
                  en="I just graduated in business. In my third year I ran the orientation campaign for…"
                />
              </p>
              <div className="mt-5 flex justify-center">
                <span className="grid size-14 place-items-center rounded-full bg-bad text-white shadow-md">
                  <span className="size-4 rounded-[3px] bg-white" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line-soft bg-white">
        <ol className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {STEPS.map((s, i) => (
            <li key={i}>
              <span className="text-sm font-bold text-brand">0{i + 1}</span>
              <p className="mt-1 font-bold text-ink">
                <T zh={s.zh[0]} en={s.en[0]} />
              </p>
              <p className="text-sm text-muted">
                <T zh={s.zh[1]} en={s.en[1]} />
              </p>
            </li>
          ))}
        </ol>
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

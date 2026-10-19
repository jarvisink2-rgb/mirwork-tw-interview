import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MirAvatar } from "@/components/mir-avatar";
import { QuickStartButton } from "@/components/quick-start-button";

const STEPS = [
  { n: 1, t: "選公司和職缺", d: "或直接按暖身，不用設定" },
  { n: 2, t: "用說的回答", d: "Mir 會像真的面試官一樣追問" },
  { n: 3, t: "看回饋報告", d: "HR 怎麼想、哪句要改、怎麼改" },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.2fr_1fr] md:pt-20">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-ink sm:text-5xl">
            面試前，
            <br />
            先跟 Mir 練一次。
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-2">台灣企業常問的面試題，用說的練習，每一題都有具體回饋。</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <QuickStartButton />
            <Button asChild variant="outline" size="lg">
              <Link href="/setup/">自訂設定</Link>
            </Button>
          </div>
          <Link href="/report/demo/" className="mt-4 inline-block text-sm font-bold text-brand underline-offset-4 hover:underline">
            看示範報告 →
          </Link>
        </div>

        <div aria-hidden className="flex items-center justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-brand-line bg-gradient-to-b from-brand-tint to-white p-6">
            <div className="flex items-center gap-4">
              <MirAvatar state="speaking" size={80} />
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[15px] shadow-sm">先請你簡單自我介紹一下。</div>
            </div>
            <div className="mt-5 flex items-center justify-center">
              <span className="grid size-16 place-items-center rounded-full bg-brand text-white shadow-lg">
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft bg-white">
        <ol className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-sm font-bold text-brand-strong">{s.n}</span>
              <span>
                <span className="block font-bold text-ink">{s.t}</span>
                <span className="block text-sm text-muted">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-brand-strong p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-white">待業中？</h2>
            <p className="mt-1 text-[#E3F0FF]">練習「空窗期」怎麼說，也看看你符合哪些青年就業補助。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="bg-white text-brand-strong hover:bg-brand-tint">
              <Link href="/setup/?focus=gap">練空窗期題目</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white/10">
              <Link href="/resources/#subsidy">看補助</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

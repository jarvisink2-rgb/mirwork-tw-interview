import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, ChartLine, FileText, MessageSquareWarning, Mic, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MirAvatar } from "@/components/mir-avatar";
import { QuickStartButton } from "@/components/quick-start-button";

const PROBLEMS = [
  {
    icon: MessageSquareWarning,
    problem: "投了履歷、面完試，卻沒人告訴你哪裡不好",
    stat: "「投履歷一堆雷缺回，真的是我太廢了嗎？」— Dcard 工作版",
    solution: "每一題都有「HR 內心 OS」：引用你說的原話，告訴你哪裡加分、哪裡扣分。",
  },
  {
    icon: Mic,
    problem: "一緊張就講不出話，越講越快",
    stat: "71.5% 的新鮮人害怕面試時開口（yes123，2026）",
    solution: "用說的練習。Mir 會算你的語速和「然後、就是」出現幾次，還有暖身模式和文字模式。",
  },
  {
    icon: Briefcase,
    problem: "期望薪資、空窗期、加班，這些題不知道怎麼答",
    stat: "54.7% 不知道期望薪資該開多少（yes123，2026）",
    solution: "台灣 HR 的「紅旗」偵測：薪資答太早、批評前公司、反問說沒有，當場標出來並給改法。",
  },
  {
    icon: FileText,
    problem: "自傳寫不出來，寫了也不及格",
    stat: "88.2% 新鮮人不會寫自傳；企業平均只給 48.1 分（yes123，2026）",
    solution: "上傳履歷和自傳，Mir 會從你寫的經驗出題；資源頁還有依企業評分標準做的自傳健檢。",
  },
  {
    icon: Timer,
    problem: "每種公司面試方式都不一樣，不知道從哪開始",
    stat: "台積電一天面 4–6 小時，含性向、英文測驗與 2–3 輪主管面（Cake，2026）",
    solution: "依科技業、傳產、外商、新創、公職國營、金融、服務業出題，含英文面試與群面練習。",
  },
];

const STATS = [
  { value: "93.3%", label: "新鮮人卡在面試準備", source: "yes123，2026/7" },
  { value: "11.81%", label: "20–24 歲失業率，全體只有 3.36%", source: "主計總處，2025/10" },
  { value: "61.8%", label: "新鮮人履歷被企業評為不及格", source: "yes123，2026/7" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div>
          <Badge className="mb-4">給新鮮人與待業中的你</Badge>
          <h1 className="text-[34px] font-bold leading-[1.2] text-ink sm:text-5xl">
            面試前，<br />先跟 Mir 練一次。
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            用說的，跟 AI 面試官練台灣企業真的會問的題目：自我介紹、期望薪資、空窗期、加班、英文面試。每一題都告訴你
            <b className="text-ink"> HR 怎麼想、該怎麼改</b>。
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <QuickStartButton />
            <Button asChild variant="outline" size="lg">
              <Link href="/setup/">自訂產業與職缺</Link>
            </Button>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-4 text-good" aria-hidden />免費、不用註冊</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-4 text-good" aria-hidden />練習紀錄只存在你的裝置</span>
            <Link href="/report/demo/" className="font-bold text-brand underline-offset-4 hover:underline">先看一份示範報告 →</Link>
          </p>
        </div>

        {/* Hero visual: 面試室＋回饋的縮影 */}
        <div aria-hidden className="relative">
          <div className="rounded-3xl border border-brand-line bg-gradient-to-b from-brand-tint to-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <MirAvatar state="speaking" size={84} />
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[15px] shadow-sm">
                你的期望薪資是多少？
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-muted">你的回答</p>
              <p className="mt-1 text-[15px]">「我希望月薪可以有 4.5 萬。」</p>
            </div>
            <div className="mt-3 rounded-2xl border border-bad/20 bg-bad-tint p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-bad">🚩 台灣 HR 眼中的紅旗：直接報死數字</p>
              <p className="mt-1 text-sm text-ink-2">改成「依公司規定，我查過的行情是 3.2–3.6 萬」，再反問試用期與調薪制度。</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ["然後", "×7"],
                ["語速", "232 字/分"],
                ["STAR", "缺結果"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white px-2 py-2 shadow-sm">
                  <div className="text-[11px] font-bold text-muted">{k}</div>
                  <div className="text-sm font-bold text-ink">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section aria-label="MirWork 社群" className="border-y border-line-soft bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 text-center text-sm text-muted sm:flex-row sm:justify-center sm:gap-6 sm:px-6">
          <span>MirWork 已完成<b className="text-ink">數萬場</b>模擬面試</span>
          <span className="hidden sm:inline" aria-hidden>·</span>
          <span>社群成員錄取於 <b className="text-ink">Meta・Google・Roblox・Amazon・Netflix</b></span>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">卡在面試的，不只你一個</h2>
        <p className="mt-2 text-ink-2">台灣不是沒有工作，而是年輕人很難把自己「說出來」。</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <Card key={s.label}>
              <CardContent>
                <div className="font-display text-4xl font-bold text-brand-strong">{s.value}</div>
                <p className="mt-1 font-bold text-ink">{s.label}</p>
                <p className="mt-2 text-xs text-muted">資料來源：{s.source}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Link href="/research/" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
          看完整研究與來源 <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">三步驟，15 分鐘練完一場</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { n: 1, t: "選公司類型和職缺", d: "科技業、傳產、外商、公職…或直接按「3 分鐘暖身」，什麼都不用設定。" },
              { n: 2, t: "用說的回答，Mir 會追問", d: "跟真的面試一樣，講太空泛 Mir 會問「那結果呢？」。想先打字也可以。" },
              { n: 3, t: "拿到逐句回饋報告", d: "雷達圖、逐字稿、HR 怎麼想、改寫範例、紅旗，還有接下來三天的練習計畫。" },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl border border-line-soft bg-canvas p-5">
                <span className="grid size-9 place-items-center rounded-full bg-brand text-white font-bold">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-ink-2">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Problems → features */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">為台灣求職者的 5 個卡關點而做</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PROBLEMS.map(({ icon: Icon, problem, stat, solution }, i) => (
            <Card key={problem} className={i === 0 ? "md:col-span-2" : undefined}>
              <CardContent className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{problem}</h3>
                  <p className="mt-1 text-sm text-muted">{stat}</p>
                  <p className="mt-2 text-ink-2">{solution}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* For job seekers who've been waiting */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-3xl bg-brand-strong p-6 text-white sm:p-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-bold text-[#BFE0FF]">待業中？</p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">空窗期不是扣分的關鍵，說不清楚才是。</h2>
            <p className="mt-3 text-[#E3F0FF]">
              選「待業中」，Mir 會幫你練「這段時間你在做什麼？」。待業超過 180 天的青年，也可以申請勞動部「青年職得好評計畫」的就業獎勵。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="bg-white text-brand-strong hover:bg-brand-tint">
              <Link href="/setup/?focus=gap">練習空窗期題目</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white/10">
              <Link href="/resources/#subsidy">查看青年就業補助</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <Sparkles className="mx-auto size-7 text-brand" aria-hidden />
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">真的面試只有一次，練習可以無限次。</h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <QuickStartButton />
          <Button asChild variant="ghost" size="lg">
            <Link href="/questions/"><BookOpen aria-hidden />先逛逛題庫</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/progress/"><ChartLine aria-hidden />我的進度</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

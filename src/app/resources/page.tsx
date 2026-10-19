import type { Metadata } from "next";
import { ExternalLink, FileText, Gift, Compass, ClipboardCheck, Coins } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutobiographyChecker } from "@/components/resources/autobiography-checker";
import { T } from "@/lib/i18n-shared";

export const metadata: Metadata = {
  title: "求職資源 Resources",
  description: "自傳健檢、面試當天檢查表、期望薪資參考、青年就業補助與職涯探索工具。",
};

const SUBSIDIES = [
  {
    name: "支援青年就業計畫",
    en: { name: "Youth Employment Support", amount: "Up to NT$48,000", who: "Age 15–29, first job, unemployed 60+ days", tag: "New grads" },
    amount: "最高 NT$48,000",
    who: "15–29 歲、第一次找工作、失業 60 天以上",
    what: "求職交通補助每月 6,000 元（最多 3 次）＋就業獎勵最高 30,000 元（同一雇主做滿 90 天、180 天）",
    url: "https://job.taiwanjobs.gov.tw/Internet/special2/woman/docDetail.aspx?docid=42056",
    tag: "應屆畢業",
  },
  {
    name: "青年職得好評計畫",
    en: { name: "Youth Re-employment Reward", amount: "NT$30,000", who: "Age 15–29, unemployed 180+ days", tag: "6+ months searching" },
    amount: "NT$30,000",
    who: "15–29 歲、失業 180 天以上",
    what: "就業獎勵。2026 年起，投保薪資低於門檻的兼職期間也可能算失業期間。不能和上一個計畫同時領。",
    url: "https://www.wda.gov.tw/cp.aspx?n=A25A31DE8D66F1C6&s=E1FC2428B7062918",
    tag: "待業半年以上",
  },
  {
    name: "青年跨域就業促進補助",
    en: { name: "Cross-region Work Subsidy", amount: "Up to NT$92,000", who: "Age 18–29, taking a job 30+ km from home", tag: "Relocating" },
    amount: "最高 NT$92,000",
    who: "18–29 歲、到離家 30 公里以上的地方工作",
    what: "求職交通、異地通勤、搬遷（最高 30,000 元）、租屋（每月最高 5,000 元，12 個月）",
    url: "https://www.wda.gov.tw/cp.aspx?n=A25A31DE8D66F1C6&s=7169BDFE5385FB1E",
    tag: "北漂／外地工作",
  },
  {
    name: "產業新尖兵計畫",
    en: { name: "Industry Training (Elite)", amount: "Course fees up to NT$100,000", who: "Age 15–29, unemployed or changing careers", tag: "Career change" },
    amount: "訓練費最高 NT$100,000",
    who: "15–29 歲、待業或想轉職，補助職訓學費",
    what: "補助職訓課程學費，參訓期間每月學習獎勵 8,000 元（最多 12 個月）。很適合轉職者。",
    url: "https://elite.taiwanjobs.gov.tw/",
    tag: "轉職",
  },
  {
    name: "大專青年預聘計畫",
    en: { name: "Graduate Pre-hire Programme", amount: "NT$10,000", who: "Graduates who stay with a partner employer", tag: "Students" },
    amount: "NT$10,000",
    who: "大專應屆生，畢業後留任合作企業",
    what: "畢業後留任合作企業做滿 30 天，可領一次性獎勵。",
    url: "https://ttms.etraining.gov.tw/eYVTR/ePlaninfo/Index9?type=10",
    tag: "在學生",
  },
];

const CHECKLIST_EN = [
  "Arrive 10–15 minutes early. Too early or late both leave a poor impression.",
  "Go in alone. Do not bring parents or friends into the office.",
  "Silence your phone and keep it away while you wait.",
  "Dress clean and neat, one step more formal than the everyday dress code.",
  "Prepare two questions to ask the interviewer.",
  "If you cannot make it, tell them a day before. Never just not show up.",
  "Bring a printed résumé and your portfolio (or a tablet).",
  "No news after two weeks? Send a short thank-you email and ask about next steps.",
];

const CHECKLIST = [
  "提早 10–15 分鐘到，太早或遲到都會被扣印象分",
  "不要帶家長或朋友陪同進公司（32.9% 新鮮人希望家長陪，但 HR 很在意）",
  "手機轉靜音，等候時不要玩手機遊戲",
  "穿著乾淨整齊，比職缺的日常穿著再正式一點",
  "準備 2 個想問面試官的問題",
  "不能去要提前一天說，不要無故不到（企業「拒絕往來戶」第 1 名）",
  "帶一份紙本履歷和作品集（或平板）",
  "面試後兩週沒消息，可以寄一封感謝信順便詢問進度",
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">
        <T zh="求職資源" en="Resources" />
      </h1>
      <p className="i18n-en mt-2 text-ink-2">For job seekers in Taiwan. Linked government sites are in Chinese.</p>

      <nav aria-label="On this page" className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          ["#autobiography", "自傳健檢", ""],
          ["#checklist", "面試當天", "Checklist"],
          ["#salary", "薪資行情", "Salaries"],
          ["#subsidy", "就業補助", "Subsidies"],
          ["#explore", "職涯探索", "Explore"],
        ].map(([href, zh, en]) => (
          <a key={href} href={href} className={`h-10 shrink-0 rounded-full border border-line bg-white px-4 text-sm font-bold leading-10 text-ink-2 hover:border-brand-line ${en ? "" : "i18n-zh"}`}>
            <T zh={zh} en={en} />
          </a>
        ))}
      </nav>

      <section id="autobiography" className="i18n-zh mt-8 scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-brand" aria-hidden />自傳健檢</CardTitle>
            <CardDescription>貼上自傳，檢查企業最常扣分的 8 個地方。</CardDescription>
          </CardHeader>
          <CardContent>
            <AutobiographyChecker />
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section id="checklist" className="scroll-mt-20">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-brand" aria-hidden />
                <T zh="面試當天檢查表" en="Interview-day checklist" />
              </CardTitle>
              
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {CHECKLIST.map((c, i) => (
                  <li key={c}>
                    <label className="flex cursor-pointer gap-3 text-[15px] text-ink-2">
                      <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#0A6FD6]" />
                      <span>
                        <T zh={c} en={CHECKLIST_EN[i]} />
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="salary" className="scroll-mt-20">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Coins className="size-5 text-brand" aria-hidden />
                <T zh="新鮮人薪資行情" en="Graduate salaries in Taiwan" />
              </CardTitle>
              
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  ["NT$33,176", "企業願給大學新鮮人的平均起薪（碩士 NT$35,941）", "Average starting pay employers offer bachelor's graduates (master's: NT$35,941)", "yes123，2026", "yes123, 2026"],
                  ["NT$38,315", "新鮮人自己期望的平均月薪", "Average monthly pay graduates expect", "1111，2026/5", "1111, May 2026"],
                  ["NT$31,650", "已就業新鮮人的實際平均月薪", "Average monthly pay graduates actually get", "1111 追蹤調查，2024", "1111 follow-up survey, 2024"],
                ].map(([v, d, de, s, se]) => (
                  <div key={v} className="rounded-xl bg-canvas px-4 py-3">
                    <dt className="font-display text-2xl font-bold text-ink">{v}</dt>
                    <dd className="text-sm text-ink-2">
                      <T zh={d} en={de} />
                      <span className="block text-xs text-muted">
                        <T zh={s} en={se} />
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-ink-2">
                <T zh="說法：「依公司規定，我查過的行情是 ___ 到 ___。」" en={"How to say it: \u201cI\u2019m open to the company\u2019s pay scale. From my research, the range is ___ to ___.\u201d"} />
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <section id="subsidy" className="mt-8 scroll-mt-20">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Gift className="size-5 text-brand" aria-hidden />
          <T zh="青年就業補助" en="Youth employment subsidies" />
        </h2>
        <p className="mt-1 text-sm text-muted">
          <T zh="規定每年會調整，申請前請確認，或撥 " en="Rules change every year. Check before applying, or call " />
          <a href="tel:0800777888" className="font-bold text-ink underline">0800-777-888</a>
          <T zh="。" en="." />
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {SUBSIDIES.map((s) => (
            <li key={s.name}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">
                      <T zh={s.name} en={s.en.name} />
                      <span className="i18n-en block text-xs font-normal text-muted">{s.name}</span>
                    </h3>
                    <Badge variant="outline">
                      <T zh={s.tag} en={s.en.tag} />
                    </Badge>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold text-brand-strong">
                    <T zh={s.amount} en={s.en.amount} />
                  </p>
                  <p className="mt-2 text-sm text-ink-2">
                    <T zh={s.who} en={s.en.who} />
                  </p>
                  <span className="flex-1" />
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                    <T zh="官方說明" en="Official page" /> <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          <T zh="來源：Yourator（2026/7/21）、勞動部勞動力發展署。" en="Sources: Yourator (21 Jul 2026); Workforce Development Agency, Ministry of Labor." />
        </p>
      </section>

      <section id="explore" className="mt-8 scroll-mt-20">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Compass className="size-5 text-brand" aria-hidden />
          <T zh="還不確定方向？" en="Not sure where to start?" />
        </h2>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["UCAN 大專校院就業職能平台", "UCAN", "教育部的職業興趣與職能診斷", "Career interest and skills assessment (Ministry of Education)", "https://ucan.moe.edu.tw/"],
            ["台灣就業通", "Taiwan Jobs", "勞動部職缺與職訓課程", "Job listings and training courses (Ministry of Labor)", "https://www.taiwanjobs.gov.tw/"],
            ["投資青年就業方案", "Youth Employment Portal", "青年職涯諮詢與補助入口", "Free career counselling and subsidy information", "https://youth.taiwanjobs.gov.tw/"],
            ["104 履歷診療室", "104 Résumé Clinic", "業界顧問免費看履歷", "Free résumé reviews by industry advisers", "https://blog.104.com.tw/resume-clinic-volunteer-consultants-schedule-continuously-updated"],
          ].map(([t, te, d, de, u]) => (
            <li key={t}>
              <a href={u} target="_blank" rel="noopener noreferrer" className="block h-full rounded-2xl border border-line-soft bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-brand-line">
                <span className="flex items-center gap-1 font-bold text-ink">
                  <T zh={t} en={te} />
                  <ExternalLink className="size-3.5 text-muted" aria-hidden /></span>
                <span className="mt-1 block text-sm text-ink-2">
                  <T zh={d} en={de} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

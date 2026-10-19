import type { Metadata } from "next";
import { ExternalLink, FileText, Gift, Compass, ClipboardCheck, Coins } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutobiographyChecker } from "@/components/resources/autobiography-checker";

export const metadata: Metadata = {
  title: "求職資源",
  description: "自傳健檢、面試當天檢查表、期望薪資參考、青年就業補助與職涯探索工具。",
};

const SUBSIDIES = [
  {
    name: "支援青年就業計畫",
    amount: "最高 NT$48,000",
    who: "15–29 歲、非在學、失業 60 天以上、第一次找工作（之前沒保過勞保）",
    what: "求職交通補助每月 6,000 元（最多 3 次）＋就業獎勵最高 30,000 元（同一雇主做滿 90 天、180 天）",
    url: "https://job.taiwanjobs.gov.tw/Internet/special2/woman/docDetail.aspx?docid=42056",
    tag: "應屆畢業",
  },
  {
    name: "青年職得好評計畫",
    amount: "NT$30,000",
    who: "15–29 歲、非在學、失業 180 天以上",
    what: "就業獎勵。2026 年起，投保薪資低於門檻的兼職期間也可能算失業期間。不能和上一個計畫同時領。",
    url: "https://www.wda.gov.tw/cp.aspx?n=A25A31DE8D66F1C6&s=E1FC2428B7062918",
    tag: "待業半年以上",
  },
  {
    name: "青年跨域就業促進補助",
    amount: "最高 NT$92,000",
    who: "18–29 歲、非在學、沒保過勞保、工作地點離家 30 公里以上",
    what: "求職交通、異地通勤、搬遷（最高 30,000 元）、租屋（每月最高 5,000 元，12 個月）",
    url: "https://www.wda.gov.tw/cp.aspx?n=A25A31DE8D66F1C6&s=7169BDFE5385FB1E",
    tag: "北漂／外地工作",
  },
  {
    name: "產業新尖兵計畫",
    amount: "訓練費最高 NT$100,000",
    who: "15–29 歲、待業或想轉職",
    what: "補助職訓課程學費，參訓期間每月學習獎勵 8,000 元（最多 12 個月）。很適合轉職者。",
    url: "https://elite.taiwanjobs.gov.tw/",
    tag: "轉職",
  },
  {
    name: "大專青年預聘計畫",
    amount: "NT$10,000",
    who: "畢業前一年的大專學生（不含研究所），參加合作企業的實習或訓練",
    what: "畢業後留任合作企業做滿 30 天，可領一次性獎勵。",
    url: "https://ttms.etraining.gov.tw/eYVTR/ePlaninfo/Index9?type=10",
    tag: "在學生",
  },
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
      <h1 className="text-2xl font-bold sm:text-3xl">求職資源</h1>
      <p className="mt-2 text-ink-2">面試以外，你也需要這些：自傳、當天準備、薪資行情，還有政府真的會給的補助。</p>

      <nav aria-label="本頁目錄" className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          ["#autobiography", "自傳健檢"],
          ["#checklist", "面試當天"],
          ["#salary", "薪資行情"],
          ["#subsidy", "就業補助"],
          ["#explore", "職涯探索"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="h-10 shrink-0 rounded-full border border-line bg-white px-4 text-sm font-bold leading-10 text-ink-2 hover:border-brand-line">
            {label}
          </a>
        ))}
      </nav>

      <section id="autobiography" className="mt-8 scroll-mt-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-brand" aria-hidden />自傳健檢</CardTitle>
            <CardDescription>88.2% 的新鮮人說自己不會寫自傳。貼上你的自傳，依照企業最常扣分的 8 個地方逐項檢查。</CardDescription>
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
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-brand" aria-hidden />面試當天檢查表</CardTitle>
              <CardDescription>整理自 104 職涯診所與 yes123 企業調查的常見地雷。</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {CHECKLIST.map((c) => (
                  <li key={c}>
                    <label className="flex cursor-pointer gap-3 text-[15px] text-ink-2">
                      <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[#0A6FD6]" />
                      {c}
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
              <CardTitle className="flex items-center gap-2"><Coins className="size-5 text-brand" aria-hidden />新鮮人薪資行情</CardTitle>
              <CardDescription>被問期望薪資前，先知道這三個數字。</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  ["NT$33,176", "企業願給大學新鮮人的平均起薪（碩士 NT$35,941）", "yes123，2026"],
                  ["NT$38,315", "新鮮人自己期望的平均月薪", "1111，2026/5"],
                  ["NT$31,650", "已就業新鮮人的實際平均月薪", "1111 追蹤調查，2024"],
                ].map(([v, d, s]) => (
                  <div key={v} className="rounded-xl bg-canvas px-4 py-3">
                    <dt className="font-display text-2xl font-bold text-ink">{v}</dt>
                    <dd className="text-sm text-ink-2">{d}<span className="block text-xs text-muted">{s}</span></dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-ink-2">
                面試時的安全說法：「依公司規定，我查過這個職務的行情大約在 ___ 到 ___ 之間。」具體職務可以查 104 薪資情報。
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <section id="subsidy" className="mt-8 scroll-mt-20">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Gift className="size-5 text-brand" aria-hidden />青年就業補助</h2>
        <p className="mt-1 text-ink-2">
          很多人不知道自己符合資格。規定每年會調整，申請前請點連結確認，或撥勞動部免付費專線 <a href="tel:0800777888" className="font-bold text-ink underline">0800-777-888</a>。
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {SUBSIDIES.map((s) => (
            <li key={s.name}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <Badge variant="outline">{s.tag}</Badge>
                  </div>
                  <p className="mt-1 font-display text-xl font-bold text-brand-strong">{s.amount}</p>
                  <p className="mt-2 text-sm text-ink-2"><b className="text-ink">誰可以申請：</b>{s.who}</p>
                  <p className="mt-1 flex-1 text-sm text-ink-2"><b className="text-ink">內容：</b>{s.what}</p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                    官方說明 <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">整理自 Yourator〈2026 青年就業補助怎麼選？〉（2026/7/21）與勞動部勞動力發展署公告。</p>
      </section>

      <section id="explore" className="mt-8 scroll-mt-20">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Compass className="size-5 text-brand" aria-hidden />還不確定方向？</h2>
        <p className="mt-1 text-ink-2">52.2% 的新鮮人說自己求職時「沒有方向感」。這些免費工具可以幫你先找方向。</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["UCAN 大專校院就業職能平台", "教育部的職業興趣探索與職能診斷，很多學校的職涯中心都用它。", "https://ucan.moe.edu.tw/"],
            ["台灣就業通", "勞動部的職缺、職訓課程和各縣市就業服務站。", "https://www.taiwanjobs.gov.tw/"],
            ["投資青年就業方案", "青年職涯諮詢、就業補助與職場體驗的入口。", "https://youth.taiwanjobs.gov.tw/"],
            ["104 履歷診療室", "業界志工顧問免費幫你看履歷，Dcard 上有人說「真的有效」。", "https://blog.104.com.tw/resume-clinic-volunteer-consultants-schedule-continuously-updated"],
          ].map(([t, d, u]) => (
            <li key={t}>
              <a href={u} target="_blank" rel="noopener noreferrer" className="block h-full rounded-2xl border border-line-soft bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-brand-line">
                <span className="flex items-center gap-1 font-bold text-ink">{t}<ExternalLink className="size-3.5 text-muted" aria-hidden /></span>
                <span className="mt-1 block text-sm text-ink-2">{d}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

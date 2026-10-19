import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "研究與資料來源",
  description: "台灣青年就業市場、企業面試方式與求職者痛點研究，以及這個原型每個功能背後的依據。",
};

type Src = { id: number; title: string; org: string; date: string; url: string };

const SOURCES: Src[] = [
  { id: 1, org: "聯合新聞網／中央社（主計總處資料）", title: "畢業生求職影響 8月失業率3.41%連3月走升", date: "2026/9/22", url: "https://udn.com/news/story/7238/9770914" },
  { id: 2, org: "中時新聞網（主計總處資料）", title: "10月失業率連二降！但「20歲出頭青年」仍破10％", date: "2025/11/24", url: "https://www.chinatimes.com/realtimenews/20251124003419-260410" },
  { id: 3, org: "大紀元（主計總處資料）", title: "景氣支撐勞動市場 5月失業率創26年同期新低", date: "2026/6/23", url: "https://www.epochtimes.com/b5/26/6/23/n14794879.htm" },
  { id: 4, org: "yes123求職網", title: "網路世代待業焦慮與求職面試難關調查（n=1,350）", date: "2026/7/23", url: "https://www.yes123.com.tw/admin/white_paper/article.asp?id=20260723102336" },
  { id: 5, org: "yes123求職網", title: "企業評價網路世代求職者調查（n=1,110 家企業）", date: "2026/7/28", url: "https://www.yes123.com.tw/admin/white_paper/article.asp?id=20260728092508" },
  { id: 6, org: "NOWnews（yes123資料）", title: "Z世代待業痛苦與上工開心指數調查", date: "—", url: "https://www.nownews.com/news/6505048" },
  { id: 7, org: "NOWnews（yes123資料）", title: "企業「拒絕往來戶」：面試無故不到 76.6%", date: "—", url: "https://www.nownews.com/news/6707266" },
  { id: 8, org: "104職場力", title: "2026新鮮人面試攻略：9大必考面試問題", date: "2025/11/28", url: "https://blog.104.com.tw/freshman-interview-frequently-asked-questions-and-answer/" },
  { id: 9, org: "104職場力", title: "面試劈頭被問「可以配合加班嗎？」該如何回答", date: "2025/5/10", url: "https://blog.104.com.tw/can-you-work-overtime/" },
  { id: 10, org: "104職場力", title: "面試官問待業空窗期，履歷空白期要怎麼解釋？", date: "2026/7/21", url: "https://blog.104.com.tw/explain-employment-gaps/" },
  { id: 11, org: "104職場力", title: "英文面試懶人包：外商面試常見6大問題", date: "2026/3/1", url: "https://blog.104.com.tw/english-interview-six-questions/" },
  { id: 12, org: "104職涯診所 Podcast EP43", title: "應屆畢業生最常踩到哪些「面試地雷」？沒工作經驗有資格談期待薪資嗎？", date: "2021/7/6", url: "https://blog.104.com.tw/podcast-ep43" },
  { id: 13, org: "Cake", title: "台積電面試懶人包：面試流程、面試問題一次看", date: "2026/9/18", url: "https://www.cake.me/resources/interview-guide/tips-for-tsmc-interview" },
  { id: 14, org: "Yourator", title: "面試被問「為什麼離職？」3 個離職原因範例", date: "2025/3/18", url: "https://www.yourator.co/articles/252" },
  { id: 15, org: "Yourator", title: "2026 青年就業補助怎麼選？初次尋職、失業半年、北漂與職訓方案比較", date: "2026/7/21", url: "https://www.yourator.co/articles/631" },
  { id: 16, org: "1111人力銀行", title: "考選部強化國考口試與職能連結 提升選才效能", date: "2023/9/11", url: "https://www.1111.com.tw/news/jobns/153111" },
  { id: 17, org: "商業周刊", title: "一次淘汰80%求職者！團體面試的步驟、角色、題型", date: "2021/3/17", url: "https://www.businessweekly.com.tw/careers/blog/3005863" },
  { id: 18, org: "商業周刊（yes123資料）", title: "企業新鮮人起薪：大學 3萬3176元、碩士 3萬5941元", date: "2026", url: "https://www.businessweekly.com.tw/career/blog/3021765" },
  { id: 19, org: "Newtalk新聞", title: "2026職場新鮮人調查：平均期望薪資38,315元", date: "2026/5/29", url: "https://newtalk.tw/news/view/2026-05-29/1038099" },
  { id: 20, org: "關鍵評論網", title: "台灣人講話語速有多快？（成人平均每秒 4.4 字）", date: "2025/10/22", url: "https://www.thenewslens.com/article/260113" },
  { id: 21, org: "關鍵評論網", title: "00世代新鮮人求職大調查2：學以致用不到兩成", date: "2023/9/5", url: "https://www.thenewslens.com/article/188720" },
  { id: 22, org: "經濟日報", title: "不再糾結學以致用：近半數新鮮人選擇就業與所學無關", date: "2026/3/6", url: "https://money.udn.com/money/story/5612/9363495" },
  { id: 23, org: "Dcard 工作版", title: "（更）終於找到實習了！履歷健診真的有效", date: "—", url: "https://www.dcard.tw/f/job/p/235196889" },
  { id: 24, org: "MirWork", title: "mirwork.ai 首頁與 interview.mirwork.ai 求職者介面（品牌與流程觀察）", date: "2026/10/19 瀏覽", url: "https://mirwork.ai" },
];

const cite = (...ids: number[]) => (
  <sup className="ml-0.5 text-xs font-bold text-brand">
    {ids.map((id, i) => (
      <span key={id}>
        {i > 0 && ","}
        <a href={`#src-${id}`} aria-label={`來源 ${id}`} className="hover:underline">
          {id}
        </a>
      </span>
    ))}
  </sup>
);

const PROBLEMS = [
  {
    n: 1,
    title: "沒有回饋：面試失敗了，卻不知道為什麼",
    evidence: (
      <>投履歷沒回應是 Dcard 最常見的抱怨；一篇 104 免費履歷健診的心得獲得 2,060 個讚，大家珍惜的是「業師直接點出問題」{cite(23)}。企業平均只用 19.8 分鐘面試一位新鮮人{cite(5)}，結果卻不附理由。</>
    ),
    features: ["回饋報告：逐題「HR 內心 OS」，一定引用你說的原話", "具體改法＋改寫範例", "下一步練習計畫"],
  },
  {
    n: 2,
    title: "怕開口、太緊張：準備面試是最大的卡關",
    evidence: (
      <>93.3% 的新鮮人卡在面試準備、71.5% 害怕面試時開口{cite(4)}；企業「拒絕往來戶」第一名是面試無故不到（76.6%）{cite(7)}。</>
    ),
    features: ["語音優先的面試室，按一下就能開始", "暖身模式、深呼吸提示、可以略過或改用打字", "語速與口頭禪量化（台灣成人平均每秒 4.4 字）"],
  },
  {
    n: 3,
    title: "自傳與履歷：寫不出來，寫了也不及格",
    evidence: (
      <>88.2% 新鮮人不會寫自傳；企業給自傳平均 48.1 分、61.8% 的新鮮人履歷不及格，最常見的問題是千篇一律（61.3%）、看不出優勢（57.1%）、對職務沒想法（56%）{cite(4, 5)}。</>
    ),
    features: ["上傳履歷／自傳 → Mir 從你寫的經驗出題", "自傳健檢：依企業最常扣分的 8 個地方逐項檢查（含簡體字偵測）"],
  },
  {
    n: 4,
    title: "台灣特有的陷阱題：期望薪資、空窗期、加班、兵役、離職原因",
    evidence: (
      <>54.7% 不知道期望薪資該開多少{cite(4)}；企業願給的起薪（大學約 3.3 萬）與新鮮人期待（約 3.8 萬）有落差{cite(18, 19)}。加班題建議「不要直接回答可或不可」{cite(9)}，空窗期則要「簡短說真實原因，再說收穫」{cite(10)}。</>
    ),
    features: ["「台灣 HR 眼中的紅旗」偵測：薪資答太早、批評前公司、反問說沒有、缺點太假等 13 種", "設定頁可指定要練的陷阱題", "題庫的陷阱題分類與範例"],
  },
  {
    n: 5,
    title: "不同公司、不同面試方式，又沒有方向",
    evidence: (
      <>台積電面試一天 4–6 小時，含性向、英文測驗與 2–3 輪主管面{cite(13)}；公職口試評估「知能、態度、人格、價值觀與行為」{cite(16)}。同時 52.2% 新鮮人求職「沒有方向感」{cite(6)}，學以致用不到兩成{cite(21)}。</>
    ),
    features: ["7 種公司類型 × 9 種職缺出題，含英文（外商模式）與群面", "題庫依公司類型篩選", "資源頁：職涯探索、青年就業補助"],
  },
];

const STYLES = [
  { type: "傳產／製造", focus: "穩定度、配合度、加班與外派／輪班意願、對前輩的態度", how: "HR＋主管一到兩輪，問題偏情境題", src: [9] },
  { type: "科技業（台積電・聯發科・鴻海）", focus: "專題細節與你的貢獻、解決問題、抗壓、輪調意願", how: "線上測驗 → 性向約 15 分鐘 → 英文約 30 分鐘 → 2–3 輪主管面 → HR 面；STAR 行為題", src: [13] },
  { type: "外商", focus: "英文表達、主動性、能帶來的影響", how: "常見 6 題：自我介紹、優缺點、犯錯經驗、離職原因、成就、為什麼選你", src: [11] },
  { type: "新創", focus: "一人多工、規格不清時怎麼推進、主動發起的事", how: "創辦人或主管直接面，常有實作或作品討論", src: [] },
  { type: "公職／國營", focus: "服務動機、依法行政、價值觀", how: "國考後口試：個別口試、集體口試或團體討論，結構化評分", src: [16] },
  { type: "群面", focus: "邏輯、溝通、協調、團隊合作、抗壓", how: "6–10 人、40–60 分鐘：自介 → 讀資料 → 自由討論 → 總結；角色有領導者、計時者、記錄者、報告者", src: [17] },
];

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="i18n-en mb-5 rounded-lg border border-line-soft bg-white px-4 py-3 text-sm text-ink-2">This research summary on Taiwan&apos;s youth job market is written in Traditional Chinese. All sources are linked at the bottom.</p>
      <Badge>研究摘要・2026 年 10 月</Badge>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">台灣年輕人不是沒有能力，是沒有機會把自己「說出來」</h1>
      <p className="mt-3 text-lg text-ink-2">
        這份研究是這個原型每個功能的依據。結論：台灣整體失業率創 26 年同期新低，但 20–24 歲青年失業率仍在 11–12%；
        卡住的不是職缺數量，而是<b className="text-ink">面試與自傳的表達，以及完全沒有回饋的求職過程</b>。
      </p>

      <section className="mt-10" aria-labelledby="market">
        <h2 id="market" className="text-xl font-bold">1. 市場：全體很好，年輕人很難</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ["3.41%", "2026 年 8 月全體失業率，連三月上升，主因是應屆畢業生投入求職，但仍是 26 年同月新低", [1]],
            ["11.81%", "20–24 歲失業率（2025 年 10 月），15–19 歲 10.33%、25–29 歲 5.78%，全體只有 3.36%", [2]],
            ["4.35%", "大學學歷失業率（2026 年 5 月），高於高中職 3.11% 與研究所 2.76%", [3]],
            ["< 20%", "00 世代新鮮人學以致用的比例；近半數新鮮人做的工作與所學無關", [21, 22]],
          ].map(([v, d, s]) => (
            <Card key={v as string}>
              <CardContent>
                <p className="font-display text-3xl font-bold text-brand-strong">{v as string}</p>
                <p className="mt-1 text-sm text-ink-2">{d as string}{cite(...(s as number[]))}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">註：使用者提供的「20–24 歲約 12%」與主計總處 2025 年 10 月的 11.81% 一致；2026 年 8 月的分齡數字尚未在公開報導中找到。</p>
      </section>

      <section className="mt-10" aria-labelledby="pain">
        <h2 id="pain" className="text-xl font-bold">2. 兩邊同時說：問題在「表達」</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent>
              <p className="font-bold text-ink">新鮮人說自己做不到{cite(4)}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                <li>準備面試 <b className="text-ink">93.3%</b></li>
                <li>寫自傳 <b className="text-ink">88.2%</b></li>
                <li>害怕面試時開口 <b className="text-ink">71.5%</b></li>
                <li>不知道職缺要求 <b className="text-ink">58.8%</b></li>
                <li>不知道期望薪資要開多少 <b className="text-ink">54.7%</b></li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="font-bold text-ink">企業說新鮮人的履歷{cite(5)}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
                <li>不及格 <b className="text-ink">61.8%</b>；自傳平均 <b className="text-ink">48.1 分</b>，看一份花 <b className="text-ink">116 秒</b></li>
                <li>千篇一律的模板 <b className="text-ink">61.3%</b></li>
                <li>看不出優勢 <b className="text-ink">57.1%</b></li>
                <li>對職務沒有想法 <b className="text-ink">56%</b></li>
                <li>79% 企業會因為求職者提出好問題而加分</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="styles">
        <h2 id="styles" className="text-xl font-bold">3. 不同公司的面試方式</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line-soft bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-canvas text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">類型</th>
                <th scope="col" className="px-4 py-3 font-bold">HR 在看什麼</th>
                <th scope="col" className="px-4 py-3 font-bold">形式</th>
              </tr>
            </thead>
            <tbody>
              {STYLES.map((s) => (
                <tr key={s.type} className="border-t border-line-soft align-top">
                  <th scope="row" className="px-4 py-3 font-bold text-ink">{s.type}</th>
                  <td className="px-4 py-3 text-ink-2">{s.focus}</td>
                  <td className="px-4 py-3 text-ink-2">{s.how}{s.src.length ? cite(...s.src) : <span className="ml-1 text-xs text-muted">（MirWork 整理）</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="problems">
        <h2 id="problems" className="text-xl font-bold">4. 五個還沒被解決的問題 → 對應功能</h2>
        <ol className="mt-4 space-y-3">
          {PROBLEMS.map((p) => (
            <li key={p.n}>
              <Card>
                <CardContent>
                  <p className="text-xs font-bold text-brand">問題 {p.n}</p>
                  <h3 className="mt-0.5 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-ink-2">{p.evidence}</p>
                  <p className="mt-3 text-xs font-bold text-muted">原型裡的對應功能</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-2">
                    {p.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="brand">
        <h2 id="brand" className="text-xl font-bold">5. 跟 MirWork 現有產品的關係</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-2">
          <li>品牌：沿用 mirwork.ai 的 Roboto Slab 標題、Lato 內文、藍色系（#0A84FF、#0A6FD6、#004AAD）、圓角按鈕與扁平藍色插畫風格{cite(24)}。為了符合無障礙對比，按鈕改用 MirWork 自己的深一階藍 #0A6FD6（對白底 4.9:1）。</li>
          <li>流程：interview.mirwork.ai 的求職者端以「HR Round 30 分鐘、Product Sense、Analytical Execution、Leadership」等關卡和 Question Bank 為主，偏向美國科技業 PM 面試{cite(24)}。這個原型把同樣的語音面試核心，換成台灣企業的題型與 HR 標準。</li>
          <li>差異：全繁體中文介面、台灣用語、台灣特有陷阱題、7 種台灣公司類型、自傳健檢與政府補助資源。</li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="method">
        <h2 id="method" className="text-xl font-bold">6. 方法與限制</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-2">
          <li>多數求職調查由人力銀行對自家會員進行，樣本偏向較焦慮、較積極的求職者。請看趨勢與方向，絕對數字當作上限。</li>
          <li>主計總處數字是最可靠的骨幹；分齡失業率採用公開報導中最新可查到的月份。</li>
          <li>原型的評分是規則式分析（語速、贅字、STAR 關鍵詞、數字、紅旗詞彙），不是 LLM 判讀，也還沒有和真實 HR 評分做過校準。</li>
          <li>語音辨識使用瀏覽器內建功能，中文辨識不加標點、偶爾會錯字，所以介面讓使用者送出前修改。</li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="sources">
        <h2 id="sources" className="text-xl font-bold">資料來源</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.id} id={`src-${s.id}`} className="flex gap-2 scroll-mt-20">
              <span className="w-6 shrink-0 text-right font-bold text-muted">{s.id}.</span>
              <span>
                <span className="text-ink-2">{s.org}・</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline-offset-2 hover:underline">
                  {s.title}
                  <ExternalLink className="ml-1 inline size-3 text-muted" aria-hidden />
                </a>
                <span className="text-muted">（{s.date}）</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-sm text-muted">
        想直接試試看？<Link href="/setup/" className="font-bold text-brand underline">開始一場模擬面試</Link>
      </p>
    </div>
  );
}

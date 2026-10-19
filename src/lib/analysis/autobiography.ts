import { NUMBER_RE, TRIVIAL_NUMBER } from "./lexicon";

export interface AutoCheck {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
  /** 對應的企業抱怨（yes123 2026 企業評價調查） */
  employerSays?: string;
}

/** 常見簡體字（台灣企業看到會扣分）。只列繁簡不同、常出現在自傳裡的字。 */
const SIMPLIFIED = "们这个为说时发学经实现处关业务产员动对开问进让认设计过还会来热团队优点场应责习专认识职总结获奖级";
const TRAD_EQUIV = "們這個為說時發學經實現處關業務產員動對開問進讓認設計劃過還會來熱團隊優點場應責習專認識職總結獲獎級";

export function checkAutobiography(text: string, job: string, company: string): { score: number; checks: AutoCheck[]; length: number } {
  const t = text.trim();
  const length = (t.match(/[㐀-鿿]/g) || []).length + (t.match(/[A-Za-z0-9]+/g) || []).length;
  const head = t.slice(0, 80);
  const paragraphs = t.split(/\n\s*\n|\n/).filter((p) => p.trim().length > 15).length;
  const numbers = (t.match(NUMBER_RE) || []).map((n) => n.trim()).filter((n) => n.length > 0 && !TRIVIAL_NUMBER.test(n) && !/^\d$/.test(n));

  const simplifiedHits = Array.from(new Set(Array.from(t).filter((ch) => SIMPLIFIED.includes(ch) && !TRAD_EQUIV.includes(ch))));

  const mentionsTarget = (job && t.includes(job.trim())) || (company && t.includes(company.trim())) || /(應徵|這個職位|這份工作|貴公司的|此職缺)/.test(t);
  const strengths = /(擅長|優勢|強項|我的能力|專長|特質是|我能)/.test(t);
  const future = /(入職後|進入貴|未來|希望能|期許|規劃|第一年|三年內|短期|長期)/.test(t);
  const familyFirst = /(我出生|出生於|家中有|家裡有|父親|母親|爸爸|媽媽|排行|家境|小康)/.test(head);

  const checks: AutoCheck[] = [
    {
      id: "length",
      label: "長度 300–800 字",
      pass: length >= 300 && length <= 800,
      detail: length < 300 ? `目前約 ${length} 字，太短了，HR 看不出你是誰。` : length > 800 ? `目前約 ${length} 字。企業平均只花 116 秒看自傳，請刪到 800 字以內。` : `約 ${length} 字，長度剛好。`,
    },
    {
      id: "family",
      label: "開頭不是家庭背景",
      pass: !familyFirst,
      detail: familyFirst ? "第一段在講家庭。HR 最想先知道你是誰、想做什麼，家庭背景可以刪掉或放到最後一句。" : "開頭直接進入重點。",
    },
    {
      id: "target",
      label: "有寫到應徵的職缺或公司",
      pass: !!mentionsTarget,
      detail: mentionsTarget ? "有對準職缺。" : "看不出你應徵的是什麼。每投一份都要改：寫出職缺名稱，以及你為什麼適合。",
      employerSays: "61.3% 企業不滿「千篇一律的模板」、52.5% 不滿「每份都投一樣的履歷」",
    },
    {
      id: "numbers",
      label: "至少 2 個具體數字",
      pass: numbers.length >= 2,
      detail: numbers.length >= 2 ? `有 ${numbers.length} 個具體數字（${numbers.slice(0, 3).join("、")}）。` : "幾乎都是形容詞。補上人數、百分比、時間或名次，讓經驗可以被相信。",
    },
    {
      id: "strengths",
      label: "優勢說得清楚",
      pass: strengths,
      detail: strengths ? "有明確寫出你的優勢。" : "看不出你的強項是什麼。用「我擅長 ___，例如 ___」的句型寫一段。",
      employerSays: "57.1% 企業抱怨新鮮人「看不出優勢」",
    },
    {
      id: "future",
      label: "寫出對這份工作的想法",
      pass: future,
      detail: future ? "有提到進公司後的規劃。" : "最後一段補上：進公司後第一年想學會什麼、能貢獻什麼。",
      employerSays: "56% 企業抱怨新鮮人「對職務沒有想法」",
    },
    {
      id: "paragraphs",
      label: "分成 3 段以上",
      pass: paragraphs >= 3,
      detail: paragraphs >= 3 ? `分成 ${paragraphs} 段，好讀。` : "整篇擠成一段，HR 很難掃讀。建議：我是誰 → 最相關的經驗 → 為什麼想來這裡。",
    },
    {
      id: "simplified",
      label: "沒有簡體字",
      pass: simplifiedHits.length === 0,
      detail: simplifiedHits.length === 0 ? "全部都是繁體字。" : `出現簡體字：${simplifiedHits.slice(0, 6).join("、")}。台灣企業看到會覺得不夠用心，請改成繁體。`,
    },
  ];

  const score = t ? Math.round((checks.filter((c) => c.pass).length / checks.length) * 100) : 0;
  return { score, checks, length };
}

import type { AnswerFeedback, AnswerRecord, Dim, FillerHit, InterviewConfig, PlanItem, Question, RedFlag, Report } from "@/lib/types";
import { DIM_LABELS, DIM_ORDER, roleLabel } from "@/lib/data/options";
import { getQuestion } from "@/lib/data/questions";
import {
  CULTURE_KEYWORDS,
  FILLERS_EN,
  FILLERS_ZH,
  HEDGES_EN,
  HEDGES_ZH,
  NUMBER_RE,
  RESEARCH_SIGNALS,
  ROLE_KEYWORDS,
  STAR_EN,
  STAR_ZH,
  STRUCTURE_EN,
  STRUCTURE_ZH,
  TRIVIAL_NUMBER,
} from "./lexicon";
import { INTRO_BY_ROLE, MOTIVATION_BY_COMPANY } from "@/lib/data/questions";

/** 履歷客製題沒有題庫條目，用這個通用設定。 */
export const RESUME_QUESTION_META: Omit<Question, "id" | "text"> = {
  lang: "zh",
  category: "resume",
  companyTypes: "all",
  idealSec: [60, 120],
  intent: "面試官一定會從你的履歷挑細節追問，確認是不是你真的做過、做到什麼程度。",
  goodSignals: ["清楚說出「我」負責的部分", "有一個數字或成果", "說得出遇到的困難和你的解法"],
  redFlags: ["一直說「我們」", "被問細節就答不出來", "履歷寫的和講的對不上"],
  modelAnswer:
    "（用 STAR 回答）情境：「大三時我在 ___ 負責 ___。」任務：「當時的目標是 ___，最大的困難是 ___。」行動：「我先 ___，再 ___。」結果：「最後 ___（數字），我學到 ___。」",
  followUps: ["你在裡面具體負責哪一部分？", "如果重來一次，你會怎麼做得不一樣？"],
};

function pickModelAnswer(q: Question, config: InterviewConfig) {
  if (q.id === "intro") return INTRO_BY_ROLE[config.role] ?? q.modelAnswer;
  if (q.id === "motivation") return MOTIVATION_BY_COMPANY[config.companyType] ?? q.modelAnswer;
  return q.modelAnswer;
}

export function questionMeta(baseId: string): Question {
  const q = getQuestion(baseId);
  if (q) return q;
  return { id: baseId, text: "", ...RESUME_QUESTION_META };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function countOccurrences(haystack: string, needle: string, en: boolean) {
  if (!needle) return 0;
  if (en) {
    const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    return (haystack.match(re) || []).length;
  }
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

export function measureLength(text: string, en: boolean) {
  if (en) return (text.trim().match(/[A-Za-z0-9'’-]+/g) || []).length;
  const cjk = (text.match(/[㐀-鿿]/g) || []).length;
  const latinWords = (text.match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + latinWords;
}

function snippetAround(text: string, re: RegExp, radius = 14) {
  const m = re.exec(text);
  if (!m) return undefined;
  const start = Math.max(0, m.index - radius);
  const end = Math.min(text.length, m.index + m[0].length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

interface FlagDef {
  id: string;
  title: string;
  why: string;
  fix: string;
  test: (t: string, q: Question, len: number) => RegExp | null;
}

const ASKED_A_QUESTION = /(？|\?|請問|想請教|想知道|想了解|what|how|could you|can you)/i;

const FLAGS: FlagDef[] = [
  {
    id: "salary-early",
    title: "期望薪資答太早",
    why: "HR 還沒問到薪水，你就先報數字，會讓人覺得你最在意的是錢，也讓你失去之後談判的空間。",
    fix: "等對方問再談。被問到時先說「依公司規定」，再補一句你查過的行情區間。",
    test: (t, q) => {
      if (q.focus === "salary") return null;
      const re = /((月薪|薪水|薪資|起薪|待遇).{0,8}\d+(\.\d+)?\s*(萬|k|K|千|元))|(\d+(\.\d+)?\s*(萬|k|K)\s*(以上|左右|起))/;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "salary-fixed",
    title: "期望薪資直接報死數字",
    why: "新鮮人直接開一個沒有依據的數字，HR 很難判斷你的期待從哪裡來；太高會被刷，太低又吃虧。",
    fix: "用「依公司規定＋我查過的行情是 3.2–3.6 萬」這種有依據的區間，再反問試用期與調薪制度。",
    test: (t, q) => {
      if (q.focus !== "salary") return null;
      const hasNumber = /\d|萬|千/.test(t);
      const hasBasis = /(依公司|依照公司|公司規定|公司制度|範圍|之間|行情|參考|區間|depend|range|market)/i.test(t);
      return hasNumber && !hasBasis ? /\d+(\.\d+)?\s*(萬|k|K|千|元)?/ : null;
    },
  },
  {
    id: "salary-whatever",
    title: "薪資題說「都可以」",
    why: "說「都可以」聽起來客氣，但 HR 會覺得你沒做功課，或對自己的價值沒有想法。",
    fix: "就算依公司規定，也補一句你查過的行情，讓對方知道你有準備。",
    test: (t, q) => (q.focus === "salary" && /(都可以|隨便|沒想法|沒有想過)/.test(t) ? /(都可以|隨便|沒想法|沒有想過)/ : null),
  },
  {
    id: "criticize",
    title: "批評前公司或主管",
    why: "台灣 HR 最怕聽到抱怨前東家：他們會想像你之後也會這樣說他們，而且這題答案對錄取沒有任何加分。",
    fix: "把「我在逃離什麼」改成「我想追求什麼」，前公司只講你學到的東西。",
    test: (t) => {
      const zh = /(前公司|上一間|之前公司|上一份|主管|老闆|同事|公司).{0,12}(爛|很差|很糟|雷|討厭|受不了|垃圾|很扯|無能|機車|情緒勒索|不合理|很誇張|亂七八糟|沒在管)/;
      const en = /(boss|manager|previous company|old company|colleague).{0,30}(terrible|awful|toxic|stupid|incompetent|horrible|useless)/i;
      if (zh.test(t)) return zh;
      if (en.test(t)) return en;
      return null;
    },
  },
  {
    id: "no-questions",
    title: "反問時說「沒有問題」",
    why: "yes123 2026 年調查中，79% 的企業會因為求職者提出好問題而加分。說沒有，等於放棄最後的加分機會。",
    fix: "準備 2 個問題，例如「這個職位前三個月最重要的目標是什麼？」",
    test: (t, q, len) => {
      if (q.category !== "closing") return null;
      if (len === 0) return null;
      const noRe = /(沒有|沒問題|目前沒有|no,? thank|no questions|not really)/i;
      return noRe.test(t) && !ASKED_A_QUESTION.test(t.replace(noRe, "")) ? noRe : null;
    },
  },
  {
    id: "money-motive",
    title: "應徵動機只談福利或離家近",
    why: "動機只有薪水、福利、離家近，HR 會擔心別家條件更好時你就走了。",
    fix: "加一句你對公司產品、服務或發展方向的觀察，再連到你想學的東西。",
    test: (t, q) => {
      if (q.category !== "motivation") return null;
      const re = /(薪水|待遇|福利|離家近|很穩定|不會被裁|年終|salary|benefits|close to (my )?home)/i;
      return re.test(t) && !RESEARCH_SIGNALS.test(t) ? re : null;
    },
  },
  {
    id: "overtime-refuse",
    title: "加班題直接拒絕或先問加班費",
    why: "一開口就說不加班或問加班費，HR 會把你歸類成配合度低，即使你的理由合理。",
    fix: "先表達需要時願意配合，再禮貌地問加班的頻率和時段，把它變成雙向了解。",
    test: (t, q) => {
      if (q.focus !== "overtime") return null;
      const re = /(不加班|不能加班|不想加班|絕對不|加班費多少|有加班費嗎|沒辦法加班|no overtime|won't work overtime)/i;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "fake-weakness",
    title: "缺點答得太假",
    why: "「太追求完美」「太認真」是 HR 聽到不想再聽的答案，會讓人覺得你在迴避問題。",
    fix: "說一個真的、但不是這份工作核心能力的缺點，再講你正在怎麼改善。",
    test: (t, q) => {
      if (q.focus !== "weakness") return null;
      const re = /(太追求完美|完美主義|太認真|太負責|太努力|太在乎細節|perfectionist|work too hard|care too much)/i;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "gap-nothing",
    title: "空窗期沒有說明收穫",
    why: "空窗期本身很少是扣分關鍵，但只說「在家休息」會讓 HR 擔心你的動力和規劃。",
    fix: "用三句話：真實原因 → 這段時間學到或做了什麼 → 為什麼現在準備好了。",
    test: (t, q) => {
      if (q.focus !== "gap") return null;
      const re = /(在家|休息|沒做什麼|打電動|耍廢|沒幹嘛|發呆)/;
      const gained = /(學|課程|證照|作品|準備|考試|研究|志工|打工|接案|專案|方向)/;
      return re.test(t) && !gained.test(t) ? re : null;
    },
  },
  {
    id: "family-intro",
    title: "自我介紹從家庭背景開始",
    why: "企業平均只花 116 秒看自傳、幾分鐘聽自我介紹。家庭背景佔掉時間，卻跟職缺無關。",
    fix: "第一句就講你是誰、想做什麼職位，家庭背景整段刪掉。",
    test: (t, q) => {
      if (q.category !== "intro") return null;
      const re = /(我出生|出生在|家中有|家裡有|爸爸|媽媽|排行|家境|my parents|my family)/i;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "english-apology",
    title: "先道歉自己英文不好",
    why: "還沒開始就降低對方期待，面試官會更注意你的錯誤。外商看重的是溝通，不是完美文法。",
    fix: "直接開始講，講錯就自然地修正，用短句說完整的意思。",
    test: (t) => {
      const re = /(english is not (very )?good|my english is poor|sorry for my english|英文不好|英文很爛)/i;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "not-prepared",
    title: "說自己沒準備",
    why: "就算是實話，HR 也會解讀成你對這份工作不夠重視。",
    fix: "說出你做過的最小準備（看官網、試用產品、問學長姐），並分享一個觀察。",
    test: (t) => {
      const re = /(沒什麼準備|沒有準備|沒準備|隨便看看|didn't prepare|not much preparation)/i;
      return re.test(t) ? re : null;
    },
  },
  {
    id: "vague",
    title: "回答太空泛",
    why: "「不知道、都可以、進來再學」會讓 HR 覺得你沒有想法，而且很難再往下追問你的能力。",
    fix: "就算不確定，也說出你的推論：「我理解是 ___，我之前做過 ___ 類似的事。」",
    test: (t, q, len) => {
      if (q.focus === "salary") return null;
      const re = /(不知道|隨便|都可以|沒想過|進來再學|不清楚|i don't know|no idea)/i;
      return re.test(t) && len < 70 ? re : null;
    },
  },
];

function detectFlags(text: string, q: Question, len: number): { def: FlagDef; quote?: string }[] {
  const out: { def: FlagDef; quote?: string }[] = [];
  for (const def of FLAGS) {
    const re = def.test(text, q, len);
    if (re) out.push({ def, quote: snippetAround(text, new RegExp(re.source, re.flags.replace("g", ""))) });
  }
  return out;
}

export function analyzeAnswer(rec: AnswerRecord, config: InterviewConfig, voice: boolean): AnswerFeedback & { flags: RedFlag[] } {
  const q = questionMeta(rec.baseId);
  const en = config.lang === "en" || q.lang === "en" || /^[\x00-\x7F\s]+$/.test(rec.transcript.trim() || "中");
  const text = rec.transcript.trim();
  const lower = text.toLowerCase();
  const len = measureLength(text, en);
  const skipped = !!rec.skipped || len === 0;

  const empty: Record<Dim, number> = { expression: 0, logic: 0, expertise: 0, confidence: 0, fit: 0 };
  if (skipped) {
    return {
      questionId: rec.questionId,
      baseId: rec.baseId,
      questionText: rec.questionText,
      isFollowUp: rec.isFollowUp,
      transcript: text,
      durationSec: rec.durationSec,
      skipped: true,
      charCount: 0,
      pace: null,
      paceUnit: en ? "wpm" : "字/分",
      fillers: [],
      fillerTotal: 0,
      star: { s: false, t: false, a: false, r: false },
      story: false,
      numbers: [],
      dims: empty,
      score: 0,
      hrThinks: ["這題你選擇跳過。真正的面試沒辦法跳過，但練習時先跳過完全沒問題，我已經把它放進你的練習計畫。"],
      improve: ["先看題庫裡這題的「HR 想知道什麼」和範例，再回來用自己的經驗答一次。"],
      modelAnswer: pickModelAnswer(q, config),
      redFlagIds: [],
      flags: [],
    };
  }

  // ── 贅字 ──
  const fillerList = en ? FILLERS_EN : FILLERS_ZH;
  const fillers: FillerHit[] = fillerList
    .map((w) => ({ word: w, count: countOccurrences(en ? lower : text, w, en) }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);
  // 「對對對」也會被算成「對」—只保留較長的詞避免重複，這裡清單已避開單字「對」
  const fillerTotal = fillers.reduce((s, f) => s + f.count, 0);
  const fillerRate = (fillerTotal / Math.max(len, 1)) * 100; // per 100 字/words

  // ── 語速 ──
  const pace = voice && rec.durationSec >= 5 ? Math.round((len / rec.durationSec) * 60) : null;
  const [paceLo, paceHi] = en ? [110, 165] : [170, 260];

  // ── 長度 ──
  const [minSec, maxSec] = q.idealSec;
  const charsPerSec = en ? 2.3 : 3.8;
  const effectiveSec = voice && rec.durationSec > 0 ? rec.durationSec : len / charsPerSec;
  const tooShort = effectiveSec < minSec * 0.5;
  const short = !tooShort && effectiveSec < minSec;
  const tooLong = effectiveSec > maxSec * 1.5;
  const long = !tooLong && effectiveSec > maxSec;

  // ── STAR / 結構 ──
  const starRe = en ? STAR_EN : STAR_ZH;
  const star = { s: starRe.s.test(text), t: starRe.t.test(text), a: starRe.a.test(text), r: starRe.r.test(text) };
  const structureHits = (text.match(en ? STRUCTURE_EN : STRUCTURE_ZH) || []).length;
  const numbers = Array.from(new Set((text.match(NUMBER_RE) || []).map((n) => n.trim()).filter((n) => n.length > 0 && !/^[一兩]$/.test(n) && !TRIVIAL_NUMBER.test(n) && !/^\d$/.test(n)))).slice(0, 5);

  // ── 關鍵字 ──
  const roleHits = ROLE_KEYWORDS[config.role].filter((k) => lower.includes(k.toLowerCase()));
  const cultureHits = CULTURE_KEYWORDS[config.companyType].filter((k) => lower.includes(k.toLowerCase()));
  const researched = RESEARCH_SIGNALS.test(text);
  const hedgeList = en ? HEDGES_EN : HEDGES_ZH;
  const hedges = hedgeList.reduce((s, h) => s + countOccurrences(en ? lower : text, h, en), 0);
  const selfDeprecating = /(我很爛|我很廢|我不太會|我沒什麼(經驗|能力)|能力不(太)?好|我不夠好|沒(有)?自信|english is not good|i'm not good at)/i.test(text);

  const flagHits = detectFlags(text, q, len);

  // ── 分數 ──
  let expression = 86;
  if (pace !== null) {
    if (pace < paceLo - 30) expression -= 12;
    else if (pace < paceLo) expression -= 5;
    else if (pace > paceHi + 50) expression -= 15;
    else if (pace > paceHi) expression -= 7;
  }
  if (fillerRate > 4) expression -= 22;
  else if (fillerRate > 2.5) expression -= 13;
  else if (fillerRate > 1.2) expression -= 6;
  if (tooShort) expression -= 20;
  else if (short) expression -= 8;
  if (tooLong) expression -= 15;
  else if (long) expression -= 6;

  const storyQuestion = ["behavioral", "role", "resume", "intro"].includes(q.category) || q.id.startsWith("career");
  let logic: number;
  if (storyQuestion) {
    logic = 42 + (star.s ? 10 : 0) + (star.t ? 8 : 0) + (star.a ? 16 : 0) + (star.r ? 17 : 0) + Math.min(structureHits, 2) * 3;
  } else {
    logic = 68 + Math.min(structureHits, 2) * 6 + (star.r ? 6 : 0) + (q.category === "closing" && ASKED_A_QUESTION.test(text) ? 12 : 0);
  }
  if (tooShort) logic -= 12;

  let expertise = 48 + Math.min(numbers.length, 3) * 9 + Math.min(roleHits.length, 4) * 5 + (star.a ? 6 : 0);
  if (len < 40) expertise -= 14;
  if (!storyQuestion && q.category !== "role") expertise += 8; // 非故事題不要求太多專業細節

  const confidence = 88 - hedges * 6 - (selfDeprecating ? 14 : 0) - (tooShort ? 12 : 0) - (pace !== null && pace > paceHi + 50 ? 6 : 0);

  let fit = 60 + Math.min(cultureHits.length, 3) * 6 + (researched ? 14 : 0) - flagHits.length * 14;
  if (q.category === "closing") fit += ASKED_A_QUESTION.test(text) ? 20 : 0;
  const whyCompany = ["motivation", "en-why-company", "public-why", "finance-why"].includes(q.id);
  if (whyCompany && !researched) fit -= 6;

  const dims: Record<Dim, number> = {
    expression: clamp(expression, 25, 98),
    logic: clamp(logic, 25, 98),
    expertise: clamp(expertise, 25, 97),
    confidence: clamp(confidence, 25, 98),
    fit: clamp(fit, 20, 97),
  };
  const score = clamp(DIM_ORDER.reduce((s, d) => s + dims[d], 0) / DIM_ORDER.length);

  // ── HR 內心 OS（必須引用你的實際內容，不給空泛稱讚） ──
  const positives: string[] = [];
  if (numbers.length) positives.push(`你講到具體的「${numbers[0]}」，這讓我比較相信你真的做過，而不是在背範本。`);
  if (storyQuestion && star.a && star.r) positives.push("行動和結果都有交代，我聽得出你在這件事裡的角色。");
  if (researched) positives.push("你有提到我們公司的具體內容，看得出有先做功課。");
  if (cultureHits.length) positives.push(`你提到「${cultureHits[0]}」，跟我們重視的特質對得上。`);
  if (pace !== null && pace >= paceLo && pace <= paceHi) positives.push(`語速大約 ${pace} ${en ? "wpm" : "字/分"}，聽起來很穩，不像在趕。`);
  if (q.category === "closing" && ASKED_A_QUESTION.test(text)) positives.push("最後有反問問題，這會讓我覺得你是真的想了解這份工作。");
  if (q.category === "intro" && /(應徵|想做|想從事|有興趣|想找|想走|apply|interested in)/i.test(text)) positives.push("你有說出想做的方向，這讓我知道你不是亂投履歷。");
  if (q.focus === "gap" && /(學|課程|證照|作品|準備|方向)/.test(text)) positives.push("你有交代這段時間做了什麼，空窗期反而變成你有規劃的證據。");

  const negatives: string[] = [];
  for (const f of flagHits) negatives.push(`${f.def.title}${f.quote ? `（你說：「${f.quote}」）` : ""}。${f.def.why}`);
  if (storyQuestion && !star.r) negatives.push("我聽完還是不知道最後結果怎麼樣——HR 最想知道的是你造成了什麼改變。");
  if (storyQuestion && !numbers.length) negatives.push("內容大多是形容詞，少了一個能證明的數字（人數、百分比、時間）。");
  if (tooShort) negatives.push(`${voice ? `這題只答了 ${Math.round(effectiveSec)} 秒` : `這段內容唸出來大約只有 ${Math.round(effectiveSec)} 秒`}，對 HR 來說資訊不夠，容易被當成沒準備。建議 ${minSec}–${maxSec} 秒。`);
  else if (tooLong || long) negatives.push(`回答大約 ${Math.round(effectiveSec / 6) / 10} 分鐘，超過建議的 ${Math.round(maxSec / 6) / 10} 分鐘，重點容易被埋掉。先講結論。`);
  if (fillers.length && fillerRate > 1.2) negatives.push(`「${fillers[0].word}」出現 ${fillers[0].count} 次，聽起來會像在想下一句要說什麼。`);
  if (pace !== null && pace > paceHi) negatives.push(`語速大約 ${pace} ${en ? "wpm" : "字/分"}，偏快，HR 可能會覺得你很緊張。`);
  if (pace !== null && pace < paceLo - 30) negatives.push(`語速大約 ${pace} ${en ? "wpm" : "字/分"}，偏慢，停頓多會讓人覺得不確定。`);
  if (hedges >= 2) negatives.push(`「可能」「應該」這類詞用了 ${hedges} 次，會削弱你的說服力。`);

  const hrThinks = [positives[0], negatives[0], negatives[1]].filter(Boolean) as string[];
  if (!hrThinks.length) hrThinks.push("內容完整、長度剛好。下一步可以試著加入一個只有你才有的細節，讓我記得你。");

  // ── 具體改法 ──
  const improve: string[] = [];
  const firstClause = text.split(/[，。,.!?！？]/)[0]?.slice(0, 18);
  if (storyQuestion && !text.slice(0, 40).match(/(我是|我叫|負責|最|I'm|I am|my name)/i) && firstClause)
    improve.push(`開頭「${firstClause}…」先換成一句結論，例如「我最相關的經驗是 ___，成果是 ___」。`);
  if (storyQuestion && !numbers.length) improve.push("補一個數字：參加人數、提升了幾 %、縮短多少時間，任選一個。");
  if (storyQuestion && !star.r) improve.push("最後加一句結果和你學到的事：「最後 ___，我學到 ___。」");
  if (fillers.length && fillerTotal >= 3) improve.push(`把 ${fillerTotal} 個贅字（${fillers.slice(0, 3).map((f) => `${f.word}×${f.count}`).join("、")}）換成短暫停頓。停一秒比說「然後」更有自信。`);
  for (const f of flagHits) improve.push(f.def.fix);
  if (hedges >= 2) improve.push("把「可能、應該」改成「我會、我做了」。");
  if (tooShort || short)
    improve.push(`內容再多一點：補一個具體例子（你做了什麼、結果如何），長度抓在 ${minSec}–${maxSec} 秒。`);
  if (tooLong || long) improve.push(`先講結論、刪掉背景描述，把回答控制在 ${maxSec < 60 ? `${maxSec} 秒` : `${Math.round((maxSec / 60) * 10) / 10} 分鐘`}以內。`);
  if (whyCompany && !researched) improve.push("加一句：「我看到你們最近在做 ___，這跟我做過的 ___ 很像。」");
  if (!improve.length) improve.push("這題可以挑戰更短的版本：用 3 句話講完，再看能不能保留同樣的重點。");

  const flags: RedFlag[] = flagHits.map((f) => ({ id: f.def.id, title: f.def.title, quote: f.quote, why: f.def.why, fix: f.def.fix, questionText: rec.questionText }));

  return {
    questionId: rec.questionId,
    baseId: rec.baseId,
    questionText: rec.questionText,
    isFollowUp: rec.isFollowUp,
    transcript: text,
    durationSec: rec.durationSec,
    skipped: false,
    charCount: len,
    pace,
    paceUnit: en ? "wpm" : "字/分",
    fillers,
    fillerTotal,
    star,
    story: storyQuestion && q.category !== "intro",
    numbers,
    dims,
    score,
    hrThinks,
    improve: improve.slice(0, 4),
    modelAnswer: pickModelAnswer(q, config),
    redFlagIds: flags.map((f) => f.id),
    flags,
  };
}

const PLAN_BY_DIM: Record<Dim, (worstQ?: string) => { title: string; detail: string }> = {
  expression: () => ({
    title: "練「表達」：錄一段 1 分鐘自我介紹",
    detail: "用手機錄音，回放時數「然後」「就是」出現幾次，目標少於 3 次；語速抓在每分鐘 200 字左右。",
  }),
  logic: (q) => ({
    title: "練「邏輯 STAR」：把一題改寫成四句話",
    detail: `挑「${q ?? "說一次你和團隊意見不合的經驗"}」，寫成：情境一句、任務一句、行動兩句、結果一句（要有數字），再唸出來。`,
  }),
  expertise: () => ({
    title: "練「專業度」：幫兩個經驗各補一個數字",
    detail: "從履歷挑出最相關的兩段經驗，各補上一個人數、百分比或時間。面試時先講這兩個。",
  }),
  confidence: () => ({
    title: "練「自信」：先講結論，刪掉「可能、應該」",
    detail: "每題第一句都用「我會…」「我做過…」開頭；遇到不會的題目，說「我的理解是…」而不是「我不知道」。",
  }),
  fit: () => ({
    title: "練「企業契合」：15 分鐘做功課",
    detail: "看目標公司官網、最近一則新聞和 104 職缺描述，準備一句「我看到你們在做 ___，這跟我做過的 ___ 很像」。",
  }),
};

export function buildReport(answers: AnswerRecord[], config: InterviewConfig): Report {
  const voice = config.mode === "voice";
  const analyzed = answers.map((a) => analyzeAnswer(a, config, voice));
  const scored = analyzed.filter((a) => !a.skipped);

  const dims: Record<Dim, number> = { expression: 0, logic: 0, expertise: 0, confidence: 0, fit: 0 };
  if (scored.length) {
    for (const d of DIM_ORDER) dims[d] = clamp(scored.reduce((s, a) => s + a.dims[d], 0) / scored.length);
  }
  const skippedPenalty = analyzed.length ? (analyzed.length - scored.length) / analyzed.length : 0;
  const rawTotal = scored.length ? DIM_ORDER.reduce((s, d) => s + dims[d], 0) / DIM_ORDER.length : 0;
  const flagCount = new Set(analyzed.flatMap((a) => a.flags.map((f) => f.id))).size;
  const total = clamp(rawTotal * (1 - skippedPenalty * 0.5) - Math.min(flagCount * 2, 10));

  // 紅旗：同一種只列一次
  const flagMap = new Map<string, RedFlag>();
  for (const a of analyzed) for (const f of a.flags) if (!flagMap.has(f.id)) flagMap.set(f.id, f);
  const redFlags = Array.from(flagMap.values());

  const sortedDims = [...DIM_ORDER].sort((a, b) => dims[b] - dims[a]);
  const best = sortedDims[0];
  const weakest = [...sortedDims].reverse();

  const strengths: string[] = [];
  if (scored.length) {
    strengths.push(`「${DIM_LABELS[best].label}」是你這次最穩的項目（${dims[best]} 分）。`);
    const withNumbers = scored.find((a) => a.numbers.length);
    if (withNumbers) strengths.push(`在「${withNumbers.questionText.slice(0, 16)}…」你用了「${withNumbers.numbers[0]}」這樣的具體數字，這是 HR 最想聽到的。`);
    const closing = scored.find((a) => questionMeta(a.baseId).category === "closing" && ASKED_A_QUESTION.test(a.transcript));
    if (closing) strengths.push("最後有反問問題，替自己多爭取了一次加分。");
    const calm = scored.filter((a) => a.pace !== null);
    if (calm.length && calm.every((a) => a.pace! <= (config.lang === "en" ? 165 : 260))) strengths.push("整場語速都在合理範圍，沒有因為緊張越講越快。");
  }

  const avgPaceArr = scored.filter((a) => a.pace !== null).map((a) => a.pace!) ;
  const avgPace = avgPaceArr.length ? Math.round(avgPaceArr.reduce((s, p) => s + p, 0) / avgPaceArr.length) : null;
  const totalFillers = scored.reduce((s, a) => s + a.fillerTotal, 0);

  let headline: string;
  if (!scored.length) headline = "這次每一題都跳過了。沒關係，先從暖身模式、只答一題開始。";
  else if (total >= 85) headline = "已經很接近錄取水準，剩下的是細節打磨。";
  else if (total >= 70) headline = "基礎不錯，修掉下面幾個細節，分數會明顯往上。";
  else if (total >= 55) headline = "方向是對的，接下來專心練「結構」和「具體例子」。";
  else headline = "第一次練習大多是這個分數，我們一次只改一件事。";

  // 練習計畫：最弱的兩項＋紅旗主題＋再練一次
  const worstStory = scored
    .filter((a) => ["behavioral", "role", "resume"].includes(questionMeta(a.baseId).category))
    .sort((a, b) => a.dims.logic - b.dims.logic)[0];
  const plan: PlanItem[] = [];
  if (scored.length) {
    const p1 = PLAN_BY_DIM[weakest[0]](worstStory?.questionText);
    plan.push({ day: "今天", title: p1.title, detail: p1.detail, href: "/questions/", cta: "去題庫看範例" });
    const p2 = PLAN_BY_DIM[weakest[1]](worstStory?.questionText);
    plan.push({ day: "明天", title: p2.title, detail: p2.detail, href: "/resources/", cta: "看準備資源" });
  } else {
    plan.push({ day: "今天", title: "先用文字模式答一題", detail: "從「請你自我介紹」開始，用打字的方式回答，不用開麥克風。", href: "/setup/?preset=gentle", cta: "開始暖身" });
  }
  const flagFocus = redFlags.find((f) => ["salary-early", "salary-fixed", "salary-whatever"].includes(f.id))
    ? "salary"
    : redFlags.find((f) => f.id === "gap-nothing")
      ? "gap"
      : redFlags.find((f) => f.id === "overtime-refuse")
        ? "overtime"
        : redFlags.find((f) => f.id === "criticize")
          ? "leaving"
          : null;
  if (flagFocus) {
    plan.push({
      day: "第 3 天",
      title: "練紅旗題：把踩到的地雷題重答兩次",
      detail: `題庫篩選「陷阱題」，先看 HR 想知道什麼，再照範例的結構用自己的話答。`,
      href: `/questions/?focus=${flagFocus}`,
      cta: "練陷阱題",
    });
  }
  if (config.situation === "unemployed") {
    plan.push({
      day: "這週",
      title: "順便確認：你可能符合青年就業補助",
      detail: "15–29 歲、待業 180 天以上可申請「青年職得好評計畫」就業獎勵 NT$30,000；第一次找工作、失業 60 天以上可看「支援青年就業計畫」。",
      href: "/resources/#subsidy",
      cta: "看補助條件",
    });
  }
  if (config.situation === "career-change") {
    plan.push({
      day: "這週",
      title: "轉職者：用作品補上「沒有相關經驗」",
      detail: "15–29 歲待業或想轉職，可申請「產業新尖兵」補助最高 NT$100,000 學費，課程期間每月還有學習獎勵。做一個能在面試展示的作品，比再多證照有用。",
      href: "/resources/#subsidy",
      cta: "看產業新尖兵",
    });
  }
  plan.push({
    day: flagFocus ? "第 4 天" : "第 3 天",
    title: `再面一次：目標總分 ${Math.min(95, Math.max(total + 5, 60))} 分以上`,
    detail: `同樣設定（${roleLabel(config.role)}）再練一次，報告會自動跟這次比較。`,
    href: "/setup/?again=1",
    cta: "用同樣設定再練",
  });

  return {
    total,
    dims,
    headline,
    strengths: strengths.slice(0, 3),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    answers: analyzed.map(({ flags: _flags, ...rest }) => rest),
    redFlags,
    plan,
    totalFillers,
    avgPace,
  };
}

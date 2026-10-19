import type { CompanyType, Difficulty, Dim, FocusTopic, RoleId, Situation } from "@/lib/types";

type L = "zh" | "en";

export const COMPANY_TYPES: { id: CompanyType; label: string; short: string; en: string; examples: string; style: string }[] = [
  { id: "tech", label: "科技業（半導體・電子）", short: "科技業", en: "Tech", examples: "台積電、聯發科、鴻海", style: "技術＋行為題，常有性向與英文測驗" },
  { id: "traditional", label: "傳產／製造", short: "傳產", en: "Manufacturing", examples: "中鋼、台塑", style: "重視穩定度、配合度、加班與外派意願" },
  { id: "foreign", label: "外商", short: "外商", en: "Multinational", examples: "外商公司、外商銀行", style: "英文面試、重視主動性與影響力" },
  { id: "startup", label: "新創", short: "新創", en: "Startup", examples: "新創公司", style: "一人多工、自主學習、執行速度" },
  { id: "public", label: "公職／國營", short: "公職國營", en: "Public sector", examples: "台電、中油、國考口試", style: "結構化口試：服務熱忱、依法行政" },
  { id: "finance", label: "金融業", short: "金融", en: "Finance", examples: "銀行、保險、證券", style: "誠信、抗壓、業績與法遵的取捨" },
  { id: "service", label: "服務／零售", short: "服務業", en: "Retail & service", examples: "超商、餐飲、門市", style: "態度、應變、排班配合" },
];

export const ROLES: { id: RoleId; label: string; en: string }[] = [
  { id: "software", label: "軟體工程師", en: "Software engineer" },
  { id: "process", label: "製程／設備工程師", en: "Process engineer" },
  { id: "pm", label: "產品／專案管理", en: "Product / project" },
  { id: "marketing", label: "行銷企劃", en: "Marketing" },
  { id: "sales", label: "業務", en: "Sales" },
  { id: "admin", label: "行政／人資", en: "Admin / HR" },
  { id: "finance", label: "財務／會計", en: "Finance / accounting" },
  { id: "service", label: "門市／客服", en: "Customer service" },
  { id: "civil", label: "公職（一般行政）", en: "Civil service" },
];

export const DIFFICULTIES: { id: Difficulty; label: string; en: string; desc: string; descEn: string }[] = [
  { id: "warmup", label: "暖身", en: "Warm-up", desc: "友善、有提示、幾乎不追問。", descEn: "Friendly, with hints and almost no follow-ups." },
  { id: "standard", label: "標準", en: "Standard", desc: "一般 HR 初面，每題可能追問一次。", descEn: "A typical first-round HR interview. May follow up once per question." },
  { id: "pressure", label: "高壓", en: "Pressure", desc: "連續追問，模擬主管面或壓力面試。", descEn: "Repeated follow-ups, like a manager or stress interview." },
];

export const SITUATIONS: { id: Situation; label: string; en: string }[] = [
  { id: "student", label: "在學・找實習", en: "Student" },
  { id: "fresh", label: "應屆畢業", en: "New graduate" },
  { id: "unemployed", label: "待業中", en: "Between jobs" },
  { id: "career-change", label: "想轉職", en: "Career change" },
];

export const FOCUS_TOPICS: { id: FocusTopic; label: string; en: string }[] = [
  { id: "salary", label: "期望薪資", en: "Salary" },
  { id: "gap", label: "空窗期", en: "Employment gap" },
  { id: "leaving", label: "離職／轉職原因", en: "Why you left" },
  { id: "overtime", label: "加班意願", en: "Overtime" },
  { id: "military", label: "兵役狀況", en: "Military service" },
  { id: "weakness", label: "優缺點", en: "Strengths & weaknesses" },
  { id: "english", label: "英文自我介紹", en: "English self-intro" },
];

export const DIM_LABELS: Record<Dim, { label: string; short: string; en: string; desc: string; descEn: string }> = {
  expression: { label: "表達", short: "表達", en: "Delivery", desc: "語速、贅字、長度", descEn: "Pace, filler words, length" },
  logic: { label: "邏輯 STAR", short: "邏輯", en: "Structure", desc: "情境→任務→行動→結果", descEn: "Situation → Task → Action → Result" },
  expertise: { label: "專業度", short: "專業度", en: "Substance", desc: "具體例子、數字、職務關鍵字", descEn: "Specific examples, numbers, role keywords" },
  confidence: { label: "自信", short: "自信", en: "Confidence", desc: "少用「可能、應該」，敢講結論", descEn: "Fewer hedges, clear conclusions" },
  fit: { label: "企業文化契合", short: "文化契合", en: "Company fit", desc: "有沒有做功課、價值觀對不對得上", descEn: "Research on the company and value fit" },
};

export const DIM_ORDER: Dim[] = ["expression", "logic", "expertise", "confidence", "fit"];

export function companyLabel(id: CompanyType, lang: L = "zh") {
  const c = COMPANY_TYPES.find((x) => x.id === id);
  return c ? (lang === "en" ? c.en : c.short) : id;
}
export function roleLabel(id: RoleId, lang: L = "zh") {
  const r = ROLES.find((x) => x.id === id);
  return r ? (lang === "en" ? r.en : r.label) : id;
}
export function difficultyLabel(id: Difficulty, lang: L = "zh") {
  const d = DIFFICULTIES.find((x) => x.id === id);
  return d ? (lang === "en" ? d.en : d.label) : id;
}
export function dimLabel(d: Dim, lang: L = "zh", short = false) {
  return lang === "en" ? DIM_LABELS[d].en : short ? DIM_LABELS[d].short : DIM_LABELS[d].label;
}

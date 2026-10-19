import type { CompanyType, Difficulty, Dim, FocusTopic, RoleId, Situation } from "@/lib/types";

export const COMPANY_TYPES: { id: CompanyType; label: string; short: string; examples: string; style: string }[] = [
  { id: "tech", label: "科技業（半導體・電子）", short: "科技業", examples: "台積電、聯發科、鴻海", style: "技術＋行為題，常有性向與英文測驗，重視解決問題與抗壓" },
  { id: "traditional", label: "傳產／製造", short: "傳產", examples: "中鋼、台塑、各縣市工廠", style: "重視穩定度、配合度、加班與外派意願" },
  { id: "foreign", label: "外商", short: "外商", examples: "Google、P&G、外商銀行", style: "英文面試、重視主動性與影響力（impact）" },
  { id: "startup", label: "新創", short: "新創", examples: "Yourator、Cake 上的新創", style: "一人多工、自主學習、執行速度" },
  { id: "public", label: "公職／國營", short: "公職國營", examples: "台電、中油、國考後口試", style: "結構化口試：服務熱忱、依法行政、價值觀" },
  { id: "finance", label: "金融業", short: "金融", examples: "國泰、富邦、玉山", style: "誠信、抗壓、業績與法遵的取捨" },
  { id: "service", label: "服務／零售", short: "服務業", examples: "統一超商、餐飲、門市", style: "態度、應變、排班配合" },
];

export const ROLES: { id: RoleId; label: string }[] = [
  { id: "software", label: "軟體工程師" },
  { id: "process", label: "製程／設備工程師" },
  { id: "pm", label: "產品／專案管理" },
  { id: "marketing", label: "行銷企劃" },
  { id: "sales", label: "業務" },
  { id: "admin", label: "行政／人資" },
  { id: "finance", label: "財務／會計" },
  { id: "service", label: "門市／客服" },
  { id: "civil", label: "公職（一般行政）" },
];

export const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: "warmup", label: "暖身", desc: "面試官很友善，會給提示，幾乎不追問。第一次練習推薦。" },
  { id: "standard", label: "標準", desc: "一般 HR 初面節奏，每題可能追問一次。" },
  { id: "pressure", label: "高壓", desc: "會連續追問、挑你的回答漏洞，模擬主管面或壓力面試。" },
];

export const SITUATIONS: { id: Situation; label: string; desc: string }[] = [
  { id: "student", label: "在學中・找實習", desc: "大學生、研究生" },
  { id: "fresh", label: "應屆畢業", desc: "今年畢業或剛退伍" },
  { id: "unemployed", label: "待業中", desc: "畢業或離職一段時間了" },
  { id: "career-change", label: "想轉職", desc: "有工作經驗，想換跑道" },
];

export const FOCUS_TOPICS: { id: FocusTopic; label: string; desc: string }[] = [
  { id: "salary", label: "期望薪資", desc: "54.7% 新鮮人不知道該開多少" },
  { id: "gap", label: "空窗期", desc: "「這段時間你在做什麼？」" },
  { id: "leaving", label: "離職／轉職原因", desc: "不批評前公司也能說清楚" },
  { id: "overtime", label: "加班意願", desc: "不用直接說可以或不行" },
  { id: "military", label: "兵役狀況", desc: "役畢、待役、免役怎麼說" },
  { id: "weakness", label: "優缺點", desc: "缺點不要再說「太追求完美」" },
  { id: "english", label: "英文自我介紹", desc: "科技業、外商常突然切英文" },
];

export const DIM_LABELS: Record<Dim, { label: string; short: string; desc: string }> = {
  expression: { label: "表達", short: "表達", desc: "語速、贅字、長度是否剛好" },
  logic: { label: "邏輯 STAR", short: "邏輯", desc: "情境→任務→行動→結果，有沒有講完整" },
  expertise: { label: "專業度", short: "專業度", desc: "有沒有具體例子、數字和職務關鍵字" },
  confidence: { label: "自信", short: "自信", desc: "少用「可能、應該、我不太會」，敢講結論" },
  fit: { label: "企業文化契合", short: "文化契合", desc: "有沒有做功課、價值觀對不對得上" },
};

export const DIM_ORDER: Dim[] = ["expression", "logic", "expertise", "confidence", "fit"];

export function companyLabel(id: CompanyType) {
  return COMPANY_TYPES.find((c) => c.id === id)?.short ?? id;
}
export function roleLabel(id: RoleId) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}
export function difficultyLabel(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id)?.label ?? id;
}

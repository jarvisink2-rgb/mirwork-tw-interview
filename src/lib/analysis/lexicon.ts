import type { CompanyType, RoleId } from "@/lib/types";

/** 中文口頭禪／贅字。語音辨識常會吃掉「嗯、呃」，所以實際次數可能更多。 */
export const FILLERS_ZH = ["然後", "就是", "那個", "嗯", "呃", "欸", "基本上", "其實", "反正", "之類的", "對對對", "這樣子"];
export const FILLERS_EN = ["um", "uh", "like", "you know", "basically", "actually", "kind of", "sort of", "i mean"];

export const HEDGES_ZH = ["可能", "應該", "好像", "大概吧", "不太確定", "不太會", "我不知道", "不好意思", "抱歉", "隨便", "都可以"];
export const HEDGES_EN = ["maybe", "i guess", "i think maybe", "not sure", "sorry", "i don't know", "probably"];

export const STAR_ZH = {
  s: /(當時|那時候|那時|有一次|之前在|大[一二三四]|在.{1,12}(的時候|期間)|曾經|情境|背景是)/,
  t: /(負責|任務|目標|需要|被要求|要在|必須|挑戰是|問題是)/,
  a: /(我(先|就|決定|主動|提出|做了|設計|整理|帶領|協調|建議|用了|寫了|開始|找了|改成|加上)|於是|所以我)/,
  r: /(結果|最後|成果|提升|增加|減少|縮短|達成|獲得|拿到|成功|學到|從此|降到|做到|\d+\s*(%|％|倍|人|位|個|件|萬|元|天|小時|分鐘))/,
};
export const STAR_EN = {
  s: /\b(when|during|at my|in my|last (year|semester)|once)\b/i,
  t: /\b(responsible|my task|goal|needed to|had to|challenge was)\b/i,
  a: /\b(i (led|built|created|decided|organi[sz]ed|suggested|proposed|designed|started|reached out|set|used|changed))\b/i,
  r: /\b(result|as a result|finally|increased|reduced|improved|achieved|cut|grew|learned)\b|\d+%/i,
};

export const STRUCTURE_ZH = /(首先|第一|第二|第三|最後|總結來說|總之|兩個|三個|分成)/g;
export const STRUCTURE_EN = /\b(first|second|third|finally|in summary|two things|three things)\b/gi;

export const NUMBER_RE = /(\d+(\.\d+)?\s*(%|％|倍|人|位|個|件|萬|千|元|天|週|個月|小時|分鐘|分|年|k|K)?)|([一二三四五六七八九十百千兩]+多?(個|位|人|件|倍|成|天|週|年|個月|場|次|筆|堂))/g;
/** 「一個、兩位、一次」這類量詞不算具體數字 */
export const TRIVIAL_NUMBER = /^[一兩二][個位件次天週年場筆堂]$/;

export const ROLE_KEYWORDS: Record<RoleId, string[]> = {
  software: ["程式", "演算法", "資料結構", "api", "資料庫", "測試", "git", "前端", "後端", "python", "java", "react", "bug", "除錯", "效能", "架構", "部署", "log", "sql"],
  process: ["良率", "製程", "設備", "spc", "數據", "參數", "機台", "異常", "根本原因", "實驗", "品質", "產線", "8d", "doe", "人機料法環"],
  pm: ["使用者", "需求", "優先", "規格", "時程", "跨部門", "數據", "驗證", "指標", "mvp", "痛點", "取捨", "訪談"],
  marketing: ["受眾", "轉換", "曝光", "點擊", "kpi", "社群", "內容", "品牌", "數據", "預算", "投放", "觸及", "互動", "ga", "文案"],
  sales: ["客戶", "需求", "成交", "業績", "開發", "關係", "提案", "議價", "回購", "拜訪", "目標"],
  admin: ["流程", "文件", "排程", "協調", "核對", "excel", "檔案", "行政", "檢核", "紀錄"],
  finance: ["報表", "帳", "稽核", "預算", "成本", "分析", "excel", "法規", "風險", "證照", "核對"],
  service: ["顧客", "客人", "服務", "滿意", "抱怨", "同理", "解決", "排班", "道歉", "商品"],
  civil: ["民眾", "法規", "依法", "公平", "服務", "行政", "效率", "公共", "流程", "便民"],
};

export const CULTURE_KEYWORDS: Record<CompanyType, string[]> = {
  traditional: ["穩定", "長期", "配合", "學習", "腳踏實地", "責任", "細心", "傳承", "前輩", "吃苦"],
  tech: ["學習", "團隊", "責任", "效率", "解決問題", "數據", "承諾", "創新", "客戶", "誠信"],
  foreign: ["initiative", "ownership", "impact", "collaborat", "data", "customer", "主動", "溝通", "跨國", "影響"],
  startup: ["主動", "多工", "快速", "學習", "彈性", "嘗試", "從零", "ownership", "自己", "影響"],
  public: ["服務", "民眾", "依法", "公平", "廉潔", "效率", "責任", "公共"],
  finance: ["誠信", "風險", "法遵", "客戶", "細心", "數字", "責任", "長期"],
  service: ["服務", "熱情", "顧客", "笑容", "同理", "團隊", "客人"],
};

/** 有做功課的訊號。只說「貴公司」不算；要提到具體的產品、新聞、官網內容等。 */
export const RESEARCH_SIGNALS = /(官網|年報|財報|新聞|產品|\bapps?\b|服務|看到你們|看到貴|注意到|研究了|查了|your (product|mission|report|team's)|i noticed|i read|i saw that|i've followed)/i;

/** 履歷／自傳關鍵字 → 客製題。aliases 讓英文履歷也能對應到中文題目。 */
export const RESUME_LEXICON: { kw: string; kind: "skill" | "exp" | "cert" | "lead"; aliases?: string[] }[] = [
  ...["Python", "Java", "C++", "JavaScript", "React", "SQL", "Excel", "Tableau", "Power BI", "Photoshop", "Figma", "AutoCAD", "MATLAB", "PyTorch"].map((kw) => ({ kw, kind: "skill" as const })),
  { kw: "機器學習", kind: "skill", aliases: ["machine learning", "deep learning", "neural network"] },
  { kw: "資料分析", kind: "skill", aliases: ["data analysis", "data analytics"] },
  { kw: "影像辨識", kind: "skill", aliases: ["computer vision", "image recognition"] },
  { kw: "專題", kind: "exp", aliases: ["capstone", "project"] },
  { kw: "實習", kind: "exp", aliases: ["intern", "internship"] },
  { kw: "打工", kind: "exp", aliases: ["part-time"] },
  { kw: "家教", kind: "exp", aliases: ["tutor"] },
  { kw: "志工", kind: "exp", aliases: ["volunteer"] },
  { kw: "研究", kind: "exp", aliases: ["research"] },
  { kw: "論文", kind: "exp", aliases: ["thesis", "paper"] },
  { kw: "實驗室", kind: "exp", aliases: ["lab"] },
  { kw: "競賽", kind: "exp", aliases: ["competition", "olympiad", "contest"] },
  { kw: "黑客松", kind: "exp", aliases: ["hackathon"] },
  { kw: "交換", kind: "exp", aliases: ["exchange student"] },
  { kw: "創業", kind: "exp", aliases: ["startup", "founder"] },
  { kw: "門市", kind: "exp" },
  { kw: "接案", kind: "exp", aliases: ["freelance"] },
  ...["多益", "TOEIC", "IELTS", "托福", "TOEFL", "日檢", "證照", "PMP", "證券", "乙級", "丙級"].map((kw) => ({ kw, kind: "cert" as const })),
  { kw: "社長", kind: "lead", aliases: ["president"] },
  { kw: "隊長", kind: "lead", aliases: ["captain"] },
  { kw: "幹部", kind: "lead", aliases: ["officer", "committee"] },
  { kw: "會長", kind: "lead" },
  { kw: "活動長", kind: "lead" },
  { kw: "公關", kind: "lead" },
  { kw: "總召", kind: "lead" },
  { kw: "組長", kind: "lead", aliases: ["team lead", "leader"] },
];

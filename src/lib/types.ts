export type CompanyType = "traditional" | "tech" | "foreign" | "startup" | "public" | "finance" | "service";
export type RoleId = "software" | "process" | "marketing" | "sales" | "admin" | "finance" | "pm" | "service" | "civil";
export type Difficulty = "warmup" | "standard" | "pressure";
export type InterviewLang = "zh" | "en";
export type AnswerMode = "voice" | "text";
export type Situation = "student" | "fresh" | "unemployed" | "career-change";
export type FocusTopic = "salary" | "gap" | "leaving" | "overtime" | "military" | "english" | "weakness";
export type QuestionCategory = "intro" | "motivation" | "behavioral" | "role" | "trap" | "situational" | "closing" | "group" | "resume";
export type Dim = "expression" | "logic" | "expertise" | "confidence" | "fit";

export interface Question {
  id: string;
  lang: InterviewLang;
  text: string;
  category: QuestionCategory;
  companyTypes: CompanyType[] | "all";
  roles?: RoleId[];
  situations?: Situation[];
  focus?: FocusTopic;
  trap?: boolean;
  /** 建議作答秒數 [min, max] */
  idealSec: [number, number];
  /** HR 問這題真正想知道什麼 */
  intent: string;
  goodSignals: string[];
  redFlags: string[];
  modelAnswer: string;
  followUps: string[];
  tip?: string;
  /** 題目背後的研究依據（顯示在題庫） */
  source?: { label: string; url: string };
}

export interface InterviewConfig {
  companyType: CompanyType;
  role: RoleId;
  difficulty: Difficulty;
  lang: InterviewLang;
  mode: AnswerMode;
  length: 3 | 5 | 7;
  situation: Situation;
  focus: FocusTopic[];
  companyName?: string;
  resumeKeywords?: string[];
  resumeFileName?: string;
  /** 首頁一鍵開始的 3 分鐘暖身：只問通用題 */
  quick?: boolean;
  /** 從題庫單題練習 */
  singleQuestionId?: string;
}

export interface PlannedQuestion {
  id: string;
  text: string;
  /** 來源題目（題庫 id）；履歷客製題為 resume-xxx */
  baseId: string;
  category: QuestionCategory;
  idealSec: [number, number];
}

export interface AnswerRecord {
  questionId: string;
  baseId: string;
  questionText: string;
  isFollowUp: boolean;
  transcript: string;
  durationSec: number;
  skipped?: boolean;
}

export interface FillerHit { word: string; count: number }

export interface RedFlag {
  id: string;
  title: string;
  quote?: string;
  why: string;
  fix: string;
  questionText: string;
}

export interface AnswerFeedback {
  questionId: string;
  baseId: string;
  questionText: string;
  isFollowUp: boolean;
  transcript: string;
  durationSec: number;
  skipped: boolean;
  charCount: number;
  /** 中文：字/分鐘；英文：words/min；文字模式為 null */
  pace: number | null;
  paceUnit: "字/分" | "wpm";
  fillers: FillerHit[];
  fillerTotal: number;
  star: { s: boolean; t: boolean; a: boolean; r: boolean };
  /** 是否為需要用 STAR 說故事的題目 */
  story: boolean;
  numbers: string[];
  dims: Record<Dim, number>;
  score: number;
  hrThinks: string[];
  improve: string[];
  modelAnswer: string;
  redFlagIds: string[];
  /** 觸發紅旗的確切字詞，用來在逐字稿上畫線（舊紀錄沒有這個欄位） */
  flagMarks?: string[];
  /** Claude 寫的回饋（有設定 API key 時才有） */
  ai?: { comment: string; rewrite: string };
}

export interface PlanItem {
  day: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
}

export interface Report {
  total: number;
  dims: Record<Dim, number>;
  headline: string;
  strengths: string[];
  answers: AnswerFeedback[];
  redFlags: RedFlag[];
  plan: PlanItem[];
  totalFillers: number;
  avgPace: number | null;
  /** Claude 的總評（有設定 API key 時才有） */
  ai?: { model: string; summary: string };
}

export interface Session {
  id: string;
  createdAt: string;
  config: InterviewConfig;
  answers: AnswerRecord[];
  report: Report;
  demo?: boolean;
}

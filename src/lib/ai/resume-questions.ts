import type { InterviewLang, PlannedQuestion } from "@/lib/types";
import { RESUME_LEXICON } from "@/lib/analysis/lexicon";

const EN_LABEL: Record<string, string> = {
  機器學習: "machine learning",
  資料分析: "data analysis",
  影像辨識: "computer vision",
  專題: "capstone project",
  實習: "internship",
  打工: "part-time job",
  家教: "tutoring",
  志工: "volunteering",
  研究: "research",
  論文: "thesis",
  實驗室: "lab",
  競賽: "competition",
  黑客松: "hackathon",
  交換: "exchange semester",
  創業: "startup",
  門市: "retail",
  接案: "freelance",
  多益: "a TOEIC score",
  托福: "a TOEFL score",
  日檢: "a JLPT certificate",
  證照: "a certification",
  證券: "a securities licence",
  乙級: "a Level B technician certificate",
  丙級: "a Level C technician certificate",
  社長: "club president",
  隊長: "team captain",
  幹部: "an officer",
  會長: "association president",
  活動長: "events lead",
  公關: "PR lead",
  總召: "lead organiser",
  組長: "team lead",
};

/** 從履歷關鍵字產生「面試官從你的履歷挑細節追問」的題目。 */
export function resumeQuestions(keywords: string[] = [], lang: InterviewLang = "zh"): PlannedQuestion[] {
  const out: PlannedQuestion[] = [];
  for (const kw of keywords) {
    const entry = RESUME_LEXICON.find((e) => e.kw.toLowerCase() === kw.toLowerCase());
    if (!entry) continue;
    const label = EN_LABEL[entry.kw] ?? entry.kw;
    const text =
      lang === "en"
        ? entry.kind === "skill"
          ? `I see ${label} on your résumé. Can you give an example of using it to solve a real problem?`
          : entry.kind === "exp"
            ? `Your résumé mentions your ${label} experience. What was the most rewarding or difficult part?`
            : entry.kind === "cert"
              ? `You have ${label}. Why did you work towards it, and how will it help in this role?`
              : `You served as ${label}. Tell me about a time your team hit a problem and how you handled it.`
        : entry.kind === "skill"
          ? `我在你的履歷上看到「${entry.kw}」。可以舉一個你實際用 ${entry.kw} 解決問題的例子嗎？`
          : entry.kind === "exp"
            ? `你的履歷提到${entry.kw}的經驗，裡面最有成就感、或最困難的一件事是什麼？`
            : entry.kind === "cert"
              ? `你有${entry.kw}的成績或證照。當初為什麼去準備？對這份工作會有什麼幫助？`
              : `你當過${entry.kw}。可以說一次你帶團隊遇到問題、你怎麼處理的經驗嗎？`;
    out.push({ id: `resume-${entry.kw}`, baseId: `resume-${entry.kw}`, text, category: "resume", idealSec: [60, 120] });
  }
  return out;
}

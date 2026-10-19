import type { PlannedQuestion } from "@/lib/types";
import { RESUME_LEXICON } from "@/lib/analysis/lexicon";

/** 從履歷關鍵字產生「面試官從你的履歷挑細節追問」的題目。 */
export function resumeQuestions(keywords: string[] = []): PlannedQuestion[] {
  const out: PlannedQuestion[] = [];
  for (const kw of keywords) {
    const entry = RESUME_LEXICON.find((e) => e.kw.toLowerCase() === kw.toLowerCase());
    if (!entry) continue;
    const text =
      entry.kind === "skill"
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


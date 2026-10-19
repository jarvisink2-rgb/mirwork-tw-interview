import type { AnswerRecord, InterviewConfig, Session } from "@/lib/types";
import { buildReport } from "@/lib/analysis/analyze";

/** 示範報告：一位資工應屆生的標準面試。報告由同一個分析器即時產生，不是寫死的分數。 */
export const DEMO_CONFIG: InterviewConfig = {
  companyType: "tech",
  role: "software",
  difficulty: "standard",
  lang: "zh",
  mode: "voice",
  length: 5,
  situation: "fresh",
  focus: ["salary"],
  companyName: "示範科技",
};

const DEMO_ANSWERS: AnswerRecord[] = [
  {
    questionId: "intro",
    baseId: "intro",
    questionText: "先請你簡單自我介紹一下，大概一到兩分鐘。",
    isFollowUp: false,
    transcript:
      "面試官好，我叫林冠宇，然後今年從逢甲資工畢業。嗯，我大學的時候就是有做一個專題，然後是做校園二手書交易平台，我負責後端，用 Node.js 和 MySQL。然後我們上線之後大概有三百多個同學註冊。我平常也會自己寫一些小工具，就是對寫程式很有熱情，然後也很喜歡學新東西。我希望可以來貴公司學習。",
    durationSec: 46,
  },
  {
    questionId: "motivation",
    baseId: "motivation",
    questionText: "為什麼想應徵我們公司？",
    isFollowUp: false,
    transcript: "因為貴公司是很大的公司，然後福利很好，聽說年終也不錯，而且離我家很近，所以想來應徵。",
    durationSec: 12,
  },
  {
    questionId: "sw-bug",
    baseId: "sw-bug",
    questionText: "說一個你寫過的程式專案，遇過最難解的 bug 是什麼？你怎麼找到的？",
    isFollowUp: false,
    transcript:
      "我做二手書平台的時候，遇過同一本書會重複上架的問題。當時我負責後端，要在一週內修好，因為已經有使用者在抱怨。我先在後端加 log，發現同一個請求被送了兩次，原因是手機網路慢的時候，使用者會連按兩次。所以我在前端加上送出後鎖住按鈕，後端也加了唯一索引。結果之後兩個月，重複上架從每週大約 20 筆降到 0 筆，我也學到要從使用者實際的操作去想 bug。",
    durationSec: 52,
  },
  {
    questionId: "sw-bug-f1",
    baseId: "sw-bug",
    questionText: "如果是只有正式環境才會出現的 bug 呢？",
    isFollowUp: true,
    transcript: "我應該會先看正式環境的 log，可能也會試著在測試環境重現看看，嗯，然後找學長討論，應該就可以找到原因。",
    durationSec: 13,
  },
  {
    questionId: "salary",
    baseId: "salary",
    questionText: "你的期望薪資是多少？",
    isFollowUp: false,
    transcript: "我希望月薪可以有 4.5 萬。",
    durationSec: 5,
  },
  {
    questionId: "closing",
    baseId: "closing",
    questionText: "最後，你有什麼問題想問我們嗎？",
    isFollowUp: false,
    transcript: "沒有，謝謝。",
    durationSec: 3,
  },
];

export function buildDemoSession(): Session {
  return {
    id: "demo",
    createdAt: "2026-10-18T14:30:00+08:00",
    config: DEMO_CONFIG,
    answers: DEMO_ANSWERS,
    report: buildReport(DEMO_ANSWERS, DEMO_CONFIG),
    demo: true,
  };
}

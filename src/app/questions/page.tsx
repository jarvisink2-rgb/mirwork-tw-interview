import type { Metadata } from "next";
import { QuestionBank } from "@/components/questions/question-bank";
import { T } from "@/lib/i18n-shared";

export const metadata: Metadata = {
  title: "面試題庫 Question bank",
  description: "依科技業、傳產、外商、新創、公職國營、金融、服務業整理的面試題，附 HR 想知道什麼、紅旗和範例回答。",
};

export default function QuestionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">
        <T zh="面試題庫" en="Question bank" />
      </h1>
      <QuestionBank />
    </div>
  );
}

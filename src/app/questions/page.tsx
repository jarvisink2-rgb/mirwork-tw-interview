import type { Metadata } from "next";
import { Suspense } from "react";
import { QuestionBank } from "@/components/questions/question-bank";

export const metadata: Metadata = {
  title: "台灣企業面試題庫",
  description: "依科技業、傳產、外商、新創、公職國營、金融、服務業整理的面試題，附 HR 想知道什麼、紅旗和範例回答。",
};

export default function QuestionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">台灣企業面試題庫</h1>
      <p className="mt-2 text-ink-2">每一題都附上「HR 真正想知道什麼」、加分與扣分訊號，以及可以參考結構的範例回答。</p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-white" />}>
        <QuestionBank />
      </Suspense>
    </div>
  );
}

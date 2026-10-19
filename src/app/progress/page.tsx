import type { Metadata } from "next";
import { ProgressView } from "@/components/progress/progress-view";

export const metadata: Metadata = { title: "我的進度" };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">我的進度</h1>
      <ProgressView />
    </div>
  );
}

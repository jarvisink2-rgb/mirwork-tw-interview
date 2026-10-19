import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupForm } from "@/components/setup/setup-form";

export const metadata: Metadata = { title: "設定面試" };

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">設定你的模擬面試</h1>
      <p className="mt-2 text-ink-2">選得越接近你要面的公司，題目就越像真的。不確定也沒關係，預設值就能開始。</p>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-white" />}>
        <SetupForm />
      </Suspense>
    </div>
  );
}

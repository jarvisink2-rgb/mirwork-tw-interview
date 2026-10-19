import type { Metadata } from "next";
import { Suspense } from "react";
import { SetupForm } from "@/components/setup/setup-form";
import { T } from "@/lib/i18n-shared";

export const metadata: Metadata = { title: "設定面試" };

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl sm:text-3xl">
        <T zh="設定面試" en="Set up your interview" />
      </h1>
      <Suspense fallback={<div className="mt-8 h-96 animate-pulse rounded-2xl bg-white" />}>
        <SetupForm />
      </Suspense>
    </div>
  );
}

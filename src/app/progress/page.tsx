import type { Metadata } from "next";
import { ProgressView } from "@/components/progress/progress-view";
import { T } from "@/lib/i18n-shared";

export const metadata: Metadata = { title: "我的進度 Progress" };

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold sm:text-3xl">
        <T zh="我的進度" en="Your progress" />
      </h1>
      <p className="mt-2 text-ink-2">
        <T zh="每次練習的分數都記在這裡，只存在這台裝置的瀏覽器。" en="Scores from every session, saved only in this browser on this device." />
      </p>
      <ProgressView />
    </div>
  );
}

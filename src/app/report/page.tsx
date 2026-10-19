import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportLoader } from "@/components/report/report-loader";

export const metadata: Metadata = { title: "回饋報告 Feedback" };

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportLoader />
    </Suspense>
  );
}

function ReportSkeleton() {
  return (
    <div className="mx-auto min-h-[130vh] max-w-4xl space-y-4 px-4 py-8 sm:px-6" role="status" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-56 animate-pulse rounded-2xl bg-white" />
      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

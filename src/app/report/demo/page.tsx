import type { Metadata } from "next";
import { ReportView } from "@/components/report/report-view";
import { buildDemoSession } from "@/lib/data/demo";

export const metadata: Metadata = { title: "示範回饋報告", description: "一位資工應屆生的模擬面試回饋報告範例：總分、雷達圖、台灣 HR 紅旗、逐題 HR 內心 OS 與改寫範例。" };

// 示範報告在建置時就由分析器產生，直接輸出成靜態 HTML
export default function DemoReportPage() {
  return <ReportView session={buildDemoSession()} previous={null} />;
}

import type { Metadata } from "next";
import { ReportView } from "@/components/report/report-view";
import { buildDemoSession } from "@/lib/data/demo";

export const metadata: Metadata = { title: "示範回饋報告 Example report", description: "模擬面試回饋報告範例 / An example mock-interview feedback report." };

// 兩種語言的示範報告都在建置時產生，CSS 依介面語言顯示其中一份
export default function DemoReportPage() {
  return (
    <>
      <div className="i18n-zh">
        <ReportView session={buildDemoSession("zh")} previous={null} idPrefix="zh-" />
      </div>
      <div className="i18n-en">
        <ReportView session={buildDemoSession("en")} previous={null} idPrefix="en-" />
      </div>
    </>
  );
}

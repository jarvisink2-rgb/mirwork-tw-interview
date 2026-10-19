"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/types";
import { getSession, listSessions } from "@/lib/storage";
import { ReportView } from "./report-view";
import { T, getLang } from "@/lib/i18n";

export function ReportLoader() {
  const params = useSearchParams();
  const id = params.get("id");
  const [state, setState] = useState<{ status: "loading" } | { status: "missing" } | { status: "ok"; session: Session; previous: Session | null }>({ status: "loading" });

  useEffect(() => {
    if (!id) return setState({ status: "missing" });
    if (id === "demo") {
      import("@/lib/data/demo").then((m) => setState({ status: "ok", session: m.buildDemoSession(getLang()), previous: null }));
      return;
    }
    const s = getSession(id);
    if (!s) return setState({ status: "missing" });
    const prev = listSessions()
      .filter((x) => !x.demo && x.id !== s.id && x.createdAt < s.createdAt && x.report.total > 0)
      .pop() ?? null;
    setState({ status: "ok", session: s, previous: prev });
  }, [id]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto min-h-[130vh] max-w-4xl space-y-4 px-4 py-8 sm:px-6" role="status" aria-label="Loading">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-line-soft" />
        <div className="h-56 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <FileQuestion className="size-10 text-muted" aria-hidden />
        <h1 className="text-xl font-bold"><T zh="找不到這份報告" en="Report not found" /></h1>
        <p className="text-ink-2"><T zh="報告只存在你練習時用的瀏覽器裡。清除瀏覽紀錄或換了裝置就會看不到。" en="Reports are saved only in the browser you practised in. Clearing browsing data or switching devices removes them." /></p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/setup/"><T zh="開始新的練習" en="Start practising" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/report/demo/"><T zh="看示範報告" en="See an example" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ReportView session={state.session} previous={state.previous} />;
}

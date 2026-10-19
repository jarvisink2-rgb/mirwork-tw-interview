"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/lib/i18n";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/interview")) return null;
  return (
    <footer className="mt-12 border-t border-line-soft bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <T zh="MirWork 台灣版原型・練習紀錄只存在你的瀏覽器" en="MirWork Taiwan prototype · Your practice history stays in your browser" />
        </p>
        <Link className="hover:text-ink hover:underline" href="/research/">
          <T zh="研究與資料來源" en="Research & sources" />
        </Link>
      </div>
    </footer>
  );
}

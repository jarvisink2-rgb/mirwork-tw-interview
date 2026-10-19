"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/interview")) return null;
  return (
    <footer className="mt-16 border-t border-line-soft bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>MirWork 台灣版原型・練習紀錄只存在你的瀏覽器</p>
        <Link className="hover:text-ink hover:underline" href="/research/">
          研究與資料來源
        </Link>
      </div>
    </footer>
  );
}

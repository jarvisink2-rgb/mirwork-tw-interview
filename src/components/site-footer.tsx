"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/interview")) return null;
  return (
    <footer className="mt-16 border-t border-line-soft bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">MirWork 模擬面試・台灣版原型</p>
          <p className="mt-2">
            這是產品原型：AI 回覆由規則與題庫模擬。逐字稿與報告只存在你的瀏覽器，MirWork 不會收到；語音辨識由你的瀏覽器提供（例如 Chrome 會使用 Google 的語音服務）。
          </p>
        </div>
        <ul className="space-y-2">
          <li><Link className="hover:text-ink hover:underline" href="/research/">研究與資料來源</Link></li>
          <li><Link className="hover:text-ink hover:underline" href="/resources/#subsidy">青年就業補助</Link></li>
          <li><Link className="hover:text-ink hover:underline" href="/questions/">台灣企業面試題庫</Link></li>
        </ul>
        <p>
          求職壓力很大的時候，也可以撥打勞動部免付費專線 <a className="font-bold text-ink underline" href="tel:0800777888">0800-777-888</a> 詢問就業服務。
        </p>
      </div>
    </footer>
  );
}

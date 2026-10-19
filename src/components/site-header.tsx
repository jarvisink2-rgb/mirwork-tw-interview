"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { LangToggle } from "./lang-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const inInterview = pathname.startsWith("/interview");
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        {!inInterview && (
          <nav aria-label="主要導覽" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-bold text-ink-2 transition-colors hover:bg-canvas hover:text-ink",
                  isActive(pathname, item.href) && "bg-brand-tint text-brand-strong hover:bg-brand-tint",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          <LangToggle />
        </div>
      </div>
    </header>
  );
}

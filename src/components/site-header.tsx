"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";
import { LangToggle } from "./lang-toggle";
import { T } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const inInterview = pathname.startsWith("/interview");
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        {!inInterview && (
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("rounded-lg px-3 py-2 text-sm font-bold text-muted transition-colors hover:text-ink", active && "text-ink")}
                >
                  <T zh={item.zh} en={item.en} />
                </Link>
              );
            })}
          </nav>
        )}
        <LangToggle />
      </div>
    </header>
  );
}

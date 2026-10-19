"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav-items";
import { T } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/interview")) return null;
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ href, zh, en, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold text-muted", active && "text-brand-strong")}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                <T zh={zh} en={en} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

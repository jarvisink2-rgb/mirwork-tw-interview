import { BookOpen, ChartLine, Home, LifeBuoy, Mic } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/setup/", label: "模擬面試", icon: Mic },
  { href: "/questions/", label: "題庫", icon: BookOpen },
  { href: "/progress/", label: "進度", icon: ChartLine },
  { href: "/resources/", label: "資源", icon: LifeBuoy },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.replace(/\/$/, "");
  if (base === "/setup") return pathname.startsWith("/setup") || pathname.startsWith("/interview") || pathname.startsWith("/report");
  return pathname.startsWith(base);
}

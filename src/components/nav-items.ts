import { BookOpen, ChartLine, Home, LifeBuoy, Mic } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", zh: "首頁", en: "Home", icon: Home },
  { href: "/setup/", zh: "模擬面試", en: "Practice", icon: Mic },
  { href: "/questions/", zh: "題庫", en: "Questions", icon: BookOpen },
  { href: "/progress/", zh: "進度", en: "Progress", icon: ChartLine },
  { href: "/resources/", zh: "資源", en: "Resources", icon: LifeBuoy },
] as const;

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.replace(/\/$/, "");
  if (base === "/setup") return pathname.startsWith("/setup") || pathname.startsWith("/interview") || pathname.startsWith("/report");
  return pathname.startsWith(base);
}

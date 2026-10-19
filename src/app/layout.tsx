import type { Metadata, Viewport } from "next";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource-variable/roboto-slab/wght.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "MirWork 模擬面試｜台灣新鮮人與待業者的 AI 語音面試練習",
    template: "%s｜MirWork 模擬面試",
  },
  description:
    "用語音跟 AI 面試官 Mir 練習台灣企業真的會問的題目：自我介紹、期望薪資、空窗期、加班、英文面試。每一題都有 HR 視角的具體回饋與改寫範例。",
  openGraph: {
    title: "MirWork 模擬面試 · 台灣版原型",
    description: "面試前，先跟 Mir 練一次。具體到每一句話的回饋。",
    locale: "zh_TW",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow">
          跳到主要內容
        </a>
        <SiteHeader />
        <main id="main" className="pb-24 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}

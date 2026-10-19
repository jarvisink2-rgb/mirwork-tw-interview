"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONFIG, getLastConfig, setPendingConfig } from "@/lib/storage";
import { T, getLang } from "@/lib/i18n";

/** 一鍵開始：3 題通用暖身，不用填任何設定。語言跟著目前的介面語言。 */
export function QuickStartButton() {
  const router = useRouter();
  const start = () => {
    const last = getLastConfig();
    const lang = getLang();
    setPendingConfig({
      ...DEFAULT_CONFIG,
      companyType: last.companyType,
      role: last.role,
      situation: last.situation,
      lang,
      difficulty: "warmup",
      length: 3,
      focus: [],
      quick: true,
    });
    router.push("/interview/");
  };
  return (
    <Button size="lg" onClick={start}>
      <Mic aria-hidden />
      <T zh="開始 3 分鐘暖身" en="Start a 3-minute warm-up" />
    </Button>
  );
}

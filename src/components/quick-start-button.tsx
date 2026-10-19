"use client";

import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONFIG, getLastConfig, setPendingConfig } from "@/lib/storage";
import { safeStorage } from "@/lib/utils";
import { PREF_LANG_KEY } from "./lang-toggle";

/** 一鍵開始：3 題通用暖身，不用填任何設定。 */
export function QuickStartButton({ label = "立即開始 3 分鐘暖身" }: { label?: string }) {
  const router = useRouter();
  const start = () => {
    const last = getLastConfig();
    const lang = safeStorage.get<"zh" | "en">(PREF_LANG_KEY, "zh");
    setPendingConfig({
      ...DEFAULT_CONFIG,
      companyType: lang === "en" ? "foreign" : last.companyType,
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
      {label}
    </Button>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MirAvatar } from "@/components/mir-avatar";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <MirAvatar size={96} />
      <h1 className="text-2xl font-bold">這一頁不存在</h1>
      <p className="text-ink-2">可能是網址打錯了。沒關係，我們回到首頁重新開始。</p>
      <Button asChild className="mt-2">
        <Link href="/">回到首頁</Link>
      </Button>
    </div>
  );
}

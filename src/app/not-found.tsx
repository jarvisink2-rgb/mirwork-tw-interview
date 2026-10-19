import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MirAvatar } from "@/components/mir-avatar";
import { T } from "@/lib/i18n-shared";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <MirAvatar size={96} />
      <h1 className="text-2xl font-bold"><T zh="這一頁不存在" en="Page not found" /></h1>
      <p className="text-ink-2"><T zh="可能是網址打錯了。" en="The link may be wrong." /></p>
      <Button asChild className="mt-2">
        <Link href="/"><T zh="回到首頁" en="Go home" /></Link>
      </Button>
    </div>
  );
}

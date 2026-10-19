import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg" title="回到首頁">
      <span aria-hidden className="grid size-8 place-items-center rounded-[9px] bg-ink text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path d="M5 18V6l7 6 7-6v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">MirWork</span>
      <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand-strong">台灣</span>
    </Link>
  );
}

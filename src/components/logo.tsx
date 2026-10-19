import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg" title="MirWork">
      <span aria-hidden className="grid size-8 place-items-center rounded-[9px] bg-ink text-white">
        <svg viewBox="0 0 24 24" className="size-5" fill="none">
          <path d="M5 18V6l7 6 7-6v12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-brand text-[19px] font-semibold tracking-tight text-ink">MirWork</span>
    </Link>
  );
}

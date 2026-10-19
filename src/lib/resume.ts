"use client";

import { RESUME_LEXICON } from "@/lib/analysis/lexicon";

/** 在瀏覽器裡讀 PDF 文字（不上傳）。pdf.js 只在使用者選檔時才載入。 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages = Math.min(doc.numPages, 6);
  let text = "";
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return text;
}

export function extractKeywords(text: string, max = 6): string[] {
  const lower = text.toLowerCase();
  const hits = RESUME_LEXICON.filter((e) => lower.includes(e.kw.toLowerCase()) || e.aliases?.some((a) => new RegExp(`\\b${a}s?\\b`, "i").test(text)));
  // 每種類型輪流挑，避免全部都是技能
  const byKind = ["exp", "lead", "skill", "cert"].map((k) => hits.filter((h) => h.kind === k));
  const out: string[] = [];
  while (out.length < max && byKind.some((l) => l.length)) {
    for (const list of byKind) {
      const next = list.shift();
      if (next && out.length < max && !out.includes(next.kw)) out.push(next.kw);
    }
  }
  return out;
}

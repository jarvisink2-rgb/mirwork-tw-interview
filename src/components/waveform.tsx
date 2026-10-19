"use client";

import { useEffect, useRef } from "react";

/** 麥克風即時波形。沒有音訊時顯示柔和的待命波形。 */
export function Waveform({ stream, active, className }: { stream: MediaStream | null; active: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;

    if (stream && active) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new Ctx();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      } catch {
        analyser = null;
      }
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const BARS = 32;

    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const gap = 3;
      const barW = Math.max(2, (w - gap * (BARS - 1)) / BARS);
      if (analyser && data) analyser.getByteFrequencyData(data);
      for (let i = 0; i < BARS; i++) {
        let v: number;
        if (analyser && data) {
          const idx = Math.floor((i / BARS) * data.length * 0.8);
          v = data[idx] / 255;
        } else {
          v = active && !reduce ? 0.12 + 0.08 * Math.sin(t / 380 + i * 0.5) : 0.08;
        }
        const barH = Math.max(4, v * h * 0.95);
        const x = i * (barW + gap);
        const y = (h - barH) / 2;
        ctx.fillStyle = active ? "#0A6FD6" : "#C7C7CC";
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, Math.min(barW / 2, 4));
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      audioCtx?.close().catch(() => {});
    };
  }, [stream, active]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

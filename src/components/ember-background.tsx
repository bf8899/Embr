"use client";

import { useEffect, useRef } from "react";

// The rising-ember atmosphere behind every page: a soft aurora glow plus a
// canvas of drifting embers. Fixed, pointer-events-none, and painted below
// .app-content (z-10). Respects prefers-reduced-motion.
export function EmberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const size = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };
    size();
    window.addEventListener("resize", size);

    type P = {
      x: number; y: number; r: number; vy: number; sway: number;
      swaySp: number; hue: number; life: number; maxLife: number;
    };
    const spawn = (): P => ({
      x: Math.random() * W, y: H + 10, r: 0.8 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.6, sway: Math.random() * 2 * Math.PI,
      swaySp: 0.004 + Math.random() * 0.01, hue: 20 + Math.random() * 20,
      life: 0, maxLife: 600 + Math.random() * 500,
    });
    const parts: P[] = [];
    for (let i = 0; i < 30; i++) {
      const p = spawn();
      p.y = Math.random() * H;
      parts.push(p);
    }

    let raf = 0;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy;
        p.sway += p.swaySp;
        p.x += Math.sin(p.sway) * 0.3;
        p.life++;
        const fade =
          Math.min(p.life / 60, 1) * Math.max(1 - p.life / p.maxLife, 0) * 0.55;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue} 90% 62% / ${fade})`;
        ctx.shadowColor = `hsla(${p.hue} 90% 60% / ${fade})`;
        ctx.shadowBlur = 8;
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
        if (p.y < -12 || p.life > p.maxLife) Object.assign(p, spawn());
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <>
      <div className="ember-aurora" aria-hidden />
      <canvas ref={canvasRef} className="ember-canvas" aria-hidden />
    </>
  );
}

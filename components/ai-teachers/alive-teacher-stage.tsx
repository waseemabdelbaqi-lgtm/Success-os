"use client";

import { useEffect, useRef } from "react";

type Props = {
  teacherId: "sara" | "ali";
  speaking: boolean;
  listening: boolean;
  mouthEnergy: number; // 0..1
  mode: "talk" | "gesture";
  nameAr: string;
};

/**
 * Live photoreal teacher: blends closed/open/wide by mouth energy,
 * blinks, and switches to listen/gesture frames.
 */
export function AliveTeacherStage({
  teacherId,
  speaking,
  listening,
  mouthEnergy,
  mode,
  nameAr,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const blinkUntilRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const base = `/media/ai-teachers/${teacherId}`;
    const keys = {
      closed: `${base}/flagship/mouth-closed.png`,
      open: `${base}/flagship/mouth-open.png`,
      wide: `${base}/flagship/mouth-wide.png`,
      gesture: `${base}/flagship/gesture.png`,
      blink: `${base}/alive/blink.png`,
      listen: `${base}/alive/listen.png`,
      half: `${base}/alive/half.png`,
    };
    const loaded: Record<string, HTMLImageElement> = {};
    let pending = Object.keys(keys).length;
    Object.entries(keys).forEach(([k, src]) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.onload = () => {
        loaded[k] = img;
        pending -= 1;
        if (pending === 0) imgsRef.current = loaded;
      };
      img.onerror = () => {
        pending -= 1;
        if (pending === 0) imgsRef.current = loaded;
      };
    });
  }, [teacherId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let lastBlink = performance.now();

    const draw = (now: number) => {
      tRef.current = now / 1000;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // stage background
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a2740");
      g.addColorStop(1, "#0f1728");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const imgs = imgsRef.current;
      let frame: HTMLImageElement | undefined;

      if (now < blinkUntilRef.current && imgs.blink) {
        frame = imgs.blink;
      } else if (listening && !speaking && imgs.listen) {
        frame = imgs.listen;
      } else if (mode === "gesture" && mouthEnergy < 0.35 && imgs.gesture) {
        frame = imgs.gesture;
      } else if (imgs.closed && imgs.open && imgs.wide) {
        // blend on offscreen
        const m = Math.max(0, Math.min(1, mouthEnergy));
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const octx = off.getContext("2d");
        if (octx) {
          const drawFit = (img: HTMLImageElement, alpha: number) => {
            octx.globalAlpha = alpha;
            const scale = Math.max(W / img.width, H / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const sway = Math.sin(tRef.current * 1.4) * 3;
            octx.drawImage(img, (W - dw) / 2 + sway, (H - dh) / 2 + Math.sin(tRef.current * 2) * 2, dw, dh);
          };
          octx.clearRect(0, 0, W, H);
          if (m < 0.15) {
            drawFit(imgs.closed, 1);
          } else if (m < 0.55) {
            const t = (m - 0.15) / 0.4;
            drawFit(imgs.closed, 1);
            drawFit(imgs.open, t);
          } else {
            const t = (m - 0.55) / 0.45;
            drawFit(imgs.open, 1);
            drawFit(imgs.wide, Math.min(1, t));
          }
          octx.globalAlpha = 1;
          ctx.drawImage(off, 0, 0);
        }
        frame = undefined;
      } else {
        frame = imgs.closed || imgs.listen || imgs.gesture;
      }

      if (frame) {
        const scale = Math.max(W / frame.width, H / frame.height);
        const dw = frame.width * scale;
        const dh = frame.height * scale;
        const sway = Math.sin(tRef.current * 1.4) * 3;
        ctx.drawImage(frame, (W - dw) / 2 + sway, (H - dh) / 2 + Math.sin(tRef.current * 2) * 2, dw, dh);
      }

      // gold frame
      ctx.strokeStyle = "#ffc85a";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // blink schedule every ~3.5s when not speaking hard
      if (now - lastBlink > 3500 + Math.random() * 1500) {
        lastBlink = now;
        blinkUntilRef.current = now + 120;
      }

      // voice bars
      const colors = ["#ff5a6a", "#ffd84a", "#6ec8ff", "#ff8ab8", "#2ec4b6", "#ffe08a"];
      for (let i = 0; i < 6; i++) {
        const bh = 6 + mouthEnergy * 28 * (0.45 + 0.55 * Math.abs(Math.sin(tRef.current * 20 + i)));
        ctx.fillStyle = colors[i] as string;
        const x = 40 + i * 28;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, H - 36 - bh, 16, bh, 4);
        } else {
          ctx.rect(x, H - 36 - bh, 16, bh);
        }
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [speaking, listening, mouthEnergy, mode, teacherId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        width={420}
        height={520}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          display: "block",
          background: "#122033",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "#ff5a6a",
          color: "#fff",
          fontWeight: 800,
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 999,
        }}
      >
        AI LIVE
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#fff8e8",
          fontWeight: 800,
          fontSize: 20,
          textShadow: "0 2px 8px rgba(0,0,0,0.45)",
        }}
      >
        {nameAr}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 26,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "#ffd84a",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {speaking ? "تتكلم الآن…" : listening ? "تستمع إليك…" : "جاهزة للتفاعل"}
      </div>
    </div>
  );
}

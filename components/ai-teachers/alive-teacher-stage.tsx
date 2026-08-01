"use client";

import { useEffect, useRef } from "react";

type Props = {
  teacherId: "sara" | "ali";
  speaking: boolean;
  listening: boolean;
  celebrating?: boolean;
  mouthEnergy: number; // 0..1
  mode: "talk" | "gesture" | "celebrate";
  nameAr: string;
  gender: "female" | "male";
  highlightWord?: string;
};

/**
 * Live photoreal teacher: mouth morph, blink, listen, gesture, celebrate pulse.
 * Presence motion (breath + sway) even when idle — never a static photo.
 */
export function AliveTeacherStage({
  teacherId,
  speaking,
  listening,
  celebrating = false,
  mouthEnergy,
  mode,
  nameAr,
  gender,
  highlightWord,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const blinkUntilRef = useRef(0);
  const tRef = useRef(0);
  const stateRef = useRef({ speaking, listening, celebrating, mouthEnergy, mode });

  useEffect(() => {
    stateRef.current = { speaking, listening, celebrating, mouthEnergy, mode };
  }, [speaking, listening, celebrating, mouthEnergy, mode]);

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
    let cancelled = false;
    Object.entries(keys).forEach(([k, src]) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.onload = () => {
        loaded[k] = img;
        pending -= 1;
        if (!cancelled && pending === 0) imgsRef.current = loaded;
      };
      img.onerror = () => {
        pending -= 1;
        if (!cancelled && pending === 0) imgsRef.current = loaded;
      };
    });
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let lastBlink = performance.now();

    const drawFit = (
      target: CanvasRenderingContext2D,
      img: HTMLImageElement,
      W: number,
      H: number,
      alpha: number,
      breath: number,
      sway: number,
    ) => {
      target.globalAlpha = alpha;
      const scale = Math.max(W / img.width, H / img.height) * (1 + breath * 0.012);
      const dw = img.width * scale;
      const dh = img.height * scale;
      target.drawImage(img, (W - dw) / 2 + sway, (H - dh) / 2 + breath * 3, dw, dh);
      target.globalAlpha = 1;
    };

    const draw = (now: number) => {
      tRef.current = now / 1000;
      const W = canvas.width;
      const H = canvas.height;
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // atmospheric stage
      const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 20, W * 0.5, H * 0.55, H * 0.75);
      g.addColorStop(0, st.celebrating || st.mode === "celebrate" ? "#3a2a14" : "#243552");
      g.addColorStop(1, "#0c1220");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // soft spotlight
      const spot = ctx.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.5, 220);
      spot.addColorStop(0, "rgba(255,220,140,0.14)");
      spot.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);

      const breath = Math.sin(tRef.current * (st.speaking ? 2.2 : 1.15));
      const sway = Math.sin(tRef.current * 1.35) * (st.speaking ? 4.5 : 2.5);
      const imgs = imgsRef.current;
      let frame: HTMLImageElement | undefined;
      let drewBlend = false;

      if (now < blinkUntilRef.current && imgs.blink) {
        frame = imgs.blink;
      } else if (st.listening && !st.speaking && imgs.listen) {
        frame = imgs.listen;
      } else if ((st.mode === "gesture" || st.mode === "celebrate") && st.mouthEnergy < 0.28 && imgs.gesture) {
        frame = imgs.gesture;
      } else if (imgs.closed && imgs.open && imgs.wide) {
        const m = Math.max(0, Math.min(1, st.mouthEnergy));
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const octx = off.getContext("2d");
        if (octx) {
          octx.clearRect(0, 0, W, H);
          if (m < 0.12) {
            drawFit(octx, imgs.closed, W, H, 1, breath, sway);
          } else if (m < 0.5) {
            const t = (m - 0.12) / 0.38;
            drawFit(octx, imgs.closed, W, H, 1, breath, sway);
            drawFit(octx, imgs.open, W, H, t, breath, sway);
          } else {
            const t = (m - 0.5) / 0.5;
            drawFit(octx, imgs.open, W, H, 1, breath, sway);
            drawFit(octx, imgs.wide, W, H, Math.min(1, t), breath, sway);
          }
          ctx.drawImage(off, 0, 0);
          drewBlend = true;
        }
      } else {
        frame = imgs.closed || imgs.listen || imgs.gesture;
      }

      if (!drewBlend && frame) {
        drawFit(ctx, frame, W, H, 1, breath, sway);
      }

      // celebrate shimmer
      if (st.celebrating || st.mode === "celebrate") {
        ctx.save();
        ctx.globalAlpha = 0.18 + 0.1 * Math.abs(Math.sin(tRef.current * 6));
        ctx.fillStyle = "#ffd56a";
        for (let i = 0; i < 8; i++) {
          const x = 30 + ((i * 47 + tRef.current * 40) % (W - 60));
          const y = 40 + ((i * 73 + Math.sin(tRef.current + i) * 20) % (H - 80));
          ctx.beginPath();
          ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // gold frame
      ctx.strokeStyle = st.celebrating ? "#ffe08a" : "#ffc85a";
      ctx.lineWidth = st.celebrating ? 5 : 4;
      ctx.strokeRect(8, 8, W - 16, H - 16);

      // blink schedule
      const blinkGap = st.speaking ? 4200 : 3200;
      if (now - lastBlink > blinkGap + Math.random() * 1400) {
        lastBlink = now;
        blinkUntilRef.current = now + 110;
      }

      // voice energy bars
      const colors = ["#ff5a6a", "#ffd84a", "#6ec8ff", "#ff8ab8", "#2ec4b6", "#ffe08a"];
      for (let i = 0; i < 6; i++) {
        const bh =
          6 +
          st.mouthEnergy * 30 * (0.4 + 0.6 * Math.abs(Math.sin(tRef.current * 18 + i * 0.9)));
        ctx.fillStyle = colors[i] as string;
        const x = 36 + i * 28;
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
  }, [teacherId]);

  const readyLabel = gender === "female" ? "جاهزة للتفاعل" : "جاهز للتفاعل";
  const speakLabel = gender === "female" ? "تتكلم الآن…" : "يتحدث الآن…";
  const listenLabel = gender === "female" ? "تستمع إليك…" : "يستمع إليك…";
  const celebLabel = "يحتفل بنجاحك!";

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
          boxShadow: celebrating
            ? "0 0 0 3px rgba(255,216,74,0.55), 0 18px 40px rgba(15,23,40,0.35)"
            : "0 18px 40px rgba(15,23,40,0.28)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: celebrating ? "#ffd84a" : "#ff5a6a",
          color: celebrating ? "#1e2a3a" : "#fff",
          fontWeight: 800,
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 999,
          letterSpacing: "0.04em",
        }}
      >
        {celebrating ? "MASTER MOVE" : "AI LIVE"}
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
        {celebrating || mode === "celebrate"
          ? celebLabel
          : speaking
            ? speakLabel
            : listening
              ? listenLabel
              : readyLabel}
        {highlightWord ? ` · ${highlightWord}` : ""}
      </div>
    </div>
  );
}

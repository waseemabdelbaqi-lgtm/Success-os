"use client";

import { useEffect, useRef } from "react";

export type TeacherPose = "idle" | "talk" | "point" | "write" | "gesture";

type Props = {
  teacherId: "sara" | "ali";
  speaking: boolean;
  listening: boolean;
  celebrating?: boolean;
  mouthEnergy: number;
  pose: TeacherPose;
  nameAr: string;
  gender: "female" | "male";
};

/**
 * Cinematic photoreal stage: pose pack + mouth morph + breath presence.
 */
export function AliveTeacherStage({
  teacherId,
  speaking,
  listening,
  celebrating = false,
  mouthEnergy,
  pose,
  nameAr,
  gender,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const blinkUntilRef = useRef(0);
  const stateRef = useRef({ speaking, listening, celebrating, mouthEnergy, pose });

  useEffect(() => {
    stateRef.current = { speaking, listening, celebrating, mouthEnergy, pose };
  }, [speaking, listening, celebrating, mouthEnergy, pose]);

  useEffect(() => {
    const base = `/media/ai-teachers/${teacherId}`;
    const keys: Record<string, string> = {
      closed: `${base}/flagship/mouth-closed.png`,
      open: `${base}/flagship/mouth-open.png`,
      wide: `${base}/flagship/mouth-wide.png`,
      gesture: `${base}/flagship/gesture.png`,
      blink: `${base}/alive/blink.png`,
      listen: `${base}/alive/listen.png`,
      half: `${base}/alive/half.png`,
      idle: `${base}/poses/idle.png`,
      talkPose: `${base}/poses/talk.png`,
      point: `${base}/poses/point.png`,
      write: `${base}/poses/write.png`,
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
    let t = 0;

    const fit = (
      target: CanvasRenderingContext2D,
      img: HTMLImageElement,
      W: number,
      H: number,
      alpha: number,
      breath: number,
      sway: number,
      zoom = 1,
    ) => {
      target.globalAlpha = alpha;
      const scale = Math.max(W / img.width, H / img.height) * zoom * (1 + breath * 0.01);
      const dw = img.width * scale;
      const dh = img.height * scale;
      target.drawImage(img, (W - dw) / 2 + sway, (H - dh) / 2 + breath * 4 + H * 0.02, dw, dh);
      target.globalAlpha = 1;
    };

    const draw = (now: number) => {
      t = now / 1000;
      const W = canvas.width;
      const H = canvas.height;
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // classroom depth backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#1c2a3d");
      bg.addColorStop(0.55, "#121c2c");
      bg.addColorStop(1, "#0a1018");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const spot = ctx.createRadialGradient(W * 0.48, H * 0.38, 30, W * 0.5, H * 0.5, W * 0.62);
      spot.addColorStop(0, st.celebrating ? "rgba(255,210,120,0.22)" : "rgba(255,220,160,0.12)");
      spot.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);

      const breath = Math.sin(t * (st.speaking ? 2.4 : 1.1));
      const sway = Math.sin(t * 1.2) * (st.speaking ? 5 : 2.2);
      const imgs = imgsRef.current;
      const m = Math.max(0, Math.min(1, st.mouthEnergy));

      // choose base body pose
      let body: HTMLImageElement | undefined;
      if (now < blinkUntilRef.current && imgs.blink) body = imgs.blink;
      else if (st.listening && !st.speaking && imgs.listen) body = imgs.listen;
      else if (st.pose === "point" && imgs.point) body = imgs.point;
      else if (st.pose === "write" && imgs.write) body = imgs.write;
      else if (st.pose === "gesture" && imgs.gesture) body = imgs.gesture;
      else if (st.speaking && m > 0.12 && imgs.closed && imgs.open && imgs.wide) {
        // mouth morph while speaking
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const octx = off.getContext("2d");
        if (octx) {
          if (m < 0.45) {
            const k = m / 0.45;
            fit(octx, imgs.closed, W, H, 1, breath, sway, 1.05);
            fit(octx, imgs.open, W, H, k, breath, sway, 1.05);
          } else {
            const k = (m - 0.45) / 0.55;
            fit(octx, imgs.open, W, H, 1, breath, sway, 1.05);
            fit(octx, imgs.wide, W, H, Math.min(1, k), breath, sway, 1.05);
          }
          ctx.drawImage(off, 0, 0);
        }
        body = undefined;
      } else if (imgs.closed) body = imgs.closed;
      else body = imgs.idle || imgs.talkPose;

      if (body) fit(ctx, body, W, H, 1, breath, sway, st.speaking ? 1.05 : 1.02);

      if (st.celebrating) {
        ctx.save();
        ctx.globalAlpha = 0.22 + 0.12 * Math.abs(Math.sin(t * 7));
        ctx.fillStyle = "#ffd56a";
        for (let i = 0; i < 10; i++) {
          const x = 24 + ((i * 53 + t * 55) % (W - 48));
          const y = 30 + ((i * 79 + Math.sin(t * 2 + i) * 28) % (H - 60));
          ctx.beginPath();
          ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      if (now - lastBlink > (st.speaking ? 4500 : 3000) + Math.random() * 1200) {
        lastBlink = now;
        blinkUntilRef.current = now + 100;
      }

      // voice bars
      for (let i = 0; i < 7; i++) {
        const bh = 5 + m * 34 * (0.35 + 0.65 * Math.abs(Math.sin(t * 17 + i)));
        ctx.fillStyle = ["#ff5a6a", "#ffd84a", "#6ec8ff", "#ff8ab8", "#2ec4b6", "#ffe08a", "#9ad7ff"][i]!;
        const x = 28 + i * 22;
        ctx.fillRect(x, H - 28 - bh, 12, bh);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [teacherId]);

  const ready = gender === "female" ? "جاهزة" : "جاهز";
  const speak = gender === "female" ? "تشرح الآن" : "يشرح الآن";
  const listen = gender === "female" ? "تستمع" : "يستمع";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 480 }}>
      <canvas
        ref={canvasRef}
        width={540}
        height={720}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          padding: "48px 20px 22px",
          background: "linear-gradient(transparent, rgba(8,12,20,0.88) 55%)",
          color: "#fff8e8",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-teacher-ar), 'Noto Kufi Arabic', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {nameAr}
        </div>
        <div style={{ marginTop: 4, color: "#ffd84a", fontWeight: 700, fontSize: 14 }}>
          {celebrating
            ? "لحظة إتقان"
            : speaking
              ? speak
              : listening
                ? listen
                : ready}
        </div>
      </div>
    </div>
  );
}

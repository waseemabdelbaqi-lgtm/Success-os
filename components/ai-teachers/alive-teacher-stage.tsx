"use client";

import { useEffect, useRef } from "react";

export type ClassroomPose = "stand" | "point" | "write";

type Props = {
  teacherId: "sara" | "ali";
  speaking: boolean;
  listening: boolean;
  celebrating?: boolean;
  mouthEnergy: number;
  pose: ClassroomPose;
  nameAr: string;
  gender: "female" | "male";
  /** When true, fills the classroom column edge-to-edge */
  cinematic?: boolean;
};

/**
 * Real-teacher stage: classroom standing poses (stand/point/write)
 * with breath + speech energy — feels like a teacher beside the board.
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
  cinematic = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgsRef = useRef<Record<string, HTMLImageElement>>({});
  const stateRef = useRef({ speaking, listening, celebrating, mouthEnergy, pose });

  useEffect(() => {
    stateRef.current = { speaking, listening, celebrating, mouthEnergy, pose };
  }, [speaking, listening, celebrating, mouthEnergy, pose]);

  useEffect(() => {
    const base = `/media/ai-teachers/${teacherId}`;
    const keys: Record<string, string> = {
      stand: `${base}/classroom/stand.png`,
      point: `${base}/classroom/point.png`,
      write: `${base}/classroom/write.png`,
      // fallbacks
      idle: `${base}/poses/idle.png`,
      talk: `${base}/poses/talk.png`,
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
    let t = 0;

    const draw = (now: number) => {
      t = now / 1000;
      const W = canvas.width;
      const H = canvas.height;
      const st = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // soft classroom wall behind teacher
      const wall = ctx.createLinearGradient(0, 0, 0, H);
      wall.addColorStop(0, "#d8c3a4");
      wall.addColorStop(0.55, "#c4ad8c");
      wall.addColorStop(1, "#8a7358");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, W, H);

      // window light
      const light = ctx.createRadialGradient(W * 0.2, H * 0.15, 20, W * 0.35, H * 0.35, W * 0.7);
      light.addColorStop(0, "rgba(255,248,220,0.35)");
      light.addColorStop(1, "rgba(255,248,220,0)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, W, H);

      const imgs = imgsRef.current;
      const frame =
        (st.pose === "point" && imgs.point) ||
        (st.pose === "write" && imgs.write) ||
        imgs.stand ||
        imgs.talk ||
        imgs.idle;

      if (frame) {
        const m = Math.max(0, Math.min(1, st.mouthEnergy));
        const breath = Math.sin(t * (st.speaking ? 2.3 : 1.05)) * (st.speaking ? 1 : 0.7);
        const sway = Math.sin(t * 1.15) * (st.speaking ? 3.5 : 1.6);
        const zoom = 1.02 + (st.speaking ? m * 0.015 : 0) + (st.listening ? 0.01 : 0);
        const scale = Math.max(W / frame.width, H / frame.height) * zoom;
        const dw = frame.width * scale;
        const dh = frame.height * scale;
        const dx = (W - dw) / 2 + sway;
        const dy = (H - dh) / 2 + breath * 3 + H * 0.04;

        // soft ground shadow
        ctx.fillStyle = "rgba(40,28,16,0.22)";
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.92, W * 0.28, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(frame, dx, dy, dw, dh);

        // speech warmth overlay
        if (st.speaking && m > 0.08) {
          ctx.save();
          ctx.globalAlpha = 0.05 + m * 0.08;
          ctx.fillStyle = "#ffe08a";
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      }

      if (st.celebrating) {
        ctx.save();
        ctx.globalAlpha = 0.2 + 0.1 * Math.abs(Math.sin(t * 6));
        ctx.fillStyle = "#ffd56a";
        for (let i = 0; i < 8; i++) {
          const x = 20 + ((i * 61 + t * 40) % (W - 40));
          const y = 40 + ((i * 83 + Math.sin(t + i) * 24) % (H - 80));
          ctx.beginPath();
          ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // listening cue ring
      if (st.listening && !st.speaking) {
        ctx.strokeStyle = "rgba(46, 196, 182, 0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.42, 40 + Math.sin(t * 4) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // voice bars near feet
      const m = st.mouthEnergy;
      for (let i = 0; i < 6; i++) {
        const bh = 4 + m * 26 * (0.4 + 0.6 * Math.abs(Math.sin(t * 16 + i)));
        ctx.fillStyle = ["#c45c26", "#e6b35a", "#2a9d8f", "#e76f51", "#f4a261", "#264653"][i]!;
        ctx.fillRect(24 + i * 18, H - 22 - bh, 10, bh);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [teacherId]);

  const ready = gender === "female" ? "جاهزة للحصة" : "جاهز للحصة";
  const speak = gender === "female" ? "تشرح للصف" : "يشرح للصف";
  const listen = gender === "female" ? "تستمع للطالب" : "يستمع للطالب";
  const write = gender === "female" ? "تكتب على السبورة" : "يكتب على السبورة";
  const point = gender === "female" ? "تشير للسبورة" : "يشير للسبورة";

  const status = celebrating
    ? "لحظة نجاح الصف"
    : speaking
      ? pose === "write"
        ? write
        : pose === "point"
          ? point
          : speak
      : listening
        ? listen
        : ready;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: cinematic ? 520 : 420,
      }}
    >
      <canvas
        ref={canvasRef}
        width={560}
        height={780}
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
          padding: "40px 16px 18px",
          background: "linear-gradient(transparent, rgba(20,14,8,0.82) 55%)",
          color: "#fff8e8",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-teacher-ar), 'Noto Kufi Arabic', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.35rem, 2.8vw, 1.85rem)",
          }}
        >
          {nameAr}
        </div>
        <div style={{ marginTop: 4, color: "#ffd84a", fontWeight: 700, fontSize: 13 }}>{status}</div>
      </div>
    </div>
  );
}

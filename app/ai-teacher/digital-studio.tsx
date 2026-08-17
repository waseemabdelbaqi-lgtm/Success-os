"use client";

import type { ReactNode } from "react";

interface DigitalStudioProps {
  children: ReactNode;
  teacherName: string;
  subjectLabel: string;
  statusLabel: string;
}

export function DigitalStudio({ children, teacherName, subjectLabel, statusLabel }: DigitalStudioProps) {
  return (
    <div className="relative isolate aspect-video overflow-hidden rounded-2xl bg-[#050b18] [perspective:1100px]" aria-label={`${teacherName} digital teaching studio`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(34,211,238,.22),transparent_36%),linear-gradient(180deg,#081426_0%,#030712_72%)]" />
      <div className="absolute left-1/2 top-[7%] h-[84%] w-[72%] -translate-x-1/2 rounded-[2rem] border border-cyan-300/20 bg-slate-950/50 shadow-[0_0_80px_rgba(34,211,238,.12)] [transform:translateX(-50%)_rotateX(1deg)]" />

      <div className="absolute left-[3%] top-[18%] h-[57%] w-[18%] origin-right rounded-xl border border-cyan-400/20 bg-gradient-to-br from-slate-800/80 to-slate-950/90 p-3 shadow-2xl [transform:rotateY(34deg)]">
        <p className="text-[clamp(7px,1vw,12px)] font-semibold uppercase tracking-[.2em] text-cyan-300">Success OS</p>
        <div className="mt-3 h-px bg-cyan-400/30" />
        <p className="mt-3 text-[clamp(7px,1vw,12px)] text-slate-300">{subjectLabel}</p>
        <div className="mt-3 space-y-2"><div className="h-1.5 rounded-full bg-cyan-400/30"/><div className="h-1.5 w-3/4 rounded-full bg-slate-600/40"/><div className="h-1.5 w-1/2 rounded-full bg-slate-600/30"/></div>
      </div>

      <div className="absolute right-[3%] top-[18%] h-[57%] w-[18%] origin-left rounded-xl border border-violet-400/20 bg-gradient-to-bl from-slate-800/80 to-slate-950/90 p-3 shadow-2xl [transform:rotateY(-34deg)]">
        <p className="text-[clamp(7px,1vw,12px)] font-semibold uppercase tracking-[.16em] text-violet-300">Live Class</p>
        <p className="mt-3 text-[clamp(7px,1vw,12px)] text-slate-400">Teacher</p><p className="text-[clamp(9px,1.2vw,14px)] font-bold text-white">{teacherName}</p>
        <p className="mt-3 text-[clamp(7px,1vw,12px)] text-slate-400">Runtime</p><p className="text-[clamp(8px,1vw,12px)] font-semibold text-emerald-300">{statusLabel}</p>
      </div>

      <div className="absolute left-1/2 top-[10%] h-[68%] w-[58%] -translate-x-1/2 overflow-hidden rounded-2xl border border-cyan-200/30 bg-black shadow-[0_24px_80px_rgba(0,0,0,.65),0_0_35px_rgba(34,211,238,.12)]">
        {children}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      </div>

      <div className="absolute bottom-[-14%] left-1/2 h-[34%] w-[88%] -translate-x-1/2 rounded-[50%] border border-cyan-300/15 bg-[radial-gradient(ellipse,rgba(34,211,238,.18),rgba(15,23,42,.92)_58%,#020617_76%)] shadow-[0_-10px_40px_rgba(34,211,238,.08)] [transform:translateX(-50%)_rotateX(66deg)]" />
      <div className="absolute left-[24%] top-0 h-[40%] w-px rotate-[18deg] bg-gradient-to-b from-cyan-100/80 to-transparent shadow-[0_0_16px_4px_rgba(103,232,249,.18)]" />
      <div className="absolute right-[24%] top-0 h-[40%] w-px -rotate-[18deg] bg-gradient-to-b from-violet-100/70 to-transparent shadow-[0_0_16px_4px_rgba(196,181,253,.16)]" />
    </div>
  );
}


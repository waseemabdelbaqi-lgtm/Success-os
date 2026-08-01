"use client";

import type { CSSProperties } from "react";
import type { BoardCue, LessonBeat } from "@/lib/ai-teachers/g1-count-lesson";

function activePointer(cues: BoardCue[], progress: number): BoardCue | null {
  const ptr = cues.filter((c) => c.type === "pointer" && progress >= c.at);
  return ptr.length ? ptr[ptr.length - 1]! : null;
}

type Props = {
  beat: LessonBeat;
  progress: number;
  writing: boolean;
  celebrating: boolean;
};

/**
 * Full-bleed living chalkboard — chalk reveals sync to speech progress.
 */
export function LivingBoard({ beat, progress, writing, celebrating }: Props) {
  const cues = beat.board.cues.filter((c) => progress >= c.at && c.type !== "pointer");
  const kinds = new Set(cues.map((c) => c.type));
  const pointer = activePointer(beat.board.cues, progress);

  const glow = (target: "number" | "apples" | "equation" | "practice"): CSSProperties =>
    pointer && pointer.type === "pointer" && pointer.target === target
      ? {
          boxShadow: "0 0 0 3px rgba(255, 236, 150, 0.85), 0 0 28px rgba(255, 220, 90, 0.45)",
          transform: "scale(1.03)",
        }
      : {};

  return (
    <div
      className="living-board"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 420,
        borderRadius: 0,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at 30% 20%, #1a6b5a 0%, transparent 45%), linear-gradient(160deg, #0d4a42 0%, #0a3a34 40%, #072e2a 100%)",
        boxShadow: celebrating
          ? "inset 0 0 80px rgba(255, 210, 90, 0.18)"
          : "inset 0 0 60px rgba(0,0,0,0.35)",
      }}
    >
      {/* chalk dust / wood rail */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 18,
          background: "linear-gradient(90deg,#6b3e22,#8a5330 40%,#5c341c)",
        }}
      />
      {writing && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#f5f0e6",
            boxShadow: "0 0 12px rgba(245,240,230,0.8)",
            animation: "chalkDot 1.2s ease-in-out infinite",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          padding: "clamp(1.25rem, 3vw, 2.25rem)",
          display: "flex",
          flexDirection: "column",
          color: "#f4f1e6",
          fontFamily: "var(--font-teacher-ar), 'Noto Kufi Arabic', sans-serif",
        }}
      >
        {kinds.has("title") && (
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#fff8e8",
              textShadow: "0 2px 0 rgba(0,0,0,0.25)",
              animation: "chalkIn 0.5s ease",
            }}
          >
            {beat.board.title}
          </h2>
        )}
        {kinds.has("subtitle") && (
          <p
            style={{
              margin: "0.45rem 0 1.25rem",
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "#ffe56a",
              fontWeight: 700,
              animation: "chalkIn 0.55s ease",
            }}
          >
            {beat.board.subtitle}
          </p>
        )}

        <div style={{ flex: 1, display: "grid", alignContent: "center", gap: 14 }}>
          {cues.map((c, i) => {
            if (c.type === "big_number") {
              const colors = ["#ffe056", "#ff9ec4", "#8fd4ff"];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    transition: "transform 0.25s, box-shadow 0.25s",
                    ...glow("number"),
                    borderRadius: 28,
                    padding: 8,
                  }}
                >
                  <div style={{ textAlign: "center", animation: "chalkIn 0.45s ease" }}>
                    <div
                      style={{
                        width: "clamp(96px, 16vw, 140px)",
                        height: "clamp(96px, 16vw, 140px)",
                        borderRadius: "50%",
                        background: colors[c.n - 1],
                        color: "#142018",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "clamp(3rem, 8vw, 4.5rem)",
                        fontWeight: 900,
                        border: "5px solid rgba(255,255,255,0.9)",
                      }}
                    >
                      {c.n}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "inline-block",
                        background: "rgba(255,255,255,0.95)",
                        color: "#142018",
                        borderRadius: 14,
                        padding: "8px 18px",
                        fontWeight: 800,
                        fontSize: "1.2rem",
                      }}
                    >
                      {c.word}
                    </div>
                  </div>
                </div>
              );
            }
            if (c.type === "apples") {
              const fruit = ["#ff6b6b", "#ff9f43", "#54a0ff"];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    transition: "transform 0.25s, box-shadow 0.25s",
                    ...glow("apples"),
                    borderRadius: 24,
                    padding: 10,
                  }}
                >
                  {Array.from({ length: c.n }).map((_, j) => (
                    <span
                      key={j}
                      style={{
                        width: 52,
                        height: 58,
                        borderRadius: "46% 46% 50% 50%",
                        background: `radial-gradient(circle at 35% 30%, #fff6, ${fruit[j % 3]})`,
                        border: "3px solid rgba(255,255,255,0.85)",
                        display: "inline-block",
                        animation: `fruitPop 0.4s ease ${j * 0.08}s both`,
                      }}
                    />
                  ))}
                  <span
                    style={{
                      background: "#ffe056",
                      color: "#142018",
                      borderRadius: 12,
                      padding: "6px 12px",
                      fontWeight: 900,
                      fontSize: 22,
                    }}
                  >
                    × {c.n}
                  </span>
                </div>
              );
            }
            if (c.type === "equation") {
              return (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    transition: "transform 0.25s, box-shadow 0.25s",
                    ...glow("equation"),
                    borderRadius: 16,
                    padding: 6,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      background: "#ffe056",
                      color: "#142018",
                      borderRadius: 16,
                      padding: "12px 28px",
                      fontWeight: 900,
                      fontSize: "clamp(1.4rem, 3vw, 2rem)",
                      animation: "chalkIn 0.4s ease",
                    }}
                  >
                    {c.text}
                  </span>
                </div>
              );
            }
            if (c.type === "practice_row") {
              const colors = ["#ffe056", "#ff9ec4", "#8fd4ff"];
              const words = { 1: "واحد", 2: "اثنان", 3: "ثلاثة" } as const;
              return (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#142018",
                    borderRadius: 18,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontWeight: 800,
                    animation: `chalkIn 0.4s ease ${i * 0.05}s both`,
                    transition: "transform 0.25s, box-shadow 0.25s",
                    ...glow("practice"),
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: colors[c.n - 1],
                      display: "grid",
                      placeItems: "center",
                      fontSize: 20,
                    }}
                  >
                    {c.n}
                  </span>
                  <span>=</span>
                  <span style={{ display: "flex", gap: 6 }}>
                    {Array.from({ length: c.n }).map((_, j) => (
                      <span
                        key={j}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: colors[c.n - 1],
                          border: "2px solid #142018",
                        }}
                      />
                    ))}
                  </span>
                  <span style={{ marginInlineStart: "auto" }}>{words[c.n as 1 | 2 | 3]}</span>
                </div>
              );
            }
            if (c.type === "stars") {
              return (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    letterSpacing: 10,
                    color: "#ffe056",
                    textShadow: "0 0 18px rgba(255,220,90,0.5)",
                    animation: "chalkIn 0.5s ease",
                  }}
                >
                  {"★".repeat(c.n)}
                </div>
              );
            }
            if (c.type === "summary") {
              return (
                <div key={i} style={{ display: "grid", gap: 10 }}>
                  {["1 = واحد", "2 = اثنان", "3 = ثلاثة"].map((line, j) => (
                    <div
                      key={line}
                      style={{
                        background: ["#ffe056", "#ff9ec4", "#8fd4ff"][j],
                        color: "#142018",
                        borderRadius: 14,
                        padding: "12px 16px",
                        textAlign: "center",
                        fontWeight: 900,
                        fontSize: "clamp(1.1rem, 2.4vw, 1.5rem)",
                        animation: `chalkIn 0.4s ease ${j * 0.08}s both`,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              );
            }
            if (c.type === "banner") {
              return (
                <div key={i} style={{ textAlign: "center", marginTop: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(120deg,#ff5a6a,#ff8a3d)",
                      borderRadius: 999,
                      padding: "12px 28px",
                      fontWeight: 900,
                      fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                      animation: "chalkIn 0.45s ease",
                    }}
                  >
                    {c.text}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      <style>{`
        @keyframes chalkIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); filter: blur(2px); }
          to { opacity: 1; transform: none; filter: none; }
        }
        @keyframes fruitPop {
          from { opacity: 0; transform: scale(0.4) translateY(12px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes chalkDot {
          0%, 100% { opacity: 0.35; transform: translate(0,0); }
          50% { opacity: 1; transform: translate(18px, 10px); }
        }
      `}</style>
    </div>
  );
}

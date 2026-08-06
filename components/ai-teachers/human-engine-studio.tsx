"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type {
  HumanFrameSample,
  HumanPerformancePlan,
  ScreenElement,
} from "@/types/human-engine";
import {
  createLocalPhotorealAdapter,
  gestureToClassroomPose,
  playPlan,
} from "@/lib/human-engine";

type Props = {
  sara: HumanPerformancePlan;
  ali: HumanPerformancePlan;
  /** When true, auto-starts after mount. */
  autoStart?: boolean;
  modeLabel?: string;
};

const ACT_AR: Record<string, string> = {
  greet_hook: "ترحيب",
  explain_concept: "شرح",
  point_content: "إشارة للمحتوى",
  write_board: "كتابة",
  write_law: "كتابة قانون",
  draw_diagram: "رسم",
  run_experiment: "تجربة",
  show_model: "عرض نموذج",
  hold_model: "إمساك نموذج",
  rotate_model: "تدوير نموذج",
  zoom_in_model: "تكبير",
  zoom_out_model: "تصغير",
  count_sequence: "عدّ",
  ask_check: "سؤال",
  celebrate: "تشجيع",
};

export function HumanEngineStudio({
  sara,
  ali,
  autoStart = true,
  modeLabel = "استوديو بشري حي",
}: Props) {
  const [teacher, setTeacher] = useState<"sara" | "ali">("sara");
  const [entered, setEntered] = useState(false);
  const plan = teacher === "ali" ? ali : sara;
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [done, setDone] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioRef = useRef<string>("");

  const pose = frame ? gestureToClassroomPose(frame.gesture) : "stand";
  const assetRoot = plan.character.appearance.photorealAssetRoot;
  const src = `${assetRoot}/classroom/${pose}.png`;
  const duration = plan.timeline.durationMs;

  const stageGrade = useMemo(() => gradeFromFrame(frame), [frame]);
  const cam = useMemo(() => cameraFromFrame(frame), [frame]);

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    lastAudioRef.current = "";
    setPlaying(false);
  }

  function start() {
    stop();
    setDone(false);
    setEntered(true);
    setPlaying(true);
    setTMs(0);
    const adapter = createLocalPhotorealAdapter({
      onFrame: (f) => {
        setFrame(f);
        // Soft audio cue per line (baked neural clips) — never blocks motion.
        const line = plan.speech.lines.find(
          (l) => f.tMs >= l.startMs && f.tMs < l.endMs,
        );
        if (line?.audioSrc && line.audioSrc !== lastAudioRef.current) {
          lastAudioRef.current = line.audioSrc;
          const a = audioRef.current ?? new Audio();
          audioRef.current = a;
          a.src = line.audioSrc;
          void a.play().catch(() => undefined);
        }
      },
    });
    const handle = playPlan(plan, adapter, {
      durationMs: duration,
      onTick: (t) => {
        setTMs(t);
        if (t >= duration) {
          setDone(true);
          setPlaying(false);
        }
      },
    });
    stopRef.current = handle.stop;
  }

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (!autoStart || !entered) return;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher, plan.planId, entered]);

  const walkShift =
    frame?.locomotion === "walk_in" || frame?.locomotion?.startsWith("step_")
      ? Math.sin((tMs / 280) * Math.PI) * 10
      : 0;

  if (!entered) {
    return (
      <main style={styles.gate}>
        <div style={styles.gateAtmosphere} aria-hidden />
        <div style={styles.gateContent}>
          <p style={styles.brand}>SUCCESS OS</p>
          <h1 style={styles.gateTitle}>{plan.character.displayName.ar}</h1>
          <p style={styles.gateSub}>
            استوديو تعليمي عالمي — أداء يُولَّد من معنى كل جملة في الدرس، لا من
            حركات محفوظة.
          </p>
          <div style={styles.gateActions}>
            <button
              type="button"
              style={styles.cta}
              onClick={() => {
                setTeacher("sara");
                setEntered(true);
              }}
            >
              ادخل مع سارة
            </button>
            <button
              type="button"
              style={styles.ctaGhost}
              onClick={() => {
                setTeacher("ali");
                setEntered(true);
              }}
            >
              ادخل مع علي
            </button>
          </div>
        </div>
        <img
          src="/media/ai-teachers/sara/classroom/stand.png"
          alt=""
          style={styles.gateHero}
        />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={{ ...styles.stage, ...stageGrade.stage }}>
        <div
          style={{
            ...styles.cameraRig,
            transform: cam.transform,
            filter: stageGrade.filter,
          }}
        >
          <div style={styles.ledWall} aria-hidden />
          <ScreenPlane element={frame?.screen ?? null} tMs={tMs} />
          <img
            src={src}
            alt={plan.character.displayName.ar}
            style={{
              ...styles.teacher,
              transform: `translate(${walkShift + (frame?.head.yaw || 0) * 0.35}px, ${Math.sin(tMs / 900) * 2.5}px) rotate(${(frame?.head.roll || 0) * 0.4}deg)`,
            }}
          />
          <div
            aria-hidden
            style={{
              ...styles.mouth,
              opacity: 0.2 + (frame?.jawOpen || 0) * 0.6,
              height: 5 + (frame?.jawOpen || 0) * 24,
            }}
          />
        </div>

        <header style={styles.topBar}>
          <div>
            <div style={styles.brandTiny}>SUCCESS OS · {modeLabel}</div>
            <div style={styles.castName}>{plan.character.displayName.ar}</div>
          </div>
          <div style={styles.topActions}>
            <button
              type="button"
              style={{ ...styles.miniBtn, ...(teacher === "sara" ? styles.miniOn : null) }}
              onClick={() => setTeacher("sara")}
            >
              سارة
            </button>
            <button
              type="button"
              style={{ ...styles.miniBtn, ...(teacher === "ali" ? styles.miniOn : null) }}
              onClick={() => setTeacher("ali")}
            >
              علي
            </button>
            <button type="button" style={styles.miniBtn} onClick={start} disabled={playing}>
              أعد
            </button>
            <Link href="/ai-teacher-preview" style={styles.miniLink}>
              التقدم
            </Link>
          </div>
        </header>

        <footer style={styles.caption}>
          <div style={styles.actChip}>
            {ACT_AR[frame?.contentAct || ""] || frame?.contentAct || "—"}
            {" · "}
            {frame?.gesture || "—"}
            {" · "}
            {frame?.camera || "—"}
          </div>
          <p style={styles.line}>{frame?.lineText || (done ? "انتهى المشهد — جاهزون للمرحلة التالية." : "…")}</p>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${Math.min(100, (tMs / Math.max(1, duration)) * 100)}%`,
              }}
            />
          </div>
        </footer>
      </div>
    </main>
  );
}

function ScreenPlane({ element, tMs }: { element: ScreenElement | null; tMs: number }) {
  if (!element) {
    return <div style={styles.boardEmpty} aria-hidden />;
  }
  const { transform } = element;
  const spin =
    element.kind === "model_3d"
      ? transform.rotateY + (tMs / 40) * (element.emphasis > 0.9 ? 0.35 : 0.08)
      : transform.rotateY;

  return (
    <div style={styles.board}>
      <div
        style={{
          ...styles.screenEl,
          left: `${transform.x * 100}%`,
          top: `${transform.y * 100}%`,
          transform: `translate(-50%, -50%) scale(${transform.scale}) rotateY(${spin}deg)`,
          opacity: 0.55 + element.emphasis * 0.45,
        }}
      >
        {element.kind === "model_3d" ? (
          <div style={styles.model3d}>
            <div style={styles.modelFace}>{element.label}</div>
            <div style={{ ...styles.modelFace, ...styles.modelSide }} />
          </div>
        ) : element.kind === "experiment" ? (
          <div style={styles.experiment}>
            <div
              style={{
                ...styles.beaker,
                background:
                  element.experimentPhase === "active"
                    ? "linear-gradient(180deg,#7ec8ff,#2a6f9a)"
                    : "linear-gradient(180deg,#c9d7e4,#6a8499)",
              }}
            />
            <span>{element.label}</span>
          </div>
        ) : element.kind === "diagram" ? (
          <svg width="160" height="90" viewBox="0 0 160 90" style={{ overflow: "visible" }}>
            <path
              d="M10,70 C40,10 70,80 100,30 S140,20 150,55"
              fill="none"
              stroke="#f2e6c8"
              strokeWidth="3"
              strokeDasharray="220"
              strokeDashoffset={220 * (1 - (element.strokeProgress ?? 1))}
              strokeLinecap="round"
            />
            <text x="12" y="16" fill="#f2e6c8" fontSize="12" fontWeight="700">
              {element.label}
            </text>
          </svg>
        ) : (
          <div style={styles.textEl}>
            <div style={styles.elKind}>{element.kind}</div>
            <div style={styles.elLabel}>{element.label}</div>
            {element.detail ? <div style={styles.elDetail}>{element.detail}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function gradeFromFrame(frame: HumanFrameSample | null): {
  filter: string;
  stage: CSSProperties;
} {
  const lighting = frame?.lighting || "soft_classroom";
  const map: Record<string, string> = {
    soft_classroom: "contrast(1.03) saturate(1.06)",
    key_fill_rim: "contrast(1.08) saturate(1.1)",
    warm_encourage: "saturate(1.12) brightness(1.04)",
    cool_focus: "saturate(0.94) contrast(1.1)",
    board_accent: "contrast(1.12)",
    closeup_beauty: "contrast(1.07) saturate(1.08) brightness(1.03)",
    model_spotlight: "contrast(1.14) saturate(1.05) brightness(1.02)",
    experiment_practical: "contrast(1.1) saturate(1.08)",
  };
  const bg =
    lighting === "warm_encourage"
      ? "radial-gradient(ellipse at 35% 30%, rgba(255,186,120,0.28), transparent 55%), linear-gradient(165deg,#1c2a38 0%,#3a4550 45%,#1a222c 100%)"
      : lighting === "cool_focus" || lighting === "model_spotlight"
        ? "radial-gradient(ellipse at 55% 35%, rgba(120,170,210,0.25), transparent 60%), linear-gradient(165deg,#15202c 0%,#2c3a48 50%,#121820 100%)"
        : "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.1), transparent 50%), linear-gradient(165deg,#243140 0%,#4a5560 42%,#1e2832 100%)";
  return {
    filter: map[lighting] || "none",
    stage: { background: bg },
  };
}

function cameraFromFrame(frame: HumanFrameSample | null): { transform: string } {
  const shot = frame?.camera || "medium_teacher";
  if (shot === "close_face") return { transform: "scale(1.32) translateY(6%)" };
  if (shot === "wide_establishing") return { transform: "scale(0.92) translateY(-2%)" };
  if (shot === "board_insert") return { transform: "scale(1.08) translate(10%, -4%)" };
  if (shot === "over_shoulder_board") return { transform: "scale(1.1) translate(8%, 0%)" };
  if (shot === "prop_orbit") return { transform: "scale(1.14) translate(-4%, -2%)" };
  return { transform: "scale(1.08)" };
}

const styles: Record<string, CSSProperties> = {
  gate: {
    minHeight: "100vh",
    margin: 0,
    position: "relative",
    overflow: "hidden",
    color: "#f4f1ea",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    direction: "rtl",
    background: "linear-gradient(135deg, #15202b 0%, #2a3540 40%, #1a222c 100%)",
  },
  gateAtmosphere: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(ellipse at 70% 40%, rgba(255,200,140,0.16), transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(120,160,190,0.18), transparent 45%)",
    pointerEvents: "none",
  },
  gateContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: 560,
    padding: "min(12vh, 96px) 28px 40px",
  },
  brand: {
    margin: 0,
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    letterSpacing: "0.22em",
    fontSize: 13,
    fontWeight: 650,
  },
  gateTitle: {
    margin: "14px 0 12px",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: "clamp(2.4rem, 6vw, 4rem)",
    fontWeight: 650,
    lineHeight: 1.05,
  },
  gateSub: {
    margin: 0,
    maxWidth: 420,
    lineHeight: 1.7,
    fontSize: 16,
    color: "rgba(244,241,234,0.88)",
  },
  gateActions: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 },
  cta: {
    border: "none",
    background: "#f0e4d0",
    color: "#1a222c",
    padding: "14px 22px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    borderRadius: 2,
  },
  ctaGhost: {
    border: "1px solid rgba(240,228,208,0.55)",
    background: "transparent",
    color: "#f0e4d0",
    padding: "14px 22px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    borderRadius: 2,
  },
  gateHero: {
    position: "absolute",
    right: "max(-4%, 0px)",
    bottom: 0,
    height: "92vh",
    width: "auto",
    maxWidth: "58vw",
    objectFit: "contain",
    objectPosition: "bottom right",
    zIndex: 1,
    maskImage: "linear-gradient(90deg, transparent 0%, black 18%)",
  },
  page: {
    minHeight: "100vh",
    margin: 0,
    background: "#0f141a",
    color: "#f4f1ea",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    direction: "rtl",
  },
  stage: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
  },
  cameraRig: {
    position: "absolute",
    inset: 0,
    transition: "transform 480ms cubic-bezier(.22,.61,.36,1), filter 480ms ease",
    transformOrigin: "50% 60%",
  },
  ledWall: {
    position: "absolute",
    inset: "6% 4% 28% 38%",
    background:
      "linear-gradient(160deg, rgba(30,48,64,0.95), rgba(18,28,38,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 0 40px rgba(0,0,0,0.35)",
  },
  board: {
    position: "absolute",
    inset: "8% 6% 30% 40%",
    overflow: "hidden",
  },
  boardEmpty: {
    position: "absolute",
    inset: "8% 6% 30% 40%",
    background: "rgba(255,255,255,0.03)",
  },
  screenEl: {
    position: "absolute",
    transition: "transform 420ms ease, opacity 320ms ease",
    transformStyle: "preserve-3d",
  },
  textEl: {
    minWidth: 140,
    padding: "10px 14px",
    background: "rgba(10,16,24,0.72)",
    border: "1px solid rgba(242,230,200,0.35)",
    color: "#f2e6c8",
  },
  elKind: {
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: 0.7,
    marginBottom: 4,
  },
  elLabel: { fontWeight: 800, fontSize: 22, lineHeight: 1.2 },
  elDetail: { marginTop: 6, fontSize: 12, opacity: 0.85, maxWidth: 200 },
  model3d: {
    width: 110,
    height: 110,
    position: "relative",
    transformStyle: "preserve-3d",
  },
  modelFace: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(145deg,#8eb7d4,#3d6f92)",
    border: "1px solid rgba(255,255,255,0.35)",
    fontWeight: 800,
    fontSize: 13,
    textAlign: "center",
    padding: 8,
  },
  modelSide: {
    transform: "rotateY(70deg) translateZ(20px)",
    background: "linear-gradient(145deg,#6a94b0,#2a516c)",
    opacity: 0.85,
  },
  experiment: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    color: "#e8f2fa",
    fontWeight: 700,
  },
  beaker: {
    width: 54,
    height: 72,
    clipPath: "polygon(18% 0, 82% 0, 92% 100%, 8% 100%)",
    border: "1px solid rgba(255,255,255,0.4)",
    transition: "background 400ms ease",
  },
  teacher: {
    position: "absolute",
    left: "2%",
    bottom: 0,
    height: "92%",
    width: "auto",
    maxWidth: "52%",
    objectFit: "contain",
    objectPosition: "bottom left",
    transition: "transform 90ms linear",
    userSelect: "none",
    pointerEvents: "none",
    filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.35))",
  },
  mouth: {
    position: "absolute",
    left: "22%",
    bottom: "22%",
    width: 32,
    borderRadius: 18,
    background: "rgba(40,18,18,0.55)",
    pointerEvents: "none",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 18px",
    background: "linear-gradient(180deg, rgba(10,14,20,0.72), transparent)",
  },
  brandTiny: {
    fontSize: 11,
    letterSpacing: "0.14em",
    opacity: 0.85,
  },
  castName: {
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: 20,
    fontWeight: 650,
  },
  topActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  miniBtn: {
    border: "1px solid rgba(244,241,234,0.35)",
    background: "rgba(0,0,0,0.25)",
    color: "#f4f1ea",
    padding: "7px 12px",
    cursor: "pointer",
    borderRadius: 2,
    fontWeight: 650,
  },
  miniOn: { background: "#f0e4d0", color: "#1a222c", borderColor: "#f0e4d0" },
  miniLink: { color: "#d7e6f5", fontWeight: 650, fontSize: 13 },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    padding: "18px 20px 22px",
    background: "linear-gradient(0deg, rgba(10,14,20,0.88), transparent)",
  },
  actChip: {
    display: "inline-block",
    fontSize: 12,
    letterSpacing: "0.04em",
    opacity: 0.85,
    marginBottom: 6,
  },
  line: {
    margin: "0 0 10px",
    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
    lineHeight: 1.55,
    fontWeight: 650,
    maxWidth: 820,
    minHeight: 48,
  },
  barTrack: {
    height: 3,
    background: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#f0e4d0",
    transition: "width 80ms linear",
  },
};

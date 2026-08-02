"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { HumanFrameSample, HumanPerformancePlan } from "@/types/human-engine";
import {
  createLocalPhotorealAdapter,
  gestureToClassroomPose,
  playPlan,
} from "@/lib/human-engine";

type Props = {
  sara: HumanPerformancePlan;
  ali: HumanPerformancePlan;
};

const CAM_LABEL: Record<string, string> = {
  wide_establishing: "Wide",
  medium_teacher: "Medium",
  close_face: "Close",
  over_shoulder_board: "OS Board",
  board_insert: "Board",
  two_shot: "Two-shot",
};

export function HumanEnginePreview({ sara, ali }: Props) {
  const [teacher, setTeacher] = useState<"sara" | "ali">("sara");
  const plan = teacher === "ali" ? ali : sara;
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [done, setDone] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const stopRef = useRef<null | (() => void)>(null);

  const pose = frame ? gestureToClassroomPose(frame.gesture) : "stand";
  const assetRoot = plan.character.appearance.photorealAssetRoot;
  const src = `${assetRoot}/classroom/${pose}.png`;

  const grade = useMemo(() => {
    if (!frame) return { filter: "none", bg: "transparent" };
    const map: Record<string, string> = {
      soft_classroom: "contrast(1.02) saturate(1.05)",
      key_fill_rim: "contrast(1.08) saturate(1.08)",
      warm_encourage: "sepia(0.12) saturate(1.15) brightness(1.04)",
      cool_focus: "saturate(0.92) contrast(1.1) hue-rotate(8deg)",
      board_accent: "contrast(1.12) brightness(1.02)",
      closeup_beauty: "contrast(1.06) saturate(1.1) brightness(1.03)",
    };
    return {
      filter: map[frame.lighting] || "none",
      bg:
        frame.lighting === "warm_encourage"
          ? "radial-gradient(ellipse at 40% 30%, rgba(255,200,140,0.22), transparent 55%)"
          : frame.lighting === "cool_focus"
            ? "radial-gradient(ellipse at 50% 40%, rgba(140,180,220,0.18), transparent 60%)"
            : "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.08), transparent 55%)",
    };
  }, [frame]);

  const camScale =
    frame?.camera === "close_face"
      ? 1.28
      : frame?.camera === "wide_establishing"
        ? 0.92
        : frame?.camera === "board_insert"
          ? 1.05
          : 1.12;

  const camX =
    frame?.camera === "over_shoulder_board" || frame?.camera === "board_insert"
      ? "-8%"
      : frame?.gaze === "board"
        ? "-4%"
        : "0%";

  function stop() {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
  }

  function start() {
    stop();
    setDone(false);
    setPlaying(true);
    setTMs(0);
    const adapter = createLocalPhotorealAdapter({
      onFrame: (f) => setFrame(f),
    });
    const handle = playPlan(plan, adapter, {
      durationMs: 10000,
      onTick: (t) => {
        setTMs(t);
        if (t >= 10000) {
          setDone(true);
          setPlaying(false);
        }
      },
    });
    stopRef.current = handle.stop;
  }

  useEffect(() => () => stop(), []);

  useEffect(() => {
    // Auto-start 10s preview when teacher changes
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher, plan.planId]);

  const jaw = frame?.jawOpen ?? 0;
  const blink = frame?.mouthShapes.eyeBlinkLeft ?? 0;

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <p style={styles.kicker}>Human Engine · Phase 2</p>
        <h1 style={styles.title}>معاينة 10 ثوانٍ — سارة وعلي</h1>
        <p style={styles.sub}>
          محرّك بشري مستقل عن استوديو Three.js. الخطة تولَّد من محتوى الدرس
          (هيكل، وجه، phonemes، نظرة، رأس، عاطفة، إيماء، سلوك، كاميرا، إضاءة،
          تايملاين) عبر Lesson Director — جاهزة لـ MetaHuman لاحقاً.
        </p>
        <div style={styles.actions}>
          <button
            type="button"
            style={{ ...styles.btn, ...(teacher === "sara" ? styles.btnOn : null) }}
            onClick={() => setTeacher("sara")}
          >
            سارة
          </button>
          <button
            type="button"
            style={{ ...styles.btn, ...(teacher === "ali" ? styles.btnOn : null) }}
            onClick={() => setTeacher("ali")}
          >
            علي
          </button>
          <button type="button" style={styles.btnGhost} onClick={start} disabled={playing}>
            إعادة 10ث
          </button>
          <Link href="/ai-teacher-preview" style={styles.link}>
            تقرير التقدم
          </Link>
        </div>
      </header>

      <section style={styles.stageWrap}>
        <div
          style={{
            ...styles.stage,
            backgroundImage: grade.bg,
          }}
        >
          <div
            style={{
              ...styles.camera,
              transform: `translateX(${camX}) scale(${camScale})`,
              filter: grade.filter,
            }}
          >
            <img
              ref={imgRef}
              src={src}
              alt={plan.character.displayName.ar}
              style={{
                ...styles.teacher,
                transform: `translateY(${Math.sin((tMs / 1000) * Math.PI) * 3}px) rotate(${frame?.head.roll || 0}deg)`,
              }}
            />
            {/* Phoneme mouth overlay energy */}
            <div
              aria-hidden
              style={{
                ...styles.mouth,
                opacity: 0.25 + jaw * 0.55,
                height: 6 + jaw * 22,
                transform: `translate(-50%, ${8 - (frame?.head.pitch || 0)}px) scaleX(${1 + jaw * 0.15})`,
              }}
            />
            {blink > 0.5 ? <div aria-hidden style={styles.blink} /> : null}
          </div>

          <aside style={styles.hud}>
            <HudRow label="t" value={`${(tMs / 1000).toFixed(1)}s / 10s`} />
            <HudRow label="gesture" value={frame?.gesture || "—"} />
            <HudRow label="phoneme" value={frame?.phoneme || "sil"} />
            <HudRow label="emotion" value={`${frame?.emotion || "—"} ${(frame?.emotionIntensity || 0).toFixed(2)}`} />
            <HudRow label="gaze" value={frame?.gaze || "—"} />
            <HudRow label="camera" value={CAM_LABEL[frame?.camera || ""] || frame?.camera || "—"} />
            <HudRow label="light" value={frame?.lighting || "—"} />
            <HudRow label="behaviour" value={frame?.behaviourGoal || "—"} />
            <HudRow label="adapter" value={`${plan.adapter.id} · ${plan.adapter.status}`} />
          </aside>
        </div>

        <p style={styles.line}>{frame?.lineText || (done ? "انتهت المعاينة — بانتظار المرحلة التالية." : "…")}</p>
        <div style={styles.barTrack}>
          <div style={{ ...styles.barFill, width: `${Math.min(100, (tMs / 10000) * 100)}%` }} />
        </div>
        {done ? (
          <p style={styles.wait}>
            Human Engine جاهز كطبقة مستقلة. المرحلة التالية: ربط MetaHuman الحقيقي
            على نفس الخطة — بدون إعادة كتابة المنصّة.
          </p>
        ) : null}
      </section>
    </main>
  );
}

function HudRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.hudRow}>
      <span style={styles.hudLabel}>{label}</span>
      <span style={styles.hudVal}>{value}</span>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "28px 20px 48px",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    color: "#1a222c",
    background:
      "linear-gradient(165deg, #dfe8f2 0%, #f3efe8 42%, #e7eef5 100%)",
    direction: "rtl",
  },
  header: { maxWidth: 980, margin: "0 auto 18px" },
  kicker: {
    margin: 0,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontSize: 12,
    color: "#4a5d73",
  },
  title: {
    margin: "8px 0 10px",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: "clamp(1.6rem, 3vw, 2.35rem)",
    fontWeight: 650,
    lineHeight: 1.2,
  },
  sub: { margin: 0, maxWidth: 720, lineHeight: 1.65, color: "#334155", fontSize: 15 },
  actions: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 },
  btn: {
    border: "1px solid #2c3e50",
    background: "transparent",
    color: "#1a222c",
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
  },
  btnOn: { background: "#1a222c", color: "#f5f1ea" },
  btnGhost: {
    border: "1px solid #7a8694",
    background: "rgba(255,255,255,0.45)",
    color: "#1a222c",
    padding: "8px 16px",
    borderRadius: 4,
    cursor: "pointer",
  },
  link: {
    alignSelf: "center",
    color: "#1d4f7a",
    fontWeight: 600,
    textDecoration: "underline",
  },
  stageWrap: { maxWidth: 980, margin: "0 auto" },
  stage: {
    position: "relative",
    height: "min(62vh, 560px)",
    borderRadius: 6,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, #8fa9c0 0%, #c9b7a0 48%, #6f8496 100%)",
    boxShadow: "0 18px 40px rgba(30,40,55,0.18)",
  },
  camera: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "end center",
    transition: "transform 420ms ease, filter 420ms ease",
    paddingBottom: 0,
  },
  teacher: {
    height: "96%",
    width: "auto",
    maxWidth: "100%",
    objectFit: "contain",
    objectPosition: "bottom center",
    transition: "transform 80ms linear",
    userSelect: "none",
    pointerEvents: "none",
  },
  mouth: {
    position: "absolute",
    left: "50%",
    bottom: "18%",
    width: 34,
    borderRadius: 20,
    background: "rgba(40,20,20,0.55)",
    pointerEvents: "none",
  },
  blink: {
    position: "absolute",
    left: "42%",
    top: "22%",
    width: "16%",
    height: 6,
    background: "rgba(20,20,30,0.35)",
    borderRadius: 4,
  },
  hud: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 210,
    padding: "10px 12px",
    background: "rgba(12,18,28,0.72)",
    color: "#e8eef6",
    fontSize: 11,
    lineHeight: 1.45,
    borderRadius: 4,
    backdropFilter: "blur(6px)",
    direction: "ltr",
    textAlign: "left",
  },
  hudRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  hudLabel: { opacity: 0.65 },
  hudVal: { fontWeight: 600, textAlign: "right", wordBreak: "break-all" },
  line: {
    margin: "14px 0 8px",
    minHeight: 48,
    fontSize: 17,
    lineHeight: 1.55,
    color: "#1a222c",
  },
  barTrack: {
    height: 4,
    background: "rgba(30,40,55,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#1a222c",
    transition: "width 80ms linear",
  },
  wait: {
    marginTop: 16,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.55)",
    borderRight: "3px solid #1d4f7a",
    lineHeight: 1.6,
  },
};

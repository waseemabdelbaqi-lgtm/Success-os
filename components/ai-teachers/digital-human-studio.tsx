"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { StudioLessonPlan, StudioScene } from "@/types/digital-human-studio";
import { AliveTeacherStage, type ClassroomPose } from "@/components/ai-teachers/alive-teacher-stage";

type Props = {
  plan: StudioLessonPlan;
  autoStart?: boolean;
};

function mapPose(scene: StudioScene, progress: number): ClassroomPose {
  const beat = [...scene.behaviors].reverse().find((b) => progress >= b.at) || scene.behaviors[0];
  const p = beat?.pose;
  if (p === "write" || p === "hold_tool") return "write";
  if (p === "point" || p === "manipulate_model" || p === "turn_to_board") return "point";
  return "stand";
}

function cameraStyle(camera: StudioScene["camera"]): CSSProperties {
  switch (camera) {
    case "close_face":
      return { transform: "scale(1.18)", transformOrigin: "50% 30%" };
    case "over_shoulder_board":
      return { transform: "scale(1.06) translateX(-3%)", transformOrigin: "70% 40%" };
    case "board_insert":
      return { transform: "scale(1.02)", transformOrigin: "80% 50%" };
    case "model_orbit":
      return { transform: "scale(1.08) translateX(2%)", transformOrigin: "40% 45%" };
    case "wide_establishing":
      return { transform: "scale(0.96)" };
    default:
      return { transform: "scale(1)" };
  }
}

function lightOverlay(light: StudioScene["lighting"]): string {
  switch (light) {
    case "warm_encourage":
      return "radial-gradient(circle at 40% 20%, rgba(255,200,120,0.28), transparent 55%)";
    case "cool_precision":
      return "radial-gradient(circle at 60% 30%, rgba(120,180,255,0.22), transparent 50%)";
    case "focus_spot":
      return "radial-gradient(circle at 45% 35%, rgba(255,255,255,0.2), transparent 40%)";
    case "soft_daylight":
      return "radial-gradient(circle at 30% 10%, rgba(255,248,220,0.18), transparent 50%)";
    default:
      return "radial-gradient(circle at 50% 20%, rgba(255,220,160,0.16), transparent 55%)";
  }
}

export function DigitalHumanStudio({ plan, autoStart = true }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0.08);
  const [speaking, setSpeaking] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("");
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("استوديو جاهز");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const scene = plan.scenes[sceneIndex] ?? plan.scenes[0]!;
  const teacherId = plan.cast.id === "ali" ? "ali" : "sara";
  const pose = mapPose(scene, progress);

  const boardItems = useMemo(
    () => scene.board.filter((c) => progress >= c.at),
    [scene.board, progress],
  );
  const visibleProps = useMemo(
    () => scene.props.filter((p) => progress >= p.appearAt).slice(0, plan.performance.maxConcurrentProps),
    [scene.props, progress, plan.performance.maxConcurrentProps],
  );

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setMouthEnergy(0);
  }, []);

  const playScene = useCallback(
    (index: number) => {
      const s = plan.scenes[index];
      if (!s) return;
      stop();
      setSceneIndex(index);
      setStarted(true);
      setCaption(s.teacherSay);
      setStatus(`${s.purpose} · ${s.camera}`);
      setProgress(0.08);
      setSpeaking(true);

      const audioKey = s.audioKey;
      const approxMs = Math.max(3500, s.durationHintSec * 1000);
      const startedAt = performance.now();

      const tick = () => {
        timerRef.current = window.setInterval(() => {
          const p = Math.min(1, (performance.now() - startedAt) / approxMs);
          setProgress(0.08 + p * 0.9);
          setMouthEnergy(0.2 + 0.75 * Math.abs(Math.sin(performance.now() / 85)));
          if (p >= 1) {
            stop();
            setProgress(1);
            setStatus("مشهد مكتمل");
            if (index < plan.scenes.length - 1) {
              window.setTimeout(() => playScene(index + 1), 700);
            }
          }
        }, 40);
      };

      if (audioKey) {
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = `${plan.cast.assetRoot}/audio/${audioKey}.mp3`;
        void audio
          .play()
          .then(() => {
            const dur = (audio.duration || s.durationHintSec) * 1000;
            timerRef.current = window.setInterval(() => {
              const p = Math.min(1, audio.currentTime / Math.max(0.1, audio.duration || s.durationHintSec));
              setProgress(0.08 + p * 0.9);
              setMouthEnergy(0.18 + 0.8 * Math.abs(Math.sin(performance.now() / 80)));
            }, 40);
            audio.onended = () => {
              stop();
              setProgress(1);
              if (index < plan.scenes.length - 1) {
                window.setTimeout(() => playScene(index + 1), 700);
              }
            };
          })
          .catch(() => tick());
      } else {
        tick();
      }
    },
    [plan.cast.assetRoot, plan.scenes, stop],
  );

  useEffect(() => {
    if (autoStart) playScene(0);
    return () => stop();
  }, [autoStart, plan.planId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#07090f",
        color: "#f3f0e7",
        fontFamily: "'Noto Kufi Arabic', 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "linear-gradient(90deg,#121826,#0b101a)",
          borderBottom: "1px solid rgba(255,215,120,0.15)",
        }}
      >
        <div>
          <div style={{ color: "#ffd84a", fontWeight: 800, letterSpacing: "0.08em", fontSize: 11 }}>
            SUCCESS OS · DIGITAL HUMAN STUDIO
          </div>
          <h1 style={{ margin: "2px 0 0", fontSize: "clamp(1.1rem, 2.3vw, 1.5rem)" }}>
            {plan.cast.displayNameAr} · {plan.analysis.summaryAr}
          </h1>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, textAlign: "left" }}>
          <div>أسلوب: {plan.analysis.teachingStyle}</div>
          <div>مزود: {plan.provider.id}</div>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 40vw) 1fr",
          minHeight: "calc(100vh - 140px)",
        }}
        className="dhs-grid"
      >
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            background: "#0e1524",
            ...cameraStyle(scene.camera),
            transition: "transform 0.8s ease",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: lightOverlay(scene.lighting),
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {/* LED studio wall */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,#1a2740 0%,#101826 50%,#0a0f18 100%), repeating-linear-gradient(90deg, rgba(80,140,255,0.04) 0 2px, transparent 2px 6px)",
              zIndex: 0,
            }}
          />
          <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
            <AliveTeacherStage
              teacherId={teacherId}
              speaking={speaking}
              listening={false}
              celebrating={scene.purpose === "close" && progress > 0.7}
              mouthEnergy={mouthEnergy}
              pose={pose}
              nameAr={plan.cast.displayNameAr}
              gender={plan.cast.gender}
            />
          </div>
        </section>

        <section style={{ position: "relative", background: "#0a1210", minHeight: 480 }}>
          {/* Smart LED board */}
          <div
            style={{
              position: "absolute",
              inset: 18,
              borderRadius: 18,
              background:
                "linear-gradient(160deg,#0b3d38 0%,#0a2f2c 45%,#071f1d 100%)",
              border: "3px solid #1f6f66",
              boxShadow: "0 0 40px rgba(40,180,160,0.18), inset 0 0 60px rgba(0,0,0,0.35)",
              padding: 22,
              overflow: "hidden",
            }}
          >
            <div style={{ color: "#9adfd6", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              SMART BOARD · {scene.camera} · {scene.lighting}
            </div>
            {boardItems.map((c, i) => (
              <div
                key={`${c.kind}-${i}`}
                style={{
                  marginBottom: 10,
                  padding: c.kind === "title" ? "10px 14px" : "8px 12px",
                  borderRadius: 12,
                  background:
                    c.kind === "equation"
                      ? "#ffe08a"
                      : c.kind === "title"
                        ? "rgba(255,255,255,0.95)"
                        : "rgba(255,255,255,0.12)",
                  color: c.kind === "equation" || c.kind === "title" ? "#142018" : "#f5f2e8",
                  fontWeight: 800,
                  fontSize: c.kind === "title" ? "1.35rem" : "1rem",
                  animation: "fadeUp 0.45s ease",
                }}
              >
                {c.content}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              {visibleProps.map((p) => (
                <div
                  key={p.id}
                  style={{
                    minWidth: 110,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))",
                    border: "1px solid rgba(255,220,120,0.35)",
                    fontWeight: 800,
                    animation: "fadeUp 0.4s ease",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.75 }}>{p.kind}</div>
                  <div>{p.label}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: "#ffd84a" }}>
                    {p.interact.join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer style={{ padding: "14px 16px 20px", background: "#0b0f16" }}>
        {!started ? (
          <button
            type="button"
            onClick={() => playScene(0)}
            style={primaryBtn}
          >
            ابدأ الاستوديو
          </button>
        ) : (
          <>
            <div style={{ fontWeight: 700, marginBottom: 8, lineHeight: 1.55 }}>{caption}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#ffd84a", fontSize: 13, fontWeight: 700 }}>
                {status} · مشهد {sceneIndex + 1}/{plan.scenes.length} · إيماءة ديناميكية
              </span>
              <button type="button" style={chip} onClick={() => playScene(Math.max(0, sceneIndex - 1))}>
                السابق
              </button>
              <button
                type="button"
                style={chip}
                onClick={() => playScene(Math.min(plan.scenes.length - 1, sceneIndex + 1))}
              >
                التالي
              </button>
              <button type="button" style={chip} onClick={() => playScene(sceneIndex)}>
                أعد المشهد
              </button>
            </div>
          </>
        )}
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (max-width: 900px) {
          .dhs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "14px 24px",
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(120deg,#ffd84a,#e0893a)",
  color: "#1a1208",
};

const chip: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 800,
  cursor: "pointer",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
};

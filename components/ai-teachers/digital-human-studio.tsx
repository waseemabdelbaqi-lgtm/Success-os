"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { StudioLessonPlan, StudioScene } from "@/types/digital-human-studio";
import {
  TeachingStudio3D,
  type Studio3DPose,
} from "@/components/ai-teachers/teaching-studio-3d";

type Props = {
  plan: StudioLessonPlan;
  autoStart?: boolean;
};

function mapPose(scene: StudioScene, progress: number): Studio3DPose {
  const beat = [...scene.behaviors].reverse().find((b) => progress >= b.at) || scene.behaviors[0];
  const p = beat?.pose;
  if (p === "write" || p === "hold_tool") return "write";
  if (p === "point" || p === "manipulate_model" || p === "turn_to_board") return "point";
  return "stand";
}

function activeBeat(scene: StudioScene, progress: number) {
  return [...scene.behaviors].reverse().find((b) => progress >= b.at) || scene.behaviors[0];
}

export function DigitalHumanStudio({ plan, autoStart = true }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0.08);
  const [speaking, setSpeaking] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("");
  const [chunk, setChunk] = useState("");
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState("AI Teaching Studio جاهز");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const scene = plan.scenes[sceneIndex] ?? plan.scenes[0]!;
  const teacherId = plan.cast.id === "ali" ? "ali" : "sara";
  const pose = mapPose(scene, progress);
  const beat = activeBeat(scene, progress);
  const focusTarget = beat?.focusTarget ?? null;

  const boardLines = useMemo(() => {
    const lines = scene.board.filter((c) => progress >= c.at).map((c) => c.content);
    return lines.length ? lines : [scene.title];
  }, [scene, progress]);

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
      setChunk(s.behaviors[0]?.sayChunk || s.teacherSay);
      setStatus(`${s.purpose} · كاميرا ${s.camera}`);
      setProgress(0.08);
      setSpeaking(true);
      setAnswer("");

      const approxMs = Math.max(3500, s.durationHintSec * 1000);
      const startedAt = performance.now();

      const drive = (getP: () => number) => {
        timerRef.current = window.setInterval(() => {
          const p = Math.min(1, getP());
          setProgress(0.08 + p * 0.9);
          setMouthEnergy(0.18 + 0.8 * Math.abs(Math.sin(performance.now() / 80)));
          const b = [...s.behaviors].reverse().find((x) => 0.08 + p * 0.9 >= x.at);
          if (b?.sayChunk) setChunk(b.sayChunk);
          if (p >= 1) {
            stop();
            setProgress(1);
            setStatus("مشهد مكتمل");
            if (index < plan.scenes.length - 1) {
              window.setTimeout(() => playScene(index + 1), 650);
            }
          }
        }, 40);
      };

      if (s.audioKey) {
        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = `${plan.cast.assetRoot}/audio/${s.audioKey}.mp3`;
        void audio
          .play()
          .then(() => {
            drive(() => audio.currentTime / Math.max(0.1, audio.duration || s.durationHintSec));
            audio.onended = () => {
              stop();
              setProgress(1);
              if (index < plan.scenes.length - 1) {
                window.setTimeout(() => playScene(index + 1), 650);
              }
            };
          })
          .catch(() => drive(() => (performance.now() - startedAt) / approxMs));
      } else {
        drive(() => (performance.now() - startedAt) / approxMs);
      }
    },
    [plan.cast.assetRoot, plan.scenes, stop],
  );

  useEffect(() => {
    if (autoStart) playScene(0);
    return () => stop();
  }, [autoStart, plan.planId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ask = async () => {
    if (!question.trim()) return;
    const res = await fetch("/api/digital-human-studio?action=adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        sceneIndex,
        event: { type: "ask_text", text: question.trim() },
      }),
    });
    const json = await res.json();
    if (json.success) {
      setAnswer(json.data.reply);
      setCaption(json.data.reply);
    }
  };

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
          background: "linear-gradient(90deg,#101826,#0b101a)",
          borderBottom: "1px solid rgba(255,215,120,0.15)",
        }}
      >
        <div>
          <div style={{ color: "#ffd84a", fontWeight: 800, letterSpacing: "0.08em", fontSize: 11 }}>
            SUCCESS OS · AI TEACHING STUDIO (3D)
          </div>
          <h1 style={{ margin: "2px 0 0", fontSize: "clamp(1.1rem, 2.3vw, 1.5rem)" }}>
            {plan.cast.displayNameAr} · {plan.analysis.summaryAr}
          </h1>
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          <div>أسلوب: {plan.analysis.teachingStyle}</div>
          <div>مشهد 3D · three.js</div>
        </div>
      </header>

      <div style={{ height: "min(72vh, 720px)", position: "relative" }}>
        <TeachingStudio3D
          teacherId={teacherId}
          pose={pose}
          speaking={speaking}
          mouthEnergy={mouthEnergy}
          camera={scene.camera}
          lighting={scene.lighting}
          props={visibleProps}
          focusTarget={focusTarget}
          boardLines={boardLines}
          celebrating={scene.purpose === "close" && progress > 0.7}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(0,0,0,0.55)",
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          تركيز: {focusTarget || "—"} · إيماءة: {beat?.gesture || "—"}
        </div>
      </div>

      <footer style={{ padding: "14px 16px 22px", background: "#0b0f16" }}>
        {!started ? (
          <button type="button" onClick={() => playScene(0)} style={primaryBtn}>
            ابدأ الاستوديو ثلاثي الأبعاد
          </button>
        ) : (
          <>
            <div style={{ fontWeight: 800, marginBottom: 4, color: "#ffd84a" }}>{chunk}</div>
            <div style={{ fontWeight: 600, marginBottom: 8, lineHeight: 1.55, opacity: 0.9 }}>
              {caption}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#9adfd6", fontSize: 13, fontWeight: 700 }}>
                {status} · {sceneIndex + 1}/{plan.scenes.length} · جملة→حركة فريدة
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

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 820 }}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="اسأل المعلم مباشرة…"
                style={{
                  flex: 1,
                  minWidth: 220,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  padding: "12px 14px",
                  fontWeight: 700,
                }}
              />
              <button type="button" onClick={ask} style={primaryBtn}>
                اسأل
              </button>
            </div>
            {answer && (
              <div style={{ marginTop: 10, color: "#ffe08a", fontWeight: 700 }}>{answer}</div>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "12px 20px",
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type {
  HumanFrameSample,
  HumanPerformancePlan,
} from "@/types/human-engine";
import type { TeacherSessionMemory } from "@/types/teacher-mind";
import {
  adaptLiveTeacher,
  buildProofLessonInput,
  createLocalPhotorealAdapter,
  createSessionMemory,
  directLesson,
  gestureToClassroomPose,
  getTeacherPersona,
  listProofLessons,
  playPlan,
  type ProofLessonId,
} from "@/lib/human-engine";
import {
  TeachingStudio3D,
  type Studio3DPose,
} from "@/components/ai-teachers/teaching-studio-3d";

type TeacherId = "sara" | "ali";

const HONESTY: Array<{
  id: string;
  label: string;
  status: "works" | "partial" | "structure";
  detail: string;
}> = [
  {
    id: "two-teachers",
    label: "سارة وعلي مستقلان (شخصية/صوت/إيماء/أسلوب)",
    status: "works",
    detail: "persona + neural MP3 مختلفة + gesture/emotion bias مختلف",
  },
  {
    id: "studio-3d",
    label: "استوديو Three.js حقيقي (غرفة/سبورة/كاميرا/إضاءة/ظلال)",
    status: "works",
    detail: "TeachingStudio3D (R3F) يعمل داخل هذه الصفحة",
  },
  {
    id: "he-drive",
    label: "Human Engine يقود الحركة/الكاميرا/الشاشة من معنى الجملة",
    status: "works",
    detail: "sampleFrame → pose/walk/look/camera/light/board/props",
  },
  {
    id: "lesson-60",
    label: "درس حقيقي ≥ 60 ثانية",
    status: "works",
    detail: "proof-lessons durationMs ≥ 65000 مع كتابة/رسم/نموذج/سؤال",
  },
  {
    id: "qa",
    label: "سؤال طالب + إعادة شرح أثناء الدرس",
    status: "works",
    detail: "Teacher Mind BT + session memory → رد + microPlan بدون تكرار الاستراتيجية",
  },
  {
    id: "teacher-mind",
    label: "Teacher Mind: Behaviour Tree + ملفات شخصية قابلة للتحرير",
    status: "works",
    detail: "/admin/ai-teachers · content/ai-teachers/profiles · ذاكرة جلسة سياقية",
  },
  {
    id: "skinned",
    label: "معلم skinned GLB كامل (هيكل Mixamo + أصابع + عيون)",
    status: "works",
    detail: "teacher.glb لسارة/علي — لا billboard PNG في الاستوديو 3D",
  },
  {
    id: "face-morphs",
    label: "Facial morph targets (jaw/smile/blink/brow) من Human Engine",
    status: "works",
    detail: "15 ARKit-named morphs على TeacherFace تُساق من phoneme/emotion",
  },
  {
    id: "walk",
    label: "مشي هيكلي (أرجل) + انتقالات موقع من locomotion",
    status: "works",
    detail: "دورة أرجل من HE locomotion + إزاحة walkOffset",
  },
  {
    id: "lipsync-pro",
    label: "Lip-sync phoneme→morph على الشبكة الحية",
    status: "works",
    detail: "jawOpen/mouth* morphs من مسار phoneme — ليس فيديو twin خارجي",
  },
  {
    id: "metahuman",
    label: "Unreal MetaHuman Pixel Streaming",
    status: "structure",
    detail: "Adapter metahuman stub — يحتاج خادم Unreal؛ WebGL humanoid هو المنتج الحي الآن",
  },
];

function walkFromFrame(frame: HumanFrameSample | null): number {
  if (!frame) return 0;
  switch (frame.locomotion) {
    case "walk_in":
      return -0.35 + Math.sin(frame.tMs / 220) * 0.08;
    case "step_to_board":
      return 0.45;
    case "step_to_prop":
      return 0.25;
    case "step_to_student":
      return -0.2;
    default:
      return 0;
  }
}

function mapCamera(shot: string): string {
  if (shot === "prop_orbit") return "prop_orbit";
  return shot || "medium_teacher";
}

export function HumanEngineProofStudio() {
  const lessons = useMemo(() => listProofLessons(), []);
  const [teacherId, setTeacherId] = useState<TeacherId>("sara");
  const [lessonId, setLessonId] = useState<ProofLessonId>("forces_law_lab");
  const [plan, setPlan] = useState<HumanPerformancePlan | null>(null);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [status, setStatus] = useState("اختر معلماً ودرساً ثم شغّل");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [done, setDone] = useState(false);
  const [memory, setMemory] = useState<TeacherSessionMemory | null>(null);
  const [mindState, setMindState] = useState("");
  const stopRef = useRef<null | (() => void)>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioRef = useRef("");
  const basePlanRef = useRef<HumanPerformancePlan | null>(null);
  const memoryRef = useRef<TeacherSessionMemory | null>(null);

  const persona = getTeacherPersona(teacherId);
  const meta = lessons.find((l) => l.id === lessonId) || lessons[0]!;

  const buildPlan = useCallback(() => {
    const input = buildProofLessonInput(lessonId, teacherId);
    return directLesson({
      input,
      adapterId: "local_photoreal_preview",
      maxDurationMs: Math.max(65000, meta.minDurationMs),
    });
  }, [lessonId, teacherId, meta.minDurationMs]);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    lastAudioRef.current = "";
    setPlaying(false);
  }, []);

  const play = useCallback(
    (nextPlan: HumanPerformancePlan, label: string) => {
      stop();
      setPlan(nextPlan);
      basePlanRef.current = nextPlan;
      setDone(false);
      setReply("");
      setPlaying(true);
      setTMs(0);
      setStatus(label);
      const adapter = createLocalPhotorealAdapter({
        onFrame: (f) => {
          setFrame(f);
          const line = nextPlan.speech.lines.find(
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
      const handle = playPlan(nextPlan, adapter, {
        durationMs: nextPlan.timeline.durationMs,
        onTick: (t) => {
          setTMs(t);
          if (t >= nextPlan.timeline.durationMs) {
            setDone(true);
            setPlaying(false);
            setStatus("انتهى الدرس — يمكنك السؤال أو إعادة التشغيل");
          }
        },
      });
      stopRef.current = handle.stop;
    },
    [stop],
  );

  const startLesson = () => {
    const mem = createSessionMemory({
      teacherId,
      lessonId,
      lessonTitle: meta.titleAr,
      subject: meta.subject || "general",
      grade: meta.grade || "g1",
    });
    memoryRef.current = mem;
    setMemory(mem);
    setMindState("hook/explain");
    const p = buildPlan();
    play(
      p,
      `تشغيل · ${persona.displayName.ar} · ${meta.titleAr} · ${(p.timeline.durationMs / 1000).toFixed(0)}ث`,
    );
  };

  const runAdapt = (event: Parameters<typeof adaptLiveTeacher>[0]["event"]) => {
    const active = basePlanRef.current || plan || buildPlan();
    const prior =
      memoryRef.current ||
      createSessionMemory({
        teacherId,
        lessonId,
        lessonTitle: meta.titleAr,
      });
    const result = adaptLiveTeacher({
      teacherId,
      lessonTitle: meta.titleAr,
      lessonId,
      currentLine: frame?.lineText || undefined,
      event,
      memory: prior,
      elapsedMs: tMs || prior.elapsedMs,
    });
    memoryRef.current = result.memory;
    setMemory(result.memory);
    setMindState(
      `${result.decision.state} · ${result.strategy} · hint=${result.contentHint}`,
    );
    setReply(result.reply);
    setStatus(
      `Teacher Mind · ${result.strategy} · strategies=${result.memory.strategiesUsed.join("→") || "—"}`,
    );
    // Play micro plan, then resume remaining base if any
    play(result.microPlan, `رد ${persona.displayName.ar}`);
    if (result.audioKey) {
      const src = `${persona.id === "ali" ? "/media/ai-teachers/ali" : "/media/ai-teachers/sara"}/audio/${result.audioKey}.mp3`;
      const a = new Audio(src);
      void a.play().catch(() => undefined);
    }
    void active;
  };

  useEffect(() => () => stop(), [stop]);

  const pose: Studio3DPose = frame ? gestureToClassroomPose(frame.gesture) : "stand";
  const boardLines = useMemo(() => {
    const lines: string[] = [meta.titleAr, persona.displayName.ar];
    if (frame?.screen?.detail) lines.push(frame.screen.detail);
    if (frame?.lineText) lines.push(frame.lineText);
    return lines.filter(Boolean);
  }, [frame, meta.titleAr, persona.displayName.ar]);

  const studioProps = useMemo(() => {
    if (!frame?.screen) return [];
    if (frame.screen.kind === "law" || frame.screen.kind === "equation") {
      return [
        {
          id: frame.screen.id,
          kind: frame.screen.kind,
          label: frame.screen.label,
          focused: true,
        },
      ];
    }
    return [];
  }, [frame]);

  const duration = plan?.timeline.durationMs || meta.minDurationMs;

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>SUCCESS OS · HUMANOID DEMO</div>
          <h1 style={styles.title}>سارة وعلي — معلمون رقميون skinned داخل استوديو 3D</h1>
          <p style={styles.sub}>
            شبكة كاملة (هيكل Mixamo + أصابع + morphs وجه) تُساق من Human Engine حسب
            معنى الدرس — بدون billboard. اختر معلماً ودرساً، شغّل ≥ دقيقة، واسأل أثناء الشرح.
          </p>
        </div>
        <Link href="/ai-teacher-preview" style={styles.link}>
          تقرير التقدم
        </Link>
      </header>

      <section style={styles.controls}>
        <label style={styles.field}>
          <span>المعلم</span>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value as TeacherId)}
            style={styles.select}
            disabled={playing}
          >
            <option value="sara">سارة — دافئة · SanaNeural</option>
            <option value="ali">علي — دقيق · TaimNeural</option>
          </select>
        </label>
        <label style={styles.field}>
          <span>الدرس</span>
          <select
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value as ProofLessonId)}
            style={styles.select}
            disabled={playing}
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titleAr} (≥{Math.round(l.minDurationMs / 1000)}ث)
              </option>
            ))}
          </select>
        </label>
        <button type="button" style={styles.primary} onClick={startLesson} disabled={playing}>
          تشغيل الدرس
        </button>
        <button type="button" style={styles.ghost} onClick={stop} disabled={!playing}>
          إيقاف
        </button>
      </section>

      <div style={styles.personaRow}>
        <div style={styles.personaCard}>
          <strong>{persona.displayName.ar}</strong>
          <div>الصوت: {persona.voiceId}</div>
          <div>الأسلوب: {persona.style === "warm" ? "دافئ وتشجيعي" : "دقيق وتعريفي"}</div>
          <div>إعادة الشرح: {persona.interaction.reexplainStrategy}</div>
          <div>
            <Link href="/admin/ai-teachers" style={styles.link}>
              تعديل الملف الشخصي
            </Link>
          </div>
        </div>
        <div style={styles.personaCard}>
          <strong>حالة التشغيل</strong>
          <div>{status}</div>
          <div>
            الزمن: {(tMs / 1000).toFixed(1)}s / {(duration / 1000).toFixed(0)}s
          </div>
          <div>
            act: {frame?.contentAct || "—"} · gesture: {frame?.gesture || "—"} · gaze:{" "}
            {frame?.gaze || "—"}
          </div>
          <div>BT: {mindState || "—"}</div>
          <div>
            ذاكرة: ارتباك {memory?.confusionCount ?? 0} · استراتيجيات{" "}
            {memory?.strategiesUsed.join(" → ") || "—"}
          </div>
        </div>
      </div>

      <div style={styles.stage}>
        <TeachingStudio3D
          teacherId={teacherId}
          pose={pose}
          speaking={!!frame?.speaking}
          mouthEnergy={frame?.jawOpen || 0}
          camera={mapCamera(frame?.camera || "medium_teacher")}
          lighting={frame?.lighting || "key_fill_rim"}
          props={studioProps}
          focusTarget={frame?.screen?.id || null}
          boardLines={boardLines}
          celebrating={frame?.contentAct === "celebrate"}
          walkOffset={walkFromFrame(frame)}
          lookYaw={frame?.head.yaw}
          lookPitch={frame?.head.pitch}
          gaze={frame?.gaze}
          screenElement={frame?.screen}
          frame={frame}
        />
        <div style={styles.caption}>
          <div style={styles.captionAct}>
            {frame?.behaviourGoal || "—"} · {frame?.camera || "—"} · {frame?.lighting || "—"}
          </div>
          <div style={styles.captionLine}>
            {frame?.lineText || (done ? "انتهى الدرس." : "اضغط تشغيل لبدء الحصة داخل الاستوديو 3D")}
          </div>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.barFill,
                width: `${Math.min(100, (tMs / Math.max(1, duration)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      <section style={styles.talk}>
        <h2 style={styles.h2}>التحدث مع المعلم أثناء/بعد الشرح</h2>
        <div style={styles.talkRow}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اطرح سؤالاً على المعلم…"
            style={styles.input}
          />
          <button
            type="button"
            style={styles.primary}
            onClick={() => {
              if (!question.trim()) return;
              runAdapt({ type: "ask_text", text: question.trim() });
              setQuestion("");
            }}
          >
            اسأل
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => runAdapt({ type: "explain_simpler" })}
          >
            أعد الشرح بطريقة مختلفة
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => runAdapt({ type: "example" })}
          >
            مثال إضافي
          </button>
        </div>
        {reply ? <div style={styles.reply}>{reply}</div> : null}
      </section>

      <section style={styles.honesty}>
        <h2 style={styles.h2}>ما المكتمل فعلاً / الجزئي / البنية فقط</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>الميزة</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>الدليل</th>
            </tr>
          </thead>
          <tbody>
            {HONESTY.map((r) => (
              <tr key={r.id}>
                <td style={styles.td}>{r.label}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        r.status === "works"
                          ? "#1f6b4a"
                          : r.status === "partial"
                            ? "#7a5b16"
                            : "#4a4a4a",
                    }}
                  >
                    {r.status === "works"
                      ? "يعمل"
                      : r.status === "partial"
                        ? "جزئي"
                        : "بنية فقط"}
                  </span>
                </td>
                <td style={styles.td}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={styles.footnote}>
          الخلاصة الصادقة: المنتج الحي الآن = معلمان skinned في Three.js (هيكل + morphs +
          Lesson Director). Unreal MetaHuman Pixel Streaming ما زال Adapter جاهزاً ويحتاج خادم
          UE — لا ندّعي أنه يعمل هنا.
        </p>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    background: "#0b1018",
    color: "#f3efe6",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    paddingBottom: 48,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 20px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brand: {
    fontSize: 11,
    letterSpacing: "0.16em",
    color: "#d8c4a0",
    fontWeight: 700,
  },
  title: {
    margin: "6px 0",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: "clamp(1.35rem, 2.5vw, 1.9rem)",
    fontWeight: 650,
  },
  sub: { margin: 0, maxWidth: 720, lineHeight: 1.65, opacity: 0.88, fontSize: 14 },
  link: { color: "#d7e6f5", fontWeight: 650, alignSelf: "flex-start" },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: "14px 20px",
    alignItems: "end",
  },
  field: { display: "grid", gap: 4, fontSize: 12, minWidth: 200 },
  select: {
    background: "#151c28",
    color: "#f3efe6",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "10px 12px",
    borderRadius: 4,
  },
  primary: {
    border: "none",
    background: "#f0e4d0",
    color: "#1a222c",
    fontWeight: 800,
    padding: "11px 16px",
    borderRadius: 4,
    cursor: "pointer",
  },
  ghost: {
    border: "1px solid rgba(240,228,208,0.4)",
    background: "transparent",
    color: "#f0e4d0",
    fontWeight: 700,
    padding: "11px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  personaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 10,
    padding: "0 20px 12px",
  },
  personaCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "12px 14px",
    borderRadius: 6,
    fontSize: 13,
    lineHeight: 1.55,
  },
  stage: {
    position: "relative",
    height: "min(64vh, 640px)",
    margin: "0 12px",
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "12px 14px 14px",
    background: "linear-gradient(0deg, rgba(8,12,18,0.92), transparent)",
  },
  captionAct: { fontSize: 12, opacity: 0.8, marginBottom: 4 },
  captionLine: { fontWeight: 700, fontSize: 16, lineHeight: 1.5, minHeight: 44 },
  barTrack: { height: 3, background: "rgba(255,255,255,0.15)", marginTop: 8 },
  barFill: { height: "100%", background: "#f0e4d0" },
  talk: { padding: "18px 20px" },
  h2: {
    margin: "0 0 10px",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: 18,
  },
  talkRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  input: {
    flex: 1,
    minWidth: 220,
    background: "#151c28",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 4,
    fontWeight: 600,
  },
  reply: {
    marginTop: 12,
    padding: "12px 14px",
    background: "rgba(240,228,208,0.1)",
    borderRight: "3px solid #d8c4a0",
    lineHeight: 1.6,
    fontWeight: 650,
  },
  honesty: { padding: "8px 20px 24px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "right",
    padding: "8px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    color: "#d8c4a0",
  },
  td: {
    textAlign: "right",
    padding: "9px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    verticalAlign: "top",
  },
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: 3,
    fontWeight: 800,
    fontSize: 12,
  },
  footnote: { marginTop: 14, opacity: 0.85, lineHeight: 1.65, maxWidth: 900 },
};

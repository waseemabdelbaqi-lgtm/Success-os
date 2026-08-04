"use client";

/**
 * Production platform studio — Sara & Ali only.
 * Any Interactive Lesson Engine package → Human Engine performance.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import type {
  HumanFrameSample,
  HumanPerformancePlan,
} from "@/types/human-engine";
import type { TeacherSessionMemory } from "@/types/teacher-mind";
import {
  adaptLiveTeacher,
  bridgeInteractiveLessonToHuman,
  createLocalPhotorealAdapter,
  createSessionMemory,
  directLesson,
  gestureToClassroomPose,
  getTeacherPersona,
  listTeachableCatalog,
  playPlan,
  resolveTeachablePackage,
} from "@/lib/human-engine";
import {
  TeachingStudio3D,
  type Studio3DPose,
} from "@/components/ai-teachers/teaching-studio-3d";

type TeacherId = "sara" | "ali";

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

export function PlatformTeacherStudio() {
  const catalog = useMemo(() => listTeachableCatalog(48), []);
  const [teacherId, setTeacherId] = useState<TeacherId>("sara");
  const [packageId, setPackageId] = useState(catalog[0]?.packageId || "demo");
  const [studentLevel, setStudentLevel] = useState<"below" | "on" | "above">("on");
  const [plan, setPlan] = useState<HumanPerformancePlan | null>(null);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [status, setStatus] = useState("اختَر سارة أو علي ودرساً من المنصة، ثم شغّل الحصة");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [answer, setAnswer] = useState("");
  const [memory, setMemory] = useState<TeacherSessionMemory | null>(null);
  const [mindState, setMindState] = useState("");
  const stopRef = useRef<null | (() => void)>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioRef = useRef("");
  const memoryRef = useRef<TeacherSessionMemory | null>(null);

  const persona = getTeacherPersona(teacherId);
  const entry = catalog.find((c) => c.packageId === packageId) || catalog[0];

  const buildPlan = useCallback(() => {
    const pkg = resolveTeachablePackage({
      packageId: entry?.packageId,
      bookId: entry?.bookId,
      unitId: entry?.unitId,
      lessonId: entry?.lessonId,
    });
    const input = bridgeInteractiveLessonToHuman({
      pkg,
      teacherId,
      studentLevel,
    });
    return {
      input,
      plan: directLesson({
        input,
        adapterId: "local_photoreal_preview",
        maxDurationMs: Math.max(65_000, input.durationMs || 65_000),
      }),
    };
  }, [entry, teacherId, studentLevel]);

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
            setPlaying(false);
            setStatus("انتهت الحصة — اسأل أو أعد الشرح أو قيّم الفهم");
          }
        },
      });
      stopRef.current = handle.stop;
    },
    [stop],
  );

  const startLesson = () => {
    const { input, plan: next } = buildPlan();
    const mem = createSessionMemory({
      teacherId,
      lessonId: input.lessonId,
      lessonTitle: input.titleAr || input.title,
      subject: input.subject,
      grade: input.grade,
      studentLevel,
    });
    memoryRef.current = mem;
    setMemory(mem);
    setMindState("teaching");
    play(
      next,
      `حصة حية · ${persona.displayName.ar} · ${input.titleAr} · ${input.subject} · ${(next.timeline.durationMs / 1000).toFixed(0)}ث`,
    );
  };

  const runAdapt = (event: Parameters<typeof adaptLiveTeacher>[0]["event"]) => {
    const { input } = buildPlan();
    const prior =
      memoryRef.current ||
      createSessionMemory({
        teacherId,
        lessonId: input.lessonId,
        lessonTitle: input.titleAr || input.title,
        subject: input.subject,
        grade: input.grade,
        studentLevel,
      });
    const result = adaptLiveTeacher({
      teacherId,
      lessonTitle: input.titleAr || input.title,
      lessonId: input.lessonId,
      subject: input.subject,
      grade: input.grade,
      currentLine: frame?.lineText || undefined,
      event,
      memory: prior,
      elapsedMs: tMs || prior.elapsedMs,
    });
    memoryRef.current = result.memory;
    setMemory(result.memory);
    setMindState(
      `${result.decision.state} · ${result.strategy} · ${result.contentHint}`,
    );
    setReply(result.reply);
    setStatus(
      `Teacher Mind · ${result.strategy} · ${result.memory.strategiesUsed.join("→") || "—"}`,
    );
    play(result.microPlan, `رد ${persona.displayName.ar}`);
    if (result.audioKey) {
      const src = `/media/ai-teachers/${teacherId}/audio/${result.audioKey}.mp3`;
      void new Audio(src).play().catch(() => undefined);
    }
  };

  useEffect(() => () => stop(), [stop]);

  const pose: Studio3DPose = frame ? gestureToClassroomPose(frame.gesture) : "stand";
  const duration = plan?.timeline.durationMs || 65_000;
  const boardLines = useMemo(() => {
    const lines: string[] = [
      entry?.titleAr || "الدرس",
      persona.displayName.ar,
      entry ? `${entry.subject} · ${entry.grade}` : "",
    ];
    if (frame?.screen?.detail) lines.push(frame.screen.detail);
    if (frame?.lineText) lines.push(frame.lineText);
    return lines.filter(Boolean);
  }, [entry, persona.displayName.ar, frame]);

  return (
    <div dir="rtl" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>SUCCESS OS · PLATFORM TEACHERS</div>
          <h1 style={styles.title}>سارة وعلي — معلما المنصة الرسميان</h1>
          <p style={styles.sub}>
            نفس Human Engine يدرّس أي مادة من كتالوج المنصة: سبورة، رسم، حل مسائل،
            نماذج 3D، تجارب، أسئلة، وإعادة شرح بدون تكرار. لا معلمين جدد — الجودة أولاً.
          </p>
        </div>
        <div style={styles.headerLinks}>
          <Link href="/admin/ai-teachers" style={styles.link}>
            إدارة الشخصية
          </Link>
          <Link href="/ai-teacher" style={styles.linkMuted}>
            الاستوديو
          </Link>
        </div>
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
            <option value="sara">سارة — دافئة · تشبيه ثم خطوات</option>
            <option value="ali">علي — دقيق · تعريف ثم مثال</option>
          </select>
        </label>
        <label style={styles.fieldWide}>
          <span>درس من المنصة</span>
          <select
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            style={styles.select}
            disabled={playing}
          >
            {catalog.map((c) => (
              <option key={c.packageId} value={c.packageId}>
                {c.titleAr} · {c.subject}/{c.grade}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.field}>
          <span>مستوى الطالب</span>
          <select
            value={studentLevel}
            onChange={(e) => setStudentLevel(e.target.value as typeof studentLevel)}
            style={styles.select}
            disabled={playing}
          >
            <option value="below">يحتاج تهدئة</option>
            <option value="on">مناسب</option>
            <option value="above">سريع</option>
          </select>
        </label>
        <button type="button" style={styles.primary} onClick={startLesson} disabled={playing}>
          بدء الحصة
        </button>
        <button type="button" style={styles.ghost} onClick={stop} disabled={!playing}>
          إيقاف
        </button>
      </section>

      <div style={styles.metaRow}>
        <div style={styles.metaCard}>
          <strong>{persona.displayName.ar}</strong>
          <div>{persona.voiceId}</div>
          <div>{persona.style === "warm" ? "أسلوب دافئ" : "أسلوب دقيق"}</div>
        </div>
        <div style={styles.metaCard}>
          <strong>الحصة</strong>
          <div>{status}</div>
          <div>
            {(tMs / 1000).toFixed(1)}s / {(duration / 1000).toFixed(0)}s ·{" "}
            {frame?.contentAct || "—"} · {frame?.gesture || "—"}
          </div>
          <div>BT: {mindState || "—"}</div>
          <div>
            ذاكرة: ارتباك {memory?.confusionCount ?? 0} · استراتيجيات{" "}
            {memory?.strategiesUsed.join(" → ") || "—"}
            {memory?.waitingForAnswer ? " · بانتظار إجابة" : ""}
          </div>
        </div>
      </div>

      <div style={styles.stage}>
        <TeachingStudio3D
          teacherId={teacherId}
          pose={pose}
          speaking={!!frame?.speaking}
          mouthEnergy={frame?.jawOpen || 0}
          camera={frame?.camera || "medium_teacher"}
          lighting={frame?.lighting || "key_fill_rim"}
          props={
            frame?.screen?.kind === "law" || frame?.screen?.kind === "equation"
              ? [
                  {
                    id: frame.screen.id,
                    kind: frame.screen.kind,
                    label: frame.screen.label,
                    focused: true,
                  },
                ]
              : []
          }
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
            {frame?.lineText || "اضغط «بدء الحصة» لدخول الاستوديو مع سارة أو علي"}
          </div>
        </div>
      </div>

      <section style={styles.talk}>
        <h2 style={styles.h2}>تفاعل أثناء الشرح</h2>
        <div style={styles.talkRow}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="سؤال للطالب أثناء الشرح…"
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
            onClick={() => runAdapt({ type: "confused" })}
          >
            لم أفهم
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => runAdapt({ type: "explain_simpler" })}
          >
            أعد بطريقة مختلفة
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => runAdapt({ type: "example" })}
          >
            مثال
          </button>
        </div>
        <div style={styles.talkRow}>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="إجابة الطالب على سؤال المعلم…"
            style={styles.input}
          />
          <button
            type="button"
            style={styles.primary}
            onClick={() => {
              if (!answer.trim()) return;
              runAdapt({ type: "answer", text: answer.trim(), correct: true });
              setAnswer("");
            }}
          >
            إجابة صحيحة
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => {
              if (!answer.trim()) return;
              runAdapt({ type: "answer", text: answer.trim(), correct: false });
              setAnswer("");
            }}
          >
            إجابة خاطئة
          </button>
        </div>
        {reply ? <div style={styles.reply}>{reply}</div> : null}
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    background:
      "radial-gradient(1000px 500px at 10% -10%, #1e2a3a 0%, transparent 50%), linear-gradient(168deg, #0b1018 0%, #141c28 50%, #1a2432 100%)",
    color: "#f3efe6",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    paddingBottom: 48,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 20px 10px",
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
    fontSize: "clamp(1.35rem, 2.5vw, 1.95rem)",
    fontWeight: 650,
  },
  sub: { margin: 0, maxWidth: 720, lineHeight: 1.65, opacity: 0.88, fontSize: 14 },
  headerLinks: { display: "flex", flexDirection: "column", gap: 8 },
  link: { color: "#d7e6f5", fontWeight: 650 },
  linkMuted: { color: "rgba(215,230,245,0.65)", fontWeight: 550, fontSize: 13 },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: "14px 20px",
    alignItems: "end",
  },
  field: { display: "grid", gap: 4, fontSize: 12, minWidth: 180 },
  fieldWide: { display: "grid", gap: 4, fontSize: 12, minWidth: 280, flex: 1 },
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
    border: "1px solid rgba(255,255,255,0.25)",
    background: "transparent",
    color: "#f3efe6",
    fontWeight: 650,
    padding: "11px 14px",
    borderRadius: 4,
    cursor: "pointer",
  },
  metaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 10,
    padding: "0 20px 12px",
  },
  metaCard: {
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: 13,
    lineHeight: 1.55,
    display: "grid",
    gap: 4,
  },
  stage: { padding: "0 20px", position: "relative" },
  caption: {
    marginTop: 8,
    padding: "10px 12px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  captionAct: { fontSize: 12, opacity: 0.75, marginBottom: 4 },
  captionLine: { fontSize: 15, lineHeight: 1.55 },
  talk: { padding: "18px 20px" },
  h2: { margin: "0 0 10px", fontSize: 16 },
  talkRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    minWidth: 200,
    background: "#151c28",
    color: "#f3efe6",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "10px 12px",
    borderRadius: 4,
  },
  reply: {
    marginTop: 8,
    padding: "12px 14px",
    background: "rgba(240,228,208,0.1)",
    border: "1px solid rgba(240,228,208,0.25)",
    lineHeight: 1.6,
  },
};

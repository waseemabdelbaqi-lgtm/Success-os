"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
  sampleFrame,
  type ProofLessonId,
} from "@/lib/human-engine";
import { alignPlanToTts, slicePlanFrom } from "@/lib/ai-teachers/align-plan-to-tts";
import {
  SeamlessVoicePlayer,
  type VoiceQueueItem,
} from "@/lib/ai-teachers/seamless-voice-player";
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

function mapCamera(shot: string): string {
  if (shot === "prop_orbit") return "prop_orbit";
  return shot || "medium_teacher";
}

async function withLiveLineTts(
  plan: HumanPerformancePlan,
  teacherId: TeacherId,
  styleHint?: "remediate",
): Promise<{
  plan: HumanPerformancePlan;
  lineCount: number;
  totalMs: number;
  queue: VoiceQueueItem[];
}> {
  const lines = (plan.speech?.lines || []).map((l, i) => ({
    id: `L${i}_${l.startMs}`,
    text: l.text,
    contentAct: l.contentAct || plan.sentences?.[i]?.contentAct,
    style: styleHint,
  }));
  if (!lines.length) {
    return { plan, lineCount: 0, totalMs: 0, queue: [] };
  }
  const res = await fetch("/api/ai-teachers/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teacherId, lines }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    totalWithPausesMs?: number;
    items?: Array<{
      url: string;
      durationMs: number;
      pauseAfterMs: number;
      style?: string;
    }>;
    error?: string;
  };
  if (!res.ok || !json.success || !json.items?.length) {
    throw new Error(json.error || "تعذر تحضير الصوت");
  }
  const timings = json.items.map((it) => ({
    url: it.url,
    durationMs: it.durationMs,
    pauseAfterMs: it.pauseAfterMs,
    style: it.style,
  }));
  const aligned = alignPlanToTts(plan, timings);
  const queue: VoiceQueueItem[] = aligned.speech.lines.map((l, i) => ({
    url: l.audioSrc || timings[i]!.url,
    text: l.text,
    startMs: l.startMs,
    endMs: l.endMs,
    pauseAfterMs: timings[i]?.pauseAfterMs ?? 300,
  }));
  return {
    plan: aligned,
    lineCount: json.items.length,
    totalMs: json.totalWithPausesMs || aligned.timeline.durationMs,
    queue,
  };
}

const FEATURED_LESSON: ProofLessonId = "forces_law_lab";

export function HumanEngineProofStudio() {
  const allLessons = useMemo(() => listProofLessons(), []);
  const [phase, setPhase] = useState<"welcome" | "studio">("welcome");
  const [teacherId, setTeacherId] = useState<TeacherId>("sara");
  const [lessonId, setLessonId] = useState<ProofLessonId>(FEATURED_LESSON);
  const [plan, setPlan] = useState<HumanPerformancePlan | null>(null);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [done, setDone] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepPct, setPrepPct] = useState(0);
  const [toast, setToast] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const voiceRef = useRef<SeamlessVoicePlayer | null>(null);
  const adapterRef = useRef<ReturnType<typeof createLocalPhotorealAdapter> | null>(
    null,
  );
  const basePlanRef = useRef<HumanPerformancePlan | null>(null);
  const resumePlanRef = useRef<HumanPerformancePlan | null>(null);
  const resumeQueueRef = useRef<VoiceQueueItem[] | null>(null);
  const memoryRef = useRef<TeacherSessionMemory | null>(null);
  const interruptMsRef = useRef(0);
  const autoStarted = useRef(false);

  const persona = getTeacherPersona(teacherId);
  const meta = allLessons.find((l) => l.id === lessonId) || allLessons[0]!;

  const buildPlan = useCallback(() => {
    const input = buildProofLessonInput(lessonId, teacherId);
    return directLesson({
      input,
      adapterId: "local_photoreal_preview",
      maxDurationMs: Math.max(65_000, meta.minDurationMs),
    });
  }, [lessonId, teacherId, meta.minDurationMs]);

  const stop = useCallback(() => {
    voiceRef.current?.stop();
    adapterRef.current?.dispose?.();
    adapterRef.current = null;
    setPlaying(false);
  }, []);

  const playAligned = useCallback(
    async (
      aligned: HumanPerformancePlan,
      queue: VoiceQueueItem[],
      opts?: { isBase?: boolean; resumeAfter?: boolean },
    ) => {
      stop();
      setPlan(aligned);
      if (opts?.isBase) {
        basePlanRef.current = aligned;
        resumePlanRef.current = aligned;
        resumeQueueRef.current = queue;
      }
      setDone(false);
      setPlaying(true);
      setTMs(0);
      setToast("");

      const adapter = createLocalPhotorealAdapter({
        onFrame: (f) => setFrame(f),
      });
      adapterRef.current = adapter;
      void adapter.load(aligned);

      const player = voiceRef.current || new SeamlessVoicePlayer();
      voiceRef.current = player;
      player.configure(queue, {
        onLineStart: () => undefined,
        onTimeUpdate: (globalMs) => {
          setTMs(globalMs);
          const f = sampleFrame(aligned, globalMs);
          adapter.applyFrame(f);
          setFrame(f);
        },
        onQueueEnded: () => {
          if (opts?.resumeAfter && resumePlanRef.current && resumeQueueRef.current) {
            const remaining = slicePlanFrom(
              resumePlanRef.current,
              interruptMsRef.current,
            );
            const q = remaining.speech.lines
              .filter((l) => l.audioSrc)
              .map((l) => ({
                url: l.audioSrc!,
                text: l.text,
                startMs: l.startMs,
                endMs: l.endMs,
                pauseAfterMs: 300,
              }));
            if (q.length) {
              void playAligned(remaining, q, { isBase: true });
              return;
            }
          }
          setDone(true);
          setPlaying(false);
        },
        onError: () => setToast("تعذر تشغيل الصوت — حاول مرة أخرى"),
      });
      setPrepPct(90);
      await player.preload();
      setPrepPct(100);
      player.start();
    },
    [stop],
  );

  const startLesson = useCallback(async () => {
    const mem = createSessionMemory({
      teacherId,
      lessonId,
      lessonTitle: meta.titleAr,
      subject: meta.subject || "general",
      grade: meta.grade || "g1",
    });
    memoryRef.current = mem;
    setPreparing(true);
    setPrepPct(8);
    setToast("يحضّر المعلم الدرس…");
    try {
      const p = buildPlan();
      setPrepPct(28);
      const voiced = await withLiveLineTts(p, teacherId);
      setPrepPct(82);
      await playAligned(voiced.plan, voiced.queue, { isBase: true });
    } catch {
      setToast("تعذر بدء الحصة. أعد المحاولة.");
    } finally {
      setPreparing(false);
    }
  }, [buildPlan, lessonId, meta.grade, meta.subject, meta.titleAr, playAligned, teacherId]);

  const enterStudio = (id: TeacherId) => {
    setTeacherId(id);
    setLessonId(FEATURED_LESSON);
    setPhase("studio");
    setReply("");
    setDone(false);
    autoStarted.current = false;
  };

  useEffect(() => {
    if (phase !== "studio" || autoStarted.current || playing || preparing) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => {
      void startLesson();
    }, 450);
    return () => window.clearTimeout(t);
  }, [phase, playing, preparing, startLesson]);

  const runAdapt = async (event: Parameters<typeof adaptLiveTeacher>[0]["event"]) => {
    const prior =
      memoryRef.current ||
      createSessionMemory({
        teacherId,
        lessonId,
        lessonTitle: meta.titleAr,
      });

    interruptMsRef.current = voiceRef.current?.getGlobalMs() || tMs;
    if (basePlanRef.current) {
      resumePlanRef.current = basePlanRef.current;
    }

    const result = adaptLiveTeacher({
      teacherId,
      lessonTitle: meta.titleAr,
      lessonId,
      currentLine: frame?.lineText || undefined,
      event,
      memory: prior,
      elapsedMs: interruptMsRef.current,
    });
    memoryRef.current = result.memory;
    setReply(result.reply);
    setAskOpen(true);
    setPreparing(true);
    try {
      const styleHint =
        event.type === "explain_simpler" || event.type === "confused"
          ? ("remediate" as const)
          : undefined;
      const voiced = await withLiveLineTts(result.microPlan, teacherId, styleHint);
      await playAligned(voiced.plan, voiced.queue, { resumeAfter: true });
    } catch {
      setToast("تعذر الرد الآن");
    } finally {
      setPreparing(false);
    }
  };

  useEffect(() => () => stop(), [stop]);

  const pose: Studio3DPose = frame ? gestureToClassroomPose(frame.gesture) : "stand";
  const boardLines = useMemo(() => {
    const lines: string[] = [];
    if (frame?.screen?.label) lines.push(frame.screen.label);
    if (frame?.screen?.detail) lines.push(frame.screen.detail);
    if (frame?.lineText && lines.length < 2) lines.push(frame.lineText);
    if (!lines.length) lines.push(meta.titleAr);
    return lines.filter(Boolean);
  }, [frame, meta.titleAr]);

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
  const progress = Math.min(100, (tMs / Math.max(1, duration)) * 100);

  if (phase === "welcome") {
    return (
      <div dir="rtl" style={styles.welcome}>
        <div style={styles.welcomeGlow} />
        <div style={styles.welcomeInner}>
          <p style={styles.welcomeBrand}>Success OS</p>
          <h1 style={styles.welcomeTitle}>استوديو التعليم العالمي</h1>
          <p style={styles.welcomeSub}>
            ادخل الحصة مع معلميك الرسميين — سارة وعلي
          </p>
          <div style={styles.teacherPick}>
            {(
              [
                {
                  id: "sara" as const,
                  name: "المعلمة سارة",
                  line: "هادئة · مشجعة · تشرح بالتدرج",
                  img: "/media/ai-teachers/sara/portrait.png",
                },
                {
                  id: "ali" as const,
                  name: "المعلم علي",
                  line: "مباشر · عملي · تفكير تحليلي",
                  img: "/media/ai-teachers/ali/portrait.png",
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                style={styles.teacherCard}
                onClick={() => enterStudio(t.id)}
              >
                <img src={t.img} alt={t.name} style={styles.teacherImg} />
                <div style={styles.teacherMeta}>
                  <strong style={styles.teacherName}>{t.name}</strong>
                  <span style={styles.teacherLine}>{t.line}</span>
                  <span style={styles.enterCta}>ادخل الحصة</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={styles.studioPage}>
      <div style={styles.stageFull}>
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

        <div style={styles.topBar}>
          <div>
            <div style={styles.brandMark}>Success OS</div>
            <div style={styles.sessionTitle}>
              {persona.displayName.ar} · {meta.titleAr}
            </div>
          </div>
          <div style={styles.topActions}>
            <button
              type="button"
              style={styles.chip}
              disabled={playing || preparing}
              onClick={() => {
                stop();
                setPhase("welcome");
                autoStarted.current = false;
              }}
            >
              تبديل المعلم
            </button>
            <button
              type="button"
              style={styles.chipPrimary}
              disabled={playing || preparing}
              onClick={() => {
                autoStarted.current = true;
                void startLesson();
              }}
            >
              {preparing ? `تحضير ${prepPct}%` : playing ? "الحصة جارية" : "أعد الحصة"}
            </button>
          </div>
        </div>

        <div style={styles.subtitle}>
          <div style={styles.subtitleText}>
            {preparing
              ? "المعلم يجهّز الشرح…"
              : frame?.lineText ||
                (done
                  ? "انتهت الحصة. يمكنك السؤال أو إعادة الشرح."
                  : "لحظة… تبدأ الحصة الآن")}
          </div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${progress}%` }} />
          </div>
        </div>

        <div style={styles.dock}>
          <button
            type="button"
            style={styles.dockBtn}
            disabled={preparing}
            onClick={() => setAskOpen((v) => !v)}
          >
            اسأل المعلم
          </button>
          <button
            type="button"
            style={styles.dockBtn}
            disabled={preparing}
            onClick={() => void runAdapt({ type: "explain_simpler" })}
          >
            اشرح بطريقة أخرى
          </button>
          <button
            type="button"
            style={styles.dockBtn}
            disabled={preparing}
            onClick={() => void runAdapt({ type: "example" })}
          >
            مثال أوضح
          </button>
          {playing ? (
            <button type="button" style={styles.dockGhost} onClick={stop}>
              إيقاف
            </button>
          ) : null}
        </div>

        {askOpen ? (
          <div style={styles.askPanel}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`اسأل ${persona.displayName.ar}…`}
              style={styles.askInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && question.trim()) {
                  void runAdapt({ type: "ask_text", text: question.trim() });
                  setQuestion("");
                }
              }}
            />
            <button
              type="button"
              style={styles.chipPrimary}
              disabled={preparing || !question.trim()}
              onClick={() => {
                if (!question.trim()) return;
                void runAdapt({ type: "ask_text", text: question.trim() });
                setQuestion("");
              }}
            >
              أرسل
            </button>
          </div>
        ) : null}

        {reply ? <div style={styles.replyBubble}>{reply}</div> : null}
        {toast ? <div style={styles.toast}>{toast}</div> : null}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  welcome: {
    minHeight: "100vh",
    margin: 0,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(1200px 700px at 70% 10%, #1a3a5c 0%, transparent 55%), linear-gradient(160deg, #0a121c 0%, #152033 45%, #0d1824 100%)",
    color: "#f7f1e6",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
    display: "grid",
    placeItems: "center",
    padding: 24,
  },
  welcomeGlow: {
    position: "absolute",
    inset: "auto auto -20% -10%",
    width: 520,
    height: 520,
    background: "radial-gradient(circle, rgba(201,162,89,0.22), transparent 70%)",
    pointerEvents: "none",
  },
  welcomeInner: {
    position: "relative",
    zIndex: 1,
    width: "min(980px, 100%)",
    textAlign: "center",
  },
  welcomeBrand: {
    margin: 0,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    fontSize: 12,
    color: "#c9a259",
    fontWeight: 700,
  },
  welcomeTitle: {
    margin: "14px 0 10px",
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
    fontSize: "clamp(2rem, 5vw, 3.4rem)",
    fontWeight: 700,
    lineHeight: 1.15,
  },
  welcomeSub: {
    margin: "0 auto 36px",
    maxWidth: 520,
    opacity: 0.88,
    fontSize: 18,
    lineHeight: 1.7,
  },
  teacherPick: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 22,
  },
  teacherCard: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(10,16,26,0.55)",
    borderRadius: 22,
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    color: "inherit",
    textAlign: "right",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
    transition: "transform 0.25s ease, border-color 0.25s ease",
  },
  teacherImg: {
    width: "100%",
    height: 300,
    objectFit: "cover",
    display: "block",
  },
  teacherMeta: {
    padding: "16px 18px 20px",
    display: "grid",
    gap: 6,
  },
  teacherName: {
    fontSize: 22,
    fontFamily: '"Fraunces", "IBM Plex Sans Arabic", serif',
  },
  teacherLine: {
    opacity: 0.8,
    fontSize: 14,
  },
  enterCta: {
    marginTop: 10,
    display: "inline-block",
    color: "#0b1018",
    background: "#e7c77a",
    fontWeight: 800,
    borderRadius: 999,
    padding: "8px 14px",
    width: "fit-content",
    fontSize: 13,
  },
  studioPage: {
    margin: 0,
    minHeight: "100vh",
    background: "#05080f",
    color: "#f4efe6",
    fontFamily: '"IBM Plex Sans Arabic", "Segoe UI", sans-serif',
  },
  stageFull: {
    position: "relative",
    width: "100%",
    height: "100vh",
    minHeight: 640,
    overflow: "hidden",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: "18px 22px",
    background: "linear-gradient(180deg, rgba(5,8,15,0.72), transparent)",
    pointerEvents: "none",
  },
  brandMark: {
    fontSize: 11,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: "#d4b36a",
    fontWeight: 700,
  },
  sessionTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: 700,
    textShadow: "0 2px 12px rgba(0,0,0,0.55)",
  },
  topActions: {
    display: "flex",
    gap: 8,
    pointerEvents: "auto",
  },
  chip: {
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(0,0,0,0.35)",
    color: "#f4efe6",
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  chipPrimary: {
    border: "none",
    background: "#e7c77a",
    color: "#14110c",
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 13,
  },
  subtitle: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 88,
    zIndex: 5,
    background: "rgba(8,12,20,0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "14px 16px 12px",
    backdropFilter: "blur(10px)",
  },
  subtitleText: {
    fontSize: 17,
    lineHeight: 1.65,
    fontWeight: 600,
    minHeight: 48,
  },
  barTrack: {
    marginTop: 10,
    height: 3,
    borderRadius: 99,
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #c9a259, #f0d59a)",
  },
  dock: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 6,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  dockBtn: {
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff8ea",
    borderRadius: 999,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    backdropFilter: "blur(8px)",
  },
  dockGhost: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#d9d2c4",
    borderRadius: 999,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 13,
  },
  askPanel: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 70,
    zIndex: 7,
    display: "flex",
    gap: 8,
    background: "rgba(8,12,20,0.9)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 10,
  },
  askInput: {
    flex: 1,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
  },
  replyBubble: {
    position: "absolute",
    top: 86,
    left: 18,
    right: 18,
    zIndex: 6,
    maxWidth: 560,
    marginInlineStart: "auto",
    background: "rgba(231,199,122,0.14)",
    border: "1px solid rgba(231,199,122,0.35)",
    color: "#fff6df",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.6,
    backdropFilter: "blur(8px)",
  },
  toast: {
    position: "absolute",
    top: "46%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 8,
    background: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: "12px 18px",
    fontSize: 15,
  },
};

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
  listProofSubjects,
  proofLessonsForSubject,
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

/** User acceptance checklist — do not mark ✅ unless fully true in this demo. */
const HONESTY: Array<{
  id: string;
  label: string;
  status: "works" | "partial" | "missing";
  detail: string;
}> = [
  {
    id: "pick",
    label: "1) اختيار سارة أو علي",
    status: "works",
    detail: "قائمة المعلم تعمل وتبدّل الشخصية/الصوت/الأسلوب فوراً",
  },
  {
    id: "studio",
    label: "2) الدخول إلى الاستوديو ثلاثي الأبعاد",
    status: "works",
    detail: "TeachingStudio3D (غرفة + سبورة + كاميرا + إضاءة) على هذه الصفحة",
  },
  {
    id: "lesson",
    label: "3) بدء درس حقيقي متعدد المواد",
    status: "partial",
    detail:
      "بوابة قبول: رياضيات/فيزياء/كيمياء/أحياء/لغات/برمجة × سارة وعلي — جاهزة للتجربة؛ لا تُعتبر مكتملة حتى تنجح عند المالك على Demo",
  },
  {
    id: "voice",
    label: "4) أسمع صوتهما",
    status: "partial",
    detail:
      "TTS حي + طابور سلس + مزامنة مدة + مقاطعة/استئناف جاهزة للاختبار — بانتظار نجاح جلسة 10 دقائق متواصلة (سارة ثم علي)",
  },
  {
    id: "body",
    label: "5) أرى حركة الجسم كاملة",
    status: "partial",
    detail:
      "هيكل Mixamo skinned (ذراع/رأس/أصابع/مشي) من Human Engine — قاعدة Xbot أسلوبية وليست performance mocap كامل",
  },
  {
    id: "face",
    label: "6) أرى حركة الوجه والشفاه",
    status: "partial",
    detail:
      "morphs (jaw/smile/blink/brow) من phoneme النص — تتحرك الشفاه، لكن المزامنة ليست من موجة الصوت الفعلي للـ MP3",
  },
  {
    id: "board",
    label: "7) أرى الكتابة على السبورة",
    status: "partial",
    detail:
      "نص/قانون يظهر على السبورة الذكية مع إيماءة كتابة — لا قلم يرسم ضربات حبر واقعية على سطح ثلاثي",
  },
  {
    id: "model3d",
    label: "8) أرى التفاعل مع نموذج ثلاثي الأبعاد",
    status: "partial",
    detail:
      "مجسم هندسي يدور/يُكبَّر عند acts النموذج — ليس نموذجاً تعليمياً غنياً خاصاً بالمادة",
  },
  {
    id: "ask",
    label: "9) أسأل أثناء الشرح وأحصل على إجابة",
    status: "works",
    detail: "adaptLiveTeacher + Teacher Mind → رد فوري + microPlan حركة",
  },
  {
    id: "reexplain",
    label: "10) إعادة الشرح بطريقة مختلفة",
    status: "works",
    detail: "زر «أعد الشرح بطريقة مختلفة» يختار استراتيجية غير مستخدمة (تشبيه/رسم/3D/…)",
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

/** Prefetch live TTS + align plan timeline to real durations (demo layer only). */
async function withLiveLineTts(
  plan: HumanPerformancePlan,
  teacherId: TeacherId,
  styleHint?: "remediate",
): Promise<{
  plan: HumanPerformancePlan;
  voiceMode: string;
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
    return {
      plan,
      voiceMode: "no-lines",
      lineCount: 0,
      totalMs: 0,
      queue: [],
    };
  }
  const res = await fetch("/api/ai-teachers/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teacherId, lines }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    voice?: string;
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
    throw new Error(json.error || "TTS prefetch failed");
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
    voiceMode: `live-tts-v2 · seamless · ${json.voice || teacherId}`,
    lineCount: json.items.length,
    totalMs: json.totalWithPausesMs || aligned.timeline.durationMs,
    queue,
  };
}

const SUBJECT_LABEL_AR: Record<string, string> = {
  all: "كل المواد (بوابة القبول)",
  math: "رياضيات",
  physics: "فيزياء",
  chemistry: "كيمياء",
  biology: "أحياء",
  languages: "لغات",
  programming: "برمجة",
};

export function HumanEngineProofStudio() {
  const allLessons = useMemo(() => listProofLessons(), []);
  const subjects = useMemo(() => ["all", ...listProofSubjects()], []);
  const [teacherId, setTeacherId] = useState<TeacherId>("sara");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [lessonId, setLessonId] = useState<ProofLessonId>("fractions_half");
  const [plan, setPlan] = useState<HumanPerformancePlan | null>(null);
  const [frame, setFrame] = useState<HumanFrameSample | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tMs, setTMs] = useState(0);
  const [status, setStatus] = useState("اختر معلماً ومادة ودرساً ثم شغّل");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [done, setDone] = useState(false);
  const [memory, setMemory] = useState<TeacherSessionMemory | null>(null);
  const [mindState, setMindState] = useState("");
  const [voiceMode, setVoiceMode] = useState("—");
  const [preparing, setPreparing] = useState(false);
  const [prepPct, setPrepPct] = useState(0);
  const [teachPlan, setTeachPlan] = useState<{
    pedagogy?: string;
    analysis?: {
      objectives?: string[];
      keyConcepts?: string[];
      commonMistakes?: string[];
      bestQuestions?: string[];
      assessmentApproach?: string;
    };
    close?: { summary?: string; followUpPlan?: string };
  } | null>(null);
  const [coreLabel, setCoreLabel] = useState("");
  const voiceRef = useRef<SeamlessVoicePlayer | null>(null);
  const adapterRef = useRef<ReturnType<typeof createLocalPhotorealAdapter> | null>(
    null,
  );
  const basePlanRef = useRef<HumanPerformancePlan | null>(null);
  const resumePlanRef = useRef<HumanPerformancePlan | null>(null);
  const resumeQueueRef = useRef<VoiceQueueItem[] | null>(null);
  const memoryRef = useRef<TeacherSessionMemory | null>(null);
  const interruptMsRef = useRef(0);

  const lessons = useMemo(
    () => proofLessonsForSubject(subjectFilter),
    [subjectFilter],
  );

  useEffect(() => {
    if (!lessons.some((l) => l.id === lessonId)) {
      const next = lessons[0]?.id;
      if (next) setLessonId(next);
    }
  }, [lessons, lessonId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [coreRes, planRes] = await Promise.all([
          fetch(`/api/ai-teachers/core?id=${teacherId}`),
          fetch(
            `/api/ai-teachers/teach-plan?teacherId=${teacherId}&proofId=${lessonId}&level=on`,
          ),
        ]);
        const coreJson = await coreRes.json();
        const planJson = await planRes.json();
        if (cancelled) return;
        const t = coreJson.teacher;
        if (t) {
          setCoreLabel(
            `${t.fullName} · ${t.personality} · ${t.teachingStyle} · ${t.voiceID}`,
          );
        }
        setTeachPlan(planJson.plan || null);
      } catch {
        if (!cancelled) setTeachPlan(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId, lessonId]);

  const persona = getTeacherPersona(teacherId);
  const meta = allLessons.find((l) => l.id === lessonId) || lessons[0] || allLessons[0]!;

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
      label: string,
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
      setStatus(label);

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
            // Re-voice remaining if speech lines still have urls
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
              void playAligned(
                remaining,
                q,
                `متابعة الدرس · ${persona.displayName.ar}`,
                { isBase: true },
              );
              return;
            }
          }
          setDone(true);
          setPlaying(false);
          setStatus("انتهى الدرس — يمكنك السؤال أو إعادة التشغيل أو تبديل المعلم");
        },
        onError: (err) => setStatus(`تحذير صوت: ${err.message}`),
      });
      setPrepPct(90);
      await player.preload();
      setPrepPct(100);
      player.start();
    },
    [stop, persona.displayName.ar],
  );

  const startLesson = async () => {
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
    setPreparing(true);
    setPrepPct(5);
    setStatus(
      lessonId === "voice_endurance_10m"
        ? "تحضير اختبار 10 دقائق: توليد صوت حي لكل جملة (قد يستغرق دقيقة)…"
        : "تحضير الصوت العصبي الحي لكل جملة…",
    );
    try {
      const p = buildPlan();
      setPrepPct(25);
      const voiced = await withLiveLineTts(p, teacherId);
      setPrepPct(80);
      setVoiceMode(
        `${voiced.voiceMode} · ${(voiced.totalMs / 60000).toFixed(1)} دقيقة`,
      );
      await playAligned(
        voiced.plan,
        voiced.queue,
        `تشغيل · ${persona.displayName.ar} · ${meta.titleAr} · ${voiced.lineCount} جملة · ${(voiced.totalMs / 1000).toFixed(0)}ث`,
        { isBase: true },
      );
    } catch (e) {
      setStatus(`فشل تحضير الصوت: ${e instanceof Error ? e.message : "error"}`);
      setVoiceMode("error");
    } finally {
      setPreparing(false);
    }
  };

  const runAdapt = async (event: Parameters<typeof adaptLiveTeacher>[0]["event"]) => {
    const prior =
      memoryRef.current ||
      createSessionMemory({
        teacherId,
        lessonId,
        lessonTitle: meta.titleAr,
      });

    // Capture resume point before interrupting
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
    setMemory(result.memory);
    setMindState(
      `${result.decision.state} · ${result.strategy} · hint=${result.contentHint}`,
    );
    setReply(result.reply);
    setStatus(
      `مقاطعة → رد · ${result.strategy} · ثم متابعة الدرس · strategies=${result.memory.strategiesUsed.join("→") || "—"}`,
    );
    setPreparing(true);
    try {
      const styleHint =
        event.type === "explain_simpler" || event.type === "confused"
          ? ("remediate" as const)
          : undefined;
      const voiced = await withLiveLineTts(
        result.microPlan,
        teacherId,
        styleHint,
      );
      setVoiceMode(voiced.voiceMode);
      await playAligned(
        voiced.plan,
        voiced.queue,
        `رد حي ثم متابعة · ${persona.displayName.ar}`,
        { resumeAfter: true },
      );
    } catch (e) {
      setStatus(`فشل رد الصوت: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setPreparing(false);
    }
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
          <h1 style={styles.title}>سارة وعلي — معلمان عالميان · يفهمان أولاً ثم يشرحان</h1>
          <p style={styles.sub}>
            نجاح المشروع = جودتهما فقط. قبل كل درس يُحلَّل المحتوى وتُبنى خطة شرح ديناميكية
            (أهداف، مفاهيم، أخطاء شائعة، أمثلة، أسئلة، رسم/تجربة/3D، تقييم). ليس قراءة نص —
            ولا Avatar فقط. لا اكتمال حتى تنسى أنك أمام ذكاء اصطناعي.
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
            <option value="sara">سارة — هادئة · مشجعة · بالتدرج</option>
            <option value="ali">علي — مباشر · عملي · تحليلي</option>
          </select>
        </label>
        <label style={styles.field}>
          <span>المادة (بوابة القبول)</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={styles.select}
            disabled={playing}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABEL_AR[s] || s}
              </option>
            ))}
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
        <button
          type="button"
          style={styles.primary}
          onClick={() => void startLesson()}
          disabled={playing || preparing}
        >
          {preparing ? "تحضير الصوت…" : "تشغيل الدرس"}
        </button>
        <button type="button" style={styles.ghost} onClick={stop} disabled={!playing}>
          إيقاف
        </button>
      </section>

      <div style={styles.voiceBanner}>
        <strong>البند 4 · اختبار 10 دقائق:</strong> {voiceMode}
        {preparing ? ` · تحضير ${prepPct}%` : ""}
        <div>
          الزمن: {(tMs / 1000).toFixed(1)}s / {(duration / 1000).toFixed(0)}s · الجملة:{" "}
          {frame?.lineText ? `«${frame.lineText.slice(0, 90)}»` : "—"}
        </div>
        <div style={{ opacity: 0.85, marginTop: 4 }}>
          للاختبار: اختر «اختبار صوت 10 دقائق» → سارة ثم علي · أثناء الشرح اضغط اسأل /
          أعد الشرح · يجب أن يجيب ثم يكمل دون إعادة تحميل الصفحة.
        </div>
      </div>

      <div style={styles.personaRow}>
        <div style={styles.personaCard}>
          <strong>{persona.displayName.ar} · Core Profile</strong>
          <div>{coreLabel || `الصوت: ${persona.voiceId}`}</div>
          <div>الأسلوب: {persona.style === "warm" ? "دافئ وتشجيعي" : "دقيق وتحليلي"}</div>
          <div>إعادة الشرح: {persona.interaction.reexplainStrategy}</div>
          <div>
            <Link href="/admin/ai-teachers" style={styles.link}>
              تعديل Teacher Mind
            </Link>
            {" · "}
            <Link href="/api/ai-teachers/core" style={styles.link}>
              TeacherProfile JSON
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

      {teachPlan?.analysis ? (
        <section style={styles.planBox}>
          <h2 style={styles.h2}>خطة الشرح الديناميكية (بعد تحليل المحتوى)</h2>
          <div style={{ opacity: 0.9, marginBottom: 8 }}>
            pedagogy: <code>{teachPlan.pedagogy || "—"}</code>
          </div>
          <div style={styles.planGrid}>
            <div>
              <strong>الأهداف</strong>
              <ul>
                {(teachPlan.analysis.objectives || []).slice(0, 3).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>المفاهيم</strong>
              <ul>
                {(teachPlan.analysis.keyConcepts || []).slice(0, 3).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>أخطاء شائعة</strong>
              <ul>
                {(teachPlan.analysis.commonMistakes || []).slice(0, 3).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>أفضل أسئلة</strong>
              <ul>
                {(teachPlan.analysis.bestQuestions || []).slice(0, 3).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ marginTop: 8, opacity: 0.88 }}>
            تقييم: {teachPlan.analysis.assessmentApproach}
          </div>
          {teachPlan.close?.followUpPlan ? (
            <div style={{ marginTop: 4, opacity: 0.88 }}>
              متابعة: {teachPlan.close.followUpPlan}
            </div>
          ) : null}
        </section>
      ) : null}

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
              void runAdapt({ type: "ask_text", text: question.trim() });
              setQuestion("");
            }}
            disabled={preparing}
          >
            اسأل
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => void runAdapt({ type: "explain_simpler" })}
            disabled={preparing}
          >
            أعد الشرح بطريقة مختلفة
          </button>
          <button
            type="button"
            style={styles.ghost}
            onClick={() => void runAdapt({ type: "example" })}
            disabled={preparing}
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
                            : "#6b1f1f",
                    }}
                  >
                    {r.status === "works"
                      ? "✅ يعمل بالكامل"
                      : r.status === "partial"
                        ? "🟡 يعمل جزئياً"
                        : "❌ غير موجود"}
                  </span>
                </td>
                <td style={styles.td}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={styles.footnote}>
          البند 4 تحت اختبار قبول 10 دقائق (جلسة متواصلة + مقاطعة + استئناف). البنود
          5–8 ما زالت صفراء. Unreal MetaHuman غير مشغّل هنا.
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
  voiceBanner: {
    margin: "0 20px 12px",
    padding: "10px 14px",
    background: "rgba(31,107,74,0.28)",
    border: "1px solid rgba(120,200,160,0.35)",
    fontSize: 13,
    lineHeight: 1.55,
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
  planBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 16,
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    fontSize: 13,
    lineHeight: 1.45,
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

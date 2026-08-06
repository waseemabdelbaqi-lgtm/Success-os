/**
 * Contextual lesson memory — mistakes, answers, strategies used.
 */
import type {
  MistakeRecord,
  StudentAnswerRecord,
  StudentLevel,
  TeacherProfileId,
  TeacherSessionMemory,
  RemediationMode,
} from "@/types/teacher-mind";
import { fingerprintSay, recordUnique } from "./performance-variety";

export function createSessionMemory(opts: {
  teacherId: TeacherProfileId;
  lessonId: string;
  lessonTitle: string;
  subject?: string;
  grade?: string;
  studentLevel?: StudentLevel;
}): TeacherSessionMemory {
  return {
    schema: "success-os.teacher-session-memory.v1",
    sessionId: `ts_${opts.teacherId}_${Date.now().toString(36)}`,
    teacherId: opts.teacherId,
    lessonId: opts.lessonId,
    lessonTitle: opts.lessonTitle,
    subject: opts.subject || "general",
    grade: opts.grade || "g1",
    studentLevel: opts.studentLevel || "on",
    startedAt: new Date().toISOString(),
    elapsedMs: 0,
    answers: [],
    mistakes: [],
    topicsCovered: [],
    lastStrategy: null,
    strategiesUsed: [],
    confusionCount: 0,
    masteryHint: 0.35,
    notes: [],
    usedGestures: [],
    usedCameras: [],
    usedSayFingerprints: [],
    lastGesture: null,
    lastCamera: null,
    waitingForAnswer: false,
    pendingQuestion: null,
  };
}

/** Fill new STM fields when older clients omit them. */
export function normalizeSessionMemory(mem: TeacherSessionMemory): TeacherSessionMemory {
  return {
    ...mem,
    usedGestures: mem.usedGestures || [],
    usedCameras: mem.usedCameras || [],
    usedSayFingerprints: mem.usedSayFingerprints || [],
    lastGesture: mem.lastGesture ?? null,
    lastCamera: mem.lastCamera ?? null,
    waitingForAnswer: Boolean(mem.waitingForAnswer),
    pendingQuestion: mem.pendingQuestion ?? null,
  };
}

export function tickMemory(mem: TeacherSessionMemory, elapsedMs: number): TeacherSessionMemory {
  return { ...normalizeSessionMemory(mem), elapsedMs };
}

export function recordAnswer(
  mem: TeacherSessionMemory,
  rec: Omit<StudentAnswerRecord, "atMs">,
): TeacherSessionMemory {
  const answers = [...mem.answers, { ...rec, atMs: mem.elapsedMs }];
  let masteryHint = mem.masteryHint;
  let confusionCount = mem.confusionCount;
  const mistakes = [...mem.mistakes];
  if (rec.correct === true) {
    masteryHint = Math.min(1, masteryHint + 0.12);
  } else if (rec.correct === false) {
    masteryHint = Math.max(0, masteryHint - 0.1);
    confusionCount += 1;
    mistakes.push({
      atMs: mem.elapsedMs,
      topic: rec.topic,
      note: `wrong: ${rec.answer.slice(0, 80)}`,
    });
  }
  return { ...mem, answers, mistakes, masteryHint, confusionCount };
}

export function recordConfusion(
  mem: TeacherSessionMemory,
  topic: string,
  note = "student confused",
): TeacherSessionMemory {
  return {
    ...mem,
    confusionCount: mem.confusionCount + 1,
    masteryHint: Math.max(0, mem.masteryHint - 0.08),
    mistakes: [
      ...mem.mistakes,
      { atMs: mem.elapsedMs, topic, note },
    ],
    notes: [...mem.notes, note],
  };
}

export function markStrategyUsed(
  mem: TeacherSessionMemory,
  strategy: RemediationMode | "direct_explain",
  topic?: string,
): TeacherSessionMemory {
  const strategiesUsed =
    strategy === "direct_explain"
      ? mem.strategiesUsed
      : [...mem.strategiesUsed, strategy as RemediationMode];
  const mistakes = mem.mistakes.map((m, i) =>
    i === mem.mistakes.length - 1 && strategy !== "direct_explain"
      ? { ...m, remediatedWith: strategy as RemediationMode }
      : m,
  );
  const topicsCovered =
    topic && !mem.topicsCovered.includes(topic)
      ? [...mem.topicsCovered, topic]
      : mem.topicsCovered;
  return {
    ...mem,
    lastStrategy: strategy,
    strategiesUsed,
    mistakes,
    topicsCovered,
  };
}

export function nextUnusedRemediation(
  mem: TeacherSessionMemory,
  order: RemediationMode[],
): RemediationMode {
  for (const mode of order) {
    if (!mem.strategiesUsed.includes(mode)) return mode;
  }
  // Cycle with offset by confusion count so we don't loop the same mode forever
  return order[mem.confusionCount % order.length] || "simpler_words";
}

export function setWaitingForAnswer(
  mem: TeacherSessionMemory,
  question: string | null,
): TeacherSessionMemory {
  return {
    ...mem,
    waitingForAnswer: Boolean(question),
    pendingQuestion: question,
  };
}

export function recordPerformanceUse(
  mem: TeacherSessionMemory,
  opts: { gesture?: string; camera?: string; say?: string },
): TeacherSessionMemory {
  let usedGestures = mem.usedGestures;
  let usedCameras = mem.usedCameras;
  let usedSayFingerprints = mem.usedSayFingerprints;
  let lastGesture = mem.lastGesture;
  let lastCamera = mem.lastCamera;
  if (opts.gesture) {
    usedGestures = recordUnique(usedGestures, opts.gesture);
    lastGesture = opts.gesture;
  }
  if (opts.camera) {
    usedCameras = recordUnique(usedCameras, opts.camera);
    lastCamera = opts.camera;
  }
  if (opts.say) {
    usedSayFingerprints = recordUnique(usedSayFingerprints, fingerprintSay(opts.say));
  }
  return {
    ...mem,
    usedGestures,
    usedCameras,
    usedSayFingerprints,
    lastGesture,
    lastCamera,
  };
}

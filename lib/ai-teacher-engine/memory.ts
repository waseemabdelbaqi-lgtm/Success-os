/**
 * Student Memory — remembers across conversations.
 */
import type {
  AffectSignal,
  ConversationTurn,
  LearningPace,
  LearningStyle,
  StudentMemoryRecord,
  TeachingStyle,
} from "@/types/ai-teacher-engine";

const store = new Map<string, StudentMemoryRecord>();

function nowIso() {
  return new Date().toISOString();
}

function defaultMemory(studentId: string, studentName = "Ahmad"): StudentMemoryRecord {
  return {
    schema: "success-os.student-memory.v1",
    studentId,
    studentName,
    preferredLanguage: "en",
    currentCurriculumId: "JO-NATIONAL",
    gradeId: "GRD-00001",
    subjectIds: ["SUB-00001"],
    completedLessonIds: [],
    weakSkillIds: ["SKL-00002"],
    strongSkillIds: [],
    previousQuestionIds: [],
    learningGoals: ["Master fractions before decimals"],
    learningPace: "normal",
    learningStyle: "mixed",
    preferredTeachingStyle: "step_by_step",
    conversationHistory: [],
    affectLast: "neutral",
    updatedAt: nowIso(),
  };
}

export function getOrCreateStudentMemory(
  studentId: string,
  opts?: { studentName?: string },
): StudentMemoryRecord {
  const existing = store.get(studentId);
  if (existing) {
    if (opts?.studentName && opts.studentName !== existing.studentName) {
      existing.studentName = opts.studentName;
      existing.updatedAt = nowIso();
    }
    return cloneMemory(existing);
  }
  const created = defaultMemory(studentId, opts?.studentName || "Ahmad");
  store.set(studentId, created);
  return cloneMemory(created);
}

export function upsertStudentMemory(
  patch: Partial<StudentMemoryRecord> & { studentId: string },
): StudentMemoryRecord {
  const current = store.get(patch.studentId) || defaultMemory(patch.studentId);
  const next: StudentMemoryRecord = {
    ...current,
    ...patch,
    schema: "success-os.student-memory.v1",
    studentId: patch.studentId,
    subjectIds: patch.subjectIds ?? current.subjectIds,
    completedLessonIds: patch.completedLessonIds ?? current.completedLessonIds,
    weakSkillIds: patch.weakSkillIds ?? current.weakSkillIds,
    strongSkillIds: patch.strongSkillIds ?? current.strongSkillIds,
    previousQuestionIds: patch.previousQuestionIds ?? current.previousQuestionIds,
    learningGoals: patch.learningGoals ?? current.learningGoals,
    conversationHistory: patch.conversationHistory ?? current.conversationHistory,
    updatedAt: nowIso(),
  };
  store.set(patch.studentId, next);
  return cloneMemory(next);
}

export function appendConversationTurn(
  studentId: string,
  turn: ConversationTurn,
): StudentMemoryRecord {
  const current = store.get(studentId) || defaultMemory(studentId);
  const history = [...current.conversationHistory, turn].slice(-100);
  const next: StudentMemoryRecord = {
    ...current,
    conversationHistory: history,
    affectLast: turn.affect || current.affectLast,
    previousQuestionIds:
      turn.role === "student"
        ? [...current.previousQuestionIds, turn.id].slice(-50)
        : current.previousQuestionIds,
    updatedAt: nowIso(),
  };
  store.set(studentId, next);
  return cloneMemory(next);
}

export function updateLearningPreferences(
  studentId: string,
  prefs: {
    learningPace?: LearningPace;
    learningStyle?: LearningStyle;
    preferredTeachingStyle?: TeachingStyle;
    preferredLanguage?: string;
    affectLast?: AffectSignal;
  },
): StudentMemoryRecord {
  return upsertStudentMemory({ studentId, ...prefs });
}

export function resetStudentMemoryStore() {
  store.clear();
}

export function listStudentMemoryIds(): string[] {
  return [...store.keys()];
}

function cloneMemory(m: StudentMemoryRecord): StudentMemoryRecord {
  return {
    ...m,
    subjectIds: [...m.subjectIds],
    completedLessonIds: [...m.completedLessonIds],
    weakSkillIds: [...m.weakSkillIds],
    strongSkillIds: [...m.strongSkillIds],
    previousQuestionIds: [...m.previousQuestionIds],
    learningGoals: [...m.learningGoals],
    conversationHistory: m.conversationHistory.map((t) => ({
      ...t,
      multimodal: t.multimodal ? t.multimodal.map((x) => ({ ...x })) : undefined,
    })),
  };
}

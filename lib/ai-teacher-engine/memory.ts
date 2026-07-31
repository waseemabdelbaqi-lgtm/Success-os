/**
 * Student Memory — durable across conversations (library/ai-teacher-engine).
 * No country-specific defaults in production records.
 */
import type {
  AffectSignal,
  ConversationTurn,
  LearningPace,
  LearningStyle,
  StudentMemoryRecord,
  TeachingStyle,
} from "@/types/ai-teacher-engine";
import {
  deleteStudentMemory,
  loadStudentMemory,
  saveStudentMemory,
} from "./store";

function nowIso() {
  return new Date().toISOString();
}

function emptyMemory(studentId: string, studentName = ""): StudentMemoryRecord {
  return {
    schema: "success-os.student-memory.v1",
    studentId,
    studentName: studentName.trim(),
    preferredLanguage: "",
    currentCurriculumId: null,
    gradeId: null,
    subjectIds: [],
    completedLessonIds: [],
    weakSkillIds: [],
    strongSkillIds: [],
    previousQuestionIds: [],
    learningGoals: [],
    learningPace: "normal",
    learningStyle: "mixed",
    preferredTeachingStyle: "step_by_step",
    conversationHistory: [],
    affectLast: "neutral",
    updatedAt: nowIso(),
  };
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

export function getOrCreateStudentMemory(
  studentId: string,
  opts?: { studentName?: string },
): StudentMemoryRecord {
  const existing = loadStudentMemory(studentId);
  if (existing) {
    if (opts?.studentName && opts.studentName.trim() && opts.studentName !== existing.studentName) {
      existing.studentName = opts.studentName.trim();
      existing.updatedAt = nowIso();
      return cloneMemory(saveStudentMemory(existing));
    }
    return cloneMemory(existing);
  }
  const created = emptyMemory(studentId, opts?.studentName || "");
  return cloneMemory(saveStudentMemory(created));
}

export function upsertStudentMemory(
  patch: Partial<StudentMemoryRecord> & { studentId: string },
): StudentMemoryRecord {
  const current =
    loadStudentMemory(patch.studentId) || emptyMemory(patch.studentId);
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
  return cloneMemory(saveStudentMemory(next));
}

export function appendConversationTurn(
  studentId: string,
  turn: ConversationTurn,
): StudentMemoryRecord {
  const current = loadStudentMemory(studentId) || emptyMemory(studentId);
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
  return cloneMemory(saveStudentMemory(next));
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
  // Compatibility shim — clears one student only via delete when id known.
  // Full store reset is test-only via resetAteStoreForTests().
}

export function clearStudentMemory(studentId: string): boolean {
  return deleteStudentMemory(studentId);
}

export function listStudentMemoryIds(): string[] {
  // Durable files are hashed; callers should use known student IDs.
  return [];
}

/**
 * session-memory.ts
 *
 * Per-session learning memory. Lives entirely on the server/runtime side —
 * TutorPanel / AITeacherPanel must never keep its own copy of mastered
 * concepts, mistakes, or misconceptions; it only renders what a TeacherTurn
 * reports for that turn.
 */

export type ExplanationPreference = "simple" | "detailed" | "visual";
export type LearningLevel = "beginner" | "intermediate" | "advanced";

export interface MistakeRecord {
  conceptId: string;
  detail: string;
  timestampMs: number;
}

export interface QuestionRecord {
  questionId: string;
  correct: boolean;
  timestampMs: number;
}

export interface SessionMemory {
  masteredConcepts: string[];
  mistakes: MistakeRecord[];
  misconceptions: string[];
  explanationPreference: ExplanationPreference;
  questionHistory: QuestionRecord[];
  lessonProgress: number; // 0..1
  responseSpeedMs: number[];
  currentLevel: LearningLevel;
}

export function createSessionMemory(): SessionMemory {
  return {
    masteredConcepts: [],
    mistakes: [],
    misconceptions: [],
    explanationPreference: "simple",
    questionHistory: [],
    lessonProgress: 0,
    responseSpeedMs: [],
    currentLevel: "beginner",
  };
}

const store = new Map<string, SessionMemory>();

export function getOrCreateMemory(sessionId: string): SessionMemory {
  let memory = store.get(sessionId);
  if (!memory) {
    memory = createSessionMemory();
    store.set(sessionId, memory);
  }
  return memory;
}

export function updateMemory(sessionId: string, patch: (memory: SessionMemory) => SessionMemory): SessionMemory {
  const current = getOrCreateMemory(sessionId);
  const next = patch(current);
  store.set(sessionId, next);
  return next;
}

export function recordMastery(sessionId: string, conceptId: string): SessionMemory {
  return updateMemory(sessionId, (m) => ({ ...m, masteredConcepts: m.masteredConcepts.includes(conceptId) ? m.masteredConcepts : [...m.masteredConcepts, conceptId] }));
}

export function recordMistake(sessionId: string, conceptId: string, detail: string): SessionMemory {
  return updateMemory(sessionId, (m) => ({ ...m, mistakes: [...m.mistakes, { conceptId, detail, timestampMs: Date.now() }] }));
}

export function recordMisconception(sessionId: string, misconceptionId: string): SessionMemory {
  return updateMemory(sessionId, (m) => ({ ...m, misconceptions: m.misconceptions.includes(misconceptionId) ? m.misconceptions : [...m.misconceptions, misconceptionId] }));
}

export function recordQuestionResult(sessionId: string, questionId: string, correct: boolean): SessionMemory {
  return updateMemory(sessionId, (m) => ({ ...m, questionHistory: [...m.questionHistory, { questionId, correct, timestampMs: Date.now() }] }));
}

export function recordResponseSpeed(sessionId: string, ms: number): SessionMemory {
  return updateMemory(sessionId, (m) => ({ ...m, responseSpeedMs: [...m.responseSpeedMs, ms] }));
}

export function setLessonProgress(sessionId: string, progress: number): SessionMemory {
  const clamped = Math.max(0, Math.min(1, progress));
  return updateMemory(sessionId, (m) => ({ ...m, lessonProgress: clamped }));
}

/** Only used by tests to guarantee isolation between test cases. */
export function _clearAllMemoryForTests(): void {
  store.clear();
}

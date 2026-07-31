/**
 * Education Intelligence Core (EIC) — thinks like an experienced teacher.
 *
 * Schema: success-os.education-intelligence-core.v1
 *
 * Updates Learning DNA after every interaction. Predicts next/review lessons,
 * likely confusion, exam risk, and adaptive teaching strategy.
 *
 * This wave is a production-grade **heuristic intelligence engine** grounded in
 * ATE memory, skill progress, and Knowledge Graph — not unconstrained LLM guessing.
 * Deeper ML models may plug into the same contracts in Learning Intelligence (#59).
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type {
  AffectSignal,
  LearningPace,
  LearningStyle,
  StudentControlIntent,
  TeachingStyle,
} from "./ai-teacher-engine";

export type EducationIntelligenceCoreSchema =
  "success-os.education-intelligence-core.v1";

export type LevelScore = {
  /** 0–100 continuous score */
  score: number;
  band: "very_low" | "low" | "moderate" | "high" | "very_high";
};

/** Lifelong Learning DNA — updated after every interaction. */
export type LearningDna = {
  schema: "success-os.learning-dna.v1";
  studentId: string;
  studentName: string;
  knowledgeLevel: LevelScore;
  understandingLevel: LevelScore;
  confidenceLevel: LevelScore;
  attentionLevel: LevelScore;
  memoryStrength: LevelScore;
  criticalThinking: LevelScore;
  problemSolving: LevelScore;
  readingSpeed: LevelScore;
  listeningAbility: LevelScore;
  speakingAbility: LevelScore;
  writingAbility: LevelScore;
  preferredLearningStyle: LearningStyle;
  preferredTeacherStyle: TeachingStyle;
  preferredExamples: string[];
  preferredLanguage: string;
  weakSkillIds: string[];
  strongSkillIds: string[];
  currentGoals: string[];
  /** Fingerprints of explanations already used — never reuse the same one */
  usedExplanationFingerprints: string[];
  /** Concept → last confusion timestamps / counts */
  confusionLog: ConfusionEvent[];
  repeatedMistakeCodes: string[];
  guessingSignals: number;
  trueUnderstandingSignals: number;
  learningVelocity: LearningPace;
  interactionCount: number;
  lastInsight: LocaleText | null;
  updatedAt: string;
  createdAt: string;
};

export type ConfusionEvent = {
  id: string;
  at: string;
  conceptId: string | null;
  conceptLabel: LocaleText;
  prerequisiteSkillId: string | null;
  utterance: string;
  intent: StudentControlIntent | "unknown";
  affect: AffectSignal;
  whyConfused: LocaleText;
};

export type TeacherUnderstanding = {
  schema: "success-os.eic-teacher-understanding.v1";
  alreadyKnows: string[];
  doesNotKnow: string[];
  whyConfused: LocaleText | null;
  conceptCausingConfusion: LocaleText | null;
  missingPrerequisiteSkillId: string | null;
  howMuchRemembers: LevelScore;
  howFastLearns: LearningPace;
  bestExplanationStyle: TeachingStyle;
  repeatedMistakes: string[];
  isGuessing: boolean;
  trulyUnderstands: boolean;
};

export type AdaptiveStrategy = {
  schema: "success-os.eic-adaptive-strategy.v1";
  mode: "struggling" | "steady" | "advanced";
  languageComplexity: "simpler" | "normal" | "advanced";
  moreExamples: boolean;
  moreDrawings: boolean;
  moreInteraction: boolean;
  increaseDifficulty: boolean;
  reduceExplanation: boolean;
  askDeeperQuestions: boolean;
  teachingStyle: TeachingStyle;
  explanationFingerprint: string;
  /** Guaranteed different from prior fingerprints when history exists */
  isNovelExplanation: boolean;
  teacherMoves: string[];
};

export type LearningPrediction = {
  schema: "success-os.eic-predictions.v1";
  nextLessonId: string | null;
  reviewLessonIds: string[];
  conceptsLikelyToConfuse: LocaleText[];
  examQuestionsLikelyMissed: LocaleText[];
  skillsNotYetMastered: string[];
  confidence: number;
  notes: string[];
};

export type InsightUtterance = {
  schema: "success-os.eic-insight.v1";
  text: LocaleText;
  /** e.g. "I noticed that you still confuse…" */
  kind: "prerequisite_review" | "repeated_confusion" | "encouragement" | "pace_shift";
  grounded: true;
  inventsCurriculumFacts: false;
};

export type EicInteractionInput = {
  studentId: string;
  studentName?: string;
  utterance?: string;
  intent?: StudentControlIntent | "unknown";
  affect?: AffectSignal;
  focusLessonId?: string;
  focusConceptLabel?: LocaleText;
  weakSkillIds?: string[];
  strongSkillIds?: string[];
  completedLessonIds?: string[];
  language?: string;
  preferredLearningStyle?: LearningStyle;
  preferredTeacherStyle?: TeachingStyle;
  currentGoals?: string[];
  /** Optional prerequisite skill id from KG / lesson dependency */
  prerequisiteSkillId?: string | null;
};

export type EicInteractionResult = {
  schema: "success-os.eic-interaction-result.v1";
  studentId: string;
  understanding: TeacherUnderstanding;
  dna: LearningDna;
  strategy: AdaptiveStrategy;
  predictions: LearningPrediction;
  insight: InsightUtterance | null;
  dnaUpdated: true;
  nothingForgotten: true;
  engineKind: "heuristic_teacher_intelligence";
  inventsCurriculumFacts: false;
  notes: string[];
};

export type EducationIntelligenceCoreSnapshot = {
  schema: EducationIntelligenceCoreSchema;
  role: "educational_intelligence";
  thinksLikeExperiencedTeacher: true;
  notAChatbot: true;
  learningDnaFields: string[];
  continuousUnderstanding: string[];
  predictions: string[];
  adaptiveRules: string[];
  explanationNovelty: true;
  lifelongProfile: true;
  engineKind: "heuristic_teacher_intelligence";
  deeperMlReservedForPr: "#59 Learning Intelligence";
  safety: {
    neverInventCurriculumFacts: true;
    groundInAteAndKnowledgeGraph: true;
  };
  rules: string[];
  notes: string[];
};

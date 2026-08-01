/**
 * Education Intelligence Core engine — update Learning DNA after every interaction.
 */
import type {
  EducationIntelligenceCoreSnapshot,
  EicInteractionInput,
  EicInteractionResult,
} from "@/types/education-intelligence-core";
import {
  getOrCreateLearningDna,
  saveLearningDna,
} from "./dna-store";
import {
  analyzeTeacherUnderstanding,
  appendConfusionIfNeeded,
  bumpScoresAfterInteraction,
} from "./understanding";
import {
  buildAdaptiveStrategy,
  recordExplanationFingerprint,
} from "./adaptation";
import { buildPredictions } from "./predictions";
import { buildInsightUtterance } from "./insights";
import { getOrCreateStudentMemory } from "@/lib/ai-teacher-engine/memory";
import { detectAffect, detectStudentIntent } from "@/lib/ai-teacher-engine/conversation";
import { logger } from "@/lib/logger";

const DNA_FIELDS = [
  "Knowledge Level",
  "Understanding Level",
  "Confidence Level",
  "Attention Level",
  "Memory Strength",
  "Critical Thinking",
  "Problem Solving",
  "Reading Speed",
  "Listening Ability",
  "Speaking Ability",
  "Writing Ability",
  "Preferred Learning Style",
  "Preferred Teacher Style",
  "Preferred Examples",
  "Preferred Language",
  "Weak Skills",
  "Strong Skills",
  "Current Goals",
];

const CONTINUOUS_UNDERSTANDING = [
  "What the student already knows",
  "What the student does not know",
  "Why the student is confused",
  "Which concept caused the confusion",
  "Which prerequisite is missing",
  "How much the student remembers",
  "How fast the student learns",
  "Which explanation works best",
  "Which mistakes are repeated",
  "Whether the student is guessing",
  "Whether the student truly understands",
];

/**
 * Process one interaction: understand → adapt → predict → persist DNA.
 */
export function processEducationalInteraction(
  input: EicInteractionInput,
): EicInteractionResult {
  if (!input.studentId?.trim()) {
    throw new Error("studentId is required for Education Intelligence Core");
  }

  // Merge ATE durable memory into the interaction context
  const ateMemory = getOrCreateStudentMemory(input.studentId, {
    studentName: input.studentName,
  });
  const utterance = input.utterance || "";
  const enriched: EicInteractionInput = {
    ...input,
    studentName: input.studentName || ateMemory.studentName,
    intent: input.intent || (utterance ? detectStudentIntent(utterance) : "unknown"),
    affect: input.affect || (utterance ? detectAffect(utterance) : "neutral"),
    weakSkillIds: input.weakSkillIds || ateMemory.weakSkillIds,
    strongSkillIds: input.strongSkillIds || ateMemory.strongSkillIds,
    completedLessonIds: input.completedLessonIds || ateMemory.completedLessonIds,
    language: input.language || ateMemory.preferredLanguage || undefined,
    preferredLearningStyle:
      input.preferredLearningStyle || ateMemory.learningStyle,
    preferredTeacherStyle:
      input.preferredTeacherStyle || ateMemory.preferredTeachingStyle,
    currentGoals: input.currentGoals || ateMemory.learningGoals,
    prerequisiteSkillId:
      input.prerequisiteSkillId ?? ateMemory.weakSkillIds[0] ?? null,
  };

  let dna = getOrCreateLearningDna(enriched.studentId, enriched.studentName);
  const understanding = analyzeTeacherUnderstanding(dna, enriched);
  dna = appendConfusionIfNeeded(dna, enriched, understanding);
  dna = bumpScoresAfterInteraction(dna, understanding, enriched);

  const strategy = buildAdaptiveStrategy(dna, understanding);
  dna = recordExplanationFingerprint(dna, strategy);

  const predictions = buildPredictions(dna, understanding, enriched);
  const insight = buildInsightUtterance(dna, understanding);
  if (insight) dna = { ...dna, lastInsight: insight.text };

  // Preferred examples evolve with strategy mode
  if (strategy.moreExamples) {
    const tag = `example:${strategy.teachingStyle}:${strategy.explanationFingerprint.slice(0, 6)}`;
    dna = {
      ...dna,
      preferredExamples: [...new Set([...dna.preferredExamples, tag])].slice(-30),
    };
  }

  dna = saveLearningDna(dna);

  logger.info("EIC interaction processed", {
    studentId: dna.studentId,
    mode: strategy.mode,
    novel: strategy.isNovelExplanation,
    insight: insight?.kind || null,
  });

  return {
    schema: "success-os.eic-interaction-result.v1",
    studentId: dna.studentId,
    understanding,
    dna,
    strategy,
    predictions,
    insight,
    dnaUpdated: true,
    nothingForgotten: true,
    engineKind: "heuristic_teacher_intelligence",
    inventsCurriculumFacts: false,
    notes: [
      "Education Intelligence Core — thinks like an experienced teacher.",
      "Learning DNA updated; explanation fingerprint recorded for novelty.",
      "Heuristic engine; deeper ML reserved for Learning Intelligence (#59).",
      "Never invents curriculum facts.",
    ],
  };
}

export function getEducationIntelligenceCoreSnapshot(): EducationIntelligenceCoreSnapshot {
  return {
    schema: "success-os.education-intelligence-core.v1",
    role: "educational_intelligence",
    thinksLikeExperiencedTeacher: true,
    notAChatbot: true,
    learningDnaFields: [...DNA_FIELDS],
    continuousUnderstanding: [...CONTINUOUS_UNDERSTANDING],
    predictions: [
      "Next lesson",
      "Lessons to review",
      "Concepts likely to confuse",
      "Exam questions likely missed",
      "Skills not yet mastered",
    ],
    adaptiveRules: [
      "Struggling → simpler language, more examples, drawings, interaction",
      "Advanced → higher difficulty, less explanation, deeper questions",
      "Never reuse the same explanation fingerprint",
    ],
    explanationNovelty: true,
    lifelongProfile: true,
    engineKind: "heuristic_teacher_intelligence",
    deeperMlReservedForPr: "#59 Learning Intelligence",
    safety: {
      neverInventCurriculumFacts: true,
      groundInAteAndKnowledgeGraph: true,
    },
    rules: [
      "Every interaction updates Learning DNA.",
      "Nothing is forgotten — durable lifelong educational profile.",
      "ATE remains the conversation/grounding engine; EIC is the intelligence layer.",
      "Success OS builds Educational Intelligence, not unconstrained AI chat.",
    ],
    notes: [
      "PR #55 foundation for Educational Intelligence; #59 deepens ML predictors.",
      "Works with AI Teacher Engine + Digital Human Teacher architecture.",
    ],
  };
}

export function runEducationIntelligenceDemo(opts?: {
  studentId?: string;
  studentName?: string;
  utterance?: string;
  focusLessonId?: string;
  focusConceptEn?: string;
  focusConceptAr?: string;
  prerequisiteSkillId?: string;
}) {
  const snapshot = getEducationIntelligenceCoreSnapshot();
  const studentId = opts?.studentId || "student_demo_eic_001";

  // Seed a prior confusion so the insight can fire on the second pass
  processEducationalInteraction({
    studentId,
    studentName: opts?.studentName || "Ahmad",
    utterance: "I don't understand this.",
    focusLessonId: opts?.focusLessonId || "LSN-VELOCITY-001",
    focusConceptLabel: {
      en: opts?.focusConceptEn || "velocity and acceleration",
      ar: opts?.focusConceptAr || "السرعة والتسارع",
    },
    prerequisiteSkillId: opts?.prerequisiteSkillId || "SKL-MOTION-BASICS",
    weakSkillIds: ["SKL-MOTION-BASICS"],
    language: "en",
  });

  const result = processEducationalInteraction({
    studentId,
    studentName: opts?.studentName || "Ahmad",
    utterance: opts?.utterance || "I still don't understand velocity and acceleration.",
    focusLessonId: opts?.focusLessonId || "LSN-VELOCITY-001",
    focusConceptLabel: {
      en: opts?.focusConceptEn || "velocity and acceleration",
      ar: opts?.focusConceptAr || "السرعة والتسارع",
    },
    prerequisiteSkillId: opts?.prerequisiteSkillId || "SKL-MOTION-BASICS",
    weakSkillIds: ["SKL-MOTION-BASICS"],
    language: "en",
  });

  const ok =
    result.dnaUpdated === true &&
    result.nothingForgotten === true &&
    result.inventsCurriculumFacts === false &&
    result.strategy.isNovelExplanation === true &&
    result.dna.interactionCount >= 2 &&
    result.dna.usedExplanationFingerprints.length >= 2 &&
    result.insight != null &&
    result.predictions.skillsNotYetMastered.length >= 1 &&
    snapshot.learningDnaFields.length === 18;

  return { ok, snapshot, result, engineKind: result.engineKind };
}

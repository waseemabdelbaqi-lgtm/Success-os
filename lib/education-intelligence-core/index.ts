/**
 * Education Intelligence Core (EIC) — public API.
 */
export {
  level,
  emptyLearningDna,
  loadLearningDna,
  saveLearningDna,
  getOrCreateLearningDna,
  resetEicStoreForTests,
} from "./dna-store";
export {
  analyzeTeacherUnderstanding,
  appendConfusionIfNeeded,
  bumpScoresAfterInteraction,
} from "./understanding";
export {
  buildAdaptiveStrategy,
  recordExplanationFingerprint,
} from "./adaptation";
export { buildPredictions } from "./predictions";
export { buildInsightUtterance } from "./insights";
export {
  processEducationalInteraction,
  getEducationIntelligenceCoreSnapshot,
  runEducationIntelligenceDemo,
} from "./engine";

export function educationIntelligenceCoreStatus() {
  return {
    schema: "success-os.education-intelligence-core.v1",
    role: "educational_intelligence",
    thinksLikeExperiencedTeacher: true,
    notAChatbot: true,
    learningDna: true,
    adaptiveAnswers: true,
    explanationNovelty: true,
    lifelongProfile: true,
    predictions: true,
    engineKind: "heuristic_teacher_intelligence",
    inventsCurriculumFacts: false,
    deeperMlReservedForPr: "#59 Learning Intelligence",
    adr: ["ADR-0049", "ADR-0055", "ADR-0055.1", "ADR-0055.2"],
    parentPr: "#55 AI Teacher Engine",
  };
}

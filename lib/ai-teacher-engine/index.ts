/**
 * AI Teacher Engine (ATE) — public API (PR #55).
 */
export {
  ATE_LAYER_CONTRACTS,
  AI_TEACHER_ENGINE_PATH,
  AI_TEACHER_ENGINE_DISPLAY_PATH,
} from "./layers";
export { ATE_CAPABILITIES } from "./capabilities";
export {
  ATE_PERMISSIONS,
  ALL_ATE_PERMISSIONS,
  getAtePermissionsForRole,
  roleHasAtePermission,
  hasAtePermission,
} from "./permissions";
export {
  ATE_PLATFORM_PERMISSIONS,
  ATE_PUBLIC_ACTIONS,
  requireAtePermission,
} from "./auth-guard";
export {
  getOrCreateStudentMemory,
  upsertStudentMemory,
  appendConversationTurn,
  updateLearningPreferences,
  clearStudentMemory,
  resetStudentMemoryStore,
  listStudentMemoryIds,
} from "./memory";
export {
  STUDENT_CONTROL_INTENTS,
  detectStudentIntent,
  detectAffect,
  normalizeMultimodalInputs,
  conversationTurnId,
} from "./conversation";
export { groundTeacherReply, buildCitations, SAFETY_RULES } from "./grounding";
export { reasonTeachingMove } from "./reasoning";
export { getVoiceSessionContract } from "./voice";
export { getWhiteboardSessionContract } from "./whiteboard";
export {
  runAiTeacherTurn,
  getAiTeacherEngineSnapshot,
  runAiTeacherEngineDemo,
} from "./orchestrator";
export {
  getAteMetrics,
  loadTeachingTurn,
  saveTeachingTurn,
  appendAteAudit,
  resetAteStoreForTests,
  loadStudentMemory,
} from "./store";
export {
  ateTurnRequestSchema,
  ateMemoryWriteSchema,
  ateDemoRequestSchema,
  formatZodError,
} from "./validation";

export function aiTeacherEngineStatus() {
  return {
    schema: "success-os.ai-teacher-engine.v1",
    role: "virtual_teacher",
    notAChatbot: true,
    path: [
      "Student",
      "AI Teacher",
      "Conversation Engine",
      "Reasoning Engine",
      "Student Memory",
      "Knowledge Graph",
      "Curriculum Registry",
      "Interactive Lesson Engine",
      "Digital Books",
      "Videos",
      "Assessments",
    ],
    conversationEngine: true,
    studentMemory: true,
    durableMemory: true,
    knowledgeGrounded: true,
    curriculumAware: true,
    lessonAwareRecommendations: true,
    voiceReadyArchitecture: true,
    whiteboardReadyArchitecture: true,
    multilingual: true,
    countryAgnosticProductionPath: true,
    avatars: false,
    animations: false,
    aiVideos: false,
    liveClassrooms: false,
    aiGeneration: false,
    ileSoleRuntime: true,
    adr: ["ADR-0049", "ADR-0050", "ADR-0054", "ADR-0055", "ADR-0055.1"],
    parentPr: "#54 Universal Curriculum Mapping Engine",
    roadmapPr: "#55 AI Teacher Engine",
    digitalHumanTeacherArchitecture: true,
    liveAvatarVideo: false,
  };
}

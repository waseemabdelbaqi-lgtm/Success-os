export { generateCharacter, getCharacter, listHumanCharacters } from "./character-generator";
export { contentSeed, splitTeachingLines } from "./seed";
export { composeSkeletonKeys, sampleBones } from "./skeleton-animation";
export { facialFromEmotion } from "./facial-rig";
export { composeBlendShapes, buildBlendShapeTrack, sampleBlendShapes } from "./blend-shapes";
export {
  textToPhonemeTrack,
  phonemeToMouth,
  samplePhoneme,
  graphemeToPhoneme,
  jawFromPhoneme,
} from "./lip-sync";
export { buildEyeTrack, sampleEyes } from "./eye-tracking";
export { buildHeadTrack, sampleHead } from "./head-tracking";
export { buildEmotionTrack, emotionForBlock, sampleEmotion } from "./emotion-system";
export { buildGestureTrack, gestureFromLine, sampleGesture } from "./gesture-engine";
export { buildBehaviourTrack, goalForKind, sampleBehaviour } from "./ai-behaviour-engine";
export { buildCameraTrack, shotForBeat, sampleCamera } from "./camera-director";
export { buildLightTrack, lightForState, sampleLight } from "./lighting-director";
export { assembleTimeline, assertTimelineIntegrity } from "./animation-timeline";
export { directLesson } from "./lesson-director";
export { sampleFrame } from "./sampler";
export {
  detectContentAct,
  directSentence,
  buildScreenElement,
} from "./semantic-sentence";
export { showcaseLessonInput, preview10sLessonInput } from "./showcase-lesson";
export {
  previewLessonInput,
  buildPreviewPlan,
  buildShowcasePlan,
  buildDemoPlans,
  buildShowcasePlans,
  playPlan,
} from "./runtime";
export {
  createAdapter,
  resolveAdapterMeta,
  createLocalPhotorealAdapter,
  createMetaHumanAdapter,
  createHeyGenAdapter,
} from "./adapters";
export { gestureToClassroomPose } from "./adapters/local-photoreal";
export {
  getTeacherPersona,
  listTeacherPersonas,
  personaEmotion,
} from "./teacher-persona";
export type { TeacherPersona, TeacherPersonaId } from "./teacher-persona";
export {
  listProofLessons,
  listProofSubjects,
  proofLessonsForSubject,
  getProofLessonMeta,
  buildProofLessonInput,
  PROOF_LESSONS,
} from "./proof-lessons";
export type { ProofLessonId, ProofLessonMeta } from "./proof-lessons";
export { adaptLiveTeacher } from "./adapt";
export type { StudentLiveEvent, LiveAdaptResult } from "./adapt";
export {
  getDefaultTeacherProfile,
  listDefaultTeacherProfiles,
} from "./teacher-profiles-defaults";
export {
  createSessionMemory,
  tickMemory,
  normalizeSessionMemory,
  recordAnswer,
  recordConfusion,
  markStrategyUsed,
  nextUnusedRemediation,
  setWaitingForAnswer,
  recordPerformanceUse,
} from "./session-memory";
export {
  bridgeInteractiveLessonToHuman,
  planLessonForTeacher,
  listTeachableCatalog,
  resolveTeachablePackage,
} from "./universal-lesson-bridge";
export type { PlatformTeacherId } from "./universal-lesson-bridge";
export {
  analyzeLessonContent,
  analyzeScriptedLesson,
  teachingPlanToBlocks,
} from "./lesson-content-analyzer";
export {
  deriveLiveTeacherState,
  TeacherState,
} from "./derive-live-teacher-state";
export type { LiveTeacherState, DeriveLiveTeacherStateOpts } from "./derive-live-teacher-state";
export { pickUnused, fingerprintSay, recordUnique } from "./performance-variety";
export {
  createBlackboard,
  tickTeacherMind,
  describeTeacherMindTree,
} from "./teacher-mind";
export {
  buildTeacherBehaviourTree,
  tickBehaviourTree,
} from "./behaviour-tree";
export {
  BONE_TO_MIXAMO,
  FACE_MORPHS,
  fingerCurlForGesture,
  humanoidUrl,
  degToRad,
} from "./humanoid-rig";

/** Human Teacher Engine — elevated teach path (Sara/Ali sole identity). */
export {
  teachHumanLesson,
  buildSessionBrief,
  resolveStudioTheme,
  rebuildLipPerformance,
} from "@/lib/human-teacher-engine";

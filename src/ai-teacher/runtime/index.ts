export {
  QualityResult,
  validateHumanTeacher,
  assertTeacherQuality,
  diagnoseTeacherQuality,
  HUMAN_TEACHER_QUALITY_MIN,
  type HumanTeacherMetrics,
} from "./quality-gate";
export { measureHumanTeacherMetrics } from "./measure-metrics";
export {
  bootstrapTeacher,
  startTeacherSession,
  probeTeacherQuality,
  type TeacherId,
} from "./bootstrap";
export {
  bootstrapTeacher as bootstrapTeacherAlias,
  startTeacherSession as startTeacherSessionFromBootstrap,
  probeTeacherQuality as probeTeacherQualityAlias,
} from "./bootstrap-teacher";
export { HumanEngine } from "./HumanEngine";
export {
  finalAcceptanceGate,
  assertFinalAcceptance,
  type AcceptanceResult,
} from "./final-acceptance-gate";
export {
  buildAcceptanceRuntime,
  hasMandatory15SecondShowcase,
  resolveShowcasePath,
  type FinalAcceptanceRuntime,
} from "./acceptance-runtime";
export {
  buildRecoveryPlan,
  collectFailedChecks,
  buildTeacherRecoveryPlan,
  type AcceptanceFailure,
  type RecoveryTask,
} from "./recovery-plan";
export { RecoveryEngine } from "./RecoveryEngine";

/** Full recovery engine (ordered dependencies, evidence, acceptance). */
export {
  PRIMARY_TEACHER_IDS,
  PRIMARY_TEACHERS,
  REQUIRED_SCORE,
  RECOVERY_ORDER,
  buildRecoveryPlan as buildEngineRecoveryPlan,
  updateTeacherScore,
  startRecoveryTask,
  getActiveRecoveryTask,
  getRecoveryPlanResponse,
  syncTeacherFromAcceptanceRuntime,
  normalizePrimaryTeacherId,
  assertPrimaryTeacher,
  calculateAcceptanceStatus,
} from "@/src/lib/ai-teachers/recovery-engine";

/** Photorealism engine — first recovery dependency (honest FAIL until ≥95). */
export {
  calculatePhotorealismScore,
  detectPhotorealismFailures,
  inspectPhotorealism,
  inspectCurrentTeacherPhotorealism,
  PHOTOREALISM_REQUIRED_SCORE,
  type PhotorealismMetrics,
  type PhotorealismInspection,
} from "@/src/lib/ai-teachers/photorealism-engine";

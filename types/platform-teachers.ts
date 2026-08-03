/**
 * Platform Teachers Doctrine — Sara & Ali.
 * Schema: success-os.platform-teachers.v1
 *
 * Binding: these two are the official faces of Success OS.
 * Any subject / curriculum / book / course must be teachable by them
 * without creating a new teacher. Specialists only for a different role later.
 *
 * Acceptance: complete only when agent verification AND owner Demo URL both succeed.
 */

export type PlatformTeachersSchema = "success-os.platform-teachers.v1";

/** Only official primary platform teachers. */
export type PlatformTeacherId = "sara" | "ali";

export const PLATFORM_TEACHER_IDS = ["sara", "ali"] as const satisfies readonly PlatformTeacherId[];

export type PlatformTeacherCapability =
  | "subject_mastery_before_explain"
  | "graduated_by_student_level"
  | "multi_explanation_styles"
  | "board_drawings_equations"
  | "models_3d_experiments_sims"
  | "mid_lesson_qa_evaluate_correct"
  | "reexplain_differently"
  | "auto_pace_and_detail"
  | "gaze_gesture_face_body"
  | "natural_multilingual_voice"
  | "session_memory_strengths_weaknesses"
  | "stable_persona_across_subjects";

export const PLATFORM_TEACHER_CAPABILITIES: readonly PlatformTeacherCapability[] = [
  "subject_mastery_before_explain",
  "graduated_by_student_level",
  "multi_explanation_styles",
  "board_drawings_equations",
  "models_3d_experiments_sims",
  "mid_lesson_qa_evaluate_correct",
  "reexplain_differently",
  "auto_pace_and_detail",
  "gaze_gesture_face_body",
  "natural_multilingual_voice",
  "session_memory_strengths_weaknesses",
  "stable_persona_across_subjects",
] as const;

/**
 * Dual acceptance: agent success alone is never enough.
 * Owner must verify on a live public Demo URL.
 */
export type DualAcceptancePolicy = {
  schema: "success-os.dual-acceptance.v1";
  agentVerificationRequired: true;
  ownerLiveDemoRequired: true;
  incompleteWithoutOwnerDemo: true;
};

export const DUAL_ACCEPTANCE_POLICY: DualAcceptancePolicy = {
  schema: "success-os.dual-acceptance.v1",
  agentVerificationRequired: true,
  ownerLiveDemoRequired: true,
  incompleteWithoutOwnerDemo: true,
};

export type PlatformTeachersDoctrine = {
  schema: PlatformTeachersSchema;
  version: string;
  officialTeacherIds: readonly PlatformTeacherId[];
  role: "platform_official_primary";
  teachAnySubjectWithoutNewTeacher: true;
  newTeacherOnlyForDifferentRole: true;
  specialistsDeferred: true;
  targetQuality: "near_best_human_professional_plus_ai_personalization";
  capabilities: readonly PlatformTeacherCapability[];
  acceptance: DualAcceptancePolicy;
  doctrineDoc: "docs/cursor/platform-teachers-doctrine.md";
};

export const PLATFORM_TEACHERS_DOCTRINE: PlatformTeachersDoctrine = {
  schema: "success-os.platform-teachers.v1",
  version: "1.0.0",
  officialTeacherIds: PLATFORM_TEACHER_IDS,
  role: "platform_official_primary",
  teachAnySubjectWithoutNewTeacher: true,
  newTeacherOnlyForDifferentRole: true,
  specialistsDeferred: true,
  targetQuality: "near_best_human_professional_plus_ai_personalization",
  capabilities: PLATFORM_TEACHER_CAPABILITIES,
  acceptance: DUAL_ACCEPTANCE_POLICY,
  doctrineDoc: "docs/cursor/platform-teachers-doctrine.md",
};

export function isPlatformTeacherId(id: string): id is PlatformTeacherId {
  return id === "sara" || id === "ali";
}

export function assertPlatformTeacherId(id: string): PlatformTeacherId {
  if (!isPlatformTeacherId(id)) {
    throw new Error(
      `Only platform teachers sara|ali are allowed (got "${id}"). See docs/cursor/platform-teachers-doctrine.md`,
    );
  }
  return id;
}

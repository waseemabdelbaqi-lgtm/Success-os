/**
 * Platform Teachers Doctrine — Sara & Ali (world-class phase).
 * Schema: success-os.platform-teachers.v1
 *
 * Platform success depends on these two only. Not avatars — professional
 * digital teachers. Any subject/book/curriculum/course without HE rewrite.
 * Complete only when agent verification AND owner live Demo both succeed.
 */

export type PlatformTeachersSchema = "success-os.platform-teachers.v1";

/** Only official primary platform teachers. */
export type PlatformTeacherId = "sara" | "ali";

export const PLATFORM_TEACHER_IDS = ["sara", "ali"] as const satisfies readonly PlatformTeacherId[];

/** Subjects required before Sara/Ali can be called complete. */
export type PlatformAcceptanceSubject =
  | "math"
  | "physics"
  | "chemistry"
  | "biology"
  | "languages"
  | "programming";

export const PLATFORM_ACCEPTANCE_SUBJECTS = [
  "math",
  "physics",
  "chemistry",
  "biology",
  "languages",
  "programming",
] as const satisfies readonly PlatformAcceptanceSubject[];

export type PlatformPersonaLock = {
  id: PlatformTeacherId;
  ar: string;
  en: string;
  traits: readonly string[];
};

export const PLATFORM_PERSONA_LOCKS = {
  sara: {
    id: "sara",
    ar: "هادئة، مشجعة، منظمة، تشرح بالتدرج",
    en: "Calm, encouraging, organized, gradual",
    traits: ["calm", "encouraging", "organized", "gradual"] as const,
  },
  ali: {
    id: "ali",
    ar: "مباشر، عملي، حل مشكلات، تفكير تحليلي",
    en: "Direct, practical, problem-solving, analytical",
    traits: ["direct", "practical", "problem_solving", "analytical"] as const,
  },
} as const satisfies Record<PlatformTeacherId, PlatformPersonaLock>;

export type PlatformTeacherCapability =
  | "deep_mastery_before_explain"
  | "multi_strategy_auto_select"
  | "graduated_by_student_level"
  | "mid_lesson_qa_evaluate_correct"
  | "reexplain_differently"
  | "board_drawings_equations"
  | "models_3d_sims_experiments_when_valuable"
  | "session_memory_strengths_weaknesses"
  | "stable_persona_across_subjects_and_languages"
  | "multilingual_voice_engine_max"
  | "purposeful_motion_every_act"
  | "world_class_studio_presence";

export const PLATFORM_TEACHER_CAPABILITIES: readonly PlatformTeacherCapability[] = [
  "deep_mastery_before_explain",
  "multi_strategy_auto_select",
  "graduated_by_student_level",
  "mid_lesson_qa_evaluate_correct",
  "reexplain_differently",
  "board_drawings_equations",
  "models_3d_sims_experiments_when_valuable",
  "session_memory_strengths_weaknesses",
  "stable_persona_across_subjects_and_languages",
  "multilingual_voice_engine_max",
  "purposeful_motion_every_act",
  "world_class_studio_presence",
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
  demoAfterEveryImprovement: true;
};

export const DUAL_ACCEPTANCE_POLICY: DualAcceptancePolicy = {
  schema: "success-os.dual-acceptance.v1",
  agentVerificationRequired: true,
  ownerLiveDemoRequired: true,
  incompleteWithoutOwnerDemo: true,
  demoAfterEveryImprovement: true,
};

export type PlatformTeachersDoctrine = {
  schema: PlatformTeachersSchema;
  version: string;
  phase: "world_class";
  officialTeacherIds: readonly PlatformTeacherId[];
  role: "platform_official_primary";
  noNewTeachersUntilWorldClass: true;
  notAvatarGoal: "indistinguishable_professional_digital_teacher";
  teachAnySubjectWithoutEngineRewrite: true;
  newTeacherOnlyForDifferentRole: true;
  specialistsDeferred: true;
  personaLocks: typeof PLATFORM_PERSONA_LOCKS;
  acceptanceSubjects: readonly PlatformAcceptanceSubject[];
  targetQuality: "world_class_human_professional_plus_ai_personalization";
  capabilities: readonly PlatformTeacherCapability[];
  purposefulMotionOnly: true;
  acceptance: DualAcceptancePolicy;
  doctrineDoc: "docs/cursor/platform-teachers-doctrine.md";
};

export const PLATFORM_TEACHERS_DOCTRINE: PlatformTeachersDoctrine = {
  schema: "success-os.platform-teachers.v1",
  version: "2.0.0",
  phase: "world_class",
  officialTeacherIds: PLATFORM_TEACHER_IDS,
  role: "platform_official_primary",
  noNewTeachersUntilWorldClass: true,
  notAvatarGoal: "indistinguishable_professional_digital_teacher",
  teachAnySubjectWithoutEngineRewrite: true,
  newTeacherOnlyForDifferentRole: true,
  specialistsDeferred: true,
  personaLocks: PLATFORM_PERSONA_LOCKS,
  acceptanceSubjects: PLATFORM_ACCEPTANCE_SUBJECTS,
  targetQuality: "world_class_human_professional_plus_ai_personalization",
  capabilities: PLATFORM_TEACHER_CAPABILITIES,
  purposefulMotionOnly: true,
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

/**
 * Original Human Teachers Policy — technique from Success4SureCenter only;
 * never copy real teacher identities (face/voice/hair/clothing/body).
 */
export type OriginalHumanTeachersPolicy = {
  schema: "success-os.original-human-teachers.v1";
  styleReferenceChannel: "https://www.youtube.com/@Success4SureCenter";
  learnTechniqueOnly: true;
  forbidIdentityCopy: true;
  forbiddenLikeness: readonly [
    "faces",
    "voices",
    "hairstyles",
    "clothing",
    "body_proportions",
    "identities",
  ];
  allowedTechnique: readonly [
    "teaching_rhythm",
    "camera_movement",
    "classroom_organization",
    "board_usage",
    "explanation_flow",
    "gesture_timing",
    "lesson_pacing",
    "eye_contact_strategy",
    "student_engagement",
    "concept_transitions",
    "professional_atmosphere",
  ];
  saraMustBeOriginal: true;
  aliMustBeOriginal: true;
  mandatorySara10sPublicDemo: true;
  publicDemoPath: "/demo/sara-10s/";
  publicDemoVideoPath: "/media/ai-teachers/sara/demo/sara-10s.mp4";
  appDemoPath: "/ai-teacher/sara-10s";
  closingLineEn: "Welcome to Success OS. I'm Sara, and I'll be your teacher.";
  obviousAiFails: true;
  policyDoc: "docs/cursor/original-human-teachers-policy.md";
};

export const ORIGINAL_HUMAN_TEACHERS_POLICY: OriginalHumanTeachersPolicy = {
  schema: "success-os.original-human-teachers.v1",
  styleReferenceChannel: "https://www.youtube.com/@Success4SureCenter",
  learnTechniqueOnly: true,
  forbidIdentityCopy: true,
  forbiddenLikeness: [
    "faces",
    "voices",
    "hairstyles",
    "clothing",
    "body_proportions",
    "identities",
  ],
  allowedTechnique: [
    "teaching_rhythm",
    "camera_movement",
    "classroom_organization",
    "board_usage",
    "explanation_flow",
    "gesture_timing",
    "lesson_pacing",
    "eye_contact_strategy",
    "student_engagement",
    "concept_transitions",
    "professional_atmosphere",
  ],
  saraMustBeOriginal: true,
  aliMustBeOriginal: true,
  mandatorySara10sPublicDemo: true,
  publicDemoPath: "/demo/sara-10s/",
  publicDemoVideoPath: "/media/ai-teachers/sara/demo/sara-10s.mp4",
  appDemoPath: "/ai-teacher/sara-10s",
  closingLineEn: "Welcome to Success OS. I'm Sara, and I'll be your teacher.",
  obviousAiFails: true,
  policyDoc: "docs/cursor/original-human-teachers-policy.md",
};

/**
 * AI Digital Human Teacher (ADHT) — world-class teacher presence layer.
 *
 * Extends AI Teacher Engine (ADR-0055) with:
 * - Localized / age-appropriate teacher profiles (admin-configurable)
 * - Digital-human presence contracts (speech, gaze, gesture, whiteboard)
 * - Provider-agnostic AI service ports (OpenAI, Gemini, ElevenLabs, Tavus, …)
 *
 * Schema: success-os.ai-digital-human-teacher.v1
 *
 * This module defines architecture and configuration. It does NOT ship
 * live avatar video, TTS/STT SDKs, or provider credentials in this PR.
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type {
  AffectSignal,
  LearningPace,
  LearningStyle,
  MultimodalInputKind,
  TeachingStyle,
} from "./ai-teacher-engine";

export type AiDigitalHumanTeacherSchema =
  "success-os.ai-digital-human-teacher.v1";

/** Educational stage for age-appropriate teacher assignment. */
export type EducationalStage =
  | "early_childhood"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "university";

export type TeacherPresenceCapability =
  | "speak_naturally"
  | "listen_naturally"
  | "understand_interruptions"
  | "maintain_eye_contact"
  | "facial_expressions"
  | "hand_gestures"
  | "point_to_diagrams"
  | "write_on_whiteboard"
  | "educational_emotional_reaction"
  | "step_by_step_explain"
  | "realtime_adaptation";

export type LiveTeachingAction =
  | "explain"
  | "draw"
  | "highlight"
  | "animate"
  | "demonstrate"
  | "ask_questions"
  | "generate_exercises"
  | "correct_mistakes"
  | "give_hints"
  | "encourage"
  | "recommend_review_lessons"
  | "recommend_videos"
  | "recommend_digital_books";

/** Provider-agnostic service ports — replaceable without redesign. */
export type AiServicePortKind =
  | "reasoning_conversation"
  | "multimodal_understanding"
  | "text_to_speech"
  | "speech_to_text"
  | "digital_human_video"
  | "avatar_generation"
  | "realtime_media"
  | "orchestration_graph"
  | "vector_memory"
  | "knowledge_graph";

export type AiServiceProviderId =
  | "openai"
  | "google_gemini"
  | "elevenlabs"
  | "azure_speech"
  | "google_speech"
  | "tavus"
  | "heygen"
  | "livekit"
  | "langgraph"
  | "vector_db"
  | "success_os_knowledge_graph"
  | "none";

export type ProviderBinding = {
  port: AiServicePortKind;
  providerId: AiServiceProviderId;
  /** Human label for admin UI */
  label: LocaleText;
  /** Example vendors (documentation only — not a hard dependency) */
  exampleVendors: string[];
  enabled: boolean;
  configured: boolean;
  implementationStatus: "architecture_ready" | "adapter_stub" | "live";
  notes: string[];
};

export type DigitalHumanPresenceContract = {
  schema: "success-os.adht-presence.v1";
  capabilities: TeacherPresenceCapability[];
  voiceConversation: {
    microphoneOnly: true;
    autoDetectLanguage: true;
    replyInStudentLanguage: true;
    instantLanguageSwitch: true;
    accentTolerance: true;
    interruptible: true;
    continueAfterInterrupt: true;
  };
  multimodalKinds: MultimodalInputKind[];
  futureKinds: Array<"live_camera" | "virtual_laboratory" | "ar_vr">;
  liveTeachingActions: LiveTeachingAction[];
  implementationStatus: "architecture_ready";
  shipsLiveAvatarVideo: false;
  shipsLiveTtsStt: false;
};

/**
 * Admin-configurable Digital Teacher profile (ADHT layer).
 * Official platform faces remain Sara & Ali only —
 * see docs/cursor/platform-teachers-doctrine.md.
 * Appearance/accent seeds here are not additional platform teachers.
 */
export type DigitalTeacherProfile = {
  id: string;
  schema: "success-os.digital-teacher-profile.v1";
  displayName: LocaleText;
  /** ISO country or region code this profile is optimized for (e.g. JO, EG, US, JP) */
  countryCode: string;
  localeCodes: string[];
  accentLabel: LocaleText;
  culturalStyleNotes: LocaleText;
  educationalStages: EducationalStage[];
  defaultTeachingStyle: TeachingStyle;
  personalityTone: LocaleText;
  appearanceNotes: LocaleText;
  enabled: boolean;
  /** Admin-assigned; system never forces a country profile */
  adminAssignable: true;
  providerHints: {
    ttsVoiceKey?: string;
    digitalHumanPresetKey?: string;
  };
  updatedAt: string;
};

export type StageTeachingDefaults = {
  stage: EducationalStage;
  name: LocaleText;
  teachingStyle: TeachingStyle;
  pace: LearningPace;
  tone: LocaleText;
  notes: string[];
};

/**
 * Extended personality memory for Digital Human Teacher.
 * Complements success-os.student-memory.v1.
 */
export type DigitalTeacherPersonalityMemory = {
  schema: "success-os.adht-personality.v1";
  studentId: string;
  studentName: string;
  preferredLanguage: string;
  learningStyle: LearningStyle;
  weakSkillIds: string[];
  strongSkillIds: string[];
  learningGoals: string[];
  preferredTeachingSpeed: LearningPace;
  preferredExamples: string[];
  favoriteSubjectIds: string[];
  confidenceLevel: AffectSignal | "low" | "medium" | "high";
  previousConversationSessionIds: string[];
  assignedTeacherProfileId: string | null;
  updatedAt: string;
};

export type DigitalTeacherSessionPlan = {
  schema: "success-os.adht-session-plan.v1";
  sessionId: string;
  studentId: string;
  teacherProfileId: string | null;
  educationalStage: EducationalStage | null;
  presence: DigitalHumanPresenceContract;
  providers: ProviderBinding[];
  personality: DigitalTeacherPersonalityMemory;
  groundedByAte: true;
  inventsCurriculumFacts: false;
  liveProvidersEnabled: false;
  notes: string[];
};

export type AiDigitalHumanTeacherSnapshot = {
  schema: AiDigitalHumanTeacherSchema;
  role: "digital_human_teacher_architecture";
  notAChatbot: true;
  presence: DigitalHumanPresenceContract;
  stages: StageTeachingDefaults[];
  profiles: DigitalTeacherProfile[];
  providers: ProviderBinding[];
  counts: {
    profiles: number;
    enabledProfiles: number;
    stages: number;
    providerPorts: number;
    configuredProviders: number;
  };
  safety: {
    neverInventCurriculumFacts: true;
    groundInVerifiedCurriculum: true;
    groundInKnowledgeGraph: true;
    groundInDigitalBooks: true;
    groundInPlatformResources: true;
    stateUncertaintyWhenUnsure: true;
  };
  outOfScopeNow: string[];
  rules: string[];
  notes: string[];
};

// ======================================================
// Success OS — AI Teacher Profile (sole identity source)
// Sara.ts / Ali.ts are the only personality definitions.
// ======================================================

export type TeacherID = "sara" | "ali";

export type TeacherDisplayName = {
  en: string;
  ar: string;
};

/** Locked teaching persona — must never drift across subjects/languages. */
export type TeacherPersonalityLock = {
  /** One-line canonical personality (English). */
  summary: string;
  /** Machine tokens used by engines (never invent new traits at runtime). */
  traits: string[];
  tone: "warm" | "direct";
  answerStyle: "analogy_then_steps" | "definition_then_example";
  boardWriting: "slow_clear" | "crisp_bullets";
  bodyLanguage: "open_warm" | "precise_point";
  defaultEmotion: "warm" | "focused" | "encouraging" | "curious";
  pace: "measured" | "brisk_clear";
};

/** Photoreal appearance keys — adapters map to PNG / GLB / MetaHuman later. */
export type TeacherAppearance = {
  skinTone: string;
  hairStyle: string;
  outfitKey: string;
  ageBand: "adult_young" | "adult";
  countryCode: string;
  assetRoot: string;
  humanoidGlb: string;
  digitalHumanPresetKey: string;
  classroomPoses: {
    stand: string;
    point: string;
    write: string;
  };
  mouthStill: {
    closed: string;
    open: string;
    wide: string;
  };
  /**
   * Original-identity lock — never a likeness of any real Success4Sure / EST teacher.
   * Technique may be studied; face/voice/hair/clothing/body must stay original.
   */
  originalIdentity: true;
  notLikenessOfAnyRealTeacher: true;
};

/** Locale → neural voice. Same performance bar for every dialect. */
export type TeacherLocaleVoice = {
  provider: string;
  voiceId: string;
  /** Optional Edge TTS locale hint */
  locale: string;
};

/**
 * Non-negotiable performance contract.
 * Product success = student cannot tell this is AI for a full hour.
 */
export type TeacherPerformanceContract = {
  indistinguishabilityGoal: true;
  minContinuousQualityHours: number;
  requireEyeContact: boolean;
  requireNaturalGestures: boolean;
  requireFacialExpressions: boolean;
  requireBodyMovement: boolean;
  requirePreciseLipSync: boolean;
  requireBoardWriting: boolean;
  requireDrawing: boolean;
  requireModel3d: boolean;
  requireStudioAdaptation: boolean;
  requireMultilingualParity: boolean;
  /** Target wall-clock continuous teaching without quality drop */
  targetContinuousMs: number;
};

export interface TeacherProfile {
  // Identity
  id: TeacherID;
  firstName: string;
  fullName: string;
  displayName: TeacherDisplayName;

  // Personal
  gender: "female" | "male";
  age: number;
  nationality: string;

  // Languages
  languages: string[];
  dialects: string[];
  /** Default BCP-47 locale for speech + UI */
  defaultLocale: string;
  localeCodes: string[];

  // Teaching
  specialties: string[];
  teachingStyle: string;
  /** @deprecated use personalityLock.summary — kept for compatibility */
  personality: string;
  personalityLock: TeacherPersonalityLock;

  // Voice (AUTO resolved in config)
  voiceProvider: string;
  voiceID: string;
  speechRate: number;
  pitch: number;
  /** Per-locale voices — same quality bar across dialects */
  localeVoices: Record<string, TeacherLocaleVoice>;

  // AI
  llmModel: string;
  reasoningLevel: "basic" | "advanced" | "expert";

  // Human Behaviour flags
  eyeContact: boolean;
  naturalGestures: boolean;
  facialExpressions: boolean;
  bodyMovement: boolean;

  // Appearance + classroom
  appearance: TeacherAppearance;
  defaultStudio: string;
  outfit: string;
  performance: TeacherPerformanceContract;

  // Status
  enabled: boolean;
}

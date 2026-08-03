/**
 * AI Teachers Catalog — official platform teachers (Sara & Ali only).
 * Schema: success-os.ai-teachers.v1
 * Doctrine: docs/cursor/platform-teachers-doctrine.md · types/platform-teachers.ts
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type { EducationalStage } from "./ai-digital-human-teacher";
import type { PlatformTeacherId } from "./platform-teachers";

export type AiTeachersSchema = "success-os.ai-teachers.v1";

export type TeacherGender = "female" | "male";

/**
 * Subject tags for casting/UI. Platform teachers teach ANY subject —
 * this list is not a ceiling; unknown subjects still cast Sara/Ali.
 */
export type TeacherSubjectFocus =
  | "math"
  | "science"
  | "physics"
  | "chemistry"
  | "biology"
  | "arabic"
  | "english"
  | "islamic"
  | "social"
  | "general"
  | (string & {});

export type TeacherPoseKind = "portrait" | "talk" | "point" | "write" | "idle";

export type TeacherPlatformRole = "platform_official_primary";

export type AiTeacherAssets = {
  /** Relative to repo root, e.g. content/media/ai-teachers/sara */
  root: string;
  /** Web path under /media/ai-teachers/... */
  publicRoot: string;
  portrait: string;
  poses: Partial<Record<Exclude<TeacherPoseKind, "portrait">, string>>;
};

export type AiTeacherProfile = {
  id: PlatformTeacherId;
  schema: "success-os.ai-teacher.v1";
  /** Official face of the platform — not a subject-specific presenter */
  role: TeacherPlatformRole;
  displayName: LocaleText;
  gender: TeacherGender;
  countryCode: string;
  localeCodes: string[];
  educationalStages: EducationalStage[];
  /** Illustrative coverage; engine teaches any subject via content swap */
  subjects: TeacherSubjectFocus[];
  personalityTone: LocaleText;
  appearanceNotes: LocaleText;
  /** edge-tts / future HeyGen voice keys */
  voice: {
    edgeTts: string;
    heygenVoiceIdEnv?: string;
    heygenAvatarIdEnv?: string;
  };
  assets: AiTeacherAssets;
  /** Links into ADHT digitalHumanPresetKey when assigned */
  digitalHumanPresetKey: string;
  enabled: boolean;
  generatedBy: "cursor-image-gen" | "heygen" | "manual";
  updatedAt: string;
};

export type AiTeachersCatalog = {
  schema: AiTeachersSchema;
  version: string;
  teachers: AiTeacherProfile[];
  counts: {
    total: number;
    female: number;
    male: number;
  };
};

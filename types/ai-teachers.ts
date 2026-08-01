/**
 * AI Teachers Catalog — professional generated teacher identities.
 * Schema: success-os.ai-teachers.v1
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type { EducationalStage } from "./ai-digital-human-teacher";

export type AiTeachersSchema = "success-os.ai-teachers.v1";

export type TeacherGender = "female" | "male";

export type TeacherSubjectFocus =
  | "math"
  | "science"
  | "physics"
  | "arabic"
  | "general";

export type TeacherPoseKind = "portrait" | "talk" | "point" | "write" | "idle";

export type AiTeacherAssets = {
  /** Relative to repo root, e.g. content/media/ai-teachers/sara */
  root: string;
  /** Web path under /media/ai-teachers/... */
  publicRoot: string;
  portrait: string;
  poses: Partial<Record<Exclude<TeacherPoseKind, "portrait">, string>>;
};

export type AiTeacherProfile = {
  id: string;
  schema: "success-os.ai-teacher.v1";
  displayName: LocaleText;
  gender: TeacherGender;
  countryCode: string;
  localeCodes: string[];
  educationalStages: EducationalStage[];
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

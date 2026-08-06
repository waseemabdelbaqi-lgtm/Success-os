/**
 * Success OS — AI Teacher Profile (API envelope).
 * Identity entity lives in Configuration Layer:
 *   src/ai-teacher/core/TeacherProfile.ts
 * Engines must read via lib/ai-teachers/core-profiles or src/ai-teacher/config.
 */

export type {
  TeacherID,
  TeacherProfile,
} from "@/src/ai-teacher/core/TeacherProfile";

/** Catalog / API envelope for core profiles. */
export type AiTeacherProfileCatalog = {
  schema: "success-os.ai-teacher-profile.v1";
  version: string;
  doctrine: "docs/cursor/platform-teachers-doctrine.md";
  teachers: import("@/src/ai-teacher/core/TeacherProfile").TeacherProfile[];
};

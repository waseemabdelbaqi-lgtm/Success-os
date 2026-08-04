/**
 * Success OS — AI Teacher Profile (Core Entity)
 * Schema: success-os.ai-teacher-profile.v1
 *
 * Sara & Ali only. Platform success is measured by their teaching quality.
 * Not Avatar / Digital Human alone — world-class teachers who understand
 * content first, then teach any subject without Human Engine rewrite.
 */

// ======================================================
// Success OS - AI Teacher Profile
// Core Entity
// ======================================================

export type TeacherID = "sara" | "ali";

export interface TeacherProfile {
  // Identity
  id: TeacherID;
  firstName: string;
  fullName: string;

  // Personal
  gender: "female" | "male";
  age: number;
  nationality: string;

  // Languages
  languages: string[];
  dialects: string[];

  // Teaching
  specialties: string[];
  teachingStyle: string;
  personality: string;

  // Voice
  voiceProvider: string;
  voiceID: string;
  speechRate: number;
  pitch: number;

  // AI
  llmModel: string;
  reasoningLevel: "basic" | "advanced" | "expert";

  // Human Behaviour
  eyeContact: boolean;
  naturalGestures: boolean;
  facialExpressions: boolean;
  bodyMovement: boolean;

  // Classroom
  defaultStudio: string;
  outfit: string;

  // Status
  enabled: boolean;
}

/** Catalog / API envelope for core profiles. */
export type AiTeacherProfileCatalog = {
  schema: "success-os.ai-teacher-profile.v1";
  version: string;
  doctrine: "docs/cursor/platform-teachers-doctrine.md";
  teachers: TeacherProfile[];
};

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

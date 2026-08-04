// =============================================
// Success OS - AI Teacher Core Types
// Author: Mr. Waseem Allabadi
// =============================================

export type TeacherId = "sara" | "ali";

export type TeacherGender = "female" | "male";

export type TeacherMood =
  | "neutral"
  | "happy"
  | "excited"
  | "serious"
  | "thinking"
  | "encouraging";

export type TeachingStyle =
  | "interactive"
  | "analytical"
  | "storytelling"
  | "step_by_step"
  | "discussion"
  | "problem_solving";

export type LessonType =
  | "physics"
  | "chemistry"
  | "biology"
  | "math"
  | "english"
  | "history"
  | "geography"
  | "programming"
  | "general";

export interface TeacherVoice {
  provider: string;
  voice: string;
  language: string;
  accent: string;
  speed: number;
  pitch: number;
}

export interface TeacherPersonality {
  patience: number;
  energy: number;
  humor: number;
  strictness: number;
  empathy: number;
  confidence: number;
}

export interface TeacherAppearance {
  hair: string;
  eyes: string;
  skin: string;
  outfit: string;
}

export interface TeacherProfile {
  id: TeacherId;
  fullName: string;
  gender: TeacherGender;
  title: string;
  biography: string;
  personality: TeacherPersonality;
  appearance: TeacherAppearance;
  defaultMood: TeacherMood;
  defaultTeachingStyle: TeachingStyle;
  voice: TeacherVoice;
}

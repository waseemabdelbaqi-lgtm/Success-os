/**
 * Human Teacher Engine — types for world-class interactive teachers.
 * Goal: student cannot tell Sara/Ali are AI across a full hour.
 */
import type { HumanPerformancePlan, HumanLessonInput } from "@/types/human-engine";
import type {
  TeacherID,
  TeacherPerformanceContract,
  TeacherPersonalityLock,
  TeacherAppearance,
  TeacherDisplayName,
} from "@/src/ai-teacher/core/TeacherProfile";

export type StudioThemeId =
  | "primary_classroom"
  | "math_studio"
  | "physics_lab"
  | "chemistry_lab"
  | "biology_lab"
  | "language_salon"
  | "programming_lab"
  | "exam_prep_studio"
  | "success_studio";

export type StudioTheme = {
  id: StudioThemeId;
  labelAr: string;
  labelEn: string;
  wallColor: string;
  accent: string;
  boardStyle: "chalkboard_digital" | "whiteboard" | "glass_lab";
  lighting: string;
  propKit: Array<"board" | "table" | "model_3d" | "experiment" | "diagram">;
};

export type HumanTeacherSessionBrief = {
  teacherId: TeacherID;
  displayName: TeacherDisplayName;
  personality: TeacherPersonalityLock;
  appearance: TeacherAppearance;
  performance: TeacherPerformanceContract;
  locale: string;
  voiceId: string;
  studio: StudioTheme;
  subject: string;
  grade: string;
  targetDurationMs: number;
  segments: number;
};

export type HumanTeacherTeachResult = {
  brief: HumanTeacherSessionBrief;
  plan: HumanPerformancePlan;
  /** Quality gates that must remain true for the whole session */
  qualityGates: {
    lipSyncAligned: boolean;
    boardActsPresent: boolean;
    modelOrExperimentPresent: boolean;
    locomotionVariety: boolean;
    personalityLocked: boolean;
    durationHonored: boolean;
  };
};

export type TeachHumanLessonOptions = {
  input: HumanLessonInput;
  teacherId?: TeacherID;
  locale?: string;
  /** Wall-clock target; engine segments for endurance (default from teacher.performance) */
  targetDurationMs?: number;
  adapterId?: string;
};

/**
 * Digital Human Studio Engine — photoreal teacher presence runtime.
 * Schema: success-os.digital-human-studio.v1
 *
 * Pluggable providers (local studio now, HeyGen/Tavus later) without redesign.
 */
import type { TeachingStyle, LearningPace, AffectSignal } from "./ai-teacher-engine";

export type DigitalHumanStudioSchema = "success-os.digital-human-studio.v1";

export type TeacherCastId = "sara" | "ali" | string;

export type StudioId =
  | "global_led_classroom"
  | "science_lab"
  | "math_atelier"
  | string;

export type CameraAngle =
  | "wide_establishing"
  | "medium_teacher"
  | "close_face"
  | "over_shoulder_board"
  | "board_insert"
  | "model_orbit";

export type StudioLighting =
  | "cinematic_key"
  | "soft_daylight"
  | "focus_spot"
  | "warm_encourage"
  | "cool_precision";

export type PresencePose =
  | "stand"
  | "point"
  | "write"
  | "walk_in"
  | "turn_to_board"
  | "turn_to_student"
  | "hold_tool"
  | "manipulate_model";

export type FaceExpression =
  | "neutral_teach"
  | "warm_smile"
  | "encourage"
  | "focus"
  | "curious"
  | "celebrate";

export type BoardActionKind =
  | "title"
  | "subtitle"
  | "equation"
  | "diagram"
  | "steps"
  | "highlight"
  | "clear"
  | "image"
  | "video_ref"
  | "chart"
  | "model_3d"
  | "experiment"
  | "law";

export type PropKind =
  | "equation"
  | "diagram"
  | "model_3d"
  | "chart"
  | "image"
  | "video"
  | "experiment"
  | "simulation"
  | "law"
  | "tool";

export type DynamicGesture =
  | "idle_breathe"
  | "explain_open_hands"
  | "point_board"
  | "write_chalk"
  | "draw_curve"
  | "rotate_model"
  | "zoom_in"
  | "zoom_out"
  | "lift_prop"
  | "nod"
  | "eye_contact"
  | "pause_think"
  | "encourage_clap_soft"
  | "walk_step";

export type LessonContentBlock = {
  id: string;
  kind: "text" | "heading" | "definition" | "example" | "practice" | "media" | "equation";
  text: string;
  mediaRef?: string;
};

export type LessonAnalysisInput = {
  lessonId: string;
  title: string;
  titleAr?: string;
  subject?: string;
  grade?: string;
  language?: "ar" | "en" | "bilingual";
  objectives?: string[];
  blocks: LessonContentBlock[];
  studentLevel?: "below" | "on" | "above";
  preferredTeacherId?: TeacherCastId;
  studioId?: StudioId;
};

export type LessonAnalysis = {
  schema: "success-os.dhs-lesson-analysis.v1";
  lessonId: string;
  topics: string[];
  difficulty: "intro" | "core" | "challenge";
  visualNeeds: PropKind[];
  needsExperiment: boolean;
  needsEquation: boolean;
  needsModel3d: boolean;
  needsStepSolve: boolean;
  teachingStyle: TeachingStyle;
  learningPace: LearningPace;
  affectTarget: AffectSignal;
  summaryAr: string;
  summaryEn: string;
};

export type StudioProp = {
  id: string;
  kind: PropKind;
  label: string;
  payload: Record<string, unknown>;
  appearAt: number; // 0..1 within scene
  interact: Array<"point" | "rotate" | "zoom" | "highlight" | "write">;
};

export type BoardCue = {
  at: number;
  kind: BoardActionKind;
  content: string;
  meta?: Record<string, unknown>;
};

export type BehaviorBeat = {
  at: number;
  pose: PresencePose;
  gesture: DynamicGesture;
  expression: FaceExpression;
  eyeContact: boolean;
  sayChunk?: string;
};

export type StudioScene = {
  id: string;
  index: number;
  title: string;
  purpose: "hook" | "explain" | "demonstrate" | "practice" | "check" | "close";
  camera: CameraAngle;
  lighting: StudioLighting;
  durationHintSec: number;
  teacherSay: string;
  audioKey?: string | null;
  behaviors: BehaviorBeat[];
  board: BoardCue[];
  props: StudioProp[];
  transition: "cut" | "dissolve" | "push" | "orbit";
};

export type TeacherCast = {
  id: TeacherCastId;
  displayNameAr: string;
  displayNameEn: string;
  gender: "female" | "male";
  voiceId: string;
  digitalHumanPresetKey: string;
  assetRoot: string;
  style: "warm" | "crisp";
};

export type StudioLessonPlan = {
  schema: DigitalHumanStudioSchema;
  version: "1.0.0";
  planId: string;
  lessonId: string;
  studioId: StudioId;
  cast: TeacherCast;
  analysis: LessonAnalysis;
  scenes: StudioScene[];
  provider: {
    id: "local_photoreal_studio" | "heygen" | "tavus";
    status: "live" | "fallback" | "needs_credentials";
    notes: string[];
  };
  performance: {
    lazyAssets: true;
    maxConcurrentProps: number;
    prefetchSceneCount: number;
  };
  createdAt: string;
};

export type StudentStudioEvent =
  | { type: "ask_text"; text: string }
  | { type: "ask_voice"; transcript: string }
  | { type: "explain_again" }
  | { type: "explain_simpler" }
  | { type: "example" }
  | { type: "challenge" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "next_scene" }
  | { type: "prev_scene" };

export type StudioAdaptResponse = {
  reply: string;
  audioKey?: string | null;
  appendScene?: StudioScene;
  styleShift?: TeachingStyle;
  paceShift?: LearningPace;
};

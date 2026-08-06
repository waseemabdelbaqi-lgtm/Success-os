/**
 * Dynamic teaching plan — built AFTER full content analysis, BEFORE delivery.
 * Schema: success-os.lesson-teaching-plan.v1
 *
 * Teachers understand first, then teach in their locked persona.
 * Human Engine consumes the plan; core pipeline is never rewritten per subject.
 */
import type { TeacherID } from "./ai-teacher-profile";

export type LessonTeachingPlanSchema = "success-os.lesson-teaching-plan.v1";

export type PedagogyStrategy =
  | "math_step_by_step"
  | "physics_diagrams_simulation"
  | "chemistry_lab_molecular"
  | "biology_anatomy_models"
  | "language_dialogue_pronunciation"
  | "programming_code_run_explain"
  | "general_explain_check";

export type StudentContext = {
  level: "below" | "on" | "above";
  ageBand?: "child" | "teen" | "adult";
  language?: string;
  priorMistakes?: string[];
  engagementHint?: "focused" | "distracted" | "bored" | "unknown";
};

export type LessonTeachingPlan = {
  schema: LessonTeachingPlanSchema;
  version: string;
  teacherId: TeacherID;
  subject: string;
  lessonTitle: string;
  pedagogy: PedagogyStrategy;
  /** Full analysis before any spoken line */
  analysis: {
    objectives: string[];
    keyConcepts: string[];
    commonMistakes: string[];
    bestExamples: string[];
    bestAnalogies: string[];
    bestQuestions: string[];
    bestDrawings: string[];
    bestExperiments: string[];
    bestModels3d: string[];
    assessmentApproach: string;
  };
  student: StudentContext;
  /** Ordered teaching beats derived from analysis (not raw text reading) */
  beats: Array<{
    id: string;
    purpose:
      | "hook"
      | "objective"
      | "concept"
      | "example"
      | "worked_step"
      | "diagram"
      | "experiment"
      | "model_3d"
      | "dialogue"
      | "code_run"
      | "check"
      | "remediate"
      | "summary"
      | "follow_up";
    speak: string;
    board?: string;
    multimodal?: "diagram" | "experiment" | "model_3d" | "code" | "none";
  }>;
  close: {
    summary: string;
    quizPrompt: string;
    followUpPlan: string;
  };
  generatedAt: string;
};

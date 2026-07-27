/** Reusable interactive lesson schema (Country→…→Scene). */

export type LessonLocale = "ar" | "en";

export type SceneType =
  | "hook"
  | "objective"
  | "prerequisite"
  | "explain"
  | "demo"
  | "guided"
  | "your_turn"
  | "practice"
  | "application"
  | "quiz"
  | "result";

export type InteractionType =
  | "none"
  | "mcq"
  | "tap"
  | "arrange"
  | "match"
  | "type"
  | "drag";

export type BoardMode =
  | "blank"
  | "title"
  | "numberline"
  | "jumps"
  | "equation"
  | "celebrate"
  | "objects";

export type VisualEvent = {
  atMs: number;
  action:
    | "show_line"
    | "highlight"
    | "place_start"
    | "jump"
    | "show_equation"
    | "circle"
    | "show_objects"
    | "celebrate";
  value?: number | string;
  from?: number;
  to?: number;
  count?: number;
};

export type LocalizedText = { ar: string; en: string };

export type SceneDefinition = {
  sceneId: string;
  sceneType: SceneType;
  durationMs: number;
  learningGoal: LocalizedText;
  narration: LocalizedText;
  audio?: { ar?: string; en?: string };
  captions: LocalizedText;
  board: BoardMode;
  visualTimeline: VisualEvent[];
  interactionType: InteractionType;
  question?: LocalizedText;
  answerOptions?: LocalizedText[];
  /** Correct option index for mcq/tap/arrange; string for type */
  correctAnswer: number | string | number[];
  firstHint?: LocalizedText;
  secondExplanation?: LocalizedText;
  correctFeedback?: LocalizedText;
  incorrectFeedback?: LocalizedText;
  accessibilityText: LocalizedText;
  completionRule: "auto" | "interaction" | "continue";
  /** Optional second-chance easier example board overrides */
  easierBoard?: BoardMode;
  easierVisualTimeline?: VisualEvent[];
};

export type InteractiveLessonDefinition = {
  schema: "success-os.interactive-lesson.v1";
  lessonId: string;
  country: string;
  curriculum: string;
  grade: string;
  subject: string;
  unit: string;
  title: LocalizedText;
  preparedBy: string;
  teacherName: LocalizedText;
  teacherTitle: LocalizedText;
  objectives: LocalizedText[];
  estimatedMinutes: number;
  nextLessonHint: LocalizedText;
  scenes: SceneDefinition[];
};

export type LessonEnginePhase =
  | "ready"
  | "playing"
  | "awaiting_interaction"
  | "hint"
  | "reexplain"
  | "feedback_correct"
  | "feedback_incorrect"
  | "completed";

export type LessonProgressState = {
  lessonId: string;
  sceneIndex: number;
  phase: LessonEnginePhase;
  attemptByScene: Record<string, number>;
  answers: Record<string, unknown>;
  correctCount: number;
  incorrectCount: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  masteryPercent: number;
  locale: LessonLocale;
};

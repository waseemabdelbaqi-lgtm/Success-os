/**
 * Teacher Mind — Human Engine manages the full teacher, not only motion.
 * Schema: success-os.teacher-mind.v1
 *
 * Behaviour Tree + Blackboard (lesson/student/time).
 * Official platform profiles: sara + ali only (docs/cursor/platform-teachers-doctrine.md).
 * Specialists may reuse this schema later only for a fundamentally different role.
 */

export type TeacherMindSchema = "success-os.teacher-mind.v1";

export type TeacherProfileId = "sara" | "ali" | (string & {});

export type TeachingPace = "slow" | "measured" | "brisk";
export type FormalityLevel = "warm_casual" | "balanced" | "formal";
export type InteractionLevel = "low" | "medium" | "high";
export type MotivationStyle =
  | "encourage_often"
  | "praise_precise"
  | "challenge_forward";
export type AnswerStyle =
  | "analogy_then_steps"
  | "definition_then_example"
  | "socratic_questions"
  | "visual_first";
export type BoardWritingStyle = "slow_clear" | "crisp_bullets" | "diagram_heavy";
export type BodyLanguageStyle = "open_warm" | "precise_point" | "animated";
export type RemediationMode =
  | "analogy"
  | "diagram"
  | "experiment"
  | "model_3d"
  | "slower_steps"
  | "simpler_words";

/** Editable teacher profile — admin can tune without code changes. */
export type TeacherMindProfile = {
  schema: TeacherMindSchema;
  id: TeacherProfileId;
  enabled: boolean;
  displayName: { en: string; ar: string };
  identity: {
    gender: "female" | "male";
    locale: string;
    countryCode: string;
    bioAr: string;
  };
  voice: {
    edgeTts: string;
    pitchBias: number; // -1..1 descriptive
    energy: number; // 0..1
  };
  teaching: {
    pace: TeachingPace;
    formality: FormalityLevel;
    interaction: InteractionLevel;
    motivation: MotivationStyle;
    answerStyle: AnswerStyle;
    boardWriting: BoardWritingStyle;
    bodyLanguage: BodyLanguageStyle;
    defaultEmotion: string;
    checkFrequency: number; // 0..1
    reexplainPatience: number; // 0..1 — higher = more soft remediation
  };
  phrases: {
    addressStudent: string;
    explainVerb: string;
    checkPhrase: string;
    reexplainOpener: string;
    celebrate: string;
    encourage: string;
    wrongSoft: string;
  };
  gestureBias: {
    preferOpenHands: boolean;
    walkEnergy: number;
    pointSharpness: number;
  };
  /** Preferred remediation order when student doesn't understand */
  remediationOrder: RemediationMode[];
  humanoidGlb?: string;
  updatedAt: string;
};

export type StudentLevel = "below" | "on" | "above";

export type StudentAnswerRecord = {
  atMs: number;
  question: string;
  answer: string;
  correct: boolean | null;
  topic: string;
};

export type MistakeRecord = {
  atMs: number;
  topic: string;
  note: string;
  remediatedWith?: RemediationMode;
};

/** Session memory — contextual during one lesson (STM). */
export type TeacherSessionMemory = {
  schema: "success-os.teacher-session-memory.v1";
  sessionId: string;
  teacherId: TeacherProfileId;
  lessonId: string;
  lessonTitle: string;
  subject: string;
  grade: string;
  studentLevel: StudentLevel;
  startedAt: string;
  elapsedMs: number;
  answers: StudentAnswerRecord[];
  mistakes: MistakeRecord[];
  topicsCovered: string[];
  lastStrategy: RemediationMode | "direct_explain" | null;
  strategiesUsed: RemediationMode[];
  confusionCount: number;
  masteryHint: number; // 0..1
  notes: string[];
  /** Anti-repeat: gestures / cameras / phrase fingerprints used this session */
  usedGestures: string[];
  usedCameras: string[];
  usedSayFingerprints: string[];
  lastGesture: string | null;
  lastCamera: string | null;
  /** Q&A: teacher asked and is waiting for student answer */
  waitingForAnswer: boolean;
  pendingQuestion: string | null;
};

export type TeacherMindState =
  | "idle"
  | "hook"
  | "explain"
  | "demonstrate"
  | "check_understanding"
  | "wait_answer"
  | "remediate"
  | "encourage"
  | "answer_question"
  | "close";

/** Blackboard shared by the Behaviour Tree. */
export type TeacherBlackboard = {
  profile: TeacherMindProfile;
  memory: TeacherSessionMemory;
  state: TeacherMindState;
  /** Current teaching focus line / topic */
  focusTopic: string;
  /** Pending student event */
  pendingEvent:
    | { type: "confused" }
    | { type: "ask"; text: string }
    | { type: "answer"; text: string; correct?: boolean }
    | { type: "request_simpler" }
    | { type: "request_example" }
    | { type: "tick" }
    | null;
  /** Last BT decision for telemetry */
  lastDecision: TeacherMindDecision | null;
};

export type TeacherMindDecision = {
  state: TeacherMindState;
  strategy: RemediationMode | "direct_explain" | "check" | "celebrate" | "hook" | "close";
  say: string;
  contentHint:
    | "speech_only"
    | "write_board"
    | "draw_diagram"
    | "run_experiment"
    | "show_model"
    | "ask_check";
  emotion: string;
  reason: string;
  cameraBias?: string;
  lightBias?: string;
};

export type BtStatus = "success" | "failure" | "running";

export type BtNode = {
  id: string;
  type: "sequence" | "selector" | "condition" | "action";
  children?: BtNode[];
  /** For condition/action nodes */
  op?: string;
};

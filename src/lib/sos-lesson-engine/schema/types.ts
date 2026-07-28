/**
 * SUCCESS OS Interactive Learning Engine — schema
 * Original architecture. Benchmarks (Nearpod/Kahoot/Padlet/Classera) inform
 * educational functions only — no copied branding, code, or proprietary content.
 */

export type LessonMode = "student_paced" | "teacher_paced" | "assignment" | "revision_game";

export type LessonStageId =
  | "identity"
  | "hook"
  | "prerequisite"
  | "objectives"
  | "vocabulary"
  | "explanation"
  | "guided_practice"
  | "interactive_activity"
  | "real_life"
  | "collaboration"
  | "independent_practice"
  | "assessment"
  | "results"
  | "reflection"
  | "next_step";

export const REQUIRED_STAGE_ORDER: LessonStageId[] = [
  "identity",
  "hook",
  "prerequisite",
  "objectives",
  "vocabulary",
  "explanation",
  "guided_practice",
  "interactive_activity",
  "real_life",
  "collaboration",
  "independent_practice",
  "assessment",
  "results",
  "reflection",
  "next_step",
];

export type ActivityKind =
  | "mcq"
  | "multi_response"
  | "true_false"
  | "matching"
  | "sorting"
  | "ordering"
  | "drag_drop"
  | "fill_blank"
  | "label_diagram"
  | "hotspot"
  | "draw"
  | "trace"
  | "write"
  | "table"
  | "graph"
  | "number_line"
  | "classify"
  | "map"
  | "timeline"
  | "observation"
  | "virtual_experiment"
  | "collaborative_board"
  | "poll";

export type DifficultyBand = "basic" | "developing" | "proficient" | "challenge";

export type InteractiveQuestion = {
  id: string;
  promptAr: string;
  kind: ActivityKind;
  options?: string[];
  correctIndex?: number;
  correctIndices?: number[];
  correctAnswer?: string;
  acceptedAnswers?: string[];
  pairs?: Array<{ left: string; right: string }>;
  orderItems?: string[];
  correctOrder?: string[];
  dragItems?: string[];
  dropZones?: Array<{ id: string; labelAr: string; accepts: string[] }>;
  numberLine?: { min: number; max: number; target?: number; showJumps?: boolean };
  explanationAr: string;
  hint1Ar: string;
  hint2Ar: string;
  commonErrorFeedbackAr?: string;
  outcomeId?: string;
  skill?: string;
  difficulty: DifficultyBand;
  masteryWeight: number;
  points: number;
};

export type ExplanationSection = {
  id: string;
  titleAr: string;
  bodyAr: string;
  visualAr: string;
  workedExampleAr: string;
  check: InteractiveQuestion;
  altExplanationAr?: string;
};

export type LessonIdentity = {
  country: "Jordan";
  curriculum: "national";
  curriculumVersion: string;
  academicYear: string;
  grade: string;
  gradeAr: string;
  semester: string;
  semesterAr: string;
  pathway: string;
  pathwayAr: string;
  subject: string;
  subjectAr: string;
  bookId: string;
  bookTitleAr: string;
  unitId: string;
  unitTitleAr: string;
  lessonId: string;
  lessonTitleAr: string;
  lessonTitleEn?: string;
  officialPageRange: string;
  learningOutcomes: string[];
  officialOutcomesNote?: string;
  skills: string[];
  prerequisites: string[];
  estimatedMinutes: number;
  materialsAr: string;
  sources: Array<{ name: string; url: string; usage: string }>;
  rightsStatus: string;
  editorialStatus: string;
  preparedBy: string;
};

export type InteractiveLesson = {
  id: string;
  schemaVersion: "sos.interactive-lesson.v1";
  identity: LessonIdentity;
  modes: LessonMode[];
  hook: {
    openingAr: string;
    questionAr: string;
    situationAr: string;
    visualAr: string;
    predictionPromptAr: string;
    priorConnectionAr: string;
  };
  prerequisiteCheck: {
    questions: InteractiveQuestion[];
    minCorrect: number;
    recoveryExplanationAr: string;
    recoveryActivity: InteractiveQuestion;
  };
  objectivesLearnerAr: string[];
  vocabulary: Array<{
    term: string;
    definition: string;
    example: string;
    nonExample: string;
    symbol?: string;
  }>;
  explanationSections: ExplanationSection[];
  guidedPractice: InteractiveQuestion[];
  interactiveActivity: {
    titleAr: string;
    kind: ActivityKind;
    instructionsAr: string;
    questions: InteractiveQuestion[];
  };
  realLife: {
    jordanContextAr: string;
    homeAr: string;
    schoolAr: string;
    communityAr: string;
  };
  collaboration: {
    boardType: "brainstorm" | "question_wall" | "kwl" | "exit_ticket" | "vocabulary_wall";
    promptAr: string;
    anonymousAllowed: boolean;
    moderationRequired: boolean;
  };
  independentPractice: InteractiveQuestion[];
  assessment: {
    titleAr: string;
    questions: InteractiveQuestion[];
    passScorePercent: number;
  };
  reflectionPromptsAr: string[];
  nextStep: {
    nextLessonId?: string;
    nextLessonTitleAr?: string;
    revisionGameEnabled: boolean;
    aiTutorEnabled: boolean;
  };
  reviewGameQuestionIds: string[];
  aiTutorPolicy: {
    allowedTopics: string[];
    forbidAnswerRevealBeforeAttempt: true;
    requireTeacherReviewOnLowConfidence: true;
    noUncontrolledInternet: true;
  };
};

export type MasteryRecord = {
  studentKey: string;
  lessonId: string;
  outcomeScores: Record<string, number>;
  skillScores: Record<string, number>;
  lessonMastery: number;
  attempts: number;
  timeSpentSec: number;
  lastStageId?: LessonStageId;
  updatedAt: string;
};

export type LiveSession = {
  id: string;
  joinCode: string;
  lessonId: string;
  teacherKey: string;
  status: "lobby" | "live" | "paused" | "ended";
  currentStageId: LessonStageId;
  lockStudentNav: boolean;
  activeQuestionId?: string;
  timerSec?: number;
  participants: Array<{ id: string; displayName: string; joinedAt: string }>;
  responses: Array<{
    participantId: string;
    questionId: string;
    answer: string;
    correct?: boolean;
    at: string;
  }>;
  points: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type CollabPost = {
  id: string;
  authorKey: string;
  displayName: string;
  anonymous: boolean;
  bodyAr: string;
  approved: boolean;
  createdAt: string;
  reactions: Record<string, number>;
};

export type CollaborativeBoard = {
  id: string;
  lessonId: string;
  boardType: InteractiveLesson["collaboration"]["boardType"];
  promptAr: string;
  posts: CollabPost[];
  moderationRequired: boolean;
  createdAt: string;
};

export type ReviewGameSession = {
  id: string;
  joinCode: string;
  lessonId: string;
  mode: "individual" | "team" | "teacher_paced" | "homework";
  status: "lobby" | "running" | "ended";
  questionIndex: number;
  timerEnabled: boolean;
  speedPointsEnabled: boolean;
  leaderboardEnabled: boolean;
  musicEnabled: boolean;
  accessibilityUntimed: boolean;
  participants: Array<{
    id: string;
    displayName: string;
    team?: string;
    score: number;
    streak: number;
    correct: number;
  }>;
  answers: Array<{ participantId: string; questionId: string; correct: boolean; ms: number }>;
  createdAt: string;
};

export type AssignmentRecord = {
  id: string;
  lessonId: string;
  teacherKey: string;
  groupLabel: string;
  startAt: string;
  dueAt: string;
  allowedAttempts: number;
  requiredScorePercent: number;
  feedbackMode: "immediate" | "after_due" | "manual";
  createdAt: string;
};

export type AITutorTurn = {
  id: string;
  lessonId: string;
  studentKey: string;
  stageId: LessonStageId;
  userMessage: string;
  assistantMessage: string;
  confidence: "high" | "medium" | "low";
  needsTeacherReview: boolean;
  createdAt: string;
};

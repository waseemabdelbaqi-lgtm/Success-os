/**
 * Student AI Learning Stack — official student journey architecture.
 *
 *   Student
 *   ↓ AI Teacher
 *   ↓ Conversation Engine
 *   ↓ Reasoning Engine
 *   ↓ Knowledge Graph
 *   ↓ Digital Books
 *   ↓ Videos
 *   ↓ Interactive Lesson Engine
 *   ↓ Quizzes
 *   ↓ Assessments
 *
 * Schema: success-os.student-ai-learning-stack.v1
 *
 * This PR defines the orchestration contract and wires existing foundations
 * (Knowledge Graph, ILE). Content generation (AI lessons/videos/quizzes) remains
 * reserved for later engine PRs — no generation here.
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type StudentAiLearningStackSchema =
  "success-os.student-ai-learning-stack.v1";

export type StackLayerId =
  | "student"
  | "ai_teacher"
  | "conversation_engine"
  | "reasoning_engine"
  | "knowledge_graph"
  | "digital_books"
  | "videos"
  | "interactive_lesson_engine"
  | "quizzes"
  | "assessments";

export type StackLayerStatus =
  | "operational"
  | "foundation"
  | "stub"
  | "reserved";

export type StackLayerContract = {
  id: StackLayerId;
  order: number;
  name: LocaleText;
  /** What this layer does in the student journey */
  role: LocaleText;
  status: StackLayerStatus;
  /** Engine / schema this layer consumes or will consume */
  bindsTo: string[];
  /** Roadmap PR that fully activates the layer */
  activatesInPr: string;
  generatesContent: boolean;
  rendersLessons: boolean;
  notes: string[];
};

export type StudentStackContext = {
  studentId: string;
  countryId?: string;
  curriculumId?: string;
  subjectGlobalId?: string;
  /** Optional focus lesson (hierarchical or LSN id) */
  focusLessonId?: string;
  language?: "ar" | "en" | "bilingual";
  /** Free-text intent from the student (conversation input) */
  utterance?: string;
};

export type StackLayerInvocation = {
  layerId: StackLayerId;
  status: StackLayerStatus;
  ok: boolean;
  /** Structured output of this layer for the next hop */
  output: Record<string, unknown>;
  durationMs: number;
};

/**
 * Planned session produced by orchestration — never generates lesson HTML/AI media.
 */
export type StudentLearningSessionPlan = {
  schema: "success-os.student-learning-session-plan.v1";
  sessionId: string;
  studentId: string;
  path: StackLayerId[];
  invocations: StackLayerInvocation[];
  /** Resolved ILE package id if available — runtime remains ILE only */
  ilePackageId: string | null;
  knowledgeGraphRefs: string[];
  recommendedLessonIds: string[];
  quizPlanId: string | null;
  assessmentPlanId: string | null;
  digitalBookIds: string[];
  videoIds: string[];
  aiContentGenerated: false;
  notes: string[];
};

export type StudentAiLearningStackSnapshot = {
  schema: StudentAiLearningStackSchema;
  path: StackLayerId[];
  displayPath: string[];
  layers: StackLayerContract[];
  counts: {
    layers: number;
    operational: number;
    foundation: number;
    stub: number;
    reserved: number;
  };
  rules: string[];
  notes: string[];
};

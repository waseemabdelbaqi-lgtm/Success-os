/**
 * AI Teacher Engine (ATE) — core intelligence of Success OS.
 *
 *   Student
 *   ↓ AI Teacher
 *   ↓ Conversation Engine
 *   ↓ Reasoning Engine
 *   ↓ Student Memory
 *   ↓ Knowledge Graph
 *   ↓ Curriculum Registry
 *   ↓ Interactive Lesson Engine
 *   ↓ Digital Books
 *   ↓ Videos
 *   ↓ Assessments
 *
 * Schema: success-os.ai-teacher-engine.v1
 *
 * The AI Teacher is NOT a chatbot. It teaches, listens, understands,
 * remembers, guides, assesses, motivates, and adapts — architecture and
 * orchestration only in this PR (no avatars, animations, AI videos, live rooms).
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type AiTeacherEngineSchema = "success-os.ai-teacher-engine.v1";

/** Official ATE stack path (immutable order). */
export type AteLayerId =
  | "student"
  | "ai_teacher"
  | "conversation_engine"
  | "reasoning_engine"
  | "student_memory"
  | "knowledge_graph"
  | "curriculum_registry"
  | "interactive_lesson_engine"
  | "digital_books"
  | "videos"
  | "assessments";

export type AteLayerStatus =
  | "operational"
  | "foundation"
  | "stub"
  | "reserved";

export type AteLayerContract = {
  id: AteLayerId;
  order: number;
  name: LocaleText;
  role: LocaleText;
  status: AteLayerStatus;
  bindsTo: string[];
  activatesInPr: string;
  generatesContent: boolean;
  rendersLessons: boolean;
  notes: string[];
};

/** Teaching styles the teacher can switch between. */
export type TeachingStyle =
  | "direct"
  | "socratic"
  | "example_first"
  | "visual"
  | "step_by_step"
  | "story"
  | "simplified";

export type LearningPace = "slow" | "normal" | "fast";
export type LearningStyle =
  | "visual"
  | "auditory"
  | "kinesthetic"
  | "reading_writing"
  | "mixed";

export type AffectSignal =
  | "neutral"
  | "confident"
  | "frustrated"
  | "confused"
  | "engaged"
  | "disengaged";

/** Multimodal input kinds ATE understands (contracts; processors may be stubs). */
export type MultimodalInputKind =
  | "text"
  | "voice"
  | "image"
  | "screenshot"
  | "homework_photo"
  | "pdf"
  | "handwritten_solution"
  | "video_conversation" // future
  | "live_whiteboard"; // future

export type MultimodalInput = {
  kind: MultimodalInputKind;
  /** Opaque payload reference — never invents curriculum from raw bytes here */
  ref?: string;
  mimeType?: string;
  transcript?: string;
  text?: string;
  language?: string;
  ready: boolean;
  notes?: string[];
};

/** Student control phrases the Conversation Engine recognizes. */
export type StudentControlIntent =
  | "explain_again"
  | "explain_differently"
  | "easier_example"
  | "harder_question"
  | "translate"
  | "summarize"
  | "test_me"
  | "skip"
  | "continue"
  | "go_back"
  | "teach_slowly"
  | "teach_faster"
  | "dont_understand"
  | "ask_question"
  | "request_lesson"
  | "request_video"
  | "request_book"
  | "request_help"
  | "unknown";

export type ConversationTurnRole = "student" | "teacher" | "system";

export type ConversationTurn = {
  id: string;
  role: ConversationTurnRole;
  text: string;
  language?: string;
  intent?: StudentControlIntent;
  affect?: AffectSignal;
  multimodal?: MultimodalInput[];
  grounded: boolean;
  uncertaintyStated: boolean;
  createdAt: string;
};

/**
 * Long-lived student memory across conversations.
 */
export type StudentMemoryRecord = {
  schema: "success-os.student-memory.v1";
  studentId: string;
  studentName: string;
  preferredLanguage: string;
  currentCurriculumId: string | null;
  gradeId: string | null;
  subjectIds: string[];
  completedLessonIds: string[];
  weakSkillIds: string[];
  strongSkillIds: string[];
  previousQuestionIds: string[];
  learningGoals: string[];
  learningPace: LearningPace;
  learningStyle: LearningStyle;
  preferredTeachingStyle: TeachingStyle;
  conversationHistory: ConversationTurn[];
  affectLast: AffectSignal;
  updatedAt: string;
};

export type GroundingSourceKind =
  | "curriculum_registry"
  | "knowledge_graph"
  | "digital_book"
  | "video"
  | "ile_package"
  | "uce_mapping"
  | "platform_kb"
  | "none";

export type GroundingCitation = {
  kind: GroundingSourceKind;
  globalId: string | null;
  label: string;
  confidence: number;
};

export type GroundedResponse = {
  text: LocaleText;
  citations: GroundingCitation[];
  uncertain: boolean;
  uncertaintyNote: LocaleText | null;
  inventsCurriculumFacts: false;
};

export type RecommendationKind =
  | "lesson"
  | "prerequisite_lesson"
  | "video"
  | "digital_book_section"
  | "practice"
  | "mini_quiz"
  | "assessment";

export type AteRecommendation = {
  kind: RecommendationKind;
  targetId: string | null;
  label: LocaleText;
  reason: LocaleText;
  ready: boolean;
  activatesInPr?: string;
};

export type VoiceSessionContract = {
  schema: "success-os.ate-voice.v1";
  enabled: boolean;
  naturalConversation: true;
  interruptible: true;
  pauseable: true;
  continuable: true;
  multiVoice: true;
  /** Implementation deferred — architecture only */
  implementationStatus: "ready_architecture";
  notes: string[];
};

export type WhiteboardSessionContract = {
  schema: "success-os.ate-whiteboard.v1";
  enabled: boolean;
  canDrawDiagrams: true;
  canWriteEquations: true;
  canHighlightTextbook: true;
  canAnimateExplanations: true;
  canPointToFigures: true;
  canSolveStepByStep: true;
  /** No live whiteboard UI in this PR */
  implementationStatus: "ready_architecture";
  notes: string[];
};

export type AteCapabilityId =
  | "answer_questions"
  | "explain_multi_style"
  | "simplify_concepts"
  | "detect_misconceptions"
  | "correct_wrong_answers"
  | "ask_follow_ups"
  | "generate_examples"
  | "generate_harder_easier_examples"
  | "create_practice_questions"
  | "create_mini_quizzes"
  | "recommend_lessons"
  | "recommend_videos"
  | "recommend_digital_book_sections"
  | "recommend_prerequisites"
  | "encourage_learner"
  | "detect_frustration"
  | "detect_confidence"
  | "adapt_explanations";

export type AteCapabilityContract = {
  id: AteCapabilityId;
  name: LocaleText;
  status: "operational" | "foundation" | "stub" | "reserved";
  generatesContent: boolean;
  notes: string[];
};

export type AteSessionContext = {
  studentId: string;
  studentName?: string;
  countryId?: string;
  curriculumId?: string;
  gradeId?: string;
  subjectGlobalId?: string;
  focusLessonId?: string;
  language?: "ar" | "en" | "bilingual";
  utterance?: string;
  multimodal?: MultimodalInput[];
  teachingStyle?: TeachingStyle;
  sessionId?: string;
};

export type AteLayerInvocation = {
  layerId: AteLayerId;
  status: AteLayerStatus;
  ok: boolean;
  output: Record<string, unknown>;
  durationMs: number;
};

export type AteTeachingTurn = {
  schema: "success-os.ate-teaching-turn.v1";
  sessionId: string;
  studentId: string;
  intent: StudentControlIntent;
  affect: AffectSignal;
  teachingStyle: TeachingStyle;
  teacherReply: GroundedResponse;
  followUpQuestion: LocaleText | null;
  recommendations: AteRecommendation[];
  memory: StudentMemoryRecord;
  voice: VoiceSessionContract;
  whiteboard: WhiteboardSessionContract;
  ilePackageId: string | null;
  path: AteLayerId[];
  invocations: AteLayerInvocation[];
  avatarsBuilt: false;
  animationsBuilt: false;
  aiVideosBuilt: false;
  liveClassroomBuilt: false;
  aiContentGenerated: false;
  notes: string[];
};

export type AiTeacherEngineSnapshot = {
  schema: AiTeacherEngineSchema;
  path: AteLayerId[];
  displayPath: string[];
  layers: AteLayerContract[];
  capabilities: AteCapabilityContract[];
  studentControls: StudentControlIntent[];
  multimodalKinds: MultimodalInputKind[];
  voice: VoiceSessionContract;
  whiteboard: WhiteboardSessionContract;
  counts: {
    layers: number;
    operational: number;
    foundation: number;
    stub: number;
    reserved: number;
    capabilities: number;
  };
  safety: {
    neverInventCurriculumFacts: true;
    groundInApprovedCurriculum: true;
    stateUncertaintyWhenUnsure: true;
  };
  outOfScope: string[];
  rules: string[];
  notes: string[];
};

/** Permission keys scoped to ATE (string literals; mirrored in permissions module). */
export type AtePermission =
  | "ate:session:start"
  | "ate:session:chat"
  | "ate:memory:read"
  | "ate:memory:write"
  | "ate:recommend"
  | "ate:admin"
  | "ate:voice:use"
  | "ate:whiteboard:use";

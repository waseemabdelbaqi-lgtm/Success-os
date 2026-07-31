/**
 * Canonical Course → Unit → Lesson structure for Success OS.
 * Additive enrichment — does not replace Book portal or marketplace schemas.
 * Schema: success-os.course-structure.v1
 */

export type LocaleText = { en: string; ar: string };

export type LessonBlockId =
  | "interactive_slides"
  | "teacher_video"
  | "ai_explanation"
  | "simulation_3d"
  | "notes"
  | "attachments"
  | "interactive_questions"
  | "ai_chat"
  | "homework"
  | "quiz"
  | "progress";

export const LESSON_BLOCK_ORDER: LessonBlockId[] = [
  "interactive_slides",
  "teacher_video",
  "ai_explanation",
  "simulation_3d",
  "notes",
  "attachments",
  "interactive_questions",
  "ai_chat",
  "homework",
  "quiz",
  "progress",
];

export const LESSON_BLOCK_LABELS: Record<
  LessonBlockId,
  LocaleText
> = {
  interactive_slides: { en: "Interactive Slides", ar: "شرائح تفاعلية" },
  teacher_video: { en: "Teacher Video", ar: "فيديو المعلم" },
  ai_explanation: { en: "AI Explanation", ar: "شرح بالذكاء الاصطناعي" },
  simulation_3d: { en: "3D Simulation", ar: "محاكاة ثلاثية الأبعاد" },
  notes: { en: "Notes", ar: "ملاحظات" },
  attachments: { en: "Attachments", ar: "مرفقات" },
  interactive_questions: { en: "Interactive Questions", ar: "أسئلة تفاعلية" },
  ai_chat: { en: "AI Chat", ar: "محادثة ذكية" },
  homework: { en: "Homework", ar: "واجب منزلي" },
  quiz: { en: "Quiz", ar: "اختبار قصير" },
  progress: { en: "Progress", ar: "التقدم" },
};

export type LessonSlide = {
  id: string;
  title: LocaleText;
  body: LocaleText;
  visualPrompt?: LocaleText;
  kind?: "intro" | "concept" | "example" | "practice" | "summary";
};

export type TeacherVideoBlock = {
  status: "ready" | "not-produced" | "processing";
  title: LocaleText;
  durationMinutes?: number;
  videoUrl?: string | null;
  posterUrl?: string | null;
  chapters?: { id: string; title: LocaleText; startSeconds: number }[];
  transcript?: LocaleText;
  note?: LocaleText;
};

export type AiExplanationBlock = {
  summary: LocaleText;
  steps: LocaleText[];
  keyIdeas: LocaleText[];
  commonMistakes: LocaleText[];
};

export type Simulation3dBlock = {
  status: "planned" | "available" | "unavailable";
  title: LocaleText;
  purpose: LocaleText;
  subject?: string;
  controls?: LocaleText[];
  placeholderNote?: LocaleText;
};

export type LessonNotesBlock = {
  studentNotes: LocaleText;
  teacherNotes?: LocaleText;
  parentNotes?: LocaleText;
  keyTakeaways: LocaleText[];
};

export type LessonAttachment = {
  id: string;
  title: LocaleText;
  kind: "pdf" | "image" | "worksheet" | "link" | "other";
  url?: string | null;
  protected?: boolean;
  description?: LocaleText;
};

export type InteractiveQuestion = {
  id: string;
  prompt: LocaleText;
  type: "mcq" | "short" | "true_false";
  options?: LocaleText[];
  answer: string;
  explanation: LocaleText;
};

export type AiChatBlock = {
  enabled: boolean;
  starterPrompts: LocaleText[];
  systemHint: LocaleText;
  endpoint?: string;
};

export type HomeworkItem = {
  id: string;
  title: LocaleText;
  instructions: LocaleText;
  estimatedMinutes: number;
};

export type QuizItem = {
  id: string;
  question: LocaleText;
  options: LocaleText[];
  answerIndex: number;
  explanation: LocaleText;
};

export type LessonProgressBlock = {
  objectives: LocaleText[];
  masteryPercent: number;
  blocksCompleted: LessonBlockId[];
  estimatedMinutes: number;
  lastVisitedAt?: string | null;
};

export type LessonBlocks = {
  interactiveSlides: LessonSlide[];
  teacherVideo: TeacherVideoBlock;
  aiExplanation: AiExplanationBlock;
  simulation3d: Simulation3dBlock;
  notes: LessonNotesBlock;
  attachments: LessonAttachment[];
  interactiveQuestions: InteractiveQuestion[];
  aiChat: AiChatBlock;
  homework: HomeworkItem[];
  quiz: QuizItem[];
  progress: LessonProgressBlock;
};

export type CourseLesson = {
  id: string;
  order: number;
  title: LocaleText;
  summary: LocaleText;
  objectives: LocaleText[];
  estimatedMinutes: number;
  blocks: LessonBlocks;
};

export type CourseUnit = {
  id: string;
  order: number;
  title: LocaleText;
  description: LocaleText;
  lessons: CourseLesson[];
};

export type CourseDefinition = {
  schema: "success-os.course-structure.v1";
  id: string;
  slug: string;
  title: LocaleText;
  description: LocaleText;
  country: string;
  curriculum: string;
  grade: string;
  subject: string;
  language: "en" | "ar" | "bilingual";
  status: "draft" | "review" | "published";
  units: CourseUnit[];
  hierarchy: {
    course: true;
    unit: true;
    lesson: true;
    lessonBlocks: LessonBlockId[];
  };
  updatedAt: string;
};

export type CourseTreeNode = {
  type: "course" | "unit" | "lesson" | "block";
  id: string;
  title: LocaleText;
  children?: CourseTreeNode[];
};

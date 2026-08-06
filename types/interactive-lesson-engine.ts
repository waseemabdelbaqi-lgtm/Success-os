/**
 * SUCCESS OS — Interactive Lesson Engine (Foundation)
 * Schema: success-os.interactive-lesson-engine.v1
 *
 * Books-first today. AI video / curriculum ingestion later (placeholders only).
 * Does not replace Book portal, marketplace, or auth.
 */

export type LocaleText = { en: string; ar: string };

/** Top-level lesson sections (product brief order). */
export type LessonSectionId =
  | "overview"
  | "learning_objectives"
  | "interactive_slides"
  | "concepts"
  | "images_diagrams"
  | "animations"
  | "simulation_3d"
  | "teacher_video"
  | "ai_explanation"
  | "student_notes"
  | "attachments"
  | "practice_questions"
  | "ai_chat"
  | "homework"
  | "lesson_summary"
  | "progress"
  | "next_lesson";

export const LESSON_SECTION_ORDER: LessonSectionId[] = [
  "overview",
  "learning_objectives",
  "interactive_slides",
  "concepts",
  "images_diagrams",
  "animations",
  "simulation_3d",
  "teacher_video",
  "ai_explanation",
  "student_notes",
  "attachments",
  "practice_questions",
  "ai_chat",
  "homework",
  "lesson_summary",
  "progress",
  "next_lesson",
];

export const LESSON_SECTION_LABELS: Record<LessonSectionId, LocaleText> = {
  overview: { en: "Overview", ar: "نظرة عامة" },
  learning_objectives: { en: "Learning Objectives", ar: "أهداف التعلم" },
  interactive_slides: { en: "Interactive Slides", ar: "شرائح تفاعلية" },
  concepts: { en: "Concepts", ar: "المفاهيم" },
  images_diagrams: { en: "Images & Diagrams", ar: "صور ومخططات" },
  animations: { en: "Animations", ar: "رسوم متحركة" },
  simulation_3d: { en: "3D / Simulation", ar: "محاكاة / ثلاثي الأبعاد" },
  teacher_video: { en: "Teacher Video", ar: "فيديو المعلم" },
  ai_explanation: { en: "AI Explanation", ar: "شرح بالذكاء الاصطناعي" },
  student_notes: { en: "Student Notes", ar: "ملاحظات الطالب" },
  attachments: { en: "Attachments", ar: "مرفقات" },
  practice_questions: { en: "Practice Questions", ar: "أسئلة تدريبية" },
  ai_chat: { en: "AI Chat", ar: "محادثة ذكية" },
  homework: { en: "Homework", ar: "واجب منزلي" },
  lesson_summary: { en: "Lesson Summary", ar: "ملخص الدرس" },
  progress: { en: "Progress", ar: "التقدم" },
  next_lesson: { en: "Next Lesson", ar: "الدرس التالي" },
};

/** Modular slide / lesson content block types. */
export type ContentBlockType =
  | "rich_text"
  | "formula"
  | "image"
  | "svg_diagram"
  | "mermaid_diagram"
  | "interactive_chart"
  | "table"
  | "code"
  | "timeline"
  | "callout"
  | "warning"
  | "definition"
  | "example"
  | "accordion"
  | "tabs"
  | "embedded_media"
  | "audio"
  | "video_placeholder"
  | "simulation_placeholder"
  | "scene_3d"
  | "pdf_document"
  | "downloadable_resource"
  | "notes"
  | "ai_explanation"
  | "quick_question"
  | "internal_nav"
  | "external_reference";

export const CONTENT_BLOCK_TYPES: ContentBlockType[] = [
  "rich_text",
  "formula",
  "image",
  "svg_diagram",
  "mermaid_diagram",
  "interactive_chart",
  "table",
  "code",
  "timeline",
  "callout",
  "warning",
  "definition",
  "example",
  "accordion",
  "tabs",
  "embedded_media",
  "audio",
  "video_placeholder",
  "simulation_placeholder",
  "scene_3d",
  "pdf_document",
  "downloadable_resource",
  "notes",
  "ai_explanation",
  "quick_question",
  "internal_nav",
  "external_reference",
];

export type LearningMode =
  | "reading"
  | "presentation"
  | "teacher"
  | "student"
  | "ai_tutor";

export const LEARNING_MODES: LearningMode[] = [
  "reading",
  "presentation",
  "teacher",
  "student",
  "ai_tutor",
];

export const LEARNING_MODE_LABELS: Record<LearningMode, LocaleText> = {
  reading: { en: "Reading Mode", ar: "وضع القراءة" },
  presentation: { en: "Presentation Mode", ar: "وضع العرض" },
  teacher: { en: "Teacher Mode", ar: "وضع المعلم" },
  student: { en: "Student Mode", ar: "وضع الطالب" },
  ai_tutor: { en: "AI Tutor Mode", ar: "وضع المعلّم الذكي" },
};

export type LessonDifficulty = "intro" | "core" | "advanced" | "challenge";

export type LessonFilters = {
  country?: string;
  curriculum?: string;
  qualification?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  lesson?: string;
  language?: string;
  difficulty?: LessonDifficulty | string;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title?: LocaleText;
  /** Primary text / markdown-ish plain text */
  text?: LocaleText;
  /** LaTeX or plain formula string */
  formula?: string;
  /** Mermaid source (flowcharts, timelines, sequence) */
  mermaidSource?: string;
  /** Subject hint for STEM rendering (math | chemistry | physics | biology) */
  stemDomain?: "math" | "chemistry" | "physics" | "biology" | "general";
  src?: string | null;
  alt?: LocaleText;
  svgMarkup?: string;
  chart?: {
    kind: "bar" | "line" | "pie";
    labels: string[];
    values: number[];
  };
  /** Simple table model */
  table?: {
    headers: LocaleText[];
    rows: LocaleText[][];
  };
  /** Code fence */
  code?: {
    language: string;
    source: string;
  };
  /** Timeline / accordion / tabs items */
  items?: {
    id: string;
    title: LocaleText;
    body: LocaleText;
  }[];
  mediaUrl?: string | null;
  downloadUrl?: string | null;
  protected?: boolean;
  question?: {
    prompt: LocaleText;
    options?: LocaleText[];
    answerIndex?: number;
    explanation?: LocaleText;
  };
  href?: string;
  external?: boolean;
  legalNote?: LocaleText;
  placeholderStatus?: "planned" | "ready" | "unavailable" | "not-produced";
  meta?: Record<string, unknown>;
};

export type InteractiveSlide = {
  id: string;
  order: number;
  title: LocaleText;
  kind?: "intro" | "concept" | "example" | "practice" | "summary" | "custom";
  blocks: ContentBlock[];
};

export type FutureCapabilityPlaceholder = {
  id: string;
  status: "placeholder" | "planned" | "ready";
  label: LocaleText;
  apiPath: string;
  notes: LocaleText;
};

export type InteractiveLessonPackage = {
  schema: "success-os.interactive-lesson-engine.v1";
  id: string;
  version: number;
  status: "draft" | "preview" | "published" | "unpublished";
  title: LocaleText;
  summary: LocaleText;
  filters: LessonFilters;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  language: "en" | "ar" | "bilingual";
  source: {
    kind: "book" | "course" | "engine-demo" | "admin";
    bookId?: string;
    unitId?: string;
    lessonId?: string;
    courseId?: string;
  };
  sections: Partial<Record<LessonSectionId, ContentBlock[]>>;
  slides: InteractiveSlide[];
  objectives: LocaleText[];
  concepts: LocaleText[];
  nextLesson?: {
    id: string;
    title: LocaleText;
    href?: string;
  } | null;
  futureCapabilities: FutureCapabilityPlaceholder[];
  accessibility: {
    captions: boolean;
    keyboardNav: boolean;
    readingMode: boolean;
    highContrast: boolean;
  };
  performance: {
    lazyLoad: boolean;
    virtualizeSlides: boolean;
    offlineReady: boolean;
  };
  changelog?: { at: string; note: string; by?: string }[];
  /** Opaque engine metadata (versioning snapshots, builder flags) — never country-specific */
  engineMeta?: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
};

export type LessonOutlineNode = {
  type: "book" | "course" | "unit" | "lesson" | "section" | "slide";
  id: string;
  title: LocaleText;
  href?: string;
  children?: LessonOutlineNode[];
};

export type StudentWorkspaceState = {
  notes: string;
  highlights: { id: string; text: string; color: string; createdAt: string }[];
  bookmarks: { id: string; label: string; sectionId?: LessonSectionId; slideId?: string }[];
  drawingDataUrl?: string | null;
  progressPercent: number;
  sectionsCompleted: LessonSectionId[];
  continueAt?: { sectionId: LessonSectionId; slideIndex?: number };
  lastVisitedAt: string;
};

export type AdminLessonDraft = InteractiveLessonPackage & {
  publishable: boolean;
  previewUrl: string;
};

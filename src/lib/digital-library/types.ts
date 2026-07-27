export type TeacherExplanationSegment = {
  id: string;
  minutes: number;
  titleAr: string;
  goalAr: string;
  teacherScript: string;
  studentMoves: string[];
  boardCue?: string;
};

export type TeacherExplanation = {
  totalMinutes: number;
  teacherId: string;
  teacherName: string;
  teacherHref: string;
  offerId?: string;
  offerHref?: string;
  titleAr: string;
  subtitleAr: string;
  materials: string[];
  segments: TeacherExplanationSegment[];
};

export type LessonModuleContent = {
  slug: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  learningObjectives: string[];
  knowledgeMarkdown: string;
  visualizer: {
    kind: "photoelectric" | "orbital" | "wave" | "numberline";
    caption: string;
  };
  examples: Array<{
    difficulty: "Easy" | "Medium" | "Hard";
    title: string;
    prompt: string;
    steps: string[];
    finalAnswer: string;
  }>;
  quiz: Array<{
    id: string;
    type: "mcq" | "open";
    prompt: string;
    choices?: string[];
    correctIndex?: number;
    sampleAnswer?: string;
    hint: string;
    explanation: string;
  }>;
  sources: Array<{ label: string; url: string }>;
  /** Full human-teacher explanation (≥30 min) when available */
  teacherExplanation?: TeacherExplanation;
  /** Opt-in interactive scene player (replaces slideshow theater) */
  interactivePlayer?: boolean;
};

export type CurriculumNode = {
  slug: string;
  name: string;
  children?: CurriculumNode[];
  lessonSlug?: string;
};

export type LibraryPath = {
  region: string;
  country: string;
  curriculumType: string;
  educationLevel: string;
  subject: string;
  chapter: string;
  lesson: string;
};

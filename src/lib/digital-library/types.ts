export type LessonModuleContent = {
  slug: string;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  learningObjectives: string[];
  knowledgeMarkdown: string;
  visualizer: {
    kind: "photoelectric" | "orbital" | "wave";
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

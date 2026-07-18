export type TextDirection = "ltr" | "rtl";

export type PortalLocale = "en" | "ar";

export type BookType = "textbook" | "workbook" | "reference" | "supplementary";

export type SystemType = "national" | "international";

export type DemoContentMeta = {
  isDemo: true;
  source: "demo-catalog";
  version: string;
  disclaimer: string;
};

export type Country = {
  id: string;
  name: Record<PortalLocale, string>;
  code: string;
};

export type EducationalSystem = {
  id: string;
  countryId: string;
  name: Record<PortalLocale, string>;
  type: SystemType;
};

export type Curriculum = {
  id: string;
  systemId: string;
  name: Record<PortalLocale, string>;
};

export type Grade = {
  id: string;
  curriculumId: string;
  name: Record<PortalLocale, string>;
  level: number;
};

export type Subject = {
  id: string;
  name: Record<PortalLocale, string>;
  icon: string;
};

export type LessonDefinition = {
  id: string;
  title: Record<PortalLocale, string>;
  order: number;
  summary: Record<PortalLocale, string>;
  objectives: Record<PortalLocale, string[]>;
  content: Record<PortalLocale, string>;
  keyConcepts: Record<PortalLocale, string[]>;
  definitions: Record<PortalLocale, { term: string; meaning: string }[]>;
  importantNotes: Record<PortalLocale, string[]>;
  diagrams: {
    id: string;
    title: Record<PortalLocale, string>;
    description: Record<PortalLocale, string>;
    type: "chart" | "diagram" | "illustration";
  }[];
  references: Record<PortalLocale, string[]>;
  estimatedMinutes: number;
};

export type UnitDefinition = {
  id: string;
  title: Record<PortalLocale, string>;
  order: number;
  description: Record<PortalLocale, string>;
  lessons: LessonDefinition[];
};

export type BookDefinition = {
  id: string;
  slug: string;
  title: Record<PortalLocale, string>;
  description: Record<PortalLocale, string>;
  coverColor: string;
  coverLabel: string;
  countryId: string;
  systemId: string;
  curriculumId: string;
  gradeId: string;
  subjectId: string;
  language: PortalLocale;
  direction: TextDirection;
  bookType: BookType;
  version: string;
  updatedAt: string;
  units: UnitDefinition[];
  tags: string[];
};

export type BookFilters = {
  countryId?: string;
  systemType?: SystemType;
  systemId?: string;
  curriculumId?: string;
  gradeId?: string;
  subjectId?: string;
  language?: PortalLocale;
  bookType?: BookType;
  version?: string;
  query?: string;
};

export type LessonBookmark = {
  id: string;
  bookId: string;
  unitId: string;
  lessonId: string;
  createdAt: string;
  label?: string;
};

export type LessonNote = {
  id: string;
  bookId: string;
  unitId: string;
  lessonId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TextHighlight = {
  id: string;
  bookId: string;
  unitId: string;
  lessonId: string;
  text: string;
  color: string;
  createdAt: string;
};

export type ReadingHistoryEntry = {
  id: string;
  bookId: string;
  unitId: string;
  lessonId: string;
  visitedAt: string;
  durationMinutes?: number;
};

export type LessonProgress = {
  bookId: string;
  unitId: string;
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  lastReadAt: string;
};

export type BookProgress = {
  bookId: string;
  completedLessons: string[];
  lastLessonId?: string;
  lastUnitId?: string;
  lastReadAt: string;
  progressPercent: number;
};

export type SavedBook = {
  bookId: string;
  savedAt: string;
};

export type StudentReadingSettings = {
  fontSize: number;
  theme: "light" | "dark";
  locale: PortalLocale;
  direction: TextDirection;
};

export type StudentProfile = {
  countryId: string;
  systemId: string;
  curriculumId: string;
  gradeId: string;
  subjectIds: string[];
};

export type ContinueReadingItem = {
  bookId: string;
  unitId: string;
  lessonId: string;
  bookTitle: string;
  lessonTitle: string;
  progressPercent: number;
  lastReadAt: string;
};

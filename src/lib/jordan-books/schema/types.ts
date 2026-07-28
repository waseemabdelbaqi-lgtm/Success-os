/**
 * Jordan Interactive Books — scalable content schema.
 * country → … → lesson → contentBlock → activity → question → source → version
 */

export type EditorialStatus =
  | "discovered"
  | "source_verified"
  | "rights_checked"
  | "structured"
  | "draft"
  | "academic_review"
  | "language_review"
  | "technical_review"
  | "approved"
  | "published"
  | "archived";

export type RightsStatus =
  | "official_link_only"
  | "sos_original_aligned"
  | "rights_review_required"
  | "unavailable"
  | "needs_verification";

export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "definition"
  | "example"
  | "formula"
  | "table"
  | "image"
  | "diagram"
  | "graph"
  | "timeline"
  | "map"
  | "worked_solution"
  | "callout"
  | "activity"
  | "question"
  | "writing_space"
  | "interactive"
  | "source_citation"
  | "vocabulary"
  | "common_mistakes"
  | "real_life"
  | "practice";

export type SourceRecord = {
  name: string;
  url: string;
  authorityType: string;
  usage: string;
  license: string;
  verificationDate: string;
  notes?: string;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  titleAr?: string;
  bodyAr: string;
  bodyEn?: string;
  formula?: string;
  items?: string[];
  interactiveKind?: "mcq" | "tap" | "match" | "type" | "trace";
  question?: {
    promptAr: string;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    explanationAr: string;
  };
};

export type LessonRecord = {
  id: string;
  order: number;
  titleAr: string;
  titleEn?: string;
  learningOutcomes: string[];
  prerequisites: string[];
  vocabulary: Array<{ term: string; definition: string }>;
  blocks: ContentBlock[];
  editorialStatus: EditorialStatus;
  rightsStatus: RightsStatus;
  sources: SourceRecord[];
  preparedBy?: string;
  estimatedMinutes: number;
};

export type UnitRecord = {
  id: string;
  order: number;
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  lessons: LessonRecord[];
  verificationNote?: string;
};

export type BookRecord = {
  id: string;
  country: "Jordan";
  curriculum: "national";
  academicYear: string;
  stage: string;
  grade: string;
  gradeAr: string;
  semester: string;
  semesterAr: string;
  stream?: string;
  subject: string;
  subjectAr: string;
  officialTitleAr: string;
  officialTitleEn?: string;
  bookType: "student" | "activity" | "workbook" | "teacher_guide" | "support";
  edition?: string;
  publicationYear?: string;
  officialSourceUrl: string;
  curriculumAuthority: string;
  availabilityStatus: string;
  rightsStatus: RightsStatus;
  verificationDate: string;
  verificationNote?: string;
  units: UnitRecord[];
  editorialStatus: EditorialStatus;
};

export type InventoryItem = {
  id: string;
  grade: string;
  gradeAr: string;
  semester: string;
  subjectAr: string;
  bookType: string;
  officialTitleAr: string;
  officialSourceUrl: string;
  rightsStatus: RightsStatus;
  availabilityStatus: string;
  verificationDate: string;
  notes?: string;
};

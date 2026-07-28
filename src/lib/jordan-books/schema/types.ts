/**
 * Jordan Interactive Books — expanded content schema (BOOKS FIRST).
 */

export type EditorialStatus =
  | "discovered"
  | "source_verified"
  | "rights_checked"
  | "structured"
  | "draft"
  | "content_draft"
  | "academic_review"
  | "language_review"
  | "technical_review"
  | "corrections_required"
  | "approved"
  | "published"
  | "archived"
  | "replaced";

export type RightsStatus =
  | "publicly_reusable"
  | "officially_authorized"
  | "official_link_only"
  | "transform_permitted"
  | "sos_original_aligned"
  | "rights_review_required"
  | "restricted"
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
  | "practice"
  | "hook"
  | "objectives"
  | "materials"
  | "closure"
  | "exit_question"
  | "hint";

export type SourceRecord = {
  name: string;
  url: string;
  authorityType: string;
  usage: string;
  license: string;
  verificationDate: string;
  notes?: string;
};

export type QuestionPayload = {
  promptAr: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  acceptedAnswers?: string[];
  explanationAr: string;
  hint1Ar?: string;
  hint2Ar?: string;
  commonWrong?: Array<{ answer: string; whyAr: string }>;
  skill?: string;
  difficulty?: "easy" | "medium" | "challenge";
  points?: number;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  titleAr?: string;
  bodyAr: string;
  bodyEn?: string;
  formula?: string;
  items?: string[];
  interactiveKind?: "mcq" | "tap" | "match" | "type" | "trace" | "true_false";
  question?: QuestionPayload;
  officialPageRef?: string;
  language?: "ar" | "en" | "math";
  direction?: "rtl" | "ltr";
  aiGenerated?: boolean;
  reviewStatus?: EditorialStatus;
};

export type LessonRecord = {
  id: string;
  order: number;
  titleAr: string;
  titleEn?: string;
  learningOutcomes: string[];
  skills?: string[];
  prerequisites: string[];
  vocabulary: Array<{ term: string; definition: string }>;
  blocks: ContentBlock[];
  editorialStatus: EditorialStatus;
  rightsStatus: RightsStatus;
  sources: SourceRecord[];
  preparedBy?: string;
  estimatedMinutes: number;
  difficulty?: "intro" | "core" | "challenge";
  officialPageRange?: string;
  aiGeneratedFlag?: boolean;
};

export type UnitRecord = {
  id: string;
  order: number;
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  lessons: LessonRecord[];
  verificationNote?: string;
  semesterAssignment?: string;
};

export type PageMapEntry = {
  digitalPage: number;
  officialPageRef?: string;
  unitId: string;
  lessonId: string;
  sectionLabelAr: string;
};

export type AnswerBankEntry = {
  id: string;
  lessonId: string;
  unitId: string;
  questionBlockId: string;
  promptAr: string;
  correctAnswer: string;
  explanationAr: string;
  verificationStatus: "verified" | "needs_academic_review" | "ambiguous";
};

export type BookRecord = {
  id: string;
  country: "Jordan";
  curriculum: "national";
  curriculumVersion: string;
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
  bookType: "student" | "activity" | "workbook" | "teacher_guide" | "support" | "sos_companion";
  edition?: string;
  publicationYear?: string;
  publisher?: string;
  officialSourceUrl: string;
  directResourceUrl?: string;
  curriculumAuthority: string;
  availabilityStatus: string;
  rightsStatus: RightsStatus;
  verificationDate: string;
  verificationNote?: string;
  units: UnitRecord[];
  pageMap?: PageMapEntry[];
  answerBank?: AnswerBankEntry[];
  glossary?: Array<{ term: string; definition: string }>;
  editorialStatus: EditorialStatus;
  completenessClaim: "not_complete" | "sem1_core_draft" | "complete_pending_review" | "complete";
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
  edition?: string;
  publicationYear?: string;
};

export type ValidationIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  bookId?: string;
  unitId?: string;
  lessonId?: string;
};

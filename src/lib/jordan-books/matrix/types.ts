/**
 * Matrix cell production statuses — never display COMPLETE without full review gates.
 */
export type MatrixStatus =
  | "NOT_DISCOVERED"
  | "DISCOVERED"
  | "SOURCE_VERIFIED"
  | "RIGHTS_REVIEW"
  | "QUEUED"
  | "IN_PRODUCTION"
  | "STRUCTURED"
  | "CONTENT_COMPLETE"
  | "ACADEMIC_REVIEW"
  | "LANGUAGE_REVIEW"
  | "TECHNICAL_REVIEW"
  | "PUBLISHED"
  | "COMPLETE"
  | "BLOCKED";

export type BookTypeKey =
  | "student"
  | "activity"
  | "workbook"
  | "teacher_guide"
  | "sos_companion"
  | "support";

export type InventoryCell = {
  id: string;
  country: "Jordan";
  curriculum: "national";
  curriculumVersion: string;
  academicYear: string;
  stage: string;
  gradeKey: string;
  gradeAr: string;
  semester: "1" | "2" | "year";
  semesterAr: string;
  pathway: string;
  pathwayAr: string;
  subjectAr: string;
  subjectSlug: string;
  bookType: BookTypeKey;
  officialTitleAr: string;
  officialSourceUrl: string;
  companionSourceUrl?: string;
  discoverySource: "nccd-verified" | "nccd-catalog" | "minhaji-indexed" | "pending";
  subjectListStatus: "verified" | "indexed-pending-nccd" | "not_discovered";
  rightsStatus: string;
  matrixStatus: MatrixStatus;
  blocker?: string;
  structuredBookId?: string;
  unitsExpected?: number;
  lessonsExpected?: number;
  unitsDone?: number;
  lessonsDone?: number;
  exercisesDone?: number;
  answersDone?: number;
  verificationDate: string;
};

export type QueueItem = {
  cellId: string;
  priority: number;
  enqueuedAt: string;
  attempts: number;
  lastError?: string;
  state: "pending" | "running" | "done" | "blocked" | "skipped";
};

export type CompletenessMatrixReport = {
  generatedAt: string;
  totalCells: number;
  byStatus: Record<string, number>;
  byGrade: Array<{
    gradeAr: string;
    pathway: string;
    subjects: number;
    cells: number;
    contentComplete: number;
    published: number;
    complete: number;
    blocked: number;
    percentStructured: number;
  }>;
  cells: InventoryCell[];
  blockers: InventoryCell[];
  videoDevelopmentStopped: true;
  honestCompleteClaim: false;
};

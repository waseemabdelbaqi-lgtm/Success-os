/**
 * SUCCESS OS — Curriculum Import Engine
 * Schema: success-os.curriculum-import-engine.v1
 *
 * Compiler only — never renders lessons.
 * Output: verified InteractiveLessonPackage (ILE) only.
 * ADR-0049 / ADR-0050: ILE is the only runtime; import is a compiler.
 */

import type { LocaleText, InteractiveLessonPackage } from "./interactive-lesson-engine";

export type CurriculumImportSchema = "success-os.curriculum-import-engine.v1";

export type ImportSourceType =
  | "ministry_of_education"
  | "curriculum_authority"
  | "oer"
  | "licensed_publisher"
  | "open_textbook"
  | "internal_success_os";

export type ImportPipelineStageId =
  | "source_discovery"
  | "source_verification"
  | "rights_verification"
  | "metadata_extraction"
  | "book_detection"
  | "unit_detection"
  | "lesson_detection"
  | "content_normalization"
  | "asset_extraction"
  | "ile_package_builder"
  | "validation"
  | "publishing_queue";

export const IMPORT_PIPELINE_STAGES: ImportPipelineStageId[] = [
  "source_discovery",
  "source_verification",
  "rights_verification",
  "metadata_extraction",
  "book_detection",
  "unit_detection",
  "lesson_detection",
  "content_normalization",
  "asset_extraction",
  "ile_package_builder",
  "validation",
  "publishing_queue",
];

export type VerificationGateId =
  | "source_verification"
  | "rights_verification"
  | "duplicate_detection"
  | "metadata_validation"
  | "structure_validation"
  | "asset_validation"
  | "package_validation";

export const VERIFICATION_GATES: VerificationGateId[] = [
  "source_verification",
  "rights_verification",
  "duplicate_detection",
  "metadata_validation",
  "structure_validation",
  "asset_validation",
  "package_validation",
];

export type GateResult = {
  gate: VerificationGateId;
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: LocaleText;
  details?: Record<string, unknown>;
};

export type RightsStatus = "unknown" | "verified" | "restricted" | "rejected";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type ImportJobStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "rejected"
  | "failed"
  | "rolled_back";

export type CurriculumSourceRef = {
  id: string;
  type: ImportSourceType;
  connectorId: string;
  label: LocaleText;
  country?: string;
  curriculum?: string;
  url?: string | null;
  authority?: string;
  license?: string;
  rightsNotes?: LocaleText;
};

export type ExtractedMetadata = {
  country: string;
  curriculum: string;
  grade?: string;
  semester?: string;
  subject?: string;
  language: "ar" | "en" | "bilingual";
  edition?: string;
  keywords: string[];
  objectives: LocaleText[];
  sourceId: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
};

export type DetectedLesson = {
  id: string;
  title: LocaleText;
  order: number;
  objectives: LocaleText[];
  keywords: string[];
  /** Normalized plain content — never AI-rewritten */
  body: LocaleText;
  assets: ImportAsset[];
  references: { label: LocaleText; href?: string }[];
};

export type DetectedUnit = {
  id: string;
  title: LocaleText;
  order: number;
  overview?: LocaleText;
  lessons: DetectedLesson[];
};

export type DetectedBook = {
  id: string;
  title: LocaleText;
  metadata: ExtractedMetadata;
  units: DetectedUnit[];
  checksum?: string;
};

export type ImportAsset = {
  id: string;
  kind: "image" | "pdf" | "audio" | "video" | "svg" | "other";
  label: LocaleText;
  src?: string | null;
  placeholder: boolean;
};

/** Compiled ILE package with import provenance — still an InteractiveLessonPackage */
export type CompiledIlePackage = InteractiveLessonPackage & {
  importMeta: {
    jobId: string;
    sourceId: string;
    connectorId: string;
    checksum: string;
    rightsStatus: RightsStatus;
    verificationStatus: VerificationStatus;
    gates: GateResult[];
    compiledAt: string;
    country: string;
    curriculum: string;
  };
};

export type ImportJobEvent = {
  at: string;
  stage: ImportPipelineStageId | "system";
  level: "info" | "warning" | "error";
  message: string;
};

export type ImportJob = {
  schema: CurriculumImportSchema;
  id: string;
  status: ImportJobStatus;
  country: string;
  curriculum: string;
  connectorId: string;
  source: CurriculumSourceRef;
  currentStage: ImportPipelineStageId | null;
  stagesCompleted: ImportPipelineStageId[];
  gates: GateResult[];
  book?: DetectedBook | null;
  packages: CompiledIlePackage[];
  packageCount: number;
  bookCount: number;
  lessonCount: number;
  errors: string[];
  warnings: string[];
  events: ImportJobEvent[];
  resumable: true;
  checkpoint?: {
    stage: ImportPipelineStageId;
    cursor?: string;
  } | null;
  version: number;
  history: { version: number; at: string; note: string }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type ImportDashboardSnapshot = {
  schema: CurriculumImportSchema;
  queue: ImportJob[];
  running: ImportJob[];
  completed: ImportJob[];
  rejected: ImportJob[];
  counts: {
    jobs: number;
    running: number;
    completed: number;
    rejected: number;
    packages: number;
    books: number;
    lessons: number;
    errors: number;
    warnings: number;
    countries: number;
    curricula: number;
    grades: number;
    subjects: number;
    units: number;
    imported: number;
    verified: number;
    pending: number;
    published: number;
    verifiedPackages: number;
    pendingPackages: number;
    rejectedPackages: number;
    rightsWarnings: number;
    globalSubjects: number;
    globalSkills: number;
  };
  verificationSummary: Record<VerificationStatus, number>;
  rightsSummary: Record<RightsStatus, number>;
  history: ImportJobEvent[];
  hierarchyPathExample?: string[];
  validationErrors?: string[];
  rightsWarningsList?: string[];
  importProgress?: {
    totalLessons: number;
    verified: number;
    pending: number;
    rejected: number;
    published: number;
    percentVerified: number;
  };
};

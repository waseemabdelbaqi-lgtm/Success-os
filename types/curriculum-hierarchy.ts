/**
 * Generic curriculum hierarchy — country-agnostic database model.
 * Adding SA/EG/USA/AP/IGCSE/IB only requires a new connector + registry rows.
 * Never renders lessons (ADR-0049 / ADR-0050).
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type {
  RightsStatus,
  VerificationStatus,
  CompiledIlePackage,
  ImportAsset,
} from "./curriculum-import-engine";

export type CurriculumHierarchySchema = "success-os.curriculum-hierarchy.v1";

export type CountryRecord = {
  id: string;
  code: string;
  name: LocaleText;
  createdAt: string;
};

export type CurriculumRecord = {
  id: string;
  countryId: string;
  name: LocaleText;
  academicYear: string;
  kind: "national" | "international" | "exam_board" | "custom";
  createdAt: string;
};

export type GradeRecord = {
  id: string;
  curriculumId: string;
  code: string;
  name: LocaleText;
  order: number;
};

export type SemesterRecord = {
  id: string;
  gradeId: string;
  code: string;
  name: LocaleText;
  order: number;
};

export type SubjectRecord = {
  /** Hierarchical id within a curriculum, e.g. JO-NATIONAL-G01-MATH */
  id: string;
  gradeId: string;
  semesterId?: string;
  code: string;
  name: LocaleText;
  /** Global Subject Registry id, e.g. SUB-00001 */
  globalSubjectId: string;
};

export type BookRecord = {
  id: string;
  subjectId: string;
  semesterId?: string;
  part?: string;
  title: LocaleText;
  language: "ar" | "en" | "bilingual";
  version: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  sourceId: string;
  checksum?: string;
};

export type UnitRecord = {
  id: string;
  bookId: string;
  order: number;
  title: LocaleText;
  overview?: LocaleText;
};

/** Per-dimension verification for the Jordan reference standard */
export type LessonDimensionStatus = "pass" | "fail" | "pending" | "n/a";

export type LessonVerificationReport = {
  sourceStatus: LessonDimensionStatus;
  rightsStatus: LessonDimensionStatus;
  structureStatus: LessonDimensionStatus;
  metadataStatus: LessonDimensionStatus;
  packageStatus: LessonDimensionStatus;
  publishingStatus: "published" | "rejected" | "pending" | "blocked";
};

export type BloomLevel =
  | "remember"
  | "understand"
  | "apply"
  | "analyze"
  | "evaluate"
  | "create";

export type LessonDifficulty = "core" | "support" | "extension" | "advanced";

/**
 * Metadata-only lesson row — official global lesson contract.
 * No AI content generation in import / dataset PRs.
 */
export type LessonMetadataRecord = {
  /** Stable UUID (deterministic from globalLessonId) */
  lessonUuid: string;
  /** Hierarchical global id, e.g. JO-NATIONAL-G01-MATH-B01-U01-L01 */
  globalLessonId: string;
  /** Global Subject Registry id, e.g. SUB-00001 */
  globalSubjectId: string;
  curriculumId: string;
  countryId: string;
  language: "ar" | "en" | "bilingual";
  /** Platform package / content version */
  version: string;
  /** Official curriculum edition version */
  officialVersion: string;
  /** Success OS platform schema/version tag */
  platformVersion: string;
  parentLesson: string | null;
  childLessons: string[];
  relatedLessons: string[];
  prerequisites: string[];
  nextLessons: string[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  difficulty: LessonDifficulty;
  bloomLevel: BloomLevel;
  /** Global Skill Registry ids, e.g. SKL-00001 */
  skills: string[];
  tags: string[];
  /** Always false until AI PRs (#52–53) explicitly enable */
  aiReady: boolean;
  published: boolean;
  verified: boolean;
  archived: boolean;
  /** Human-readable hierarchy projection */
  country: string;
  curriculum: string;
  grade: string;
  semester: string;
  subject: string;
  book: string;
  unit: string;
  lesson: string;
  lessonOrder: number;
  officialLessonTitle: LocaleText;
  learningObjectives: LocaleText[];
  keywords: string[];
  references: { label: LocaleText; href?: string }[];
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  packageVersion: string;
  checksum: string;
  verification: LessonVerificationReport;
};

export type LessonRecord = {
  id: string;
  unitId: string;
  bookId: string;
  order: number;
  title: LocaleText;
  objectives: LocaleText[];
  standards: string[];
  keywords: string[];
  references: { label: LocaleText; href?: string }[];
  assets: ImportAsset[];
  activities: LocaleText[];
  /** Structural synopsis only — never AI-rewritten lesson prose in dataset PRs */
  body: LocaleText;
  language: "ar" | "en" | "bilingual";
  version: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  published: boolean;
  ilePackageId?: string | null;
  checksum?: string;
  verification?: LessonVerificationReport;
  /** Flattened metadata projection for the official reference standard */
  metadata?: LessonMetadataRecord;
};

export type HierarchySnapshot = {
  schema: CurriculumHierarchySchema;
  countries: CountryRecord[];
  curricula: CurriculumRecord[];
  grades: GradeRecord[];
  semesters: SemesterRecord[];
  subjects: SubjectRecord[];
  books: BookRecord[];
  units: UnitRecord[];
  lessons: LessonRecord[];
  packages: CompiledIlePackage[];
  counts: {
    countries: number;
    curricula: number;
    grades: number;
    subjects: number;
    books: number;
    units: number;
    lessons: number;
    packages: number;
    verifiedPackages: number;
    pendingPackages: number;
    rejectedPackages: number;
    imported: number;
    verified: number;
    rejected: number;
    pending: number;
    published: number;
    errors: number;
    warnings: number;
    rightsWarnings: number;
  };
  validationErrors: string[];
  rightsWarnings: string[];
  tree?: unknown;
};

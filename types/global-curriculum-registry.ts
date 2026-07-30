/**
 * Global Curriculum Registry — permanent foundation for every educational system.
 *
 * Hierarchy (discovered dynamically; never assumed):
 *   World → Country → Curriculum → Academic Year → Grade → Semester?
 *     → Subject → Book → Unit → Lesson → ILE Package
 *
 * Jordan is the first reference implementation, not a hardcoded platform model.
 * Schema: success-os.global-curriculum-registry.v1
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type { RightsStatus, VerificationStatus } from "./curriculum-import-engine";
import type { BloomLevel, LessonDifficulty } from "./curriculum-hierarchy";

export type GlobalCurriculumRegistrySchema =
  "success-os.global-curriculum-registry.v1";

export type WorldRecord = {
  globalId: string; // WLD-00001
  name: LocaleText;
};

export type GlobalCountryRecord = {
  globalId: string; // CTR-XXXXX
  /** Short ISO-style code used in hierarchical paths, e.g. JO */
  code: string;
  name: LocaleText;
  active: boolean;
};

export type GlobalCurriculumRecord = {
  globalId: string; // CUR-XXXXX
  countryGlobalId: string;
  code: string;
  name: LocaleText;
  kind: "national" | "international" | "exam_board" | "custom";
  active: boolean;
};

export type GlobalAcademicYearRecord = {
  globalId: string; // AYR-XXXXX
  curriculumGlobalId: string;
  /** Display label, e.g. 2025/2026 */
  label: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
};

export type GlobalGradeRecord = {
  globalId: string; // GRD-XXXXX
  academicYearGlobalId: string;
  curriculumGlobalId: string;
  code: string;
  name: LocaleText;
  order: number;
  /** Hierarchical path id when known, e.g. JO-NATIONAL-G01 */
  hierarchicalId?: string;
};

export type GlobalSemesterRecord = {
  globalId: string; // SEM-XXXXX
  gradeGlobalId: string;
  code: string;
  name: LocaleText;
  order: number;
  hierarchicalId?: string;
};

export type GlobalSubjectBinding = {
  /** Curriculum-local hierarchical subject id, e.g. JO-NATIONAL-G01-MATH */
  hierarchicalId: string;
  gradeGlobalId: string;
  semesterGlobalId?: string;
  /** Resolved Global Subject Registry id (SUB-XXXXX) */
  subjectGlobalId: string;
  /** Official local label as discovered from curriculum source */
  localLabel: LocaleText;
  localCode: string;
};

export type GlobalBookRecord = {
  globalId: string; // BOK-XXXXX
  hierarchicalId: string;
  subjectHierarchicalId: string;
  subjectGlobalId: string;
  title: LocaleText;
  language: "ar" | "en" | "bilingual";
  part?: string;
  version: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
};

export type GlobalUnitRecord = {
  globalId: string; // UNT-XXXXX
  hierarchicalId: string;
  bookGlobalId: string;
  order: number;
  title: LocaleText;
};

export type GlobalLessonNode = {
  globalId: string; // LSN-XXXXX
  hierarchicalId: string;
  unitGlobalId: string;
  bookGlobalId: string;
  subjectGlobalId: string;
  countryGlobalId: string;
  curriculumGlobalId: string;
  academicYearGlobalId: string;
  gradeGlobalId: string;
  semesterGlobalId?: string;
  order: number;
  officialLessonName: LocaleText;
  language: "ar" | "en" | "bilingual";
  learningObjectives: LocaleText[];
  skills: string[]; // SKL-XXXXX
  prerequisites: string[]; // hierarchical or LSN ids
  nextLessons: string[];
  estimatedDuration: number;
  difficulty: LessonDifficulty;
  bloomLevel: BloomLevel;
  keywords: string[];
  references: { label: LocaleText; href?: string }[];
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  packageVersion: string;
  checksum: string;
  published: boolean;
  archived: boolean;
  ilePackageGlobalId?: string | null;
  ilePackageId?: string | null;
};

export type GlobalIlePackageRef = {
  globalId: string; // PKG-XXXXX
  /** Runtime package id, e.g. ile_JO-NATIONAL-G01-MATH-B01-U01-L01 */
  packageId: string;
  lessonGlobalId: string;
  lessonHierarchicalId: string;
  schema: "success-os.interactive-lesson-engine.v1";
};

export type GlobalCurriculumRegistrySnapshot = {
  schema: GlobalCurriculumRegistrySchema;
  hierarchy: string[];
  world: WorldRecord;
  countries: GlobalCountryRecord[];
  curricula: GlobalCurriculumRecord[];
  academicYears: GlobalAcademicYearRecord[];
  grades: GlobalGradeRecord[];
  semesters: GlobalSemesterRecord[];
  subjectBindings: GlobalSubjectBinding[];
  books: GlobalBookRecord[];
  units: GlobalUnitRecord[];
  lessons: GlobalLessonNode[];
  packages: GlobalIlePackageRef[];
  counts: {
    countries: number;
    curricula: number;
    academicYears: number;
    grades: number;
    semesters: number;
    subjects: number;
    books: number;
    units: number;
    lessons: number;
    packages: number;
  };
  notes: string[];
};

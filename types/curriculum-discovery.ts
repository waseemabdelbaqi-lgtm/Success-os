/**
 * Dynamic curriculum discovery — structures detected from official sources.
 * The platform never assumes grades, subjects, books, or semesters.
 */
import type { LocaleText } from "./interactive-lesson-engine";
import type { RightsStatus, VerificationStatus } from "./curriculum-import-engine";

export type CurriculumDiscoverySchema = "success-os.curriculum-discovery.v1";

/** Official curriculum source document (ministry / authority / connector payload). */
export type OfficialCurriculumSource = {
  schema: "success-os.official-curriculum-source.v1";
  sourceId: string;
  authority: string;
  connectorId: string;
  countryCode: string;
  countryName: LocaleText;
  curriculumCode: string;
  curriculumName: LocaleText;
  curriculumKind: "national" | "international" | "exam_board" | "custom";
  academicYear: string;
  license: string;
  grades: OfficialGradeSource[];
};

export type OfficialGradeSource = {
  code: string;
  name: LocaleText;
  order: number;
  /** Omit or empty when the curriculum has no semesters */
  semesters?: OfficialSemesterSource[];
  /** Subjects that officially exist in this grade (and optional semester) */
  subjects: OfficialSubjectSource[];
};

export type OfficialSemesterSource = {
  code: string;
  name: LocaleText;
  order: number;
};

export type OfficialSubjectSource = {
  /** Local subject code used in hierarchical paths, e.g. MATH */
  localCode: string;
  /** Official local label(s) — resolved to SUB-XXXXX via Global Subject Registry */
  localLabel: LocaleText;
  /** Preferred alias key for resolution (ar or en string) */
  aliasLabel: string;
  semesterCode?: string;
  books: OfficialBookSource[];
};

export type OfficialBookSource = {
  part?: string;
  title: LocaleText;
  language: "ar" | "en" | "bilingual";
  version: string;
  units: OfficialUnitSource[];
};

export type OfficialUnitSource = {
  order: number;
  title: LocaleText;
  lessons: OfficialLessonSource[];
};

export type OfficialLessonSource = {
  order: number;
  title: LocaleText;
  learningObjectives: LocaleText[];
  keywords: string[];
  references: { label: LocaleText; href?: string }[];
  assets?: { kind: string; href?: string; label?: string }[];
  rightsStatus?: RightsStatus;
  verificationStatus?: VerificationStatus;
  packageEligible?: boolean;
};

export type DiscoveredSubject = {
  localCode: string;
  localLabel: LocaleText;
  aliasLabel: string;
  /** Resolved Global Subject Registry id — empty if unresolved */
  globalSubjectId: string;
  hierarchicalId: string;
  bookCount: number;
  unitCount: number;
  lessonCount: number;
};

export type DiscoveredGrade = {
  code: string;
  name: LocaleText;
  order: number;
  hierarchicalId: string;
  semesterCodes: string[];
  subjects: DiscoveredSubject[];
};

export type CurriculumDiscoveryReport = {
  schema: CurriculumDiscoverySchema;
  sourceId: string;
  countryCode: string;
  curriculumCode: string;
  academicYear: string;
  detected: {
    grades: DiscoveredGrade[];
    subjects: DiscoveredSubject[];
    semesters: { code: string; name: LocaleText; gradeCode: string }[];
    books: number;
    units: number;
    lessons: number;
    learningObjectives: number;
    references: number;
    assets: number;
  };
  /** Subjects that appear in the Global Registry but were NOT in this official grade */
  excludedGlobalSubjects: string[];
  unresolvedLocalSubjects: string[];
  notes: string[];
};

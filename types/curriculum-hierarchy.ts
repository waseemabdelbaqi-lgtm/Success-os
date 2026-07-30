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
  id: string;
  gradeId: string;
  semesterId?: string;
  code: string;
  name: LocaleText;
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
  body: LocaleText;
  language: "ar" | "en" | "bilingual";
  version: string;
  rightsStatus: RightsStatus;
  verificationStatus: VerificationStatus;
  published: boolean;
  ilePackageId?: string | null;
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
    books: number;
    units: number;
    lessons: number;
    packages: number;
    imported: number;
    verified: number;
    rejected: number;
    pending: number;
    published: number;
    errors: number;
    warnings: number;
  };
};

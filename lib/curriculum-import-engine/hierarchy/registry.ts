/**
 * In-memory curriculum hierarchy registry — generic admin flow store.
 * Connector-agnostic: Jordan today; SA/EG/AP/IGCSE later via new connectors only.
 */
import type {
  BookRecord,
  CountryRecord,
  CurriculumRecord,
  GradeRecord,
  HierarchySnapshot,
  LessonRecord,
  SemesterRecord,
  SubjectRecord,
  UnitRecord,
} from "@/types/curriculum-hierarchy";
import type { CompiledIlePackage } from "@/types/curriculum-import-engine";

const countries = new Map<string, CountryRecord>();
const curricula = new Map<string, CurriculumRecord>();
const grades = new Map<string, GradeRecord>();
const semesters = new Map<string, SemesterRecord>();
const subjects = new Map<string, SubjectRecord>();
const books = new Map<string, BookRecord>();
const units = new Map<string, UnitRecord>();
const lessons = new Map<string, LessonRecord>();
const packages = new Map<string, CompiledIlePackage>();
let errors = 0;
let warnings = 0;

export function resetHierarchyRegistry() {
  countries.clear();
  curricula.clear();
  grades.clear();
  semesters.clear();
  subjects.clear();
  books.clear();
  units.clear();
  lessons.clear();
  packages.clear();
  errors = 0;
  warnings = 0;
}

export function createCountry(input: Omit<CountryRecord, "createdAt"> & { createdAt?: string }) {
  const row: CountryRecord = {
    ...input,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  countries.set(row.id, row);
  return row;
}

export function attachCurriculum(
  input: Omit<CurriculumRecord, "createdAt"> & { createdAt?: string },
) {
  if (!countries.has(input.countryId)) throw new Error("Country missing");
  const row: CurriculumRecord = {
    ...input,
    createdAt: input.createdAt || new Date().toISOString(),
  };
  curricula.set(row.id, row);
  return row;
}

export function createGrade(row: GradeRecord) {
  if (!curricula.has(row.curriculumId)) throw new Error("Curriculum missing");
  grades.set(row.id, row);
  return row;
}

export function createSemester(row: SemesterRecord) {
  if (!grades.has(row.gradeId)) throw new Error("Grade missing");
  semesters.set(row.id, row);
  return row;
}

export function createSubject(row: SubjectRecord) {
  if (!grades.has(row.gradeId)) throw new Error("Grade missing");
  subjects.set(row.id, row);
  return row;
}

export function importBook(row: BookRecord) {
  if (!subjects.has(row.subjectId)) throw new Error("Subject missing");
  books.set(row.id, row);
  return row;
}

export function detectUnit(row: UnitRecord) {
  if (!books.has(row.bookId)) throw new Error("Book missing");
  units.set(row.id, row);
  return row;
}

export function detectLesson(row: LessonRecord) {
  if (!units.has(row.unitId)) throw new Error("Unit missing");
  lessons.set(row.id, row);
  return row;
}

export function registerIlePackage(pkg: CompiledIlePackage, lessonId: string) {
  packages.set(pkg.id, pkg);
  const lesson = lessons.get(lessonId);
  if (lesson) {
    lessons.set(lessonId, { ...lesson, ilePackageId: pkg.id });
  }
  return pkg;
}

export function approveAndPublishLesson(lessonId: string) {
  const lesson = lessons.get(lessonId);
  if (!lesson) throw new Error("Lesson missing");
  if (lesson.verificationStatus !== "verified" || lesson.rightsStatus === "rejected") {
    errors += 1;
    throw new Error("Cannot publish unverified lesson");
  }
  if (!lesson.ilePackageId || !packages.has(lesson.ilePackageId)) {
    errors += 1;
    throw new Error("ILE package missing");
  }
  const pkg = packages.get(lesson.ilePackageId)!;
  const publishedLesson: LessonRecord = {
    ...lesson,
    published: true,
    verificationStatus: "verified",
  };
  lessons.set(lessonId, publishedLesson);
  packages.set(pkg.id, { ...pkg, status: "published" });
  return publishedLesson;
}

export function bumpWarning() {
  warnings += 1;
}

export function getHierarchySnapshot(): HierarchySnapshot {
  const lessonList = [...lessons.values()];
  const verified = lessonList.filter((l) => l.verificationStatus === "verified").length;
  const rejected = lessonList.filter((l) => l.verificationStatus === "rejected").length;
  const pending = lessonList.filter((l) => l.verificationStatus === "pending" || l.verificationStatus === "unverified").length;
  const published = lessonList.filter((l) => l.published).length;

  return {
    schema: "success-os.curriculum-hierarchy.v1",
    countries: [...countries.values()],
    curricula: [...curricula.values()],
    grades: [...grades.values()],
    semesters: [...semesters.values()],
    subjects: [...subjects.values()],
    books: [...books.values()],
    units: [...units.values()],
    lessons: lessonList,
    packages: [...packages.values()],
    counts: {
      countries: countries.size,
      curricula: curricula.size,
      books: books.size,
      units: units.size,
      lessons: lessons.size,
      packages: packages.size,
      imported: lessons.size,
      verified,
      rejected,
      pending,
      published,
      errors,
      warnings,
    },
  };
}

export function getLesson(id: string) {
  return lessons.get(id) || null;
}

export function getPackage(id: string) {
  return packages.get(id) || null;
}

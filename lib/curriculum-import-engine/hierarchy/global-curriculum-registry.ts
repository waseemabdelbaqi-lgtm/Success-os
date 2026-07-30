/**
 * Global Curriculum Registry store — World → … → ILE Package.
 * Populated by dynamic discovery; never assumes a country's grade/subject set.
 */
import type {
  GlobalAcademicYearRecord,
  GlobalBookRecord,
  GlobalCountryRecord,
  GlobalCurriculumRecord,
  GlobalCurriculumRegistrySnapshot,
  GlobalGradeRecord,
  GlobalIlePackageRef,
  GlobalLessonNode,
  GlobalSemesterRecord,
  GlobalSubjectBinding,
  GlobalUnitRecord,
  WorldRecord,
} from "@/types/global-curriculum-registry";
import { WORLD_GLOBAL_ID } from "@/types/global-ids";
import {
  allocateGlobalId,
  resetGlobalIdAllocators,
} from "./global-ids";
import type { CurriculumDiscoveryReport } from "@/types/curriculum-discovery";
import type { OfficialCurriculumSource } from "@/types/curriculum-discovery";
import { discoverCurriculum } from "../discovery/discover";

const world: WorldRecord = {
  globalId: WORLD_GLOBAL_ID,
  name: { en: "World", ar: "العالم" },
};

const countries = new Map<string, GlobalCountryRecord>();
const curricula = new Map<string, GlobalCurriculumRecord>();
const academicYears = new Map<string, GlobalAcademicYearRecord>();
const grades = new Map<string, GlobalGradeRecord>();
const semesters = new Map<string, GlobalSemesterRecord>();
const subjectBindings = new Map<string, GlobalSubjectBinding>();
const books = new Map<string, GlobalBookRecord>();
const units = new Map<string, GlobalUnitRecord>();
const lessons = new Map<string, GlobalLessonNode>();
const packages = new Map<string, GlobalIlePackageRef>();

export function resetGlobalCurriculumRegistry() {
  resetGlobalIdAllocators();
  countries.clear();
  curricula.clear();
  academicYears.clear();
  grades.clear();
  semesters.clear();
  subjectBindings.clear();
  books.clear();
  units.clear();
  lessons.clear();
  packages.clear();
}

/**
 * Materialize a Global Curriculum Registry from an official source via discovery.
 * Returns the discovery report (what was detected) plus registry snapshot.
 */
export function ingestOfficialCurriculumSource(source: OfficialCurriculumSource): {
  discovery: CurriculumDiscoveryReport;
  registry: GlobalCurriculumRegistrySnapshot;
} {
  const discovery = discoverCurriculum(source);

  const countryGlobalId = allocateGlobalId("country", source.countryCode);
  countries.set(countryGlobalId, {
    globalId: countryGlobalId,
    code: source.countryCode,
    name: source.countryName,
    active: true,
  });

  const curriculumGlobalId = allocateGlobalId(
    "curriculum",
    `${source.countryCode}:${source.curriculumCode}`,
  );
  curricula.set(curriculumGlobalId, {
    globalId: curriculumGlobalId,
    countryGlobalId,
    code: source.curriculumCode,
    name: source.curriculumName,
    kind: source.curriculumKind,
    active: true,
  });

  const academicYearGlobalId = allocateGlobalId(
    "academic_year",
    `${curriculumGlobalId}:${source.academicYear}`,
  );
  academicYears.set(academicYearGlobalId, {
    globalId: academicYearGlobalId,
    curriculumGlobalId,
    label: source.academicYear,
    active: true,
  });

  for (const gradeSrc of source.grades) {
    const gradeHierarchical = `${source.countryCode}-${source.curriculumCode}-${gradeSrc.code}`;
    const gradeGlobalId = allocateGlobalId("grade", gradeHierarchical);
    grades.set(gradeGlobalId, {
      globalId: gradeGlobalId,
      academicYearGlobalId,
      curriculumGlobalId,
      code: gradeSrc.code,
      name: gradeSrc.name,
      order: gradeSrc.order,
      hierarchicalId: gradeHierarchical,
    });

    const semesterByCode = new Map<string, string>();
    for (const sem of gradeSrc.semesters || []) {
      const semHierarchical = `${gradeHierarchical}-${sem.code}`;
      const semesterGlobalId = allocateGlobalId("semester", semHierarchical);
      semesters.set(semesterGlobalId, {
        globalId: semesterGlobalId,
        gradeGlobalId,
        code: sem.code,
        name: sem.name,
        order: sem.order,
        hierarchicalId: semHierarchical,
      });
      semesterByCode.set(sem.code, semesterGlobalId);
    }

    for (const sub of gradeSrc.subjects) {
      const discovered = discovery.detected.subjects.find(
        (s) =>
          s.localCode === sub.localCode &&
          s.hierarchicalId.startsWith(gradeHierarchical),
      );
      const hierarchicalId =
        discovered?.hierarchicalId || `${gradeHierarchical}-${sub.localCode}`;
      const globalSubjectId = discovered?.globalSubjectId || "";
      if (!globalSubjectId) continue;

      subjectBindings.set(hierarchicalId, {
        hierarchicalId,
        gradeGlobalId,
        semesterGlobalId: sub.semesterCode
          ? semesterByCode.get(sub.semesterCode)
          : semesterByCode.values().next().value,
        subjectGlobalId: globalSubjectId,
        localLabel: sub.localLabel,
        localCode: sub.localCode,
      });

      sub.books.forEach((bookSrc, bookIdx) => {
        const bookHierarchical = `${hierarchicalId}-B${String(bookIdx + 1).padStart(2, "0")}`;
        const bookGlobalId = allocateGlobalId("book", bookHierarchical);
        books.set(bookGlobalId, {
          globalId: bookGlobalId,
          hierarchicalId: bookHierarchical,
          subjectHierarchicalId: hierarchicalId,
          subjectGlobalId: globalSubjectId,
          title: bookSrc.title,
          language: bookSrc.language,
          part: bookSrc.part,
          version: bookSrc.version,
          rightsStatus: "cleared",
          verificationStatus: "pending",
        });

        for (const unitSrc of bookSrc.units) {
          const unitHierarchical = `${bookHierarchical}-U${String(unitSrc.order).padStart(2, "0")}`;
          const unitGlobalId = allocateGlobalId("unit", unitHierarchical);
          units.set(unitGlobalId, {
            globalId: unitGlobalId,
            hierarchicalId: unitHierarchical,
            bookGlobalId,
            order: unitSrc.order,
            title: unitSrc.title,
          });

          for (const lessonSrc of unitSrc.lessons) {
            const lessonHierarchical = `${unitHierarchical}-L${String(lessonSrc.order).padStart(2, "0")}`;
            const lessonGlobalId = allocateGlobalId("lesson", lessonHierarchical);
            lessons.set(lessonGlobalId, {
              globalId: lessonGlobalId,
              hierarchicalId: lessonHierarchical,
              unitGlobalId,
              bookGlobalId,
              subjectGlobalId: globalSubjectId,
              countryGlobalId,
              curriculumGlobalId,
              academicYearGlobalId,
              gradeGlobalId,
              semesterGlobalId: subjectBindings.get(hierarchicalId)?.semesterGlobalId,
              order: lessonSrc.order,
              officialLessonName: lessonSrc.title,
              language: bookSrc.language,
              learningObjectives: lessonSrc.learningObjectives,
              skills: [],
              prerequisites: [],
              nextLessons: [],
              estimatedDuration: 20,
              difficulty: "core",
              bloomLevel: "understand",
              keywords: lessonSrc.keywords,
              references: lessonSrc.references,
              rightsStatus: lessonSrc.rightsStatus || "cleared",
              verificationStatus: lessonSrc.verificationStatus || "pending",
              packageVersion: bookSrc.version,
              checksum: "",
              published: false,
              archived: false,
              ilePackageGlobalId: null,
              ilePackageId: null,
            });
          }
        }
      });
    }
  }

  return { discovery, registry: getGlobalCurriculumRegistrySnapshot() };
}

export function registerPackageRef(input: {
  packageId: string;
  lessonHierarchicalId: string;
}): GlobalIlePackageRef | null {
  const lesson = [...lessons.values()].find(
    (l) => l.hierarchicalId === input.lessonHierarchicalId,
  );
  if (!lesson) return null;
  const globalId = allocateGlobalId("ile_package", input.packageId);
  const row: GlobalIlePackageRef = {
    globalId,
    packageId: input.packageId,
    lessonGlobalId: lesson.globalId,
    lessonHierarchicalId: lesson.hierarchicalId,
    schema: "success-os.interactive-lesson-engine.v1",
  };
  packages.set(globalId, row);
  lessons.set(lesson.globalId, {
    ...lesson,
    ilePackageGlobalId: globalId,
    ilePackageId: input.packageId,
  });
  return row;
}

export function getGlobalCurriculumRegistrySnapshot(): GlobalCurriculumRegistrySnapshot {
  return {
    schema: "success-os.global-curriculum-registry.v1",
    hierarchy: [
      "World",
      "Country",
      "Curriculum",
      "Academic Year",
      "Grade",
      "Semester (if applicable)",
      "Subject",
      "Book",
      "Unit",
      "Lesson",
      "ILE Package",
    ],
    world,
    countries: [...countries.values()],
    curricula: [...curricula.values()],
    academicYears: [...academicYears.values()],
    grades: [...grades.values()].sort((a, b) => a.order - b.order),
    semesters: [...semesters.values()].sort((a, b) => a.order - b.order),
    subjectBindings: [...subjectBindings.values()],
    books: [...books.values()],
    units: [...units.values()].sort((a, b) => a.order - b.order),
    lessons: [...lessons.values()].sort((a, b) => a.order - b.order),
    packages: [...packages.values()],
    counts: {
      countries: countries.size,
      curricula: curricula.size,
      academicYears: academicYears.size,
      grades: grades.size,
      semesters: semesters.size,
      subjects: subjectBindings.size,
      books: books.size,
      units: units.size,
      lessons: lessons.size,
      packages: packages.size,
    },
    notes: [
      "Jordan is the first reference implementation — not a hardcoded platform model.",
      "Grades/subjects/books are discovered from official curriculum sources.",
      "Global IDs (CTR/CUR/AYR/GRD/SEM/SUB/BOK/UNT/LSN/SKL/PKG) are immutable.",
    ],
  };
}

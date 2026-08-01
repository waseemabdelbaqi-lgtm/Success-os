/**
 * Dynamic curriculum discovery — detect structure from official sources only.
 * Never inject subjects/grades that are absent from the official document.
 */
import type {
  CurriculumDiscoveryReport,
  DiscoveredGrade,
  DiscoveredSubject,
  OfficialCurriculumSource,
  OfficialGradeSource,
} from "@/types/curriculum-discovery";
import { resolveCountrySubject } from "../hierarchy/global-subject-registry";
import { listGlobalSubjects } from "../hierarchy/global-subject-registry";

function hierarchicalGradeId(country: string, curriculum: string, gradeCode: string) {
  return `${country}-${curriculum}-${gradeCode}`;
}

function hierarchicalSubjectId(gradeId: string, localCode: string) {
  return `${gradeId}-${localCode}`;
}

function discoverGrade(
  source: OfficialCurriculumSource,
  grade: OfficialGradeSource,
): DiscoveredGrade {
  const gradeId = hierarchicalGradeId(
    source.countryCode,
    source.curriculumCode,
    grade.code,
  );
  const subjects: DiscoveredSubject[] = grade.subjects.map((sub) => {
    const resolved = resolveCountrySubject(source.countryCode, sub.aliasLabel);
    let bookCount = 0;
    let unitCount = 0;
    let lessonCount = 0;
    for (const book of sub.books) {
      bookCount += 1;
      for (const unit of book.units) {
        unitCount += 1;
        lessonCount += unit.lessons.length;
      }
    }
    return {
      localCode: sub.localCode,
      localLabel: sub.localLabel,
      aliasLabel: sub.aliasLabel,
      globalSubjectId: resolved.globalSubjectId,
      hierarchicalId: hierarchicalSubjectId(gradeId, sub.localCode),
      bookCount,
      unitCount,
      lessonCount,
    };
  });

  return {
    code: grade.code,
    name: grade.name,
    order: grade.order,
    hierarchicalId: gradeId,
    semesterCodes: (grade.semesters || []).map((s) => s.code),
    subjects,
  };
}

/**
 * Discover grades, subjects, semesters, books, units, lessons, objectives,
 * references, and assets from an official curriculum source document.
 */
export function discoverCurriculum(
  source: OfficialCurriculumSource,
): CurriculumDiscoveryReport {
  const grades = source.grades.map((g) => discoverGrade(source, g));
  const subjects = grades.flatMap((g) => g.subjects);

  let books = 0;
  let units = 0;
  let lessons = 0;
  let learningObjectives = 0;
  let references = 0;
  let assets = 0;

  for (const grade of source.grades) {
    for (const sub of grade.subjects) {
      for (const book of sub.books) {
        books += 1;
        for (const unit of book.units) {
          units += 1;
          for (const lesson of unit.lessons) {
            lessons += 1;
            learningObjectives += lesson.learningObjectives.length;
            references += lesson.references.length;
            assets += lesson.assets?.length || 0;
          }
        }
      }
    }
  }

  const semesters = source.grades.flatMap((g) =>
    (g.semesters || []).map((s) => ({
      code: s.code,
      name: s.name,
      gradeCode: g.code,
    })),
  );

  const discoveredSubjectIds = new Set(
    subjects.map((s) => s.globalSubjectId).filter(Boolean),
  );
  const excludedGlobalSubjects = listGlobalSubjects()
    .filter((s) => s.active && !discoveredSubjectIds.has(s.id))
    .map((s) => `${s.id} ${s.name.en}`);

  const unresolvedLocalSubjects = subjects
    .filter((s) => !s.globalSubjectId)
    .map((s) => s.aliasLabel);

  return {
    schema: "success-os.curriculum-discovery.v1",
    sourceId: source.sourceId,
    countryCode: source.countryCode,
    curriculumCode: source.curriculumCode,
    academicYear: source.academicYear,
    detected: {
      grades,
      subjects,
      semesters,
      books,
      units,
      lessons,
      learningObjectives,
      references,
      assets,
    },
    excludedGlobalSubjects,
    unresolvedLocalSubjects,
    notes: [
      "Subjects are discovered from the official source only.",
      "Physics/Chemistry/Biology appear only when present in the official grade document.",
      "Global Subject Registry resolves local labels → SUB-XXXXX.",
    ],
  };
}

/** True when a local subject code was discovered for a grade. */
export function gradeHasSubject(
  report: CurriculumDiscoveryReport,
  gradeCode: string,
  localCode: string,
): boolean {
  const grade = report.detected.grades.find((g) => g.code === gradeCode);
  return Boolean(grade?.subjects.some((s) => s.localCode === localCode));
}

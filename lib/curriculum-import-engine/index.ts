/**
 * Curriculum Import Engine — public API.
 * Compiler only (ADR-0050). Never renders lessons.
 */
import { IMPORT_PIPELINE } from "./pipeline";
import { listSourceConnectors } from "./connectors";
import { VERIFICATION_GATES } from "./verification/engine";
import {
  buildDashboardSnapshot,
  getJob,
  listJobs,
  resetImportStore,
  rollbackJob,
} from "./store";
import { createImportJob, runImportJob, runJordanPhase1Import } from "./runner";
import { runJordanGrade1MathReference } from "./reference/jordan-g1-math";
import { runJordanReferenceDataset } from "./reference/jordan-dataset";
import {
  getHierarchySnapshot,
  resetHierarchyRegistry,
} from "./hierarchy/registry";
import {
  getCrossCountryMathExamples,
  getGlobalSubjectRegistrySnapshot,
  listCountrySubjectAliases,
  listGlobalSubjects,
  resetGlobalSubjectRegistry,
  resolveCountrySubject,
} from "./hierarchy/global-subject-registry";
import {
  defaultSkillIdsForSubject,
  getGlobalSkillRegistrySnapshot,
  listGlobalSkills,
  resetGlobalSkillRegistry,
} from "./hierarchy/global-skill-registry";
import {
  buildJordanDemoStudentSkillProgress,
  buildStudentSkillProgress,
} from "./student/skill-progress";
import {
  buildJordanMathDependencyExample,
  buildLessonDependencyGraph,
  resolveLessonDependsOn,
} from "./hierarchy/lesson-dependency";

export {
  IMPORT_PIPELINE,
  listSourceConnectors,
  VERIFICATION_GATES,
  buildDashboardSnapshot,
  getJob,
  listJobs,
  resetImportStore,
  rollbackJob,
  createImportJob,
  runImportJob,
  runJordanPhase1Import,
  runJordanGrade1MathReference,
  runJordanReferenceDataset,
  getHierarchySnapshot,
  resetHierarchyRegistry,
  getGlobalSubjectRegistrySnapshot,
  listGlobalSubjects,
  listCountrySubjectAliases,
  resetGlobalSubjectRegistry,
  resolveCountrySubject,
  getCrossCountryMathExamples,
  getGlobalSkillRegistrySnapshot,
  listGlobalSkills,
  resetGlobalSkillRegistry,
  defaultSkillIdsForSubject,
  buildStudentSkillProgress,
  buildJordanDemoStudentSkillProgress,
  buildLessonDependencyGraph,
  buildJordanMathDependencyExample,
  resolveLessonDependsOn,
};

export { evaluateRights } from "./rights/engine";
export { extractMetadata, validateMetadata } from "./metadata/engine";
export { buildIlePackagesFromBook } from "./ile-package-builder";
export { runVerificationGates, allGatesPassed } from "./verification/engine";
export { normalizeBook } from "./normalize";
export { checksumBook } from "./checksum";

export function engineStatus() {
  return {
    schema: "success-os.curriculum-import-engine.v1",
    role: "compiler",
    rendersLessons: false,
    runtime: "success-os.interactive-lesson-engine.v1",
    adr: ["ADR-0049", "ADR-0050", "ADR-0050.1", "ADR-0050.2"],
    phase1: {
      country: "Jordan",
      curriculum: "Jordan National Curriculum",
      aiGeneration: false,
      lessonRewrite: false,
      videoGeneration: false,
      quizGeneration: false,
    },
    referenceImplementation: {
      id: "jordan-g1-math",
      path: [
        "Jordan",
        "National Curriculum",
        "Grade 1",
        "Mathematics",
        "Part 1",
        "Unit 1",
        "Lesson 1",
        "ILE Package",
      ],
      hierarchySchema: "success-os.curriculum-hierarchy.v1",
      genericConnectorsOnly: true,
    },
    referenceDataset: {
      id: "jordan-reference-dataset.v1",
      grade: "Grade 1",
      subjects: [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Arabic",
        "English",
        "Science",
        "Islamic Education",
        "Social Studies",
      ],
      metadataOnly: true,
      aiGeneration: false,
      idConvention: {
        country: "JO",
        curriculum: "JO-NATIONAL",
        grade: "JO-NATIONAL-G01",
        subject: "JO-NATIONAL-G01-MATH",
        book: "JO-NATIONAL-G01-MATH-B01",
        unit: "JO-NATIONAL-G01-MATH-B01-U01",
        lesson: "JO-NATIONAL-G01-MATH-B01-U01-L01",
      },
      globalSubjectRegistry: "success-os.global-subject-registry.v1",
      globalSkillRegistry: "success-os.global-skill-registry.v1",
      studentSkillProgress: "success-os.student-skill-progress.v1",
      lessonDependency: "success-os.lesson-dependency.v1",
    },
    globalSubjectRegistry: getGlobalSubjectRegistrySnapshot(),
    globalSkillRegistry: getGlobalSkillRegistrySnapshot(),
    studentSkillProgressPath: [
      "Student",
      "Completed Lessons",
      "Completed Skills",
      "Missing Skills",
      "Weak Skills",
      "Recommended Lessons",
    ],
    lessonDependencyPath: ["Lesson", "depends on", "Lesson", "depends on", "Lesson"],
    pipeline: IMPORT_PIPELINE.map((s) => s.id),
    connectors: listSourceConnectors().map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      modular: c.modular,
      countries: c.countries,
    })),
    verificationGates: VERIFICATION_GATES,
    quality: {
      resumable: true,
      incrementalUpdates: true,
      retries: true,
      versionHistory: true,
      rollback: true,
    },
  };
}

/**
 * Student foundation — data model projection only (no AI).
 */
import type { StudentFoundationRecord } from "@/types/student-foundation";
import type { StudentSkillProgressRecord } from "@/types/student-skill-progress";

/** Project existing skill-progress into the student foundation schema. */
export function toStudentFoundation(
  progress: StudentSkillProgressRecord,
): StudentFoundationRecord {
  return {
    schema: "success-os.student-foundation.v1",
    studentId: progress.studentId,
    countryId: progress.countryId,
    curriculumId: progress.curriculumId,
    completedLessons: progress.completedLessons,
    completedSkills: progress.completedSkills,
    missingSkills: progress.missingSkills,
    weakSkills: progress.weakSkills,
    recommendedLessons: progress.recommendedLessons,
    learningPath: null,
    counts: {
      completedLessons: progress.counts.completedLessons,
      completedSkills: progress.counts.completedSkills,
      missingSkills: progress.counts.missingSkills,
      weakSkills: progress.counts.weakSkills,
      recommendedLessons: progress.counts.recommendedLessons,
      learningPathSteps: 0,
    },
  };
}

/** Empty foundation shell for a learner — reserved for later Learning Path PRs. */
export function emptyStudentFoundation(input: {
  studentId: string;
  countryId: string;
  curriculumId: string;
}): StudentFoundationRecord {
  return {
    schema: "success-os.student-foundation.v1",
    studentId: input.studentId,
    countryId: input.countryId,
    curriculumId: input.curriculumId,
    completedLessons: [],
    completedSkills: [],
    missingSkills: [],
    weakSkills: [],
    recommendedLessons: [],
    learningPath: null,
    counts: {
      completedLessons: 0,
      completedSkills: 0,
      missingSkills: 0,
      weakSkills: 0,
      recommendedLessons: 0,
      learningPathSteps: 0,
    },
  };
}

/**
 * Student skill progress — derived from completed lessons + Global Skill Registry.
 *
 *   Student
 *   ↓ Completed Lessons
 *   ↓ Completed Skills
 *   ↓ Missing Skills
 *   ↓ Weak Skills
 *   ↓ Recommended Lessons
 *
 * Recommendations point at hierarchical lesson ids / ILE packages only (ADR-0049).
 * No AI generation in this contract.
 */
import type { LocaleText } from "./interactive-lesson-engine";

export type StudentSkillProgressSchema = "success-os.student-skill-progress.v1";

export type StudentSkillRef = {
  skillId: string;
  code: string;
  name: LocaleText;
};

export type StudentLessonRef = {
  lessonId: string;
  title: LocaleText;
  globalSubjectId: string;
  skills: string[];
  ilePackageId?: string | null;
  published?: boolean;
};

export type RecommendedLesson = StudentLessonRef & {
  reason: "missing_skill" | "weak_skill" | "next_in_sequence";
  targetSkillIds: string[];
};

export type StudentSkillProgressRecord = {
  schema: StudentSkillProgressSchema;
  studentId: string;
  countryId: string;
  curriculumId: string;
  /** Pipeline path for docs/UI */
  path: string[];
  completedLessons: StudentLessonRef[];
  completedSkills: StudentSkillRef[];
  missingSkills: StudentSkillRef[];
  weakSkills: StudentSkillRef[];
  recommendedLessons: RecommendedLesson[];
  counts: {
    completedLessons: number;
    completedSkills: number;
    missingSkills: number;
    weakSkills: number;
    recommendedLessons: number;
  };
};

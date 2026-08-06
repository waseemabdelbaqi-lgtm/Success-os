/**
 * Student foundation data model (PR #50.3) — schema only.
 * No AI implementation. Runtime progress builders may project into this shape later.
 *
 * Each learner must later support:
 *   Completed Lessons → Completed Skills → Missing Skills → Weak Skills
 *   → Recommended Lessons → Learning Path
 */
import type {
  RecommendedLesson,
  StudentLessonRef,
  StudentSkillRef,
} from "./student-skill-progress";

export type StudentFoundationSchema = "success-os.student-foundation.v1";

export type LearningPathStep = {
  order: number;
  lessonId: string;
  skillIds: string[];
  status: "locked" | "available" | "in_progress" | "completed";
};

export type LearningPathRecord = {
  id: string;
  studentId: string;
  countryId: string;
  curriculumId: string;
  subjectGlobalId?: string;
  steps: LearningPathStep[];
};

/**
 * Canonical student foundation record — data model only in this PR.
 */
export type StudentFoundationRecord = {
  schema: StudentFoundationSchema;
  studentId: string;
  countryId: string;
  curriculumId: string;
  completedLessons: StudentLessonRef[];
  completedSkills: StudentSkillRef[];
  missingSkills: StudentSkillRef[];
  weakSkills: StudentSkillRef[];
  recommendedLessons: RecommendedLesson[];
  /** Reserved for Learning Intelligence PRs — empty until populated */
  learningPath: LearningPathRecord | null;
  counts: {
    completedLessons: number;
    completedSkills: number;
    missingSkills: number;
    weakSkills: number;
    recommendedLessons: number;
    learningPathSteps: number;
  };
};

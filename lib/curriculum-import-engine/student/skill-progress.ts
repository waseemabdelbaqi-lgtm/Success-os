/**
 * Student skill progress engine.
 * Student → Completed Lessons → Completed / Missing / Weak Skills → Recommended Lessons.
 * Uses hierarchy registry + Global Skill Registry. No AI. ILE recommendations only.
 */
import { getLesson, listLessons } from "../hierarchy/registry";
import {
  getGlobalSkillById,
  listGlobalSkills,
} from "../hierarchy/global-skill-registry";
import type {
  RecommendedLesson,
  StudentLessonRef,
  StudentSkillProgressRecord,
  StudentSkillRef,
} from "@/types/student-skill-progress";
import type { LessonRecord } from "@/types/curriculum-hierarchy";

function toSkillRef(skillId: string): StudentSkillRef | null {
  const sk = getGlobalSkillById(skillId);
  if (!sk) return null;
  return { skillId: sk.id, code: sk.code, name: sk.name };
}

function toLessonRef(lesson: LessonRecord): StudentLessonRef {
  return {
    lessonId: lesson.id,
    title: lesson.title,
    globalSubjectId: lesson.metadata?.globalSubjectId || "",
    skills: [...(lesson.metadata?.skills || [])],
    ilePackageId: lesson.ilePackageId || null,
    published: lesson.published,
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export type BuildStudentSkillProgressInput = {
  studentId: string;
  countryId?: string;
  curriculumId?: string;
  /** Hierarchical lesson ids the student completed */
  completedLessonIds: string[];
  /**
   * Skill universe for gap analysis.
   * Defaults to skills taught by any lesson in the same subjects as completed lessons,
   * falling back to all active skills linked to those subjects.
   */
  targetSkillIds?: string[];
  /** Max recommendations to return */
  limit?: number;
};

/**
 * Derive skill progress + recommendations from completed lessons.
 * Weak skill = student completed ≥1 lesson teaching it, but not all published lessons that teach it.
 */
export function buildStudentSkillProgress(
  input: BuildStudentSkillProgressInput,
): StudentSkillProgressRecord {
  const limit = input.limit ?? 5;
  const completedIds = uniqueIds(input.completedLessonIds);
  const allLessons = listLessons();

  const completedLessons: StudentLessonRef[] = [];
  const completedSkillIdSet = new Set<string>();

  for (const id of completedIds) {
    const lesson = getLesson(id);
    if (!lesson) continue;
    const ref = toLessonRef(lesson);
    completedLessons.push(ref);
    for (const sid of ref.skills) completedSkillIdSet.add(sid);
  }

  const subjectIds = uniqueIds(
    completedLessons.map((l) => l.globalSubjectId).filter(Boolean),
  );

  const lessonsInSubjects = allLessons.filter((l) =>
    subjectIds.length
      ? subjectIds.includes(l.metadata?.globalSubjectId || "")
      : true,
  );

  const taughtSkillIds = uniqueIds(
    lessonsInSubjects.flatMap((l) => l.metadata?.skills || []),
  );

  const targetSkillIds =
    input.targetSkillIds && input.targetSkillIds.length
      ? uniqueIds(input.targetSkillIds)
      : taughtSkillIds.length
        ? taughtSkillIds
        : listGlobalSkills()
            .filter((s) => s.active)
            .map((s) => s.id);

  const completedSkills = targetSkillIds
    .filter((id) => completedSkillIdSet.has(id))
    .map(toSkillRef)
    .filter((s): s is StudentSkillRef => Boolean(s));

  const missingSkills = targetSkillIds
    .filter((id) => !completedSkillIdSet.has(id))
    .map(toSkillRef)
    .filter((s): s is StudentSkillRef => Boolean(s));

  const weakSkills: StudentSkillRef[] = [];
  for (const skillId of completedSkillIdSet) {
    if (!targetSkillIds.includes(skillId)) continue;
    const teaching = lessonsInSubjects.filter(
      (l) =>
        (l.metadata?.skills || []).includes(skillId) &&
        l.verificationStatus !== "rejected",
    );
    const completedTeaching = teaching.filter((l) => completedIds.includes(l.id));
    if (teaching.length > 1 && completedTeaching.length < teaching.length) {
      const ref = toSkillRef(skillId);
      if (ref) weakSkills.push(ref);
    }
  }

  const missingOrWeak = new Set([
    ...missingSkills.map((s) => s.skillId),
    ...weakSkills.map((s) => s.skillId),
  ]);

  const recommended: RecommendedLesson[] = [];
  const seen = new Set(completedIds);
  const lastCompleted = completedLessons[completedLessons.length - 1];
  const lastUnitId = lastCompleted
    ? getLesson(lastCompleted.lessonId)?.unitId || null
    : null;

  const candidates = lessonsInSubjects
    .filter((l) => !seen.has(l.id))
    .filter((l) => l.verificationStatus === "verified")
    .filter((l) => l.rightsStatus === "verified")
    .sort((a, b) => {
      const aSkills = a.metadata?.skills || [];
      const bSkills = b.metadata?.skills || [];
      const aMissing = aSkills.some((s) => missingSkills.some((m) => m.skillId === s))
        ? 0
        : 1;
      const bMissing = bSkills.some((s) => missingSkills.some((m) => m.skillId === s))
        ? 0
        : 1;
      if (aMissing !== bMissing) return aMissing - bMissing;
      const aSame = lastUnitId && a.unitId === lastUnitId ? 0 : 1;
      const bSame = lastUnitId && b.unitId === lastUnitId ? 0 : 1;
      if (aSame !== bSame) return aSame - bSame;
      return a.id.localeCompare(b.id);
    });

  for (const lesson of candidates) {
    const skills = lesson.metadata?.skills || [];
    const hitMissing = skills.filter((s) =>
      missingSkills.some((m) => m.skillId === s),
    );
    const hitWeak = skills.filter((s) => weakSkills.some((w) => w.skillId === s));
    if (!hitMissing.length && !hitWeak.length) continue;

    const reason: RecommendedLesson["reason"] = hitMissing.length
      ? "missing_skill"
      : "weak_skill";
    recommended.push({
      ...toLessonRef(lesson),
      reason,
      targetSkillIds: uniqueIds([...hitMissing, ...hitWeak]).filter((id) =>
        missingOrWeak.has(id),
      ),
    });
    if (recommended.length >= limit) break;
  }

  // If still empty, recommend next sequential unverified-ok lesson after last completed
  if (!recommended.length && completedLessons.length) {
    const last = completedLessons[completedLessons.length - 1]!;
    const sameUnit = allLessons
      .filter((l) => l.unitId === (getLesson(last.lessonId)?.unitId || ""))
      .sort((a, b) => a.order - b.order);
    const next = sameUnit.find((l) => !seen.has(l.id) && l.verificationStatus !== "rejected");
    if (next) {
      recommended.push({
        ...toLessonRef(next),
        reason: "next_in_sequence",
        targetSkillIds: [...(next.metadata?.skills || [])],
      });
    }
  }

  return {
    schema: "success-os.student-skill-progress.v1",
    studentId: input.studentId,
    countryId: input.countryId || "JO",
    curriculumId: input.curriculumId || "JO-NATIONAL",
    path: [
      "Student",
      "Completed Lessons",
      "Completed Skills",
      "Missing Skills",
      "Weak Skills",
      "Recommended Lessons",
    ],
    completedLessons,
    completedSkills,
    missingSkills,
    weakSkills,
    recommendedLessons: recommended,
    counts: {
      completedLessons: completedLessons.length,
      completedSkills: completedSkills.length,
      missingSkills: missingSkills.length,
      weakSkills: weakSkills.length,
      recommendedLessons: recommended.length,
    },
  };
}

/** Demo student after completing the canonical Math L01 only. */
export function buildJordanDemoStudentSkillProgress(): StudentSkillProgressRecord {
  return buildStudentSkillProgress({
    studentId: "student_jo_demo_001",
    countryId: "JO",
    curriculumId: "JO-NATIONAL",
    completedLessonIds: ["JO-NATIONAL-G01-MATH-B01-U01-L01"],
    limit: 5,
  });
}

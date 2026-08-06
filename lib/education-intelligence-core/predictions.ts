/**
 * Continuous predictions — next lesson, review, confusion, exam risk.
 */
import type {
  EicInteractionInput,
  LearningDna,
  LearningPrediction,
  TeacherUnderstanding,
} from "@/types/education-intelligence-core";

function L(en: string, ar: string) {
  return { en, ar };
}

export function buildPredictions(
  dna: LearningDna,
  understanding: TeacherUnderstanding,
  input: EicInteractionInput,
): LearningPrediction {
  const weak = understanding.doesNotKnow.slice(0, 8);
  const completed = new Set(input.completedLessonIds || []);
  const focus = input.focusLessonId || null;

  const reviewLessonIds: string[] = [];
  if (understanding.missingPrerequisiteSkillId) {
    reviewLessonIds.push(`review:${understanding.missingPrerequisiteSkillId}`);
  }
  for (const c of dna.confusionLog.slice(-5)) {
    if (c.conceptId && !reviewLessonIds.includes(c.conceptId)) {
      reviewLessonIds.push(c.conceptId);
    }
  }

  let nextLessonId: string | null = focus;
  if (understanding.trulyUnderstands && focus) {
    nextLessonId = `next_after:${focus}`;
  } else if (understanding.whyConfused && understanding.missingPrerequisiteSkillId) {
    nextLessonId = `review:${understanding.missingPrerequisiteSkillId}`;
  }

  const conceptsLikelyToConfuse = weak.slice(0, 3).map((id) =>
    L(
      `Concept linked to weak skill ${id} may cause confusion next`,
      `مفهوم مرتبط بالمهارة الضعيفة ${id} قد يسبب ارتباكًا لاحقًا`,
    ),
  );
  if (understanding.conceptCausingConfusion) {
    conceptsLikelyToConfuse.unshift({
      en: `${understanding.conceptCausingConfusion.en} remains a confusion risk until the prerequisite is solid`,
      ar: `${understanding.conceptCausingConfusion.ar} يبقى خطر ارتباك حتى تثبيت المتطلب السابق`,
    });
  }

  const examQuestionsLikelyMissed = weak.slice(0, 3).map((id) =>
    L(
      `Exam items targeting skill ${id} are likely to be missed`,
      `بنود الاختبار التي تستهدف المهارة ${id} مرجّحة للخطأ`,
    ),
  );

  const skillsNotYetMastered = weak.filter((id) => !completed.has(id));

  const confidence = Math.min(
    0.95,
    0.45 +
      dna.interactionCount * 0.01 +
      (understanding.missingPrerequisiteSkillId ? 0.15 : 0) +
      (dna.confusionLog.length > 0 ? 0.1 : 0),
  );

  return {
    schema: "success-os.eic-predictions.v1",
    nextLessonId,
    reviewLessonIds: [...new Set(reviewLessonIds)].slice(0, 8),
    conceptsLikelyToConfuse: conceptsLikelyToConfuse.slice(0, 5),
    examQuestionsLikelyMissed,
    skillsNotYetMastered: skillsNotYetMastered.slice(0, 12),
    confidence,
    notes: [
      "Heuristic teacher predictions grounded in Learning DNA + interaction signals.",
      "Deeper ML predictors may replace scoring later without changing this contract (#59).",
      "Does not invent curriculum entities — uses provided lesson/skill ids only.",
    ],
  };
}

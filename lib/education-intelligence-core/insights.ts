/**
 * Experienced-teacher insights — grounded in Learning DNA history.
 */
import type {
  InsightUtterance,
  LearningDna,
  TeacherUnderstanding,
} from "@/types/education-intelligence-core";

function L(en: string, ar: string) {
  return { en, ar };
}

/**
 * Build utterances like:
 * "I noticed that you still confuse velocity and acceleration because of
 *  something we studied three weeks ago…"
 */
export function buildInsightUtterance(
  dna: LearningDna,
  understanding: TeacherUnderstanding,
): InsightUtterance | null {
  const repeated = dna.confusionLog.filter((c) => {
    const code = `${c.conceptId || "concept"}::${c.prerequisiteSkillId || "none"}`;
    return dna.repeatedMistakeCodes.includes(code);
  });

  if (repeated.length >= 1 || dna.repeatedMistakeCodes.length >= 1) {
    const last = repeated[repeated.length - 1] || dna.confusionLog[dna.confusionLog.length - 1];
    if (!last) return null;
    const daysAgo = Math.max(
      1,
      Math.round(
        (Date.now() - new Date(last.at).getTime()) / (1000 * 60 * 60 * 24),
      ) || 1,
    );
    const when =
      daysAgo >= 14
        ? L(`about ${Math.round(daysAgo / 7)} weeks ago`, `منذ حوالي ${Math.round(daysAgo / 7)} أسابيع`)
        : L(`${daysAgo} day(s) ago`, `منذ ${daysAgo} يوم/أيام`);

    const concept = last.conceptLabel.en;
    const conceptAr = last.conceptLabel.ar;
    const prereq = last.prerequisiteSkillId || "an earlier prerequisite";

    return {
      schema: "success-os.eic-insight.v1",
      kind: "repeated_confusion",
      text: L(
        `I noticed that you still struggle with ${concept} because of something we studied ${when.en} (${prereq}). Let's review that concept for two minutes before continuing.`,
        `لاحظت أنك ما زلت تواجه صعوبة في ${conceptAr} بسبب شيء درسناه ${when.ar} (${prereq}). دعنا نراجع ذلك المفهوم لدقيقتين قبل المتابعة.`,
      ),
      grounded: true,
      inventsCurriculumFacts: false,
    };
  }

  if (understanding.whyConfused && understanding.missingPrerequisiteSkillId) {
    return {
      schema: "success-os.eic-insight.v1",
      kind: "prerequisite_review",
      text: L(
        `I can see the confusion is tied to a missing prerequisite (${understanding.missingPrerequisiteSkillId}). Let's strengthen that first, then return to the current idea.`,
        `أرى أن الارتباك مرتبط بمتطلب سابق مفقود (${understanding.missingPrerequisiteSkillId}). دعنا نقوّيه أولًا ثم نعود للفكرة الحالية.`,
      ),
      grounded: true,
      inventsCurriculumFacts: false,
    };
  }

  if (understanding.trulyUnderstands && dna.confidenceLevel.score >= 70) {
    return {
      schema: "success-os.eic-insight.v1",
      kind: "pace_shift",
      text: L(
        "Your understanding looks solid here. I'll reduce the explanation and ask a deeper question next.",
        "فهمك يبدو متينًا هنا. سأقلل الشرح وأطرح سؤالًا أعمق تاليًا.",
      ),
      grounded: true,
      inventsCurriculumFacts: false,
    };
  }

  if (dna.confidenceLevel.score < 35) {
    return {
      schema: "success-os.eic-insight.v1",
      kind: "encouragement",
      text: L(
        "You're putting in real effort. We'll go slower with a simpler example so confidence can catch up.",
        "أنت تبذل جهدًا حقيقيًا. سنتمهل بمثال أبسط حتى تلحق الثقة.",
      ),
      grounded: true,
      inventsCurriculumFacts: false,
    };
  }

  return null;
}

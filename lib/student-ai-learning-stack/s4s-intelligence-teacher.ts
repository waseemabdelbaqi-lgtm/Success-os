/**
 * S4S Intelligence Teacher — personalized greeting when a student opens a lesson.
 *
 * Flow:
 *   Student → Open Lesson → S4S Intelligence Teacher appears
 *
 * Example:
 *   Hello Ahmad,
 *   Last time you struggled with Fractions.
 *   Would you like me to review them first?
 *
 * No AI lesson generation — scripted tutoring prompt from skill progress.
 */
import type { LocaleText } from "@/types/interactive-lesson-engine";
import type { StudentSkillProgressRecord } from "@/types/student-skill-progress";

export type S4sTeacherGreeting = {
  schema: "success-os.s4s-intelligence-teacher.v1/greeting";
  teacherName: LocaleText;
  studentName: string;
  struggleSkillId: string | null;
  struggleSkillName: LocaleText | null;
  headline: LocaleText;
  body: LocaleText;
  ctaReview: LocaleText;
  ctaContinue: LocaleText;
  /** Exact English demo line for contract tests / docs */
  displayEn: string;
  displayAr: string;
  reviewFirst: boolean;
  source: "skill_progress" | "demo_fallback";
};

export type BuildS4sGreetingInput = {
  studentName?: string;
  progress?: StudentSkillProgressRecord | null;
  /** Prefer this skill if present in missing/weak */
  preferSkillCode?: string;
  locale?: "en" | "ar";
};

function L(en: string, ar: string): LocaleText {
  return { en, ar };
}

/**
 * Pick the skill the student struggled with — prefer Fractions when present.
 */
export function resolveStruggleSkill(
  progress?: StudentSkillProgressRecord | null,
  preferSkillCode = "FRACTIONS",
): { skillId: string; name: LocaleText } | null {
  if (!progress) return null;
  const pool = [...progress.missingSkills, ...progress.weakSkills];
  const preferred =
    pool.find((s) => s.code.toUpperCase() === preferSkillCode.toUpperCase()) ||
    pool[0];
  if (!preferred) return null;
  return { skillId: preferred.skillId, name: preferred.name };
}

/**
 * Build the S4S Intelligence Teacher open-lesson greeting.
 * Defaults to the product demo: Ahmad + Fractions.
 */
export function buildS4sIntelligenceTeacherGreeting(
  input: BuildS4sGreetingInput = {},
): S4sTeacherGreeting {
  const studentName = (input.studentName || "Ahmad").trim() || "Ahmad";
  const resolved = resolveStruggleSkill(input.progress, input.preferSkillCode || "FRACTIONS");

  const struggleName = resolved?.name || L("Fractions", "الكسور");
  const struggleSkillId = resolved?.skillId || "SKL-00002";
  const source: S4sTeacherGreeting["source"] = resolved ? "skill_progress" : "demo_fallback";

  const displayEn = [
    `Hello ${studentName},`,
    `Last time you struggled with ${struggleName.en}.`,
    `Would you like me to review them first?`,
  ].join("\n");

  const displayAr = [
    `مرحبًا ${studentName}،`,
    `في المرة السابقة واجهت صعوبة في ${struggleName.ar}.`,
    `هل تريد أن نراجعها أولًا؟`,
  ].join("\n");

  return {
    schema: "success-os.s4s-intelligence-teacher.v1/greeting",
    teacherName: L("S4S Intelligence Teacher", "معلم Success 4 Sure الذكي"),
    studentName,
    struggleSkillId,
    struggleSkillName: struggleName,
    headline: L(
      `Hello ${studentName},`,
      `مرحبًا ${studentName}،`,
    ),
    body: L(
      `Last time you struggled with ${struggleName.en}.`,
      `في المرة السابقة واجهت صعوبة في ${struggleName.ar}.`,
    ),
    ctaReview: L(
      "Would you like me to review them first?",
      "هل تريد أن نراجعها أولًا؟",
    ),
    ctaContinue: L("Continue to lesson", "متابعة إلى الدرس"),
    displayEn,
    displayAr,
    reviewFirst: true,
    source,
  };
}

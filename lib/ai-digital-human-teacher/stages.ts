/**
 * Age-appropriate teaching defaults — admin may override via profiles.
 */
import type { StageTeachingDefaults } from "@/types/ai-digital-human-teacher";

function L(en: string, ar: string) {
  return { en, ar };
}

export const STAGE_TEACHING_DEFAULTS: StageTeachingDefaults[] = [
  {
    stage: "early_childhood",
    name: L("Early childhood", "الطفولة المبكرة"),
    teachingStyle: "story",
    pace: "slow",
    tone: L("Warm and encouraging", "دافئ ومشجّع"),
    notes: ["Teacher profile selectable by administrators."],
  },
  {
    stage: "elementary",
    name: L("Elementary", "المرحلة الابتدائية"),
    teachingStyle: "example_first",
    pace: "slow",
    tone: L("Warm and encouraging", "دافئ ومشجّع"),
    notes: ["Teacher profile selectable by administrators."],
  },
  {
    stage: "middle_school",
    name: L("Middle school", "المرحلة المتوسطة"),
    teachingStyle: "socratic",
    pace: "normal",
    tone: L("Energetic and interactive", "نشيط وتفاعلي"),
    notes: ["Interactive checks; still curriculum-grounded."],
  },
  {
    stage: "high_school",
    name: L("High school", "المرحلة الثانوية"),
    teachingStyle: "step_by_step",
    pace: "normal",
    tone: L("Academically rigorous", "صارم أكاديميًا"),
    notes: ["Precision over entertainment; uncertainty stated when needed."],
  },
  {
    stage: "university",
    name: L("University", "الجامعة"),
    teachingStyle: "direct",
    pace: "fast",
    tone: L("Professional lecturer", "محاضر مهني"),
    notes: ["Lecture-style explanations; ILE remains sole lesson runtime."],
  },
];

export function getStageDefaults(stage: string): StageTeachingDefaults | null {
  return STAGE_TEACHING_DEFAULTS.find((s) => s.stage === stage) || null;
}

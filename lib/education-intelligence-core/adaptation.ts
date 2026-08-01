/**
 * Adaptive strategy — never repeats the same explanation fingerprint.
 */
import { createHash } from "node:crypto";
import type {
  AdaptiveStrategy,
  LearningDna,
  TeacherUnderstanding,
} from "@/types/education-intelligence-core";
import type { TeachingStyle } from "@/types/ai-teacher-engine";

const STYLE_ROTATION: TeachingStyle[] = [
  "simplified",
  "example_first",
  "step_by_step",
  "visual",
  "socratic",
  "story",
  "direct",
];

function fingerprint(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

function nextUnusedStyle(
  preferred: TeachingStyle,
  used: string[],
  mode: AdaptiveStrategy["mode"],
): { style: TeachingStyle; fp: string; novel: boolean } {
  const ordered =
    mode === "struggling"
      ? ([
          "simplified",
          "example_first",
          "visual",
          "story",
          "step_by_step",
          "socratic",
          "direct",
        ] as TeachingStyle[])
      : mode === "advanced"
        ? ([
            "socratic",
            "direct",
            "step_by_step",
            "example_first",
            "visual",
            "simplified",
            "story",
          ] as TeachingStyle[])
        : ([preferred, ...STYLE_ROTATION.filter((s) => s !== preferred)] as TeachingStyle[]);

  for (let i = 0; i < ordered.length; i++) {
    const style = ordered[i];
    const analogySlot = i % 5;
    const diagramSlot = i % 3;
    const fp = fingerprint([style, `analogy:${analogySlot}`, `diagram:${diagramSlot}`, mode]);
    if (!used.includes(fp)) {
      return { style, fp, novel: used.length > 0 };
    }
  }
  // Exhausted — force novelty with interaction counter salt
  const style = ordered[used.length % ordered.length];
  const fp = fingerprint([style, "salt", String(used.length), mode]);
  return { style, fp, novel: true };
}

export function buildAdaptiveStrategy(
  dna: LearningDna,
  understanding: TeacherUnderstanding,
): AdaptiveStrategy {
  const struggling =
    Boolean(understanding.whyConfused) ||
    dna.understandingLevel.score < 45 ||
    dna.confidenceLevel.score < 40 ||
    understanding.isGuessing;

  const advanced =
    !struggling &&
    (dna.understandingLevel.score >= 75 ||
      dna.confidenceLevel.score >= 75 ||
      understanding.trulyUnderstands);

  const mode: AdaptiveStrategy["mode"] = struggling
    ? "struggling"
    : advanced
      ? "advanced"
      : "steady";

  const pick = nextUnusedStyle(
    dna.preferredTeacherStyle,
    dna.usedExplanationFingerprints,
    mode,
  );

  const teacherMoves =
    mode === "struggling"
      ? [
          "use_simpler_language",
          "add_examples",
          "add_drawings",
          "increase_interaction",
          "check_prerequisite",
        ]
      : mode === "advanced"
        ? [
            "increase_difficulty",
            "reduce_explanation",
            "ask_deeper_questions",
            "accelerate_pace",
          ]
        : ["continue_current_path", "spot_check_understanding"];

  return {
    schema: "success-os.eic-adaptive-strategy.v1",
    mode,
    languageComplexity:
      mode === "struggling" ? "simpler" : mode === "advanced" ? "advanced" : "normal",
    moreExamples: mode === "struggling",
    moreDrawings: mode === "struggling",
    moreInteraction: mode === "struggling",
    increaseDifficulty: mode === "advanced",
    reduceExplanation: mode === "advanced",
    askDeeperQuestions: mode === "advanced",
    teachingStyle: pick.style,
    explanationFingerprint: pick.fp,
    isNovelExplanation: pick.novel || dna.usedExplanationFingerprints.length === 0,
    teacherMoves,
  };
}

export function recordExplanationFingerprint(
  dna: LearningDna,
  strategy: AdaptiveStrategy,
): LearningDna {
  const used = [...dna.usedExplanationFingerprints, strategy.explanationFingerprint].slice(
    -200,
  );
  return {
    ...dna,
    usedExplanationFingerprints: used,
    preferredTeacherStyle: strategy.teachingStyle,
  };
}

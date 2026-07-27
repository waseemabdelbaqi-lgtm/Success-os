import type { SceneDefinition } from "@/src/lib/interactive-lesson/types";

export function normalizeTypeAnswer(value: string) {
  return value.replace(/[^\d]/g, "").trim();
}

/** Compare student answer against scene.correctAnswer for all interaction types. */
export function isCorrectAnswer(scene: SceneDefinition, answer: unknown): boolean {
  if (scene.interactionType === "type" || scene.interactionType === "draw") {
    return normalizeTypeAnswer(String(answer ?? "")) === normalizeTypeAnswer(String(scene.correctAnswer));
  }

  if (scene.interactionType === "arrange" || scene.interactionType === "drag") {
    const expected = scene.correctAnswer as number[];
    const got = answer as number[];
    return Array.isArray(got) && expected.length === got.length && expected.every((v, i) => v === got[i]);
  }

  if (scene.interactionType === "match") {
    // answer[i] = selected matchTargets index for left option i
    const expected = scene.correctAnswer as number[];
    const got = answer as number[];
    return Array.isArray(got) && expected.length === got.length && expected.every((v, i) => v === got[i]);
  }

  return Number(answer) === Number(scene.correctAnswer);
}

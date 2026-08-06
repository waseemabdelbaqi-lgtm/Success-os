/**
 * Gesture Engine — prefers semantic ContentAct; falls back to wording heuristics.
 */
import type {
  GestureIntent,
  GestureKeyframe,
  LessonBlockKind,
} from "@/types/human-engine";
import { directSentence } from "./semantic-sentence";
import { pick } from "./seed";

export function gestureFromLine(
  text: string,
  kind: LessonBlockKind,
  seed: number,
  index: number,
): GestureIntent {
  const perf = directSentence(text, {
    lessonId: "gesture_engine",
    blockId: "line",
    blockKind: kind,
    lineIndex: index,
  });
  if (perf.contentAct === "explain_concept") {
    return pick(
      ["open_explain", "emphasize", "turn_to_student", "point_board"] as const,
      seed,
      index * 3,
    );
  }
  return perf.gesture;
}

export function buildGestureTrack(
  segments: Array<{
    startMs: number;
    endMs: number;
    kind: LessonBlockKind;
    text: string;
    seed: number;
    index: number;
    gesture?: GestureIntent;
  }>,
): GestureKeyframe[] {
  return segments.map((seg) => ({
    tMs: seg.startMs,
    durationMs: Math.max(400, seg.endMs - seg.startMs),
    intent: seg.gesture || gestureFromLine(seg.text, seg.kind, seg.seed, seg.index),
    seed: seg.seed + seg.index * 31,
  }));
}

export function sampleGesture(keys: GestureKeyframe[], tMs: number): GestureIntent {
  let cur: GestureIntent = "idle_breathe";
  for (const k of keys) {
    if (k.tMs <= tMs && tMs <= k.tMs + k.durationMs) cur = k.intent;
    else if (k.tMs <= tMs) cur = k.intent;
  }
  return cur;
}

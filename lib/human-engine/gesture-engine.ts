/**
 * Gesture Engine — intent per line from lesson wording (no loop packs).
 */
import type { GestureIntent, GestureKeyframe, LessonBlockKind } from "@/types/human-engine";
import { pick } from "./seed";

export function gestureFromLine(
  text: string,
  kind: LessonBlockKind,
  seed: number,
  index: number,
): GestureIntent {
  const s = text.toLowerCase();
  if (/اكتب|بكتب|معادل|=|قانون|صيغة|خطوة/.test(s) || kind === "demonstrate") {
    return index % 2 === 0 ? "write_board" : "point_board";
  }
  if (/شوف|انظر|لاحظ|سبور|رسم|شكل/.test(s)) {
    return pick(["point_board", "turn_to_board", "emphasize"] as const, seed, index);
  }
  if (/عدّ|واحد|اثنان|ثلاثة|count|رقم/.test(s)) {
    return "count_on_fingers";
  }
  if (/سؤال|فكر|لماذا|؟/.test(s) || kind === "check" || kind === "practice") {
    return pick(["invite_answer", "think_pause", "turn_to_student"] as const, seed, index);
  }
  if (/أحسن|ممتاز|بطل|مرحبا|أهلا|إلى اللقاء/.test(s) || kind === "encourage" || kind === "close") {
    return pick(["encourage", "affirm_nod", "open_explain"] as const, seed, index);
  }
  if (kind === "hook") {
    return pick(["open_explain", "turn_to_student", "affirm_nod"] as const, seed, index);
  }
  return pick(
    ["open_explain", "emphasize", "turn_to_student", "idle_breathe", "point_board"] as const,
    seed,
    index * 3,
  );
}

export function buildGestureTrack(
  segments: Array<{
    startMs: number;
    endMs: number;
    kind: LessonBlockKind;
    text: string;
    seed: number;
    index: number;
  }>,
): GestureKeyframe[] {
  return segments.map((seg) => ({
    tMs: seg.startMs,
    durationMs: Math.max(400, seg.endMs - seg.startMs),
    intent: gestureFromLine(seg.text, seg.kind, seg.seed, seg.index),
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

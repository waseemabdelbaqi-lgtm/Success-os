/**
 * Eye Tracking — gaze targets + blink schedule driven by lesson focus.
 */
import type { EyeKeyframe, GazeTarget, LessonBlockKind } from "@/types/human-engine";
import { pick } from "./seed";

function gazeForKind(kind: LessonBlockKind, seed: number, i: number): GazeTarget {
  if (kind === "demonstrate" || kind === "example") {
    return pick(["board", "board", "prop", "student"] as const, seed, i);
  }
  if (kind === "check" || kind === "practice") {
    return pick(["student", "student", "board", "notes"] as const, seed, i);
  }
  if (kind === "hook" || kind === "encourage" || kind === "close") {
    return "student";
  }
  return pick(["student", "board", "student", "notes"] as const, seed, i + 2);
}

export function buildEyeTrack(opts: {
  segments: Array<{ startMs: number; endMs: number; kind: LessonBlockKind; seed: number }>;
}): EyeKeyframe[] {
  const keys: EyeKeyframe[] = [];
  for (const seg of opts.segments) {
    const span = seg.endMs - seg.startMs;
    const steps = Math.max(2, Math.floor(span / 900));
    for (let i = 0; i <= steps; i++) {
      const tMs = Math.round(seg.startMs + (span * i) / steps);
      const blink =
        (seg.seed + i * 13) % 5 === 0 ? 1 : (seg.seed + i) % 11 === 0 ? 0.85 : 0;
      keys.push({
        tMs,
        target: gazeForKind(seg.kind, seg.seed, i),
        blink,
        saccadeAmp: 0.15 + ((seg.seed + i) % 5) * 0.04,
      });
    }
  }
  return keys;
}

export function sampleEyes(
  keys: EyeKeyframe[],
  tMs: number,
): { target: GazeTarget; blink: number } {
  let cur = keys[0] || { tMs: 0, target: "student" as GazeTarget, blink: 0 };
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k;
    else break;
  }
  return { target: cur.target, blink: cur.blink || 0 };
}

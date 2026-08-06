/**
 * AI Behaviour Engine — high-level teaching goals per beat.
 */
import type { BehaviourBeat, BehaviourGoal, LessonBlockKind } from "@/types/human-engine";

export function goalForKind(kind: LessonBlockKind): BehaviourGoal {
  switch (kind) {
    case "hook":
      return "hook";
    case "explain":
      return "explain";
    case "example":
      return "demonstrate";
    case "practice":
    case "check":
      return "check";
    case "encourage":
      return "encourage";
    case "close":
      return "close";
    default:
      return "explain";
  }
}

export function buildBehaviourTrack(
  segments: Array<{ startMs: number; kind: LessonBlockKind; blockId: string; text: string }>,
): BehaviourBeat[] {
  return segments.map((seg) => {
    const goal = goalForKind(seg.kind);
    return {
      tMs: seg.startMs,
      goal,
      blockId: seg.blockId,
      reason: `lesson:${seg.kind} → behaviour:${goal} · ${seg.text.slice(0, 48)}`,
    };
  });
}

export function sampleBehaviour(keys: BehaviourBeat[], tMs: number): BehaviourGoal {
  let cur: BehaviourGoal = "explain";
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k.goal;
    else break;
  }
  return cur;
}

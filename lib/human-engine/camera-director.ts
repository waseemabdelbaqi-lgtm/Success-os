/**
 * Camera Director — shot language from behaviour + gesture (not a fixed cut list).
 */
import type {
  BehaviourGoal,
  CameraKeyframe,
  CameraShot,
  GestureIntent,
} from "@/types/human-engine";
import { pick } from "./seed";

export function shotForBeat(opts: {
  goal: BehaviourGoal;
  gesture: GestureIntent;
  seed: number;
  index: number;
}): CameraShot {
  if (
    opts.gesture === "rotate_model" ||
    opts.gesture === "zoom_in_model" ||
    opts.gesture === "zoom_out_model" ||
    opts.gesture === "hold_model" ||
    opts.gesture === "manipulate_experiment"
  ) {
    return pick(["prop_orbit", "medium_teacher", "over_shoulder_board"] as const, opts.seed, opts.index);
  }
  if (
    opts.gesture === "write_board" ||
    opts.gesture === "draw_curve" ||
    opts.gesture === "point_board"
  ) {
    return pick(["over_shoulder_board", "board_insert", "medium_teacher"] as const, opts.seed, opts.index);
  }
  if (opts.goal === "hook" || opts.goal === "close") {
    return pick(["wide_establishing", "medium_teacher", "close_face"] as const, opts.seed, opts.index);
  }
  if (opts.goal === "check" || opts.gesture === "invite_answer") {
    return "close_face";
  }
  if (opts.goal === "demonstrate") {
    return pick(["over_shoulder_board", "prop_orbit", "medium_teacher"] as const, opts.seed, opts.index + 1);
  }
  if (opts.goal === "encourage") {
    return pick(["close_face", "medium_teacher"] as const, opts.seed, opts.index);
  }
  return pick(["medium_teacher", "close_face", "wide_establishing"] as const, opts.seed, opts.index * 2);
}

export function buildCameraTrack(
  beats: Array<{
    tMs: number;
    goal: BehaviourGoal;
    gesture: GestureIntent;
    seed: number;
    index: number;
  }>,
): CameraKeyframe[] {
  return beats.map((b) => ({
    tMs: b.tMs,
    shot: shotForBeat(b),
    easeMs: 420 + (b.seed % 5) * 40,
  }));
}

export function sampleCamera(keys: CameraKeyframe[], tMs: number): CameraShot {
  let cur: CameraShot = "medium_teacher";
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k.shot;
    else break;
  }
  return cur;
}

/**
 * Skeleton Animation — generates bone keyframes from gesture intent + content seed.
 * Not a canned clip library: poses are composed per beat.
 */
import type {
  BoneId,
  BonePose,
  GestureIntent,
  SkeletonKeyframe,
} from "@/types/human-engine";

type BoneRot = Record<BoneId, [number, number, number]>;

const REST: BoneRot = {
  root: [0, 0, 0],
  hips: [0, 0, 0],
  spine: [2, 0, 0],
  chest: [4, 0, 0],
  neck: [0, 0, 0],
  head: [0, 0, 0],
  shoulder_l: [0, 8, -8],
  upper_arm_l: [8, 12, -20],
  lower_arm_l: [15, 0, 0],
  hand_l: [0, 0, 0],
  shoulder_r: [0, -8, 8],
  upper_arm_r: [8, -12, 20],
  lower_arm_r: [15, 0, 0],
  hand_r: [0, 0, 0],
  thigh_l: [0, 0, 0],
  shin_l: [0, 0, 0],
  foot_l: [0, 0, 0],
  thigh_r: [0, 0, 0],
  shin_r: [0, 0, 0],
  foot_r: [0, 0, 0],
};

function cloneRest(): BoneRot {
  const out = {} as BoneRot;
  for (const k of Object.keys(REST) as BoneId[]) {
    out[k] = [...REST[k]] as [number, number, number];
  }
  return out;
}

function applyIntent(base: BoneRot, intent: GestureIntent, seed: number): BoneRot {
  const b = cloneRest();
  // copy base
  for (const k of Object.keys(base) as BoneId[]) b[k] = [...base[k]] as [number, number, number];
  const wobble = ((seed % 7) - 3) * 1.2;

  switch (intent) {
    case "point_board":
      b.upper_arm_r = [-35 + wobble, -40, 55];
      b.lower_arm_r = [10, 0, 0];
      b.hand_r = [0, -20, 0];
      b.chest = [6, -12, 0];
      break;
    case "write_board":
      b.upper_arm_r = [-20, -25, 40];
      b.lower_arm_r = [55, 5, 0];
      b.hand_r = [-10, 0, 15];
      b.head = [8, -18, 0];
      b.chest = [8, -10, 0];
      break;
    case "open_explain":
      b.upper_arm_l = [20, 35, -45];
      b.upper_arm_r = [20, -35, 45];
      b.lower_arm_l = [25, 0, 0];
      b.lower_arm_r = [25, 0, 0];
      b.chest = [5, wobble, 0];
      break;
    case "count_on_fingers":
      b.upper_arm_r = [-5, -15, 35];
      b.lower_arm_r = [70, 0, 0];
      b.hand_r = [0, 0, -25];
      break;
    case "invite_answer":
      b.upper_arm_l = [15, 25, -30];
      b.lower_arm_l = [40, 0, 0];
      b.hand_l = [0, 10, 0];
      b.head = [0, 8, 0];
      break;
    case "think_pause":
      b.upper_arm_r = [25, -10, 15];
      b.lower_arm_r = [80, 0, 0];
      b.hand_r = [0, 15, -20];
      b.head = [5, 10, 0];
      break;
    case "affirm_nod":
      b.head = [12, 0, 0];
      b.neck = [6, 0, 0];
      break;
    case "encourage":
      b.upper_arm_l = [30, 40, -50];
      b.upper_arm_r = [30, -40, 50];
      b.chest = [6, 0, 0];
      break;
    case "turn_to_board":
      b.spine = [2, -22, 0];
      b.chest = [4, -18, 0];
      b.head = [0, -28, 0];
      break;
    case "turn_to_student":
      b.spine = [2, 12, 0];
      b.head = [0, 18, 0];
      break;
    case "hold_prop":
    case "hold_model":
      b.upper_arm_l = [-10, 20, -25];
      b.lower_arm_l = [60, 0, 0];
      b.hand_l = [0, 0, 10];
      b.upper_arm_r = [-5, -18, 30];
      b.lower_arm_r = [50, 0, 0];
      break;
    case "rotate_model":
      b.upper_arm_l = [-8, 25, -30];
      b.lower_arm_l = [55, 10, 0];
      b.upper_arm_r = [-12, -30, 40];
      b.lower_arm_r = [45, -8, 0];
      b.chest = [5, wobble, 0];
      b.head = [4, -10, 0];
      break;
    case "zoom_in_model":
      b.upper_arm_r = [-25, -20, 35];
      b.lower_arm_r = [40, 0, 0];
      b.hand_r = [0, -15, 0];
      b.head = [6, -8, 0];
      break;
    case "zoom_out_model":
      b.upper_arm_r = [5, -25, 45];
      b.lower_arm_r = [20, 0, 0];
      b.head = [2, -6, 0];
      break;
    case "draw_curve":
      b.upper_arm_r = [-18, -28, 42];
      b.lower_arm_r = [50, 8, 0];
      b.hand_r = [-8, 0, 20];
      b.head = [10, -20, 0];
      b.chest = [7, -12, 0];
      break;
    case "manipulate_experiment":
      b.upper_arm_l = [-15, 30, -35];
      b.lower_arm_l = [70, 0, 0];
      b.upper_arm_r = [-10, -22, 32];
      b.lower_arm_r = [65, 0, 0];
      b.head = [8, -6, 0];
      break;
    case "walk_step":
      b.thigh_l = [18, 0, 0];
      b.thigh_r = [-8, 0, 0];
      b.shin_l = [-12, 0, 0];
      b.hips = [0, 6 + wobble, 0];
      b.spine = [3, 8, 0];
      b.upper_arm_l = [15, 20, -25];
      b.upper_arm_r = [10, -15, 20];
      break;
    case "emphasize":
      b.upper_arm_r = [10, -30, 40];
      b.lower_arm_r = [35, 0, 0];
      b.chest = [8, -5, 0];
      break;
    case "idle_breathe":
    default:
      b.chest = [3 + wobble * 0.2, 0, 0];
      b.spine = [1, wobble * 0.3, 0];
      break;
  }
  return b;
}

function toKey(tMs: number, bones: BoneRot): SkeletonKeyframe {
  const list: BonePose[] = (Object.keys(bones) as BoneId[]).map((bone) => ({
    bone,
    rot: bones[bone],
  }));
  return { tMs, bones: list };
}

export function composeSkeletonKeys(opts: {
  startMs: number;
  durationMs: number;
  intent: GestureIntent;
  seed: number;
}): SkeletonKeyframe[] {
  const mid = opts.startMs + Math.floor(opts.durationMs * 0.45);
  const end = opts.startMs + opts.durationMs;
  const peak = applyIntent(REST, opts.intent, opts.seed);
  const settle = applyIntent(REST, "idle_breathe", opts.seed + 3);
  return [
    toKey(opts.startMs, applyIntent(REST, "idle_breathe", opts.seed)),
    toKey(mid, peak),
    toKey(end, settle),
  ];
}

export function sampleBones(
  keys: SkeletonKeyframe[],
  tMs: number,
): BonePose[] {
  if (!keys.length) {
    return (Object.keys(REST) as BoneId[]).map((bone) => ({ bone, rot: REST[bone] }));
  }
  let prev = keys[0]!;
  let next = keys[keys.length - 1]!;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    if (k.tMs <= tMs) prev = k;
    if (k.tMs >= tMs) {
      next = k;
      break;
    }
  }
  if (prev.tMs === next.tMs) return prev.bones;
  const u = Math.min(1, Math.max(0, (tMs - prev.tMs) / (next.tMs - prev.tMs)));
  const map = new Map(next.bones.map((b) => [b.bone, b]));
  return prev.bones.map((pb) => {
    const nb = map.get(pb.bone) || pb;
    return {
      bone: pb.bone,
      rot: [
        pb.rot[0] + (nb.rot[0] - pb.rot[0]) * u,
        pb.rot[1] + (nb.rot[1] - pb.rot[1]) * u,
        pb.rot[2] + (nb.rot[2] - pb.rot[2]) * u,
      ] as [number, number, number],
    };
  });
}

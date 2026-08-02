/**
 * Animation Timeline — merges all Human Engine tracks into one plan timeline.
 */
import type {
  AnimationTimeline,
  BehaviourBeat,
  BlendShapeKeyframe,
  CameraKeyframe,
  EmotionKeyframe,
  EyeKeyframe,
  GestureKeyframe,
  HeadKeyframe,
  LightKeyframe,
  PhonemeKeyframe,
  SkeletonKeyframe,
} from "@/types/human-engine";

export function assembleTimeline(opts: {
  durationMs: number;
  fps?: number;
  skeleton: SkeletonKeyframe[];
  facial: BlendShapeKeyframe[];
  lipSync: PhonemeKeyframe[];
  eyes: EyeKeyframe[];
  head: HeadKeyframe[];
  emotion: EmotionKeyframe[];
  gesture: GestureKeyframe[];
  camera: CameraKeyframe[];
  lighting: LightKeyframe[];
  behaviour: BehaviourBeat[];
}): AnimationTimeline {
  return {
    schema: "success-os.human-engine.timeline.v1",
    durationMs: opts.durationMs,
    fps: opts.fps ?? 30,
    skeleton: { name: "skeleton", keys: sortByT(opts.skeleton) },
    facial: { name: "facial", keys: sortByT(opts.facial) },
    lipSync: { name: "lipSync", keys: sortByT(opts.lipSync) },
    eyes: { name: "eyes", keys: sortByT(opts.eyes) },
    head: { name: "head", keys: sortByT(opts.head) },
    emotion: { name: "emotion", keys: sortByT(opts.emotion) },
    gesture: { name: "gesture", keys: sortByT(opts.gesture) },
    camera: { name: "camera", keys: sortByT(opts.camera) },
    lighting: { name: "lighting", keys: sortByT(opts.lighting) },
    behaviour: { name: "behaviour", keys: sortByT(opts.behaviour) },
  };
}

function sortByT<T extends { tMs: number }>(keys: T[]): T[] {
  return [...keys].sort((a, b) => a.tMs - b.tMs);
}

export function assertTimelineIntegrity(tl: AnimationTimeline): string[] {
  const issues: string[] = [];
  if (tl.durationMs <= 0) issues.push("durationMs must be > 0");
  const tracks = [
    tl.skeleton,
    tl.facial,
    tl.lipSync,
    tl.eyes,
    tl.head,
    tl.emotion,
    tl.gesture,
    tl.camera,
    tl.lighting,
    tl.behaviour,
  ];
  for (const tr of tracks) {
    if (!tr.keys.length) issues.push(`track ${tr.name} is empty`);
    for (let i = 1; i < tr.keys.length; i++) {
      if (tr.keys[i]!.tMs < tr.keys[i - 1]!.tMs) {
        issues.push(`track ${tr.name} not sorted at i=${i}`);
        break;
      }
    }
  }
  return issues;
}

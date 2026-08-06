/**
 * Blend Shapes — composes ARKit-style weights from phoneme + facial channels.
 */
import type { BlendShapeId, BlendShapeKeyframe, PhonemeId } from "@/types/human-engine";
import { facialFromEmotion, facialSpeechMicro, type FacialChannels } from "./facial-rig";
import type { EmotionId } from "@/types/human-engine";
import { phonemeToMouth } from "./lip-sync";

export function composeBlendShapes(opts: {
  phoneme: PhonemeId;
  emotion: EmotionId;
  intensity: number;
}): Partial<Record<BlendShapeId, number>> {
  const mouth = phonemeToMouth(opts.phoneme);
  const face = facialFromEmotion(opts.emotion, opts.intensity);
  const micro = facialSpeechMicro(opts.phoneme);
  return mergeFaceAndMouth(face, mouth, micro);
}

function mergeFaceAndMouth(
  face: FacialChannels,
  mouth: Partial<Record<BlendShapeId, number>>,
  micro: number,
): Partial<Record<BlendShapeId, number>> {
  return {
    ...mouth,
    jawOpen: Math.min(1, (mouth.jawOpen || 0) + micro * 0.15),
    mouthSmileLeft: face.smile,
    mouthSmileRight: face.smile,
    mouthFrownLeft: face.frown,
    mouthFrownRight: face.frown,
    browInnerUp: face.browInnerUp,
    browDownLeft: face.browDown,
    browDownRight: face.browDown,
    cheekSquintLeft: face.cheekSquint,
    cheekSquintRight: face.cheekSquint,
  };
}

export function buildBlendShapeTrack(
  keys: Array<{ tMs: number; phoneme: PhonemeId; emotion: EmotionId; intensity: number }>,
): BlendShapeKeyframe[] {
  return keys.map((k) => ({
    tMs: k.tMs,
    shapes: composeBlendShapes(k),
  }));
}

export function sampleBlendShapes(
  keys: BlendShapeKeyframe[],
  tMs: number,
): Partial<Record<BlendShapeId, number>> {
  if (!keys.length) return {};
  let prev = keys[0]!;
  let next = keys[keys.length - 1]!;
  for (const k of keys) {
    if (k.tMs <= tMs) prev = k;
    if (k.tMs >= tMs) {
      next = k;
      break;
    }
  }
  if (prev.tMs === next.tMs) return { ...prev.shapes };
  const u = Math.min(1, Math.max(0, (tMs - prev.tMs) / (next.tMs - prev.tMs)));
  const ids = new Set([
    ...Object.keys(prev.shapes),
    ...Object.keys(next.shapes),
  ]) as Set<BlendShapeId>;
  const out: Partial<Record<BlendShapeId, number>> = {};
  for (const id of ids) {
    const a = prev.shapes[id] || 0;
    const b = next.shapes[id] || 0;
    out[id] = a + (b - a) * u;
  }
  return out;
}

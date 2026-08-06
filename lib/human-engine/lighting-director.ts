/**
 * Lighting Director — presets follow emotion / camera intimacy / content act.
 */
import type {
  CameraShot,
  EmotionId,
  LightKeyframe,
  LightPreset,
} from "@/types/human-engine";

export function lightForState(emotion: EmotionId, shot: CameraShot): {
  preset: LightPreset;
  intensity: number;
} {
  if (emotion === "celebratory" || emotion === "encouraging") {
    return { preset: "warm_encourage", intensity: 1.05 };
  }
  if (emotion === "focused" || emotion === "serious") {
    return { preset: "cool_focus", intensity: 0.95 };
  }
  if (shot === "prop_orbit") {
    return { preset: "model_spotlight", intensity: 1.1 };
  }
  if (shot === "board_insert" || shot === "over_shoulder_board") {
    return { preset: "board_accent", intensity: 1 };
  }
  if (shot === "close_face") {
    return { preset: "closeup_beauty", intensity: 1.08 };
  }
  if (shot === "wide_establishing") {
    return { preset: "soft_classroom", intensity: 0.9 };
  }
  return { preset: "key_fill_rim", intensity: 1 };
}

export function buildLightTrack(
  samples: Array<{ tMs: number; emotion: EmotionId; shot: CameraShot }>,
): LightKeyframe[] {
  return samples.map((s) => {
    const L = lightForState(s.emotion, s.shot);
    return { tMs: s.tMs, preset: L.preset, intensity: L.intensity };
  });
}

export function sampleLight(
  keys: LightKeyframe[],
  tMs: number,
): { preset: LightPreset; intensity: number } {
  let cur = keys[0] || { preset: "soft_classroom" as LightPreset, intensity: 1, tMs: 0 };
  for (const k of keys) {
    if (k.tMs <= tMs) cur = k;
    else break;
  }
  return { preset: cur.preset, intensity: cur.intensity };
}

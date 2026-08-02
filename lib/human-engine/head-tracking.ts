/**
 * Head Tracking — yaw/pitch/roll follow gaze + speech emphasis.
 */
import type { GazeTarget, HeadKeyframe } from "@/types/human-engine";

const GAZE_HEAD: Record<GazeTarget, { yaw: number; pitch: number; roll: number }> = {
  student: { yaw: 8, pitch: -2, roll: 0 },
  board: { yaw: -22, pitch: 4, roll: -1 },
  prop: { yaw: -10, pitch: 6, roll: 0 },
  notes: { yaw: 4, pitch: 10, roll: 1 },
  away_soft: { yaw: 14, pitch: -1, roll: 2 },
};

export function buildHeadTrack(
  eyeKeys: Array<{ tMs: number; target: GazeTarget }>,
  seed: number,
): HeadKeyframe[] {
  return eyeKeys.map((e, i) => {
    const base = GAZE_HEAD[e.target];
    const micro = ((seed + i * 7) % 5) - 2;
    return {
      tMs: e.tMs,
      yaw: base.yaw + micro * 0.6,
      pitch: base.pitch + ((seed + i) % 3) * 0.4,
      roll: base.roll,
    };
  });
}

export function sampleHead(
  keys: HeadKeyframe[],
  tMs: number,
): { yaw: number; pitch: number; roll: number } {
  if (!keys.length) return { yaw: 0, pitch: 0, roll: 0 };
  let prev = keys[0]!;
  let next = keys[keys.length - 1]!;
  for (const k of keys) {
    if (k.tMs <= tMs) prev = k;
    if (k.tMs >= tMs) {
      next = k;
      break;
    }
  }
  if (prev.tMs === next.tMs) {
    return { yaw: prev.yaw, pitch: prev.pitch, roll: prev.roll };
  }
  const u = Math.min(1, Math.max(0, (tMs - prev.tMs) / (next.tMs - prev.tMs)));
  return {
    yaw: prev.yaw + (next.yaw - prev.yaw) * u,
    pitch: prev.pitch + (next.pitch - prev.pitch) * u,
    roll: prev.roll + (next.roll - prev.roll) * u,
  };
}

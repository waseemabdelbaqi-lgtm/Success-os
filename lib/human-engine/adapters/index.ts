/**
 * Digital Human adapters — swap MetaHuman / HeyGen / local preview without rewrite.
 */
import type { AdapterId, AdapterStatus, DigitalHumanAdapter } from "@/types/human-engine";
import { createLocalPhotorealAdapter } from "./local-photoreal";
import { createMetaHumanAdapter } from "./metahuman";
import { createHeyGenAdapter } from "./heygen";
import { createHumanoidWebGLAdapter } from "./humanoid-webgl";

export function resolveAdapterMeta(opts: {
  id: AdapterId;
  heygenConfigured?: boolean;
  metahumanConfigured?: boolean;
}): { id: AdapterId; status: AdapterStatus; notes: string[]; capabilities: string[] } {
  if (opts.id === "metahuman") {
    return {
      id: "metahuman",
      status: opts.metahumanConfigured ? "live" : "stub",
      capabilities: [
        "skeletal_animation",
        "facial_rig",
        "blendshapes",
        "phoneme_lipsync",
        "metahuman_mesh",
      ],
      notes: opts.metahumanConfigured
        ? ["MetaHuman adapter live"]
        : [
            "MetaHuman adapter stub — Human Engine plan is ready to bind",
            "Wire Unreal/MetaHuman runtime later without changing Lesson Director",
          ],
    };
  }
  if (opts.id === "heygen") {
    return {
      id: "heygen",
      status: opts.heygenConfigured ? "live" : "needs_credentials",
      capabilities: ["digital_twin_video", "cloud_lipsync"],
      notes: opts.heygenConfigured
        ? ["HeyGen twin live"]
        : ["HEYGEN_* credentials missing — use local_photoreal_preview"],
    };
  }
  return {
    id: "local_photoreal_preview",
    status: "live",
    capabilities: [
      "photoreal_sprite",
      "phoneme_mouth_drive",
      "gesture_pose_map",
      "emotion_tint",
      "camera_framing",
      "lighting_grade",
    ],
    notes: [
      "Local photoreal preview adapter (DOM/canvas) — not Three.js characters",
      "Same HumanPerformancePlan binds to MetaHuman later",
    ],
  };
}

export function createAdapter(
  id: AdapterId,
  hooks?: Parameters<typeof createLocalPhotorealAdapter>[0],
): DigitalHumanAdapter {
  if (id === "metahuman") return createMetaHumanAdapter();
  if (id === "heygen") return createHeyGenAdapter();
  return createLocalPhotorealAdapter(hooks);
}

export {
  createLocalPhotorealAdapter,
  createMetaHumanAdapter,
  createHeyGenAdapter,
  createHumanoidWebGLAdapter,
};

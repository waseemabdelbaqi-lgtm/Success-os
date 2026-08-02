/**
 * Local photoreal preview adapter — applies HumanFrameSample to canvas/DOM hooks.
 * Not a Three.js character. MetaHuman replaces this adapter later.
 */
import type {
  DigitalHumanAdapter,
  HumanFrameSample,
  HumanPerformancePlan,
} from "@/types/human-engine";

export type LocalPhotorealHooks = {
  onLoad?: (plan: HumanPerformancePlan) => void;
  onFrame?: (frame: HumanFrameSample) => void;
  onDispose?: () => void;
};

export function createLocalPhotorealAdapter(
  hooks: LocalPhotorealHooks = {},
): DigitalHumanAdapter {
  let plan: HumanPerformancePlan | null = null;
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
    notes: ["DOM/canvas photoreal preview driven by Human Engine timeline"],
    load(next) {
      plan = next;
      hooks.onLoad?.(next);
    },
    applyFrame(frame) {
      if (!plan) return;
      hooks.onFrame?.(frame);
    },
    dispose() {
      plan = null;
      hooks.onDispose?.();
    },
  };
}

/** Map engine gesture → classroom photoreal pose pack. */
export function gestureToClassroomPose(
  gesture: HumanFrameSample["gesture"],
): "stand" | "point" | "write" {
  if (gesture === "write_board") return "write";
  if (
    gesture === "point_board" ||
    gesture === "emphasize" ||
    gesture === "count_on_fingers" ||
    gesture === "hold_prop"
  ) {
    return "point";
  }
  return "stand";
}

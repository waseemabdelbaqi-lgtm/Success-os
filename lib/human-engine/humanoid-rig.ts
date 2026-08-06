/**
 * Mixamo bone map + morph application helpers for skinned teacher GLBs.
 */
import type { BoneId, BlendShapeId, GestureIntent } from "@/types/human-engine";

/** Human Engine bone → Mixamo joint name */
export const BONE_TO_MIXAMO: Record<BoneId, string> = {
  root: "mixamorig:Hips",
  hips: "mixamorig:Hips",
  spine: "mixamorig:Spine",
  chest: "mixamorig:Spine1",
  neck: "mixamorig:Neck",
  head: "mixamorig:Head",
  shoulder_l: "mixamorig:LeftShoulder",
  upper_arm_l: "mixamorig:LeftArm",
  lower_arm_l: "mixamorig:LeftForeArm",
  hand_l: "mixamorig:LeftHand",
  shoulder_r: "mixamorig:RightShoulder",
  upper_arm_r: "mixamorig:RightArm",
  lower_arm_r: "mixamorig:RightForeArm",
  hand_r: "mixamorig:RightHand",
  thigh_l: "mixamorig:LeftUpLeg",
  shin_l: "mixamorig:LeftLeg",
  foot_l: "mixamorig:LeftFoot",
  thigh_r: "mixamorig:RightUpLeg",
  shin_r: "mixamorig:RightLeg",
  foot_r: "mixamorig:RightFoot",
};

export const FINGER_BONES = [
  "mixamorig:LeftHandThumb1",
  "mixamorig:LeftHandIndex1",
  "mixamorig:LeftHandMiddle1",
  "mixamorig:LeftHandRing1",
  "mixamorig:LeftHandPinky1",
  "mixamorig:RightHandThumb1",
  "mixamorig:RightHandIndex1",
  "mixamorig:RightHandMiddle1",
  "mixamorig:RightHandRing1",
  "mixamorig:RightHandPinky1",
] as const;

/** Phoneme / blendshape ids that exist on TeacherFace morph targets */
export const FACE_MORPHS: BlendShapeId[] = [
  "jawOpen",
  "mouthClose",
  "mouthFunnel",
  "mouthPucker",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "browInnerUp",
  "browDownLeft",
  "browDownRight",
  "cheekSquintLeft",
  "cheekSquintRight",
];

export function humanoidUrl(teacherId: "sara" | "ali"): string {
  return `/media/ai-teachers/${teacherId}/humanoid/teacher.glb`;
}

/** Finger curl degrees from gesture intent */
export function fingerCurlForGesture(gesture: GestureIntent): number {
  switch (gesture) {
    case "count_on_fingers":
      return 0.35;
    case "write_board":
    case "draw_curve":
      return 0.55;
    case "point_board":
    case "emphasize":
      return 0.25;
    case "hold_model":
    case "hold_prop":
    case "rotate_model":
      return 0.7;
    case "invite_answer":
      return 0.15;
    default:
      return 0.1;
  }
}

export function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

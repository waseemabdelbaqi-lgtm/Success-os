"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { HumanFrameSample } from "@/types/human-engine";
import {
  BONE_TO_MIXAMO,
  FACE_MORPHS,
  fingerCurlForGesture,
  degToRad,
  humanoidUrl,
} from "@/lib/human-engine/humanoid-rig";
import {
  buildEyeMaterial,
  buildHairMaterial,
  buildSkinMaterial,
  classifyTeacherMesh,
  clothColorFor,
} from "@/lib/human-engine/teacher-skin";

type Props = {
  teacherId: "sara" | "ali";
  frame: HumanFrameSample | null;
  walkOffset?: number;
};

type BoneMap = Map<string, THREE.Bone>;

function collectBones(root: THREE.Object3D): BoneMap {
  const map: BoneMap = new Map();
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) {
      map.set(o.name, o as THREE.Bone);
    }
  });
  return map;
}

function findFaceMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name.includes("TeacherFace")) {
      found = o as THREE.Mesh;
    }
  });
  if (found) return found;
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.morphTargetDictionary && Object.keys(m.morphTargetDictionary).length) {
      found = m;
    }
  });
  return found;
}

/**
 * Real skinned digital human — Mixamo skeleton + ARKit-named face morphs.
 * Photorealism path: physical skin/eye/hair + corneal catchlights + face key light.
 */
export function SkinnedDigitalHuman({ teacherId, frame, walkOffset = 0 }: Props) {
  const url = humanoidUrl(teacherId);
  const gltf = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const catchlights = useRef<THREE.Group>(null);
  const faceLight = useRef<THREE.PointLight>(null);
  const bones = useMemo(() => collectBones(gltf.scene), [gltf.scene]);
  const face = useMemo(() => findFaceMesh(gltf.scene), [gltf.scene]);
  const restQuats = useRef<Map<string, THREE.Quaternion>>(new Map());

  useEffect(() => {
    const map = new Map<string, THREE.Quaternion>();
    bones.forEach((b, name) => {
      map.set(name, b.quaternion.clone());
    });
    restQuats.current = map;

    const cloth = clothColorFor(teacherId);
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const kind = classifyTeacherMesh(m);

      mats.forEach((mat, idx) => {
        if (!mat) return;
        mat.side = THREE.FrontSide;
        const src = mat as THREE.MeshStandardMaterial;

        if (kind === "face") {
          const physical = buildSkinMaterial(
            src,
            teacherId,
            !!m.morphTargetDictionary,
          );
          if (Array.isArray(m.material)) m.material[idx] = physical;
          else m.material = physical;
          return;
        }

        if (kind === "eye") {
          const physical = buildEyeMaterial(src);
          if (Array.isArray(m.material)) m.material[idx] = physical;
          else m.material = physical;
          return;
        }

        if (kind === "hair") {
          const physical = buildHairMaterial(src, teacherId);
          if (Array.isArray(m.material)) m.material[idx] = physical;
          else m.material = physical;
          return;
        }

        if (src.color) {
          src.color.copy(cloth);
          src.roughness = 0.62;
          src.metalness = 0.08;
        }
      });
    });
  }, [bones, gltf.scene, teacherId]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const speaking = !!frame?.speaking;
    const jaw = frame?.jawOpen ?? 0;
    const breath = Math.sin(t * (speaking ? 2.6 : 1.2)) * 0.008;
    // Subtle facial-presence micro sway (human stillness is never perfect)
    const micro = Math.sin(t * 0.85) * 0.004;

    const baseX = teacherId === "ali" ? -1.35 : -1.55;
    const targetX = baseX + walkOffset;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.1);
    group.current.position.y = breath;
    group.current.position.z = frame?.gaze === "board" ? -0.05 : 0.1;
    group.current.rotation.y = micro;

    if (frame?.bones?.length) {
      for (const bp of frame.bones) {
        const joint = BONE_TO_MIXAMO[bp.bone];
        const bone = bones.get(joint);
        if (!bone) continue;
        const rest = restQuats.current.get(joint) || bone.quaternion;
        const e = new THREE.Euler(
          degToRad(bp.rot[0]),
          degToRad(bp.rot[1]),
          degToRad(bp.rot[2]),
          "XYZ",
        );
        const q = new THREE.Quaternion().setFromEuler(e);
        bone.quaternion.copy(rest).multiply(q);
      }
    }

    const head = bones.get("mixamorig:Head");
    const neck = bones.get("mixamorig:Neck");
    if (head && frame) {
      const gazeYaw =
        frame.gaze === "board"
          ? -0.45
          : frame.gaze === "prop"
            ? -0.2
            : frame.gaze === "student"
              ? 0.25
              : 0;
      const yaw = degToRad(frame.head.yaw) * 0.6 + gazeYaw;
      const pitch = degToRad(frame.head.pitch) * 0.5;
      const roll = degToRad(frame.head.roll) * 0.4;
      head.rotation.order = "YXZ";
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, yaw, 0.15);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pitch, 0.15);
      head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, roll, 0.15);

      // Keep catchlights + face key locked to the head for corneal realism
      if (catchlights.current) {
        head.getWorldPosition(catchlights.current.position);
        catchlights.current.position.y += 0.12;
        catchlights.current.position.z += 0.08;
        head.getWorldQuaternion(catchlights.current.quaternion);
      }
      if (faceLight.current) {
        head.getWorldPosition(faceLight.current.position);
        faceLight.current.position.y += 0.22;
        faceLight.current.position.z += 0.35;
        faceLight.current.position.x += teacherId === "ali" ? 0.12 : -0.08;
        faceLight.current.intensity = frame.camera === "close_face" ? 1.15 : 0.55;
      }
    }
    if (neck && frame) {
      neck.rotation.y = THREE.MathUtils.lerp(
        neck.rotation.y,
        degToRad(frame.head.yaw) * 0.25,
        0.12,
      );
    }

    const eyeL = bones.get("mixamorig:LeftEye");
    const eyeR = bones.get("mixamorig:RightEye");
    const eyeYaw =
      frame?.gaze === "board" ? -0.15 : frame?.gaze === "student" ? 0.1 : 0;
    const eyePitch = frame?.gaze === "board" ? -0.06 : 0.02;
    const saccade = Math.sin(t * 3.1) * 0.012;
    if (eyeL) {
      eyeL.rotation.y = eyeYaw + saccade;
      eyeL.rotation.x = eyePitch;
    }
    if (eyeR) {
      eyeR.rotation.y = eyeYaw + saccade * 0.9;
      eyeR.rotation.x = eyePitch;
    }

    const curl = fingerCurlForGesture(frame?.gesture || "idle_breathe");
    for (const name of [
      "mixamorig:LeftHandIndex1",
      "mixamorig:LeftHandMiddle1",
      "mixamorig:LeftHandRing1",
      "mixamorig:RightHandIndex1",
      "mixamorig:RightHandMiddle1",
      "mixamorig:RightHandRing1",
    ]) {
      const b = bones.get(name);
      if (b) b.rotation.z = THREE.MathUtils.lerp(b.rotation.z, curl, 0.12);
    }

    const walking =
      frame?.locomotion === "walk_in" ||
      frame?.locomotion === "step_to_board" ||
      frame?.locomotion === "step_to_prop" ||
      frame?.locomotion === "step_to_student";
    if (walking) {
      const thighL = bones.get("mixamorig:LeftUpLeg");
      const thighR = bones.get("mixamorig:RightUpLeg");
      const phase = Math.sin(t * 7.5);
      if (thighL) thighL.rotation.x = phase * 0.35;
      if (thighR) thighR.rotation.x = -phase * 0.35;
    }

    if (face?.morphTargetDictionary && face.morphTargetInfluences) {
      const dict = face.morphTargetDictionary;
      const infl = face.morphTargetInfluences;
      for (let i = 0; i < infl.length; i++) infl[i] = THREE.MathUtils.lerp(infl[i]!, 0, 0.2);

      const shapes = frame?.mouthShapes || {};
      for (const key of FACE_MORPHS) {
        const idx = dict[key];
        if (idx === undefined) continue;
        let w = shapes[key] ?? 0;
        if (key === "jawOpen") w = Math.max(w, jaw);
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          // Asymmetric natural blink cadence
          const phase = key === "eyeBlinkLeft" ? t * 0.71 : t * 0.69 + 0.4;
          const blink = Math.max(0, Math.sin(phase) - 0.955) * 22;
          w = Math.max(w, blink);
        }
        infl[idx] = THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(infl[idx]!, w, 0.35),
          0,
          1,
        );
      }

      if (
        frame?.emotion === "warm" ||
        frame?.emotion === "celebratory" ||
        frame?.emotion === "encouraging"
      ) {
        const sL = dict.mouthSmileLeft;
        const sR = dict.mouthSmileRight;
        const amp = (frame.emotionIntensity || 0.5) * 0.55;
        if (sL !== undefined) infl[sL] = Math.max(infl[sL]!, amp);
        if (sR !== undefined) infl[sR] = Math.max(infl[sR]!, amp * 0.92);
      }
      if (frame?.emotion === "curious" || frame?.emotion === "focused") {
        const b = dict.browInnerUp;
        if (b !== undefined) infl[b] = Math.max(infl[b]!, 0.35 * (frame.emotionIntensity || 0.5));
      }
    }
  });

  const s = teacherId === "ali" ? 1.05 : 1.0;

  return (
    <>
      <group ref={group} position={[teacherId === "ali" ? -1.35 : -1.55, 0, 0.1]} scale={s}>
        <primitive object={gltf.scene} />
      </group>

      {/* Corneal catchlights — dominant cue for eye realism in close-ups */}
      <group ref={catchlights}>
        <mesh position={[-0.028, 0.01, 0.045]} scale={0.008}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.028, 0.008, 0.045]} scale={0.007}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
        </mesh>
      </group>

      {/* Soft face key — physically plausible skin response under beauty/close shots */}
      <pointLight
        ref={faceLight}
        color="#ffe6c8"
        intensity={0.55}
        distance={1.8}
        decay={2}
      />
    </>
  );
}

useGLTF.preload(humanoidUrl("sara"));
useGLTF.preload(humanoidUrl("ali"));

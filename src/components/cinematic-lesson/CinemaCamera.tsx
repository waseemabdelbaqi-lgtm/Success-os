"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CinemaShot } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

type Props = { shot: CinemaShot };

export function CinemaCamera({ shot }: Props) {
  const { camera } = useThree();
  const look = new THREE.Vector3();
  const pos = new THREE.Vector3();

  useFrame((_, dt) => {
    pos.set(...shot.camera.position);
    look.set(...shot.camera.lookAt);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 3.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 3.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 3.2, dt);
    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov = THREE.MathUtils.damp(persp.fov, shot.camera.fov, 3.2, dt);
      persp.updateProjectionMatrix();
    }
    const cur = new THREE.Vector3();
    camera.getWorldDirection(cur);
    const targetDir = look.clone().sub(camera.position).normalize();
    const next = cur.lerp(targetDir, 1 - Math.exp(-3.2 * dt)).add(camera.position);
    camera.lookAt(next);
  });

  return null;
}

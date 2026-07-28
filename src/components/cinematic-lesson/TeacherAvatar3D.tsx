"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CinemaShot } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

type Props = {
  shot: CinemaShot;
  mouthOpen: number;
  timeSec: number;
};

/** Original stylized 3D Success OS teacher — fictional Ms. Lama. */
export function TeacherAvatar3D({ shot, mouthOpen, timeSec }: Props) {
  const group = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Group>(null);

  const skin = useMemo(() => new THREE.Color("#e8b89a"), []);
  const hijab = useMemo(() => new THREE.Color("#9e1722"), []);
  const gold = useMemo(() => new THREE.Color("#f2d77c"), []);
  const dress = useMemo(() => new THREE.Color("#4b0a11"), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;

    const targetX = shot.teacher.walkIn ? THREE.MathUtils.lerp(1.8, 0.55, Math.min(1, timeSec / 4.2)) : 0.55;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 4, dt);
    g.position.y = 0;
    g.position.z = 0.35;

    const faceBoard = shot.teacher.lookAt === "board";
    const yaw = faceBoard ? -0.55 : 0.12 + Math.sin(timeSec * 1.3) * 0.03;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, yaw, 5, dt);

    if (arm.current) {
      const point = shot.teacher.pointBoard;
      const ax = point ? -0.35 : 0.15;
      const az = point ? -1.15 : -0.25;
      arm.current.rotation.x = THREE.MathUtils.damp(arm.current.rotation.x, ax, 6, dt);
      arm.current.rotation.z = THREE.MathUtils.damp(arm.current.rotation.z, az, 6, dt);
    }

    if (mouth.current) {
      const open = shot.teacher.mouth ? 0.04 + mouthOpen * 0.22 : 0.02;
      mouth.current.scale.y = THREE.MathUtils.damp(mouth.current.scale.y, open / 0.08, 12, dt);
    }

    if (eyes.current) {
      eyes.current.rotation.y = faceBoard ? -0.25 : Math.sin(timeSec * 2.1) * 0.04;
    }

    // subtle breathing
    g.position.y = Math.sin(timeSec * 2.2) * 0.012;
  });

  return (
    <group ref={group} position={[1.8, 0, 0.35]}>
      {/* body */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
        <meshStandardMaterial color={dress} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* shoulders */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color={dress} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 12]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.18, 28, 28]} />
        <meshStandardMaterial color={skin} roughness={0.45} />
      </mesh>
      {/* hijab / hair covering */}
      <mesh position={[0, 1.52, -0.02]} castShadow>
        <sphereGeometry args={[0.2, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
        <meshStandardMaterial color={hijab} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.35, -0.08]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.12]} />
        <meshStandardMaterial color={hijab} />
      </mesh>
      {/* gold pin */}
      <mesh position={[0.12, 1.22, 0.16]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.2} emissive={gold} emissiveIntensity={0.2} />
      </mesh>
      {/* eyes */}
      <group ref={eyes} position={[0, 1.5, 0.14]}>
        <mesh position={[-0.055, 0.01, 0]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#1a0d10" />
        </mesh>
        <mesh position={[0.055, 0.01, 0]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#1a0d10" />
        </mesh>
        <mesh position={[-0.055, 0.018, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[0.055, 0.018, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      </group>
      {/* smile / mouth */}
      <mesh ref={mouth} position={[0, 1.41, 0.155]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#8b2e3a" />
      </mesh>
      {/* pointing arm (left from student view / teacher's right) */}
      <group ref={arm} position={[-0.28, 1.1, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.38, 4, 8]} />
          <meshStandardMaterial color={dress} />
        </mesh>
        <mesh position={[0, -0.48, 0.02]} castShadow>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      {/* resting arm */}
      <group position={[0.28, 1.05, 0]} rotation={[0.2, 0, 0.35]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
          <meshStandardMaterial color={dress} />
        </mesh>
      </group>
    </group>
  );
}

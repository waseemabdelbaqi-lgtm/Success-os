"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { CinemaShot } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

type Props = {
  shot: CinemaShot;
  timeSec: number;
};

function Apple({ position, visible, delay, timeSec }: { position: [number, number, number]; visible: boolean; delay: number; timeSec: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = Math.max(0, Math.min(1, (timeSec - delay) / 0.55));
    const show = visible && t > 0;
    ref.current.visible = show;
    const s = THREE.MathUtils.smootherstep(t, 0, 1);
    ref.current.scale.setScalar(show ? 0.2 + s * 0.8 : 0.01);
    ref.current.position.y = position[1] + (1 - s) * 0.35;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#c62828" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh position={[0.02, 0.13, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.06, 6]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      <mesh position={[0.05, 0.14, 0]} rotation={[0, 0, 0.6]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#2e7d32" />
      </mesh>
    </group>
  );
}

export function SmartBoard3D({ shot, timeSec }: Props) {
  const lineToken = useRef<THREE.Mesh>(null);
  const writing = useMemo(() => {
    const full = shot.board.equation || "";
    const n = Math.floor(full.length * shot.board.writingProgress);
    return full.slice(0, n);
  }, [shot.board.equation, shot.board.writingProgress]);

  useFrame(() => {
    if (!lineToken.current || !shot.board.showLine) return;
    // Jump path: start at 3, then to 4, then 5 based on shot progress in numberline/equation
    const local = Math.max(0, timeSec - 26.2);
    let at = 3;
    if (local > 2.2) at = 4;
    if (local > 5.0) at = 5;
    const x = -0.95 + (at / 10) * 1.9;
    lineToken.current.position.x = THREE.MathUtils.damp(lineToken.current.position.x, x, 6, 0.016);
  });

  const objectCount = shot.board.objects;
  const appleDelays =
    objectCount <= 3
      ? [14.7, 16.3, 18.1]
      : [14.7, 16.3, 18.1, 20.0, 22.0];

  return (
    <group position={[-1.15, 1.35, -1.55]}>
      {/* frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.35, 1.45, 0.08]} />
        <meshStandardMaterial color="#2a1518" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.15, 1.25]} />
        <meshStandardMaterial color="#fff8f0" emissive="#f7e7d4" emissiveIntensity={0.25} roughness={0.7} />
      </mesh>
      {/* brand bar */}
      <mesh position={[0, 0.56, 0.06]}>
        <planeGeometry args={[2.05, 0.12]} />
        <meshStandardMaterial color="#9e1722" />
      </mesh>
      <Text position={[0, 0.56, 0.07]} fontSize={0.055} color="#f2d77c" anchorX="center" anchorY="middle">
        Success OS · السبورة الذكية
      </Text>

      {/* apples */}
      {appleDelays.map((delay, i) => (
        <Apple
          key={i}
          position={[-0.7 + i * 0.35, 0.05, 0.08]}
          visible={i < objectCount}
          delay={delay}
          timeSec={timeSec}
        />
      ))}

      {/* number line */}
      {shot.board.showLine ? (
        <group position={[0, -0.28, 0.08]}>
          <mesh>
            <boxGeometry args={[1.95, 0.025, 0.02]} />
            <meshStandardMaterial color="#9e1722" />
          </mesh>
          {Array.from({ length: 11 }, (_, n) => (
            <group key={n} position={[-0.95 + (n / 10) * 1.9, 0, 0]}>
              <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[0.02, 0.08, 0.02]} />
                <meshStandardMaterial color="#4b0a11" />
              </mesh>
              <Text position={[0, -0.1, 0]} fontSize={0.07} color="#4b0a11" anchorX="center">
                {String(n)}
              </Text>
            </group>
          ))}
          <mesh ref={lineToken} position={[-0.95 + 0.3 * 1.9, 0.12, 0.02]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#f2d77c" emissive="#f2d77c" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ) : null}

      {/* equation writing */}
      {writing ? (
        <Text position={[0, 0.28, 0.09]} fontSize={0.16} color="#9e1722" anchorX="center">
          {writing}
        </Text>
      ) : null}
    </group>
  );
}

"use client";

import { SoftShadows } from "@react-three/drei";
import { SmartBoard3D } from "@/src/components/cinematic-lesson/SmartBoard3D";
import { TeacherAvatar3D } from "@/src/components/cinematic-lesson/TeacherAvatar3D";
import type { CinemaShot } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

type Props = {
  shot: CinemaShot;
  mouthOpen: number;
  timeSec: number;
};

export function ClassroomScene({ shot, mouthOpen, timeSec }: Props) {
  return (
    <>
      <color attach="background" args={["#c8b09a"]} />
      <fog attach="fog" args={["#c8b09a", 8, 18]} />
      <SoftShadows size={18} samples={10} focus={0.85} />
      <ambientLight intensity={0.62} />
      <directionalLight
        castShadow
        position={[3.5, 5.5, 2.5]}
        intensity={1.35}
        shadow-mapSize={[1024, 1024]}
        color="#fff1dd"
      />
      <pointLight position={[-2.2, 2.4, 1]} intensity={0.45} color="#f2d77c" />
      <hemisphereLight args={["#fff6ea", "#7a5a40", 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#d9c2a8" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.01, 0.6]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#9e1722" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.012, 0.6]}>
        <planeGeometry args={[1.9, 1.15]} />
        <meshStandardMaterial color="#f2d77c" roughness={0.85} />
      </mesh>

      <mesh position={[0, 1.6, -2.2]} receiveShadow>
        <boxGeometry args={[8, 3.4, 0.12]} />
        <meshStandardMaterial color="#f3e6d8" />
      </mesh>
      <mesh position={[-3.6, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[6, 3.4, 0.12]} />
        <meshStandardMaterial color="#efe0d2" />
      </mesh>

      <group position={[2.6, 1.7, -2.12]}>
        <mesh>
          <boxGeometry args={[1.5, 1.2, 0.06]} />
          <meshStandardMaterial color="#6b3a40" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.3, 1.0]} />
          <meshStandardMaterial
            color="#b8d4ef"
            emissive="#9ec5e8"
            emissiveIntensity={0.45}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      <mesh position={[0.5, 0.38, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.08, 0.7]} />
        <meshStandardMaterial color="#8d6e4c" />
      </mesh>
      <mesh position={[0.05, 0.18, 1.15]} castShadow>
        <boxGeometry args={[0.08, 0.36, 0.08]} />
        <meshStandardMaterial color="#6d4c33" />
      </mesh>
      <mesh position={[0.95, 0.18, 1.15]} castShadow>
        <boxGeometry args={[0.08, 0.36, 0.08]} />
        <meshStandardMaterial color="#6d4c33" />
      </mesh>

      <SmartBoard3D shot={shot} timeSec={timeSec} />
      <TeacherAvatar3D shot={shot} mouthOpen={mouthOpen} timeSec={timeSec} />
    </>
  );
}

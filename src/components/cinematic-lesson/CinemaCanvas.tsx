"use client";

import { Canvas } from "@react-three/fiber";
import { CinemaCamera } from "@/src/components/cinematic-lesson/CinemaCamera";
import { ClassroomScene } from "@/src/components/cinematic-lesson/ClassroomScene";
import type { CinemaShot } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

type Props = {
  shot: CinemaShot;
  mouthOpen: number;
  timeSec: number;
};

export function CinemaCanvas({ shot, mouthOpen, timeSec }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [2.4, 1.55, 4.2], fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <CinemaCamera shot={shot} />
      <ClassroomScene shot={shot} mouthOpen={mouthOpen} timeSec={timeSec} />
    </Canvas>
  );
}

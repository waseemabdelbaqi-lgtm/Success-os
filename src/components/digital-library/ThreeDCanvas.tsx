"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";

type Props = {
  kind?: "photoelectric" | "orbital" | "wave";
  caption: string;
};

function MetalLattice() {
  const atoms = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        pts.push([x * 0.55, -0.85, z * 0.55]);
      }
    }
    return pts;
  }, []);

  return (
    <group>
      {atoms.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#1a2433" metalness={0.4} roughness={0.7} />
      </mesh>
    </group>
  );
}

function PhotonStream() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y -= (0.9 + i * 0.05) * dt;
      if (child.position.y < -0.7) {
        child.position.y = 2.2;
        child.position.x = -1.2 + (i % 5) * 0.55;
      }
    });
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-1.2 + (i % 5) * 0.55, 1.5 + (i % 3) * 0.35, 0.2]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial
            color={i % 2 ? "#5ec8ff" : "#8ef0c4"}
            emissive={i % 2 ? "#1a6ea8" : "#1f8a5b"}
            emissiveIntensity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function EjectedElectrons() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.x += (0.6 + i * 0.08) * dt;
      child.position.y += (0.35 + (i % 3) * 0.1) * dt;
      if (child.position.x > 2.8) {
        child.position.set(-0.2 + (i % 3) * 0.15, -0.55, 0.1 * (i % 2));
      }
    });
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.1, -0.55, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#ffb454" emissive="#a85a10" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function PhotoelectricScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 2]} intensity={1.25} />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#7ec8ff" />
      <MetalLattice />
      <PhotonStream />
      <EjectedElectrons />
      <Text position={[0, 1.85, 0]} fontSize={0.18} color="#e8eef7" anchorX="center">
        photons → metal → photoelectrons
      </Text>
      <ContactShadows opacity={0.35} scale={8} blur={2.5} position={[0, -1.08, 0]} />
      <OrbitControls makeDefault enablePan={false} minDistance={2.5} maxDistance={9} />
    </>
  );
}

export function ThreeDCanvas({ caption }: Props) {
  return (
    <section id="visualizer" className="dl-panel scroll-mt-24" aria-labelledby="viz-heading">
      <header className="dl-panel-head">
        <p className="dl-kicker">Module B</p>
        <h2 id="viz-heading">Interactive 3D visualizer</h2>
        <p className="dl-lead">{caption}</p>
      </header>
      <div className="dl-canvas-frame" role="img" aria-label="3D photoelectric effect model">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [3.2, 2.2, 4.2], fov: 42 }}
          style={{ touchAction: "none", width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0b1220"]} />
          <PhotoelectricScene />
        </Canvas>
      </div>
      <p className="dl-hint">Drag to rotate · pinch/scroll to zoom · optimized for mouse, touch, and Pencil.</p>
    </section>
  );
}

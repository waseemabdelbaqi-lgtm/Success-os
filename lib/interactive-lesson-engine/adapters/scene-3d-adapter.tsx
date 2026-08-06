"use client";

/**
 * Scene3dAdapter — React Three Fiber shell for virtual labs / spatial concepts.
 * Lazy-friendly; always includes accessible text fallback.
 * Replaceable: Babylon.js behind the same props contract.
 */
import { Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

type Scene3dAdapterProps = {
  title?: string;
  description?: string;
  variant?: "molecule" | "orbit" | "lab" | "generic";
  height?: number;
};

function MoleculeDemo() {
  return (
    <group>
      <mesh position={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color="#14b8a6" />
      </mesh>
      <mesh position={[0.6, 0, 0]}>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial color="#0f766e" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 12]} />
        <meshStandardMaterial color="#99f6e4" />
      </mesh>
    </group>
  );
}

function OrbitDemo() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#78350f" emissiveIntensity={0.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
        <torusGeometry args={[1.2, 0.03, 12, 64]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[1.2, 0, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

export function Scene3dAdapter({
  title,
  description,
  variant = "generic",
  height = 260,
}: Scene3dAdapterProps): ReactNode {
  return (
    <div data-adapter="r3f" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <div
        style={{
          height,
          background: "radial-gradient(circle at 30% 20%, #134e4a, #020617)",
        }}
      >
        <Canvas camera={{ position: [2.4, 1.6, 2.4], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 2]} intensity={1.1} />
          <Suspense fallback={<Html center>Loading 3D…</Html>}>
            {variant === "orbit" ? <OrbitDemo /> : <MoleculeDemo />}
            <OrbitControls enablePan={false} />
          </Suspense>
        </Canvas>
      </div>
      <div style={{ padding: "0.65rem 0.75rem", background: "#fff", fontSize: 12, color: "#334155" }}>
        <strong>{title || "3D scene"}</strong>
        {description ? <p style={{ margin: "0.25rem 0 0" }}>{description}</p> : null}
        <p style={{ margin: "0.35rem 0 0", color: "#94a3b8" }}>
          Accessible fallback: rotate with pointer/touch. Full virtual labs ship in a later stage.
        </p>
      </div>
    </div>
  );
}

export const SCENE_3D_ADAPTER_META = {
  id: "react-three-fiber",
  replaceWith: ["babylonjs"],
  license: "MIT",
  monthlyCostUsd: 0,
};

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";

type VisualizerKind = "photoelectric" | "orbital" | "wave" | "numberline";

type Props = {
  kind?: VisualizerKind;
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

/** Grade-1 addition: hop along a number line (3 + 4). */
function NumberLineHopper() {
  const token = useRef<Mesh>(null);
  const [a] = useState(3);
  const [b] = useState(4);
  const spacing = 0.42;
  const startX = -4.2;

  useFrame(({ clock }) => {
    if (!token.current) return;
    const t = clock.getElapsedTime();
    const cycle = 5.5;
    const phase = (t % cycle) / cycle;
    let pos = a;
    let y = 0.35;
    if (phase < 0.15) {
      pos = a;
    } else if (phase < 0.75) {
      const u = (phase - 0.15) / 0.6;
      const hops = u * b;
      pos = a + hops;
      const frac = hops % 1;
      y = 0.35 + Math.sin(frac * Math.PI) * 0.55;
    } else {
      pos = a + b;
    }
    token.current.position.set(startX + pos * spacing, y, 0.15);
  });

  const marks = Array.from({ length: 16 }, (_, i) => i);

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[7.2, 0.06, 0.18]} />
        <meshStandardMaterial color="#f2d77c" metalness={0.2} roughness={0.45} />
      </mesh>
      {marks.map((n) => (
        <group key={n} position={[startX + n * spacing, 0, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.04, 0.22, 0.04]} />
            <meshStandardMaterial color="#9e1722" />
          </mesh>
          <Text
            position={[0, -0.35, 0]}
            fontSize={0.18}
            color="#fff8f0"
            anchorX="center"
            anchorY="middle"
          >
            {String(n)}
          </Text>
        </group>
      ))}
      <mesh ref={token}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#9e1722" emissive="#4b0a11" emissiveIntensity={0.45} />
      </mesh>
      <Text position={[0, 1.55, 0]} fontSize={0.22} color="#f2d77c" anchorX="center">
        {`${a} + ${b} = ${a + b}`}
      </Text>
      <Text position={[0, 1.2, 0]} fontSize={0.14} color="#ffe8d6" anchorX="center">
        قفز على خط الأعداد
      </Text>
    </group>
  );
}

function NumberLineScene() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <pointLight position={[-2, 3, 2]} intensity={0.4} color="#f2d77c" />
      <NumberLineHopper />
      <ContactShadows opacity={0.3} scale={12} blur={2.2} position={[0, -0.55, 0]} />
      <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={11} />
    </>
  );
}

function OrbitalScene() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35;
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 4, 2]} intensity={1.1} />
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color="#9e1722" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2.8, 0.4, 0]}>
          <torusGeometry args={[1.2, 0.03, 12, 80]} />
          <meshStandardMaterial color="#f2d77c" />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#f2d77c" emissive="#b8860b" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <OrbitControls makeDefault enablePan={false} />
    </>
  );
}

function WaveScene() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 2.2 + i * 0.45) * 0.55;
    });
  });
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 3]} intensity={1} />
      <group ref={ref}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i} position={[-2.6 + i * 0.4, 0, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={i % 2 ? "#9e1722" : "#f2d77c"} />
          </mesh>
        ))}
      </group>
      <OrbitControls makeDefault enablePan={false} />
    </>
  );
}

function SceneForKind({ kind }: { kind: VisualizerKind }) {
  if (kind === "numberline") return <NumberLineScene />;
  if (kind === "orbital") return <OrbitalScene />;
  if (kind === "wave") return <WaveScene />;
  return <PhotoelectricScene />;
}

export function ThreeDCanvas({ kind = "photoelectric", caption }: Props) {
  const isNumberLine = kind === "numberline";
  return (
    <section id="visualizer" className="dl-panel scroll-mt-24" aria-labelledby="viz-heading">
      <header className="dl-panel-head">
        <p className="dl-kicker">Module B · 3D</p>
        <h2 id="viz-heading">
          {isNumberLine ? "مجسّم تفاعلي · خط الأعداد" : "Interactive 3D visualizer"}
        </h2>
        <p className="dl-lead">{caption}</p>
      </header>
      <div
        className="dl-canvas-frame"
        role="img"
        aria-label={isNumberLine ? "3D number line addition" : "3D lesson model"}
      >
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: isNumberLine ? [0, 2.4, 6.2] : [3.2, 2.2, 4.2],
            fov: 42,
          }}
          style={{ touchAction: "none", width: "100%", height: "100%" }}
        >
          <color attach="background" args={[isNumberLine ? "#2a0c10" : "#0b1220"]} />
          <SceneForKind kind={kind} />
        </Canvas>
      </div>
      <p className="dl-hint">
        {isNumberLine
          ? "اسحب للدوران · قرّب/بعّد · شاهد القفزات تمثّل الجمع"
          : "Drag to rotate · pinch/scroll to zoom · optimized for mouse, touch, and Pencil."}
      </p>
    </section>
  );
}

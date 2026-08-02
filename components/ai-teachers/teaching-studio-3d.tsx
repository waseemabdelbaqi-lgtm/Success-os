"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { ScreenElement } from "@/types/human-engine";

export type Studio3DPose = "stand" | "point" | "write";

/** Camera shots accepted from Human Engine + legacy DHS names. */
export type StudioCamShot =
  | "wide_establishing"
  | "medium_teacher"
  | "close_face"
  | "over_shoulder_board"
  | "board_insert"
  | "prop_orbit"
  | "two_shot"
  | "model_orbit";

export type StudioLightId =
  | "soft_classroom"
  | "key_fill_rim"
  | "warm_encourage"
  | "cool_focus"
  | "board_accent"
  | "closeup_beauty"
  | "model_spotlight"
  | "experiment_practical"
  | "cinematic_key"
  | "soft_daylight"
  | "focus_spot"
  | "cool_precision";

export type Studio3DProp = {
  id: string;
  kind: string;
  label: string;
  scale?: number;
  rotateY?: number;
  focused?: boolean;
};

type Props = {
  teacherId: "sara" | "ali";
  pose: Studio3DPose;
  speaking: boolean;
  mouthEnergy: number;
  camera: StudioCamShot | string;
  lighting: StudioLightId | string;
  props: Studio3DProp[];
  focusTarget: string | null;
  boardLines: string[];
  celebrating?: boolean;
  /** Human Engine locomotion / look drive */
  walkOffset?: number;
  lookYaw?: number;
  lookPitch?: number;
  gaze?: string;
  screenElement?: ScreenElement | null;
};

const CAM: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
  wide_establishing: { pos: [0, 2.2, 6.2], look: [0, 1.2, 0] },
  medium_teacher: { pos: [-1.6, 1.7, 3.8], look: [-1.4, 1.45, 0] },
  close_face: { pos: [-1.5, 1.85, 2.4], look: [-1.45, 1.7, 0] },
  over_shoulder_board: { pos: [-2.4, 1.8, 2.8], look: [1.2, 1.5, -1.5] },
  board_insert: { pos: [1.4, 1.7, 3.2], look: [1.3, 1.55, -1.6] },
  prop_orbit: { pos: [0.8, 1.9, 4.2], look: [0.9, 1.3, 0.2] },
  model_orbit: { pos: [0.8, 1.9, 4.2], look: [0.9, 1.3, 0.2] },
  two_shot: { pos: [0.2, 1.9, 5.2], look: [0, 1.4, 0] },
};

function CameraRig({ camera }: { camera: string }) {
  const { camera: cam } = useThree();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const cfg = CAM[camera] || CAM.medium_teacher;
    desired.set(...cfg.pos);
    look.set(...cfg.look);
    cam.position.lerp(desired, Math.min(1, dt * 2.4));
    cam.lookAt(look);
  });
  return null;
}

function StudioRoom({ lighting }: { lighting: string }) {
  const keyColor =
    lighting === "warm_encourage"
      ? "#ffb070"
      : lighting === "cool_focus" || lighting === "cool_precision"
        ? "#8eb7ff"
        : lighting === "focus_spot" || lighting === "model_spotlight"
          ? "#fff2c8"
          : lighting === "experiment_practical"
            ? "#ffc89a"
            : "#ffe2b0";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#2a2118" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.2, -3.2]}>
        <planeGeometry args={[12, 4.4]} />
        <meshStandardMaterial
          color="#0b1a33"
          emissive="#1a4d8c"
          emissiveIntensity={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 2.2, -3.18]}>
        <planeGeometry args={[11.6, 4]} />
        <meshBasicMaterial color="#13365f" transparent opacity={0.35} />
      </mesh>
      <mesh position={[-5.5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 4.5]} />
        <meshStandardMaterial color="#1c2436" roughness={0.9} />
      </mesh>
      <RoundedBox args={[1.8, 0.12, 0.9]} position={[0.9, 0.78, 0.7]} radius={0.04}>
        <meshStandardMaterial color="#3a2a1c" roughness={0.5} metalness={0.2} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.78, 0.1]} position={[0.2, 0.39, 0.4]} radius={0.02}>
        <meshStandardMaterial color="#2a1d14" />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.78, 0.1]} position={[1.6, 0.39, 0.4]} radius={0.02}>
        <meshStandardMaterial color="#2a1d14" />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.78, 0.1]} position={[0.2, 0.39, 1.0]} radius={0.02}>
        <meshStandardMaterial color="#2a1d14" />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.78, 0.1]} position={[1.6, 0.39, 1.0]} radius={0.02}>
        <meshStandardMaterial color="#2a1d14" />
      </RoundedBox>

      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[-2, 5, 3]}
        intensity={1.15}
        color={keyColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        position={[2.5, 4.2, 2]}
        angle={0.45}
        penumbra={0.5}
        intensity={
          lighting === "focus_spot" || lighting === "model_spotlight" ? 1.6 : 0.9
        }
        color="#fff6e0"
      />
      <pointLight position={[0, 2.5, -2.5]} intensity={0.8} color="#3d7cff" />
    </group>
  );
}

function SmartBoard({
  lines,
  screenElement,
}: {
  lines: string[];
  screenElement?: ScreenElement | null;
}) {
  const label = screenElement?.label;
  const kind = screenElement?.kind;
  return (
    <group position={[1.55, 1.7, -1.75]}>
      <RoundedBox args={[3.4, 2.1, 0.08]} radius={0.04}>
        <meshStandardMaterial color="#0a2f2c" emissive="#0d4a42" emissiveIntensity={0.4} />
      </RoundedBox>
      <Html
        transform
        position={[0, 0.05, 0.06]}
        distanceFactor={2.6}
        style={{
          width: 360,
          padding: 14,
          color: "#f4fffb",
          fontFamily: "'Noto Kufi Arabic', sans-serif",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <div style={{ fontSize: 11, color: "#ffe08a", fontWeight: 800, marginBottom: 8 }}>
          SUCCESS OS · SMART BOARD
          {kind ? ` · ${kind}` : ""}
        </div>
        {label ? (
          <div
            style={{
              marginBottom: 8,
              fontWeight: 900,
              fontSize: 22,
              background: "rgba(255,255,255,0.95)",
              color: "#142018",
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            {label}
          </div>
        ) : null}
        {lines.slice(0, 5).map((line, i) => (
          <div
            key={`${line}-${i}`}
            style={{
              marginBottom: 6,
              fontWeight: 800,
              fontSize: i === 0 && !label ? 18 : 13,
              background:
                i === 0 && !label ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.1)",
              color: i === 0 && !label ? "#142018" : "#f4fffb",
              borderRadius: 10,
              padding: "6px 8px",
            }}
          >
            {line}
          </div>
        ))}
      </Html>
    </group>
  );
}

function TeacherBillboard({
  teacherId,
  pose,
  speaking,
  mouthEnergy,
  walkOffset = 0,
  lookYaw = 0,
  lookPitch = 0,
  gaze = "student",
}: {
  teacherId: "sara" | "ali";
  pose: Studio3DPose;
  speaking: boolean;
  mouthEnergy: number;
  walkOffset?: number;
  lookYaw?: number;
  lookPitch?: number;
  gaze?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const load = (p: Studio3DPose) => {
      const t = loader.load(`/media/ai-teachers/${teacherId}/classroom/${p}.png`);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return { stand: load("stand"), point: load("point"), write: load("write") };
  }, [teacherId]);

  useEffect(
    () => () => {
      textures.stand.dispose();
      textures.point.dispose();
      textures.write.dispose();
    },
    [textures],
  );

  const texture = textures[pose] || textures.stand;

  // Base X differs slightly per teacher — independent staging
  const baseX = teacherId === "ali" ? -1.45 : -1.65;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const breath = Math.sin(t * (speaking ? 2.4 : 1.15)) * (0.012 + mouthEnergy * 0.01);
    const walkBob = Math.abs(walkOffset) > 0.02 ? Math.sin(t * 8) * 0.03 : 0;
    const gazeYaw =
      gaze === "board" ? -0.35 : gaze === "prop" ? -0.12 : gaze === "student" ? 0.12 : 0;
    const targetX = baseX + walkOffset;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, targetX, 0.08);
    group.current.position.y = 1.35 + breath + walkBob;
    group.current.position.z = 0.15 + (gaze === "board" ? -0.08 : 0);
    const targetRotY = -0.18 + gazeYaw + (lookYaw || 0) * 0.012;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.1);
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      (lookPitch || 0) * 0.008,
      0.1,
    );
    group.current.scale.setScalar(1 + mouthEnergy * 0.02);
  });

  return (
    <group ref={group} position={[baseX, 1.35, 0.15]}>
      <mesh castShadow>
        <planeGeometry args={[1.7, 2.45]} />
        <meshStandardMaterial map={texture} transparent toneMapped={false} />
      </mesh>
      {/* mouth energy indicator — honest approx, not MetaHuman viseme */}
      <mesh position={[0.02, -0.42, 0.02]} scale={[1, 0.35 + mouthEnergy * 1.4, 1]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#2a1010" transparent opacity={0.25 + mouthEnergy * 0.45} />
      </mesh>
      <mesh position={[0, -0.2, -0.05]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial
          color={teacherId === "ali" ? "#8eb7ff" : "#ffd59a"}
          transparent
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

function LessonProps({
  props,
  focusTarget,
  screenElement,
}: {
  props: Studio3DProp[];
  focusTarget: string | null;
  screenElement?: ScreenElement | null;
}) {
  const dynamic: Studio3DProp[] = [...props];
  if (screenElement && (screenElement.kind === "model_3d" || screenElement.kind === "experiment")) {
    dynamic.unshift({
      id: screenElement.id,
      kind: screenElement.kind === "experiment" ? "experiment" : "model_3d",
      label: screenElement.label,
      scale: screenElement.transform.scale,
      rotateY: (screenElement.transform.rotateY * Math.PI) / 180,
      focused: true,
    });
  }

  return (
    <group>
      {dynamic.slice(0, 4).map((p, i) => {
        const focused = p.focused || focusTarget === p.id;
        const x = 0.4 + i * 0.55;
        return (
          <PropMesh
            key={p.id}
            kind={p.kind}
            focused={!!focused}
            position={[x, 1.05, 0.55]}
            label={p.label}
            scale={p.scale || 1}
            rotateY={p.rotateY || 0}
          />
        );
      })}
    </group>
  );
}

function PropMesh({
  kind,
  focused,
  position,
  label,
  scale,
  rotateY,
}: {
  kind: string;
  focused: boolean;
  position: [number, number, number];
  label: string;
  scale: number;
  rotateY: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const spin = kind === "model_3d" ? rotateY + s.clock.elapsedTime * (focused ? 1.4 : 0.35) : s.clock.elapsedTime * 0.35;
    ref.current.rotation.y = spin;
    const pulse = focused ? 1.15 + Math.sin(s.clock.elapsedTime * 6) * 0.05 : 1;
    ref.current.scale.setScalar(pulse * scale);
  });

  const color =
    kind === "equation" || kind === "law"
      ? "#ffe08a"
      : kind === "model_3d"
        ? "#6ec8ff"
        : kind === "experiment" || kind === "simulation"
          ? "#ff8a5a"
          : "#9adfd6";

  return (
    <group ref={ref} position={position}>
      {kind === "model_3d" ? (
        <mesh castShadow>
          <icosahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={focused ? 0.55 : 0.15}
            metalness={0.3}
          />
        </mesh>
      ) : kind === "equation" || kind === "law" ? (
        <RoundedBox args={[0.55, 0.28, 0.06]} radius={0.03} castShadow>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={focused ? 0.35 : 0.08}
          />
        </RoundedBox>
      ) : (
        <mesh castShadow>
          <torusGeometry args={[0.16, 0.05, 12, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={focused ? 0.4 : 0.1}
          />
        </mesh>
      )}
      <Html position={[0, 0.38, 0]} center distanceFactor={4} style={{ pointerEvents: "none" }}>
        <div
          style={{
            color: "#fff8e8",
            fontWeight: 800,
            fontSize: 12,
            fontFamily: "'Noto Kufi Arabic', sans-serif",
            textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function SceneBody(props: Props) {
  return (
    <>
      <CameraRig camera={props.camera} />
      <StudioRoom lighting={props.lighting} />
      <SmartBoard lines={props.boardLines} screenElement={props.screenElement} />
      <TeacherBillboard
        teacherId={props.teacherId}
        pose={props.pose}
        speaking={props.speaking}
        mouthEnergy={props.mouthEnergy}
        walkOffset={props.walkOffset}
        lookYaw={props.lookYaw}
        lookPitch={props.lookPitch}
        gaze={props.gaze}
      />
      <LessonProps
        props={props.props}
        focusTarget={props.focusTarget}
        screenElement={props.screenElement}
      />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={12} blur={2.5} far={4} />
      <Environment preset="city" environmentIntensity={0.25} />
      {props.celebrating && (
        <pointLight position={[-1.4, 2.4, 1]} intensity={2} color="#ffd84a" />
      )}
    </>
  );
}

export function TeachingStudio3D(props: Props) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 480, background: "#070b14" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.2, 6.2], fov: 42, near: 0.1, far: 40 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneBody {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type { HumanFrameSample, ScreenElement } from "@/types/human-engine";
import { SkinnedDigitalHuman } from "@/components/ai-teachers/skinned-digital-human";

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
  /** Full HE frame — drives skinned skeleton + face morphs */
  frame?: HumanFrameSample | null;
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

function StudioRoom({
  lighting,
  teacherId,
}: {
  lighting: string;
  teacherId: "sara" | "ali";
}) {
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

  const teacherX = teacherId === "ali" ? -1.35 : -1.55;
  const beauty =
    lighting === "closeup_beauty" || lighting === "key_fill_rim";

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

      <ambientLight intensity={lighting === "closeup_beauty" ? 0.24 : 0.32} />
      <directionalLight
        castShadow
        position={[teacherX - 0.8, 5.2, 3.2]}
        intensity={lighting === "closeup_beauty" ? 1.4 : 1.15}
        color={keyColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Fill — softens face shadows for skin response */}
      <directionalLight
        position={[teacherX + 2.2, 3.4, 2.6]}
        intensity={beauty ? 0.62 : 0.35}
        color="#fff4e8"
      />
      {/* Rim — separates teacher silhouette from LED wall */}
      <directionalLight
        position={[teacherX - 0.2, 2.6, -2.4]}
        intensity={beauty ? 0.85 : 0.4}
        color="#c8d8ff"
      />
      {/* Beauty spot aimed at teacher face plane */}
      <spotLight
        position={[teacherX + 0.35, 2.55, 2.1]}
        angle={0.32}
        penumbra={0.65}
        intensity={beauty ? 1.35 : 0.7}
        color="#ffe8cc"
        castShadow={false}
      >
        <object3D attach="target" position={[teacherX, 1.65, 0.1]} />
      </spotLight>
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

/** Photoreal classroom teacher — full human presence inside the 3D studio. */
function PhotorealTeacher({
  teacherId,
  pose,
  speaking,
  mouthEnergy,
  walkOffset = 0,
  lookYaw = 0,
  lookPitch = 0,
}: {
  teacherId: "sara" | "ali";
  pose: Studio3DPose;
  speaking: boolean;
  mouthEnergy: number;
  walkOffset?: number;
  lookYaw?: number;
  lookPitch?: number;
}) {
  // Asset paths follow Configuration Layer appearance.assetRoot convention
  const root = `/media/ai-teachers/${teacherId}`;
  const stand = useTexture(`${root}/classroom/stand.png`);
  const point = useTexture(`${root}/classroom/point.png`);
  const write = useTexture(`${root}/classroom/write.png`);
  const mouthClosed = useTexture(`${root}/flagship/mouth-closed.png`);
  const mouthOpen = useTexture(`${root}/flagship/mouth-open.png`);
  const mouthWide = useTexture(`${root}/flagship/mouth-wide.png`);
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const mouthMat = useRef<THREE.MeshBasicMaterial>(null);

  for (const t of [stand, point, write, mouthClosed, mouthOpen, mouthWide]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  }

  const map = pose === "point" ? point : pose === "write" ? write : stand;
  const aspect = map.image ? map.image.width / map.image.height : 0.62;
  const height = 2.55;
  const width = height * aspect;
  const energy = Math.max(0, Math.min(1, mouthEnergy));
  const mouthMap =
    !speaking || energy < 0.12
      ? mouthClosed
      : energy > 0.55
        ? mouthWide
        : mouthOpen;
  const mouthOpacity = speaking ? 0.22 + energy * 0.55 : 0.08;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const breath = Math.sin(t * (speaking ? 2.4 : 1.15)) * (speaking ? 0.012 : 0.007);
    const sway = Math.sin(t * 1.1) * (speaking ? 0.025 : 0.012);
    const headYaw = THREE.MathUtils.degToRad(lookYaw || 0) * 0.35;
    const headPitch = THREE.MathUtils.degToRad(lookPitch || 0) * 0.2;
    const baseX = teacherId === "ali" ? -1.25 : -1.45;
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      baseX + walkOffset * 0.55,
      0.08,
    );
    group.current.position.y = 1.28 + breath;
    group.current.rotation.y = sway + headYaw;
    group.current.rotation.x = headPitch;
    if (mat.current) {
      mat.current.emissiveIntensity = speaking ? 0.06 + energy * 0.1 : 0.03;
    }
    if (mouthMat.current) {
      mouthMat.current.opacity = THREE.MathUtils.lerp(
        mouthMat.current.opacity,
        mouthOpacity,
        0.22,
      );
    }
  });

  return (
    <group ref={group} position={[teacherId === "ali" ? -1.25 : -1.45, 1.28, 0.15]}>
      <mesh castShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          ref={mat}
          map={map}
          transparent
          alphaTest={0.15}
          roughness={0.72}
          metalness={0.02}
          emissive="#22180f"
          emissiveIntensity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Soft lip-sync overlay — photoreal mouth stills driven by jaw energy */}
      <mesh position={[0, height * 0.18, 0.012]} scale={[0.42, 0.22, 1]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          ref={mouthMat}
          map={mouthMap}
          transparent
          opacity={mouthOpacity}
          depthWrite={false}
          alphaTest={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
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
  const progress = Math.max(0.18, Math.min(1, screenElement?.strokeProgress ?? 1));
  const visibleCount = Math.max(
    1,
    Math.ceil(lines.slice(0, 5).length * progress),
  );
  const reveal = lines.slice(0, visibleCount);
  const last = reveal[reveal.length - 1] || "";
  const lastFrac =
    reveal.length === lines.slice(0, 5).length
      ? 1
      : Math.max(0.35, (progress * lines.slice(0, 5).length) % 1 || progress);
  const lastShown =
    lastFrac >= 0.98 ? last : last.slice(0, Math.max(1, Math.ceil(last.length * lastFrac)));

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
        <div style={{ fontSize: 12, color: "#ffe08a", fontWeight: 800, marginBottom: 8 }}>
          السبورة
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
              clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
            }}
          >
            {label}
          </div>
        ) : null}
        {reveal.map((line, i) => {
          const text =
            i === reveal.length - 1 && reveal.length < Math.min(5, lines.length)
              ? lastShown
              : line;
          return (
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
                transition: "opacity 220ms ease",
              }}
            >
              {text}
              {i === reveal.length - 1 && progress < 0.98 ? (
                <span style={{ opacity: 0.55 }}>▍</span>
              ) : null}
            </div>
          );
        })}
      </Html>
    </group>
  );
}

/** Synthesize a minimal HE frame for legacy callers that only pass pose/mouth. */
function legacyFrame(props: Props): HumanFrameSample {
  const gesture =
    props.pose === "write"
      ? "write_board"
      : props.pose === "point"
        ? "point_board"
        : "open_explain";
  return {
    tMs: 0,
    characterId: props.teacherId,
    phoneme: props.speaking ? "AA" : "sil",
    jawOpen: props.mouthEnergy,
    mouthShapes: {
      jawOpen: props.mouthEnergy,
      mouthSmileLeft: props.celebrating ? 0.4 : 0.1,
      mouthSmileRight: props.celebrating ? 0.4 : 0.1,
    },
    emotion: props.celebrating ? "celebratory" : "warm",
    emotionIntensity: 0.6,
    gesture,
    locomotion: "stand",
    gaze: (props.gaze as HumanFrameSample["gaze"]) || "student",
    head: {
      yaw: props.lookYaw || 0,
      pitch: props.lookPitch || 0,
      roll: 0,
    },
    bones: [],
    camera: (props.camera as HumanFrameSample["camera"]) || "medium_teacher",
    lighting: (props.lighting as HumanFrameSample["lighting"]) || "key_fill_rim",
    lightIntensity: 1,
    behaviourGoal: "explain",
    contentAct: null,
    screen: props.screenElement || null,
    speaking: props.speaking,
    lineText: null,
    sentenceId: null,
  };
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
  const frame = props.frame ?? legacyFrame(props);
  // Live Human Engine path: drive the skinned GLB (bones + ARKit morphs).
  // Legacy callers without a real frame keep the PNG billboard fallback.
  const useSkinnedHuman = !!props.frame;
  return (
    <>
      <CameraRig camera={props.camera} />
      <StudioRoom lighting={props.lighting} teacherId={props.teacherId} />
      <SmartBoard lines={props.boardLines} screenElement={props.screenElement} />
      {useSkinnedHuman ? (
        <SkinnedDigitalHuman
          teacherId={props.teacherId}
          frame={props.frame ?? null}
          walkOffset={props.walkOffset}
        />
      ) : (
        <PhotorealTeacher
          teacherId={props.teacherId}
          pose={props.pose}
          speaking={props.speaking || !!frame.speaking}
          mouthEnergy={props.mouthEnergy || frame.jawOpen || 0}
          walkOffset={props.walkOffset}
          lookYaw={props.lookYaw ?? frame.head?.yaw ?? 0}
          lookPitch={props.lookPitch ?? frame.head?.pitch ?? 0}
        />
      )}
      <LessonProps
        props={props.props}
        focusTarget={props.focusTarget}
        screenElement={props.screenElement}
      />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={12} blur={2.8} far={4} />
      <Environment preset="apartment" environmentIntensity={0.55} />
      {props.celebrating && (
        <pointLight position={[-1.4, 2.4, 1]} intensity={2} color="#ffd84a" />
      )}
    </>
  );
}

export function TeachingStudio3D(props: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        background: "radial-gradient(circle at 50% 20%, #152033 0%, #070b14 65%)",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.05, 5.6], fov: 40, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <Suspense fallback={null}>
          <SceneBody {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Human Engine — independent digital-human performance layer.
 * Schema: success-os.human-engine.v1
 *
 * Separate from Three.js Teaching Studio (phase 1 set).
 * Pluggable to MetaHuman / HeyGen / any pro DH via DigitalHumanAdapter.
 * Performance is generated from lesson content — not canned motion loops.
 */

export type HumanEngineSchema = "success-os.human-engine.v1";

export type HumanCharacterId = "sara" | "ali" | string;

export type AdapterId =
  | "local_photoreal_preview"
  | "metahuman"
  | "heygen"
  | "tavus"
  | string;

export type AdapterStatus = "live" | "stub" | "needs_credentials" | "unavailable";

/** Arabic + Latin teaching phoneme inventory (coarse, provider-portable). */
export type PhonemeId =
  | "sil"
  | "AA"
  | "AE"
  | "AH"
  | "EH"
  | "IH"
  | "IY"
  | "OW"
  | "UH"
  | "UW"
  | "B"
  | "D"
  | "F"
  | "G"
  | "HH"
  | "K"
  | "L"
  | "M"
  | "N"
  | "P"
  | "R"
  | "S"
  | "SH"
  | "T"
  | "TH"
  | "V"
  | "W"
  | "Y"
  | "Z"
  | "CH"
  | "JH"
  | "NG"
  | "AR_AIN"
  | "AR_GHAIN"
  | "AR_QAF"
  | "AR_HAA"
  | "AR_KHA"
  | "AR_SAD"
  | "AR_DAD"
  | "AR_TAA"
  | "AR_ZAA";

export type BlendShapeId =
  | "jawOpen"
  | "mouthClose"
  | "mouthFunnel"
  | "mouthPucker"
  | "mouthSmileLeft"
  | "mouthSmileRight"
  | "mouthFrownLeft"
  | "mouthFrownRight"
  | "eyeBlinkLeft"
  | "eyeBlinkRight"
  | "eyeLookUp"
  | "eyeLookDown"
  | "eyeLookInLeft"
  | "eyeLookOutLeft"
  | "eyeLookInRight"
  | "eyeLookOutRight"
  | "browInnerUp"
  | "browDownLeft"
  | "browDownRight"
  | "cheekSquintLeft"
  | "cheekSquintRight"
  | "noseSneerLeft"
  | "noseSneerRight";

export type BoneId =
  | "root"
  | "hips"
  | "spine"
  | "chest"
  | "neck"
  | "head"
  | "shoulder_l"
  | "upper_arm_l"
  | "lower_arm_l"
  | "hand_l"
  | "shoulder_r"
  | "upper_arm_r"
  | "lower_arm_r"
  | "hand_r"
  | "thigh_l"
  | "shin_l"
  | "foot_l"
  | "thigh_r"
  | "shin_r"
  | "foot_r";

export type EmotionId =
  | "neutral"
  | "warm"
  | "curious"
  | "focused"
  | "encouraging"
  | "celebratory"
  | "patient"
  | "serious";

export type GestureIntent =
  | "idle_breathe"
  | "open_explain"
  | "point_board"
  | "write_board"
  | "draw_curve"
  | "count_on_fingers"
  | "invite_answer"
  | "think_pause"
  | "affirm_nod"
  | "encourage"
  | "turn_to_board"
  | "turn_to_student"
  | "hold_prop"
  | "hold_model"
  | "rotate_model"
  | "zoom_in_model"
  | "zoom_out_model"
  | "manipulate_experiment"
  | "walk_step"
  | "emphasize";

export type LocomotionIntent =
  | "stand"
  | "walk_in"
  | "step_to_board"
  | "step_to_prop"
  | "step_to_student";

/** What the teacher is doing with lesson content this sentence. */
export type ContentAct =
  | "greet_hook"
  | "explain_concept"
  | "point_content"
  | "write_board"
  | "write_law"
  | "draw_diagram"
  | "run_experiment"
  | "show_model"
  | "hold_model"
  | "rotate_model"
  | "zoom_in_model"
  | "zoom_out_model"
  | "count_sequence"
  | "ask_check"
  | "celebrate";

export type ScreenElementKind =
  | "title"
  | "note"
  | "equation"
  | "law"
  | "diagram"
  | "experiment"
  | "model_3d"
  | "number"
  | "question"
  | "highlight"
  | "banner";

export type ScreenElement = {
  id: string;
  kind: ScreenElementKind;
  label: string;
  detail?: string;
  transform: { x: number; y: number; scale: number; rotateY: number };
  emphasis: number;
  /** 0–1 draw progress for diagram strokes */
  strokeProgress?: number;
  experimentPhase?: "setup" | "active" | "result";
};

export type CameraShot =
  | "wide_establishing"
  | "medium_teacher"
  | "close_face"
  | "over_shoulder_board"
  | "board_insert"
  | "prop_orbit"
  | "two_shot";

export type LightPreset =
  | "soft_classroom"
  | "key_fill_rim"
  | "warm_encourage"
  | "cool_focus"
  | "board_accent"
  | "closeup_beauty"
  | "model_spotlight"
  | "experiment_practical";

export type BehaviourGoal =
  | "hook"
  | "explain"
  | "demonstrate"
  | "check"
  | "encourage"
  | "remediate"
  | "close";

export type LessonBlockKind =
  | "hook"
  | "explain"
  | "example"
  | "practice"
  | "check"
  | "encourage"
  | "close";

export type HumanLessonBlock = {
  id: string;
  kind: LessonBlockKind;
  text: string;
  textAr?: string;
  focusTarget?: "student" | "board" | "prop" | "self";
};

export type HumanLessonInput = {
  lessonId: string;
  title: string;
  titleAr?: string;
  subject?: string;
  grade?: string;
  language?: "ar" | "en" | "bilingual";
  preferredCharacterId?: HumanCharacterId;
  blocks: HumanLessonBlock[];
  durationMs?: number;
};

export type CharacterSpec = {
  id: HumanCharacterId;
  displayName: { en: string; ar: string };
  gender: "female" | "male";
  locale: string;
  voiceId: string;
  /** Provider-agnostic appearance keys — MetaHuman mesh id later. */
  appearance: {
    skinTone: string;
    hairStyle: string;
    outfit: string;
    ageBand: "adult_young" | "adult";
    photorealAssetRoot: string;
  };
  skeletonPreset: "adult_teaching_a_pose";
  facialRigPreset: "ar_teaching_v1";
  defaultEmotion: EmotionId;
};

export type PhonemeKeyframe = {
  tMs: number;
  phoneme: PhonemeId;
  weight: number;
};

export type BlendShapeKeyframe = {
  tMs: number;
  shapes: Partial<Record<BlendShapeId, number>>;
};

export type BonePose = {
  bone: BoneId;
  /** Euler degrees — adapter maps to quaternions / MetaHuman. */
  rot: [number, number, number];
  pos?: [number, number, number];
};

export type SkeletonKeyframe = {
  tMs: number;
  bones: BonePose[];
};

export type GazeTarget = "student" | "board" | "prop" | "notes" | "away_soft";

export type EyeKeyframe = {
  tMs: number;
  target: GazeTarget;
  blink?: number;
  saccadeAmp?: number;
};

export type HeadKeyframe = {
  tMs: number;
  yaw: number;
  pitch: number;
  roll: number;
};

export type EmotionKeyframe = {
  tMs: number;
  emotion: EmotionId;
  intensity: number;
};

export type GestureKeyframe = {
  tMs: number;
  durationMs: number;
  intent: GestureIntent;
  seed: number;
};

export type CameraKeyframe = {
  tMs: number;
  shot: CameraShot;
  easeMs: number;
};

export type LightKeyframe = {
  tMs: number;
  preset: LightPreset;
  intensity: number;
};

export type BehaviourBeat = {
  tMs: number;
  goal: BehaviourGoal;
  reason: string;
  blockId: string;
};

export type LocomotionKeyframe = {
  tMs: number;
  durationMs: number;
  intent: LocomotionIntent;
  seed: number;
};

export type ScreenKeyframe = {
  tMs: number;
  endMs: number;
  element: ScreenElement;
  contentAct: ContentAct;
};

/** Full per-sentence package — generated from meaning, not a clip library. */
export type SentencePerformance = {
  sentenceId: string;
  text: string;
  contentAct: ContentAct;
  emotion: EmotionId;
  emotionIntensity: number;
  gesture: GestureIntent;
  gaze: GazeTarget;
  locomotion: LocomotionIntent;
  head: { yaw: number; pitch: number; roll: number };
  camera: CameraShot;
  lighting: LightPreset;
  lightIntensity: number;
  screen: ScreenElement;
  behaviourGoal: BehaviourGoal;
  seed: number;
  reason: string;
};

export type TimelineTrack<T> = {
  name: string;
  keys: T[];
};

export type AnimationTimeline = {
  schema: "success-os.human-engine.timeline.v1";
  durationMs: number;
  fps: number;
  skeleton: TimelineTrack<SkeletonKeyframe>;
  facial: TimelineTrack<BlendShapeKeyframe>;
  lipSync: TimelineTrack<PhonemeKeyframe>;
  eyes: TimelineTrack<EyeKeyframe>;
  head: TimelineTrack<HeadKeyframe>;
  emotion: TimelineTrack<EmotionKeyframe>;
  gesture: TimelineTrack<GestureKeyframe>;
  locomotion: TimelineTrack<LocomotionKeyframe>;
  camera: TimelineTrack<CameraKeyframe>;
  lighting: TimelineTrack<LightKeyframe>;
  behaviour: TimelineTrack<BehaviourBeat>;
  screen: TimelineTrack<ScreenKeyframe>;
};

export type HumanPerformancePlan = {
  schema: HumanEngineSchema;
  version: string;
  planId: string;
  lessonId: string;
  character: CharacterSpec;
  adapter: {
    id: AdapterId;
    status: AdapterStatus;
    notes: string[];
  };
  timeline: AnimationTimeline;
  /** Ordered sentence performances — primary content→motion contract. */
  sentences: Array<
    SentencePerformance & {
      blockId: string;
      startMs: number;
      endMs: number;
      audioSrc?: string;
    }
  >;
  speech: {
    lines: Array<{
      blockId: string;
      text: string;
      startMs: number;
      endMs: number;
      audioSrc?: string;
      sentenceId?: string;
      contentAct?: ContentAct;
    }>;
  };
  createdAt: string;
};

/** Sampled frame for any adapter to apply. */
export type HumanFrameSample = {
  tMs: number;
  characterId: HumanCharacterId;
  phoneme: PhonemeId;
  jawOpen: number;
  mouthShapes: Partial<Record<BlendShapeId, number>>;
  emotion: EmotionId;
  emotionIntensity: number;
  gesture: GestureIntent;
  locomotion: LocomotionIntent;
  gaze: GazeTarget;
  head: { yaw: number; pitch: number; roll: number };
  bones: BonePose[];
  camera: CameraShot;
  lighting: LightPreset;
  lightIntensity: number;
  behaviourGoal: BehaviourGoal;
  contentAct: ContentAct | null;
  screen: ScreenElement | null;
  speaking: boolean;
  lineText: string | null;
  sentenceId: string | null;
};

export type DigitalHumanAdapter = {
  id: AdapterId;
  status: AdapterStatus;
  capabilities: string[];
  notes: string[];
  /** Bind plan before playback. */
  load(plan: HumanPerformancePlan): Promise<void> | void;
  /** Apply one sampled frame. */
  applyFrame(frame: HumanFrameSample): void;
  /** Optional teardown. */
  dispose?(): void;
};

export type HumanEnginePreviewMode = {
  durationMs: 10000;
  characters: HumanCharacterId[];
  adapterId: AdapterId;
};

/**
 * Facial Rig — maps emotion + phoneme drive into facial control channels.
 */
import type { EmotionId, PhonemeId } from "@/types/human-engine";

export type FacialChannels = {
  browInnerUp: number;
  browDown: number;
  smile: number;
  frown: number;
  cheekSquint: number;
  eyeWiden: number;
};

const EMOTION_BASE: Record<EmotionId, FacialChannels> = {
  neutral: { browInnerUp: 0.05, browDown: 0.05, smile: 0.08, frown: 0, cheekSquint: 0, eyeWiden: 0.1 },
  warm: { browInnerUp: 0.15, browDown: 0, smile: 0.45, frown: 0, cheekSquint: 0.2, eyeWiden: 0.15 },
  curious: { browInnerUp: 0.55, browDown: 0, smile: 0.12, frown: 0, cheekSquint: 0, eyeWiden: 0.35 },
  focused: { browInnerUp: 0.05, browDown: 0.35, smile: 0.05, frown: 0.05, cheekSquint: 0.1, eyeWiden: 0.05 },
  encouraging: { browInnerUp: 0.25, browDown: 0, smile: 0.55, frown: 0, cheekSquint: 0.3, eyeWiden: 0.2 },
  celebratory: { browInnerUp: 0.4, browDown: 0, smile: 0.75, frown: 0, cheekSquint: 0.45, eyeWiden: 0.3 },
  patient: { browInnerUp: 0.1, browDown: 0, smile: 0.25, frown: 0, cheekSquint: 0.1, eyeWiden: 0.1 },
  serious: { browInnerUp: 0, browDown: 0.45, smile: 0, frown: 0.2, cheekSquint: 0.05, eyeWiden: 0 },
};

export function facialFromEmotion(emotion: EmotionId, intensity: number): FacialChannels {
  const base = EMOTION_BASE[emotion] || EMOTION_BASE.neutral;
  const i = Math.min(1, Math.max(0, intensity));
  return {
    browInnerUp: base.browInnerUp * i,
    browDown: base.browDown * i,
    smile: base.smile * i,
    frown: base.frown * i,
    cheekSquint: base.cheekSquint * i,
    eyeWiden: base.eyeWiden * i,
  };
}

/** Viseme openness hint for facial micro-motion (blendshapes own the mouth). */
export function facialSpeechMicro(phoneme: PhonemeId): number {
  if (phoneme === "sil") return 0;
  if (["AA", "AE", "AH", "OW", "UW"].includes(phoneme)) return 0.35;
  if (["B", "M", "P"].includes(phoneme)) return 0.05;
  return 0.18;
}

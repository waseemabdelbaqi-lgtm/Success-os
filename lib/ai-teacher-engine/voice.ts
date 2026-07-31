/**
 * Voice Teacher — architecture-ready contract (no TTS/STT implementation).
 */
import type { VoiceSessionContract } from "@/types/ai-teacher-engine";

export function getVoiceSessionContract(enabled = true): VoiceSessionContract {
  return {
    schema: "success-os.ate-voice.v1",
    enabled,
    naturalConversation: true,
    interruptible: true,
    pauseable: true,
    continuable: true,
    multiVoice: true,
    implementationStatus: "ready_architecture",
    notes: [
      "Student can interrupt; teacher can pause and continue naturally.",
      "Different voices will be supported.",
      "No avatar or live classroom implementation in PR #55.",
    ],
  };
}

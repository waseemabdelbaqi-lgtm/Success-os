/**
 * Digital Human presence + live teaching contracts (architecture only).
 */
import type {
  DigitalHumanPresenceContract,
  LiveTeachingAction,
  TeacherPresenceCapability,
} from "@/types/ai-digital-human-teacher";

export const TEACHER_PRESENCE_CAPABILITIES: TeacherPresenceCapability[] = [
  "speak_naturally",
  "listen_naturally",
  "understand_interruptions",
  "maintain_eye_contact",
  "facial_expressions",
  "hand_gestures",
  "point_to_diagrams",
  "write_on_whiteboard",
  "educational_emotional_reaction",
  "step_by_step_explain",
  "realtime_adaptation",
];

export const LIVE_TEACHING_ACTIONS: LiveTeachingAction[] = [
  "explain",
  "draw",
  "highlight",
  "animate",
  "demonstrate",
  "ask_questions",
  "generate_exercises",
  "correct_mistakes",
  "give_hints",
  "encourage",
  "recommend_review_lessons",
  "recommend_videos",
  "recommend_digital_books",
];

export function getDigitalHumanPresenceContract(): DigitalHumanPresenceContract {
  return {
    schema: "success-os.adht-presence.v1",
    capabilities: [...TEACHER_PRESENCE_CAPABILITIES],
    voiceConversation: {
      microphoneOnly: true,
      autoDetectLanguage: true,
      replyInStudentLanguage: true,
      instantLanguageSwitch: true,
      accentTolerance: true,
      interruptible: true,
      continueAfterInterrupt: true,
    },
    multimodalKinds: [
      "text",
      "voice",
      "image",
      "screenshot",
      "homework_photo",
      "pdf",
      "handwritten_solution",
      "video_conversation",
      "live_whiteboard",
    ],
    futureKinds: ["live_camera", "virtual_laboratory", "ar_vr"],
    liveTeachingActions: [...LIVE_TEACHING_ACTIONS],
    implementationStatus: "architecture_ready",
    shipsLiveAvatarVideo: false,
    shipsLiveTtsStt: false,
  };
}

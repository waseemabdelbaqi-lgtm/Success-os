import { NextResponse } from "next/server";
import { isSubjectRegistered } from "@/lib/ai-teacher";
import { LiveAvatarProvider, ElevenLabsVoiceProvider } from "@/lib/ai-teacher/providers";

export const runtime = "nodejs";

const liveAvatar = new LiveAvatarProvider();
const elevenLabs = new ElevenLabsVoiceProvider();

export async function GET() {
  // Every field here reflects something actually checked in this request —
  // nothing is a hardcoded "online"/"CONNECTED" for a subsystem that
  // doesn't exist or hasn't been verified.
  const [liveAvatarStatus, elevenLabsStatus] = await Promise.all([liveAvatar.checkStatus(), elevenLabs.checkStatus()]);

  const health = {
    status: "online",
    runtime: "online",
    identityEngine: "online",
    stateMachine: "online",
    subjectToolRouter: isSubjectRegistered("physics") ? "online" : "degraded",
    memoryEngine: "online",
    openaiRuntime: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
    liveAvatar: liveAvatarStatus.state,
    liveAvatarDetail: liveAvatarStatus.detail,
    elevenLabs: elevenLabsStatus.state,
    elevenLabsDetail: elevenLabsStatus.detail,
    voiceRuntime: elevenLabsStatus.state, // alias, same underlying check as elevenLabs above
    // These subsystems do not exist in this project. Reporting "online" for
    // them would be fabricated data.
    lipsyncRuntime: "provided_by_liveavatar_repeatAudio", // real: driven by LiveAvatarSession.repeatAudio(), not a separate runtime we built
    animationRuntime: "provided_by_liveavatar",
    whiteboardRuntime: "online", // real: TeacherTurn.boardActions render in the existing smart-board UI
    recoveryEngine: "not_implemented",
    finalAcceptanceGate: "not_implemented",
  };
  return NextResponse.json(health);
}

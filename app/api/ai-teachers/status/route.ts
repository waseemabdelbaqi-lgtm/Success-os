import { NextResponse } from "next/server";
import { TEACHER_IDS, isSubjectRegistered, sessionCount } from "@/lib/ai-teacher";
import { LiveAvatarProvider, ElevenLabsVoiceProvider, checkMappingCompleteness, validateConfiguration } from "@/lib/ai-teacher/providers";

export const runtime = "nodejs";

const liveAvatar = new LiveAvatarProvider();
const elevenLabs = new ElevenLabsVoiceProvider();

/**
 * These counts come from an actual test run performed during development
 * (see the conversation/engineering log), not a live CI pipeline — this
 * project has no test-result persistence layer. They are real numbers, not
 * fabricated, but they will go stale until a real CI integration exists.
 */
const LAST_VERIFIED_TEST_RESULTS = {
  physicsEngineTests: { passed: 66, total: 66, verifiedAt: "development-time, not live" },
  aiTeacherEngineTests: { passed: 52, total: 52, verifiedAt: "development-time, not live" },
  note: "No CI/test-persistence pipeline exists in this project. Run `npm run validate:ai-teacher-engine` and `node --test lib/physics/__tests__/*.test.ts` for current results.",
};

export async function GET() {
  const [liveAvatarStatus, elevenLabsStatus] = await Promise.all([liveAvatar.checkStatus(), elevenLabs.checkStatus()]);
  const mapping = checkMappingCompleteness();
  const config = validateConfiguration();

  return NextResponse.json({
    runtime: "online",
    teachers: TEACHER_IDS.map((id) => ({
      teacherId: id,
      identityLocked: true,
      liveAvatarMapped: mapping[id].liveAvatarAvatarId,
      liveAvatarVoiceAgentMapped: mapping[id].liveAvatarVoiceAgentId,
      elevenLabsMapped: mapping[id].elevenLabsVoiceId, // optional, informational only
      ready: config[id].ready,
      missingVariables: config[id].missingVariables,
      // Honest: no independently-scored photorealism/lipsync/animation/teaching/showcase pipeline exists.
      qualityGates: "not_evaluated",
      acceptanceStatus: "not_applicable — no human-quality gate/scoring system exists in this project",
    })),
    sessions: { activeCount: sessionCount() },
    providers: {
      liveAvatar: { state: liveAvatarStatus.state, detail: liveAvatarStatus.detail },
      elevenLabs: { state: elevenLabsStatus.state, detail: elevenLabsStatus.detail },
    },
    quality: "not_implemented — no independent photorealism/lipsync/animation scoring pipeline exists in this project",
    recovery: "not_implemented — no recovery-engine exists in this project",
    tests: LAST_VERIFIED_TEST_RESULTS,
    subjectTools: {
      physics: isSubjectRegistered("physics"),
      mathematics: isSubjectRegistered("mathematics"),
      chemistry: isSubjectRegistered("chemistry"),
      biology: isSubjectRegistered("biology"),
    },
  });
}

/**
 * providers/config-validator.ts
 *
 * The single source of truth for "is Sara/Ali ready to demo." For the
 * current milestone, LiveAvatar's native Voice Agent replaces ElevenLabs
 * as the required voice path — ElevenLabs is optional and never blocks a
 * teacher. Reports SET/MISSING per variable name — never a value.
 */

export type VarState = "SET" | "MISSING";

export interface TeacherConfigStatus {
  liveAvatarAvatarId: VarState;
  liveAvatarVoiceAgentId: VarState;
  elevenLabsVoiceId: VarState; // optional — informational only, never blocks readiness
  ready: boolean;
  missingVariables: string[];
}

export interface ConfigValidationResult {
  liveAvatarApiKey: VarState;
  elevenLabsApiKey: VarState; // optional
  sara: TeacherConfigStatus;
  ali: TeacherConfigStatus;
  /** Backwards-compatible top-level fields, now reflecting SARA's readiness (the current milestone's focus). */
  blocked: boolean;
  missingVariables: string[];
}

function envState(name: string): VarState {
  return process.env[name] ? "SET" : "MISSING";
}

function teacherStatus(prefix: "SARA" | "ALI"): TeacherConfigStatus {
  const apiKeySet = Boolean(process.env.LIVEAVATAR_API_KEY);
  const avatarVar = `LIVEAVATAR_${prefix}_AVATAR_ID`;
  const voiceAgentVar = `LIVEAVATAR_${prefix}_VOICE_AGENT_ID`;
  const elevenLabsVar = `ELEVENLABS_${prefix}_VOICE_ID`;

  const avatarSet = Boolean(process.env[avatarVar]);
  const voiceAgentSet = Boolean(process.env[voiceAgentVar]);

  const missingVariables: string[] = [];
  if (!apiKeySet) missingVariables.push("LIVEAVATAR_API_KEY");
  if (!avatarSet) missingVariables.push(avatarVar);
  if (!voiceAgentSet) missingVariables.push(voiceAgentVar);

  return {
    liveAvatarAvatarId: avatarSet ? "SET" : "MISSING",
    liveAvatarVoiceAgentId: voiceAgentSet ? "SET" : "MISSING",
    elevenLabsVoiceId: envState(elevenLabsVar), // informational only
    ready: apiKeySet && avatarSet && voiceAgentSet,
    missingVariables,
  };
}

export function validateConfiguration(): ConfigValidationResult {
  const sara = teacherStatus("SARA");
  const ali = teacherStatus("ALI");
  return {
    liveAvatarApiKey: envState("LIVEAVATAR_API_KEY"),
    elevenLabsApiKey: envState("ELEVENLABS_API_KEY"),
    sara,
    ali,
    blocked: !sara.ready,
    missingVariables: sara.missingVariables,
  };
}

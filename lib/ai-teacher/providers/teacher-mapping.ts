/**
 * providers/teacher-mapping.ts
 *
 * Maps Sara/Ali to their provider-specific resource IDs via environment
 * variables. Renaming or reconfiguring a provider must never rename the
 * teacher — this file is the only place that mapping is read.
 *
 * Sara's first working milestone uses LiveAvatar's own native Voice Agent
 * (FULL mode: avatar_persona.voice_id) instead of ElevenLabs, so
 * ElevenLabs is now OPTIONAL — a teacher is considered ready without it.
 */

import type { TeacherId } from "../teacher-identity.ts";

export interface TeacherProviderMapping {
  liveAvatarAvatarId: string | undefined;
  /** LiveAvatar's own native voice/agent id, used as avatar_persona.voice_id in a FULL-mode session. Required for the current milestone. */
  liveAvatarVoiceAgentId: string | undefined;
  /** Optional — only used if the ElevenLabs-audio path (repeatAudio) is deliberately chosen instead of LiveAvatar's own voice. */
  elevenLabsVoiceId: string | undefined;
}

export function getTeacherMapping(teacherId: TeacherId): TeacherProviderMapping {
  if (teacherId === "sara") {
    return {
      liveAvatarAvatarId: process.env.LIVEAVATAR_SARA_AVATAR_ID,
      liveAvatarVoiceAgentId: process.env.LIVEAVATAR_SARA_VOICE_AGENT_ID,
      elevenLabsVoiceId: process.env.ELEVENLABS_SARA_VOICE_ID,
    };
  }
  return {
    liveAvatarAvatarId: process.env.LIVEAVATAR_ALI_AVATAR_ID,
    liveAvatarVoiceAgentId: process.env.LIVEAVATAR_ALI_VOICE_AGENT_ID,
    elevenLabsVoiceId: process.env.ELEVENLABS_ALI_VOICE_ID,
  };
}

export interface MappingCompleteness {
  liveAvatarApiKey: boolean;
  elevenLabsApiKey: boolean;
  sara: { liveAvatarAvatarId: boolean; liveAvatarVoiceAgentId: boolean; elevenLabsVoiceId: boolean };
  ali: { liveAvatarAvatarId: boolean; liveAvatarVoiceAgentId: boolean; elevenLabsVoiceId: boolean };
}

/** Reports which required env vars are present, WITHOUT ever returning their values. */
export function checkMappingCompleteness(): MappingCompleteness {
  const sara = getTeacherMapping("sara");
  const ali = getTeacherMapping("ali");
  return {
    liveAvatarApiKey: Boolean(process.env.LIVEAVATAR_API_KEY),
    elevenLabsApiKey: Boolean(process.env.ELEVENLABS_API_KEY),
    sara: {
      liveAvatarAvatarId: Boolean(sara.liveAvatarAvatarId),
      liveAvatarVoiceAgentId: Boolean(sara.liveAvatarVoiceAgentId),
      elevenLabsVoiceId: Boolean(sara.elevenLabsVoiceId),
    },
    ali: {
      liveAvatarAvatarId: Boolean(ali.liveAvatarAvatarId),
      liveAvatarVoiceAgentId: Boolean(ali.liveAvatarVoiceAgentId),
      elevenLabsVoiceId: Boolean(ali.elevenLabsVoiceId),
    },
  };
}

/** A teacher is ready for the current milestone once LiveAvatar (API key + avatar + native voice agent) is configured — ElevenLabs is optional. */
export function isTeacherReady(teacherId: TeacherId): boolean {
  const mapping = getTeacherMapping(teacherId);
  return Boolean(process.env.LIVEAVATAR_API_KEY) && Boolean(mapping.liveAvatarAvatarId) && Boolean(mapping.liveAvatarVoiceAgentId);
}

export function missingVariablesForTeacher(teacherId: TeacherId): string[] {
  const missing: string[] = [];
  if (!process.env.LIVEAVATAR_API_KEY) missing.push("LIVEAVATAR_API_KEY");
  const mapping = getTeacherMapping(teacherId);
  const prefix = teacherId.toUpperCase();
  if (!mapping.liveAvatarAvatarId) missing.push(`LIVEAVATAR_${prefix}_AVATAR_ID`);
  if (!mapping.liveAvatarVoiceAgentId) missing.push(`LIVEAVATAR_${prefix}_VOICE_AGENT_ID`);
  return missing;
}

/**
 * providers/liveavatar-provider.ts
 *
 * Real LiveAvatar (HeyGen) integration (https://docs.liveavatar.com).
 * Server-side only — LIVEAVATAR_API_KEY never leaves this module.
 *
 * Verified against LiveAvatar's current FULL Mode documentation and the
 * published @heygen/liveavatar-web-sdk (v0.0.18) type definitions:
 *   POST https://api.liveavatar.com/v1/sessions/token
 *   header: X-API-KEY
 *   body: { mode: "FULL", avatar_id, avatar_persona: { voice_id, language } }
 *   -> { data: { session_token } }
 *
 * "voice_id" here is LiveAvatar's own native voice/agent id (what the
 * product calls a "Voice Agent") — FULL mode uses it for real-time TTS
 * without requiring a separate ElevenLabs integration. context_id is
 * omitted since it's optional and not part of the current milestone's
 * required configuration.
 *
 * The returned session_token is short-lived and safe to hand to the
 * browser: the client SDK's SessionAPIClient/LiveAvatarSession classes call
 * /v1/sessions/start and /v1/sessions/stop using ONLY that token, never the
 * permanent API key.
 */

import type { TeacherId } from "../teacher-identity.ts";
import type { DigitalHumanProvider, ProviderStatus } from "./types.ts";
import { getTeacherMapping } from "./teacher-mapping.ts";

const LIVEAVATAR_API_BASE = "https://api.liveavatar.com";

interface TokenResponse {
  data?: { session_token?: string };
}

export class LiveAvatarProvider implements DigitalHumanProvider {
  readonly name = "LiveAvatar";

  async createSessionToken(teacherId: TeacherId, languageHint: "ar" | "en" = "ar"): Promise<{ sessionToken: string }> {
    const apiKey = process.env.LIVEAVATAR_API_KEY;
    if (!apiKey) {
      throw new Error("LiveAvatar provider error: LIVEAVATAR_API_KEY is not configured.");
    }
    const { liveAvatarAvatarId, liveAvatarVoiceAgentId } = getTeacherMapping(teacherId);
    if (!liveAvatarAvatarId) {
      throw new Error(`LiveAvatar provider error: no avatar id mapped for teacher "${teacherId}". Set LIVEAVATAR_${teacherId.toUpperCase()}_AVATAR_ID.`);
    }
    if (!liveAvatarVoiceAgentId) {
      throw new Error(`LiveAvatar provider error: no voice agent id mapped for teacher "${teacherId}". Set LIVEAVATAR_${teacherId.toUpperCase()}_VOICE_AGENT_ID.`);
    }

    const response = await fetch(`${LIVEAVATAR_API_BASE}/v1/sessions/token`, {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: liveAvatarAvatarId,
        avatar_persona: {
          voice_id: liveAvatarVoiceAgentId,
          language: languageHint,
        },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(`LiveAvatar provider error: token request failed with status ${response.status}. ${bodyText.slice(0, 300)}`);
    }

    const payload = (await response.json()) as TokenResponse;
    const sessionToken = payload.data?.session_token;
    if (!sessionToken) {
      throw new Error("LiveAvatar provider error: token response did not include data.session_token.");
    }
    return { sessionToken };
  }

  async checkStatus(): Promise<ProviderStatus> {
    const apiKey = process.env.LIVEAVATAR_API_KEY;
    const saraReady = Boolean(process.env.LIVEAVATAR_SARA_AVATAR_ID) && Boolean(process.env.LIVEAVATAR_SARA_VOICE_AGENT_ID);
    if (!apiKey || !saraReady) {
      return {
        state: "NOT_CONFIGURED",
        detail: !apiKey
          ? "LIVEAVATAR_API_KEY is not set."
          : "LIVEAVATAR_SARA_AVATAR_ID / LIVEAVATAR_SARA_VOICE_AGENT_ID are not both set.",
      };
    }
    try {
      // Minting an unused, short-lived token is the same real endpoint the
      // app uses for real sessions — no separate "ping" endpoint is assumed.
      await this.createSessionToken("sara");
      return { state: "CONNECTED", detail: "LIVEAVATAR_API_KEY validated by successfully minting a FULL-mode session token for Sara's avatar + voice agent." };
    } catch (error) {
      return { state: "ERROR", detail: error instanceof Error ? error.message : "Unknown network error contacting LiveAvatar." };
    }
  }
}

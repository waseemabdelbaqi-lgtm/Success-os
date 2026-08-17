/**
 * providers/elevenlabs-voice-provider.ts
 *
 * Real ElevenLabs integration (https://elevenlabs.io/docs/api-reference).
 * Server-side only — ELEVENLABS_API_KEY never leaves this module. Endpoint
 * and header names verified against ElevenLabs' current documentation:
 *   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
 *   header: xi-api-key
 *   body: { text, model_id }
 *
 * NOTE ON LATENCY: this implementation fully buffers the streamed response
 * before returning it as one base64 payload to the caller (see synthesize()
 * below), because the current /api/ai-teacher route contract returns one
 * JSON response per turn. That means today's integration gets ElevenLabs'
 * fast time-to-first-byte on their end, but not true low-latency streaming
 * all the way to the browser. Piping true incremental audio to the client
 * (e.g. via a streamed HTTP response or WebSocket) is a real follow-up
 * improvement, not implemented here — flagged honestly rather than implied.
 */

import type { TeacherId } from "../teacher-identity.ts";
import type { VoiceProvider, ProviderStatus } from "./types.ts";
import { getTeacherMapping } from "./teacher-mapping.ts";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io";

// eleven_flash_v2_5: ~75ms latency, 32-language support (includes Arabic + English).
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // btoa is available in both edge/worker and Node 18+ runtimes.
  return btoa(binary);
}

export class ElevenLabsVoiceProvider implements VoiceProvider {
  readonly name = "ElevenLabs";

  async synthesize(teacherId: TeacherId, text: string, languageHint?: "ar" | "en"): Promise<{ audioBase64: string; mimeType: string }> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ElevenLabs voice provider error: ELEVENLABS_API_KEY is not configured.");
    }
    const { elevenLabsVoiceId } = getTeacherMapping(teacherId);
    if (!elevenLabsVoiceId) {
      throw new Error(`ElevenLabs voice provider error: no voice id mapped for teacher "${teacherId}". Set ELEVENLABS_${teacherId.toUpperCase()}_VOICE_ID.`);
    }
    if (!text.trim()) {
      throw new Error("ElevenLabs voice provider error: text must not be empty.");
    }

    const response = await fetch(`${ELEVENLABS_API_BASE}/v1/text-to-speech/${elevenLabsVoiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_MODEL_ID,
        ...(languageHint ? { language_code: languageHint } : {}),
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new Error(`ElevenLabs voice provider error: request failed with status ${response.status}. ${bodyText.slice(0, 300)}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return { audioBase64: arrayBufferToBase64(audioBuffer), mimeType: "audio/mpeg" };
  }

  async checkStatus(): Promise<ProviderStatus> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return { state: "NOT_CONFIGURED", detail: "ELEVENLABS_API_KEY is not set." };
    try {
      // GET /v1/user is a cheap, well-documented way to validate a key without incurring TTS cost.
      const response = await fetch(`${ELEVENLABS_API_BASE}/v1/user`, { headers: { "xi-api-key": apiKey } });
      if (response.ok) return { state: "CONNECTED", detail: "ELEVENLABS_API_KEY validated against GET /v1/user." };
      return { state: "ERROR", detail: `GET /v1/user returned status ${response.status}.` };
    } catch (error) {
      return { state: "ERROR", detail: error instanceof Error ? error.message : "Unknown network error contacting ElevenLabs." };
    }
  }
}

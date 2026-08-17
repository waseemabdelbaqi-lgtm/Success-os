/**
 * providers/types.ts
 *
 * Provider-independent contracts. Sara and Ali are Success OS identities;
 * LiveAvatar/ElevenLabs (or any future replacement) are only renderers
 * behind these interfaces. The teaching orchestrator never imports a
 * concrete provider — only these types.
 */

import type { TeacherId } from "../teacher-identity.ts";

export type ProviderConnectionState = "NOT_CONFIGURED" | "CONNECTED" | "ERROR";

export interface ProviderStatus {
  state: ProviderConnectionState;
  detail: string;
}

/**
 * Server-side voice synthesis. Implementations must never expose the
 * underlying API key to the browser — callers get back audio bytes, not a
 * key or a direct third-party URL requiring the key.
 */
export interface VoiceProvider {
  readonly name: string;
  /** Synthesizes speech for a teacher's mapped voice. Returns base64-encoded audio and its MIME type. */
  synthesize(teacherId: TeacherId, text: string, languageHint?: "ar" | "en"): Promise<{ audioBase64: string; mimeType: string }>;
  /** Checks configuration/connectivity without exposing secrets. */
  checkStatus(): Promise<ProviderStatus>;
}

/**
 * Server-side session lifecycle for a real-time digital human avatar. The
 * actual audio/video rendering happens client-side (via the provider's own
 * client SDK) using the short-lived token this issues — the permanent
 * provider API key never leaves the server.
 */
export interface DigitalHumanProvider {
  readonly name: string;
  /** Mints a short-lived, browser-safe session token scoped to one teacher's mapped avatar + native voice. */
  createSessionToken(teacherId: TeacherId, languageHint?: "ar" | "en"): Promise<{ sessionToken: string }>;
  /** Checks configuration/connectivity without exposing secrets. */
  checkStatus(): Promise<ProviderStatus>;
}

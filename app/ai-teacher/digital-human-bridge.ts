"use client";

/**
 * digital-human-bridge.ts
 *
 * Browser-only. Wraps the real @heygen/liveavatar-web-sdk LiveAvatarSession
 * in FULL mode with LiveAvatar's own native Voice Agent (avatar_persona.
 * voice_id) — LIVEAVATAR_API_KEY never reaches this file, only a
 * short-lived session token from /api/ai-teacher/liveavatar-token.
 *
 * speak() uses session.repeat(text): LiveAvatar's own TTS speaks the exact
 * given text through the configured voice agent — no ElevenLabs round-trip
 * for this milestone. ElevenLabs remains available as an optional future
 * path but is not used here.
 *
 * Microphone input uses the SDK's real startListening()/stopListening()
 * plus the USER_TRANSCRIPTION event so the child's spoken answer reaches
 * our own teaching logic as text, rather than letting LiveAvatar's agent
 * freely improvise a response to it.
 */

export type DigitalHumanStatus = "idle" | "connecting" | "connected" | "not_configured" | "error";

export type DebugStage =
  | "session_token_requested" | "session_token_received"
  | "session_start" | "session_started"
  | "stream_attach"
  | "repeat_called"
  | "mic_listening_started" | "mic_listening_stopped"
  | "user_transcription" | "avatar_speak_started" | "avatar_speak_ended"
  | "session_stop" | "session_stopped";

export interface DebugEvent {
  stage: DebugStage | "error";
  teacherId: TeacherId;
  detail?: string;
  httpStatus?: number;
  errorStage?: string;
}

type TeacherId = "sara" | "ali";

type LiveAvatarSessionInstance = {
  start(): Promise<void>;
  stop(): Promise<void>;
  attach(element: HTMLMediaElement): void;
  repeat(text: string): string;
  repeatAudio(audioBase64: string): string;
  startListening(): string;
  stopListening(): string;
  on(event: string, callback: (...args: unknown[]) => void): unknown;
};

export class DigitalHumanBridge {
  private session: LiveAvatarSessionInstance | null = null;
  private readonly teacherId: TeacherId;
  private readonly onEvent: (event: DebugEvent) => void;
  private readonly onTranscript: (text: string) => void;

  constructor(teacherId: TeacherId, onEvent: (event: DebugEvent) => void = () => {}, onTranscript: (text: string) => void = () => {}) {
    this.teacherId = teacherId;
    this.onEvent = onEvent;
    this.onTranscript = onTranscript;
  }

  /** Connects to a real LiveAvatar FULL-mode session (avatar + native voice agent) and attaches its stream to the given video element. */
  async connect(videoEl: HTMLVideoElement, languageHint: "ar" | "en" = "ar"): Promise<DigitalHumanStatus> {
    this.onEvent({ stage: "session_token_requested", teacherId: this.teacherId });
    let tokenRes: Response;
    try {
      tokenRes = await fetch("/api/ai-teacher/liveavatar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: this.teacherId, languageHint }),
      });
    } catch (err) {
      this.onEvent({ stage: "error", teacherId: this.teacherId, errorStage: "session_token_requested", detail: err instanceof Error ? err.message : "Network error contacting our own server." });
      return "error";
    }
    if (tokenRes.status === 503) {
      const body = await tokenRes.json().catch(() => ({}));
      this.onEvent({ stage: "error", teacherId: this.teacherId, errorStage: "session_token_requested", httpStatus: 503, detail: body.error ?? "LiveAvatar not configured." });
      return "not_configured";
    }
    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      this.onEvent({ stage: "error", teacherId: this.teacherId, errorStage: "session_token_requested", httpStatus: tokenRes.status, detail: body.error ?? "Unknown error." });
      return "error";
    }
    const { sessionToken } = await tokenRes.json();
    this.onEvent({ stage: "session_token_received", teacherId: this.teacherId });

    try {
      this.onEvent({ stage: "session_start", teacherId: this.teacherId });
      const { LiveAvatarSession, AgentEventsEnum } = await import("@heygen/liveavatar-web-sdk");
      const session = new LiveAvatarSession(sessionToken) as unknown as LiveAvatarSessionInstance;

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => this.onEvent({ stage: "avatar_speak_started", teacherId: this.teacherId }));
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => this.onEvent({ stage: "avatar_speak_ended", teacherId: this.teacherId }));
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (...args: unknown[]) => {
        const event = args[0] as { text?: string } | undefined;
        const text = event?.text ?? "";
        this.onEvent({ stage: "user_transcription", teacherId: this.teacherId, detail: text });
        if (text) this.onTranscript(text);
      });

      await session.start();
      this.onEvent({ stage: "session_started", teacherId: this.teacherId });
      session.attach(videoEl);
      this.onEvent({ stage: "stream_attach", teacherId: this.teacherId });
      this.session = session;
      return "connected";
    } catch (err) {
      this.onEvent({ stage: "error", teacherId: this.teacherId, errorStage: "session_start", detail: err instanceof Error ? err.message : "Unknown LiveAvatar SDK error." });
      return "error";
    }
  }

  /**
   * Has the connected avatar speak the given text through LiveAvatar's own
   * native voice agent (session.repeat) — no external TTS round-trip.
   */
  speak(text: string): void {
    if (!this.session) return;
    this.session.repeat(text);
    this.onEvent({ stage: "repeat_called", teacherId: this.teacherId, detail: text.slice(0, 80) });
  }

  /** Starts real microphone capture via the SDK; recognized speech arrives through the USER_TRANSCRIPTION event (see connect()). */
  startListening(): void {
    if (!this.session) return;
    this.session.startListening();
    this.onEvent({ stage: "mic_listening_started", teacherId: this.teacherId });
  }

  stopListening(): void {
    if (!this.session) return;
    this.session.stopListening();
    this.onEvent({ stage: "mic_listening_stopped", teacherId: this.teacherId });
  }

  async disconnect(): Promise<void> {
    this.onEvent({ stage: "session_stop", teacherId: this.teacherId });
    try {
      await this.session?.stop();
      this.onEvent({ stage: "session_stopped", teacherId: this.teacherId });
    } catch (err) {
      this.onEvent({ stage: "error", teacherId: this.teacherId, errorStage: "session_stop", detail: err instanceof Error ? err.message : "Error stopping session." });
    }
    this.session = null;
  }

  isConnected(): boolean {
    return this.session !== null;
  }
}

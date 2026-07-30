export const VOICE_AGENT = {
  id: "voice",
  label: "Voice Agent",
  responsibilities: ["Human narration", "Multilingual speech"],
};

export async function runVoiceAgent(task) {
  const started = Date.now();
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY);
  // Credentials ≠ READY. Green/READY requires last live authenticated probe success.
  const status = eleven ? "CREDENTIALS_PRESENT_AWAITING_LIVE_PROBE" : "WAITING_FOR_KEYS";
  return {
    agent: VOICE_AGENT.id,
    provider: eleven ? "elevenlabs" : "unconfigured",
    model: null,
    durationMs: Date.now() - started,
    stub: true,
    output: {
      summary: eleven
        ? "ElevenLabs credentials detected — not READY until a live authenticated health probe succeeds."
        : "Voice Agent ready; awaiting ELEVENLABS_API_KEY (or Cartesia).",
      narrationPlan: [
        {
          language: task.context?.language || "ar",
          scriptHint: task.goal,
          status,
        },
      ],
      nextSteps: eleven
        ? [
            "Run npm run ai:aios:health and confirm ElevenLabs is green only after live auth success",
            "Generate Arabic narration for approved lesson",
          ]
        : ["Add ELEVENLABS_API_KEY"],
    },
  };
}

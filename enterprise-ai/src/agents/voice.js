export const VOICE_AGENT = {
  id: "voice",
  label: "Voice Agent",
  responsibilities: ["Human narration", "Multilingual speech"],
};

export async function runVoiceAgent(task) {
  const started = Date.now();
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY);
  return {
    agent: VOICE_AGENT.id,
    provider: eleven ? "elevenlabs" : "unconfigured",
    model: null,
    durationMs: Date.now() - started,
    stub: !eleven,
    output: {
      summary: eleven
        ? "ElevenLabs credentials detected — narration pipeline ready."
        : "Voice Agent ready; awaiting ELEVENLABS_API_KEY (or Cartesia).",
      narrationPlan: [
        {
          language: task.context?.language || "ar",
          scriptHint: task.goal,
          status: eleven ? "READY" : "WAITING_FOR_KEYS",
        },
      ],
      nextSteps: eleven ? ["Generate Arabic narration for approved lesson"] : ["Add ELEVENLABS_API_KEY"],
    },
  };
}

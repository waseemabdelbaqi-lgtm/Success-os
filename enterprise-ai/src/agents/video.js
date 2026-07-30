export const VIDEO_AGENT = {
  id: "video",
  label: "Video Agent",
  responsibilities: ["Educational videos", "Animations", "Lesson media generation"],
};

export async function runVideoAgent(task) {
  const started = Date.now();
  const heygen = Boolean(process.env.HEYGEN_API_KEY);
  // Credentials ≠ READY. Green/READY requires last live authenticated probe success.
  const status = heygen ? "CREDENTIALS_PRESENT_AWAITING_LIVE_PROBE" : "WAITING_FOR_KEYS";
  return {
    agent: VIDEO_AGENT.id,
    provider: heygen ? "heygen" : "unconfigured",
    model: null,
    durationMs: Date.now() - started,
    stub: true,
    output: {
      summary: heygen
        ? "HeyGen credentials detected — not READY until a live authenticated health probe succeeds."
        : "Video Agent ready; add HEYGEN_API_KEY (or other media keys) to activate generation.",
      mediaPlan: [
        {
          type: "lesson-explainer",
          title: task.title,
          status,
        },
      ],
      nextSteps: heygen
        ? [
            "Run npm run ai:aios:health and confirm HeyGen is green only after live auth success",
            "Enqueue avatar video job via existing Success OS video adapters when approved",
          ]
        : ["Add HEYGEN_API_KEY / SYNTHESIA_API_KEY"],
    },
  };
}

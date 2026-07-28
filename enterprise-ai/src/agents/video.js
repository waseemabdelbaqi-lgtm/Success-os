export const VIDEO_AGENT = {
  id: "video",
  label: "Video Agent",
  responsibilities: ["Educational videos", "Animations", "Lesson media generation"],
};

export async function runVideoAgent(task) {
  const started = Date.now();
  const heygen = Boolean(process.env.HEYGEN_API_KEY);
  return {
    agent: VIDEO_AGENT.id,
    provider: heygen ? "heygen" : "unconfigured",
    model: null,
    durationMs: Date.now() - started,
    stub: !heygen,
    output: {
      summary: heygen
        ? "HeyGen credentials detected — ready for avatar lesson jobs (not auto-fired)."
        : "Video Agent ready; add HEYGEN_API_KEY (or other media keys) to activate generation.",
      mediaPlan: [
        {
          type: "lesson-explainer",
          title: task.title,
          status: heygen ? "READY" : "WAITING_FOR_KEYS",
        },
      ],
      nextSteps: heygen
        ? ["Enqueue avatar video job via existing Success OS video adapters when approved"]
        : ["Add HEYGEN_API_KEY / SYNTHESIA_API_KEY"],
    },
  };
}

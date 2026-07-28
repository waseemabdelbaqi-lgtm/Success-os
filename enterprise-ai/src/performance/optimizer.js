/**
 * Performance Optimizer — reviews agent timings and suggests improvements.
 */

export function optimizePerformance({ plan, taskResults = [], durationMs = 0 } = {}) {
  const perAgent = taskResults.map((t) => ({
    agent: t.agent,
    status: t.status,
    durationMs: t.durationMs || 0,
  }));
  const slow = perAgent.filter((a) => a.durationMs > 20000);
  const failed = perAgent.filter((a) => a.status === "FAILED");
  const suggestions = [];

  if (plan?.tasks?.length > 1) {
    suggestions.push("Keep specialist agents parallel; avoid serializing independent work");
  }
  if (slow.length) {
    suggestions.push(
      `Investigate slow agents: ${slow.map((s) => `${s.agent}(${s.durationMs}ms)`).join(", ")}`,
    );
  }
  if (failed.length) {
    suggestions.push("Retry failed agents with alternate providers via AI Gateway");
  }
  if (durationMs > 60000) {
    suggestions.push("Raise MASTER_ORCHESTRATOR_MAX_PARALLEL cautiously or trim agent set by intent");
  }
  suggestions.push("Prefer composition and reusable modules over duplicated agent prompts");

  const regressionRisk =
    slow.length >= 2 || durationMs > 120000 ? "ELEVATED" : failed.length ? "MODERATE" : "LOW";

  return {
    status: regressionRisk === "ELEVATED" ? "ATTENTION" : "OK",
    regressionRisk,
    totalMs: durationMs,
    parallelAgents: plan?.tasks?.length || 0,
    perAgent,
    suggestions,
  };
}

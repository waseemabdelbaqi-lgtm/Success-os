/**
 * Result Aggregator — merge specialist outputs and resolve conflicts.
 */

export function aggregateResults(plan, taskResults) {
  const providersUsed = new Set();
  const completed = [];
  const failed = [];
  const conflicts = [];

  for (const tr of taskResults) {
    if (tr.status === "COMPLETED") {
      completed.push(tr);
      if (tr.result?.provider) providersUsed.add(tr.result.provider);
    } else {
      failed.push(tr);
    }
  }

  const byAgent = new Map();
  for (const tr of completed) {
    const prev = byAgent.get(tr.agent);
    if (!prev) {
      byAgent.set(tr.agent, tr);
      continue;
    }
    const prevStub = Boolean(prev.result?.stub);
    const nextStub = Boolean(tr.result?.stub);
    if (prevStub && !nextStub) {
      conflicts.push({ agent: tr.agent, resolution: "prefer_live_provider", kept: tr.taskId });
      byAgent.set(tr.agent, tr);
    } else {
      conflicts.push({ agent: tr.agent, resolution: "keep_first", kept: prev.taskId });
    }
  }

  const pick = (...ids) => {
    for (const id of ids) {
      if (byAgent.has(id)) return byAgent.get(id)?.result?.output || null;
    }
    return null;
  };

  return {
    planId: plan.planId,
    userRequest: plan.userRequest || plan.objective,
    providersUsed: [...providersUsed],
    agentsCompleted: completed.map((c) => c.agent),
    agentsFailed: failed.map((f) => f.agent),
    conflicts,
    summaries: [...byAgent.values()].map((tr) => ({
      agent: tr.agent,
      provider: tr.result?.provider,
      stub: Boolean(tr.result?.stub),
      summary: tr.result?.output?.summary || null,
      nextSteps: tr.result?.output?.nextSteps || [],
    })),
    engineering: pick("engineering", "gpt-engineering"),
    backend: pick("backend"),
    frontend: pick("frontend"),
    database: pick("database"),
    security: pick("security"),
    performance: pick("performance"),
    curriculum: pick("curriculum", "claude-curriculum"),
    research: pick("research", "gemini-research"),
    video: pick("video"),
    voice: pick("voice"),
    translation: pick("translation"),
    testing: pick("testing"),
    accessibility: pick("accessibility"),
    documentation: pick("documentation"),
    deployment: pick("deployment"),
    monitoring: pick("monitoring"),
  };
}

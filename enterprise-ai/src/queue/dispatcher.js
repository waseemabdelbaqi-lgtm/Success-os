/**
 * Parallel Agent Dispatcher — respects dependency waves + AIOS_MAX_PARALLEL_TASKS.
 */
import { getAgentRunner } from "../agents/registry.js";

async function runOne(task) {
  const runner = getAgentRunner(task.agent);
  const started = Date.now();
  if (!runner) {
    return {
      taskId: task.id,
      agent: task.agent,
      status: "FAILED",
      error: "UNKNOWN_AGENT",
      durationMs: Date.now() - started,
    };
  }
  try {
    task.status = "RUNNING";
    const output = await runner(task);
    task.status = "COMPLETED";
    return {
      taskId: task.id,
      agent: task.agent,
      status: "COMPLETED",
      durationMs: Date.now() - started,
      result: output,
    };
  } catch (err) {
    task.status = "FAILED";
    return {
      taskId: task.id,
      agent: task.agent,
      status: "FAILED",
      durationMs: Date.now() - started,
      error: String(err?.message || err),
    };
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, () => worker()));
  return results;
}

export async function dispatchParallel(tasks, { maxParallel } = {}) {
  const limit = Math.max(
    1,
    Number(maxParallel || process.env.AIOS_MAX_PARALLEL_TASKS || process.env.MASTER_ORCHESTRATOR_MAX_PARALLEL || 4),
  );

  // Build waves from dependsOn
  const byAgent = new Map(tasks.map((t) => [t.agent, t]));
  const remaining = new Set(tasks.map((t) => t.agent));
  const completedAgents = new Set();
  const failedCritical = new Set();
  const allResults = [];

  while (remaining.size) {
    const ready = [...remaining].filter((agent) => {
      const t = byAgent.get(agent);
      return (t.dependsOn || []).every((d) => completedAgents.has(d) || !byAgent.has(d));
    });
    const batchAgents = ready.length ? ready : [[...remaining][0]];
    const batch = batchAgents.map((a) => byAgent.get(a));

    const waveResults = await mapPool(batch, limit, (task) => runOne(task));
    for (const r of waveResults) {
      allResults.push(r);
      remaining.delete(r.agent);
      if (r.status === "COMPLETED") completedAgents.add(r.agent);
      if (r.status === "FAILED" && ["engineering", "security"].includes(r.agent)) {
        failedCritical.add(r.agent);
      }
    }

    // Abort dependent work after critical failure
    if (failedCritical.size) {
      for (const agent of [...remaining]) {
        const t = byAgent.get(agent);
        if ((t.dependsOn || []).some((d) => failedCritical.has(d))) {
          allResults.push({
            taskId: t.id,
            agent: t.agent,
            status: "FAILED",
            error: "ABORTED_DEPENDENCY_FAILED",
            durationMs: 0,
          });
          remaining.delete(agent);
        }
      }
    }
  }

  return allResults;
}

export async function runTaskQueue(tasks, opts) {
  return dispatchParallel(tasks, opts);
}

/**
 * Parallel Agent Dispatcher + Task Queue
 */
import { getAgentRunner } from "../agents/registry.js";

export async function dispatchParallel(tasks, { maxParallel = 4 } = {}) {
  const limit = Math.max(1, Number(process.env.MASTER_ORCHESTRATOR_MAX_PARALLEL || maxParallel));
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      const task = tasks[idx];
      const runner = getAgentRunner(task.agent);
      const started = Date.now();
      if (!runner) {
        results[idx] = {
          taskId: task.id,
          agent: task.agent,
          status: "FAILED",
          error: "UNKNOWN_AGENT",
          durationMs: Date.now() - started,
        };
        continue;
      }
      try {
        task.status = "RUNNING";
        const output = await runner(task);
        task.status = "COMPLETED";
        results[idx] = {
          taskId: task.id,
          agent: task.agent,
          status: "COMPLETED",
          durationMs: Date.now() - started,
          result: output,
        };
      } catch (err) {
        task.status = "FAILED";
        results[idx] = {
          taskId: task.id,
          agent: task.agent,
          status: "FAILED",
          durationMs: Date.now() - started,
          error: String(err?.message || err),
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, Math.max(tasks.length, 1)) }, () => worker()));
  return results;
}

// Back-compat
export async function runTaskQueue(tasks, opts) {
  return dispatchParallel(tasks, opts);
}

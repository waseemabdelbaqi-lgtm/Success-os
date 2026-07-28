/**
 * Structured agent output contracts + repair attempt.
 */
import { z } from "zod";

export const AgentOutputSchema = z.object({
  taskId: z.string(),
  agent: z.string(),
  provider: z.string(),
  model: z.string().nullable(),
  status: z.enum(["completed", "failed", "needs_review"]),
  summary: z.string(),
  assumptions: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  filesProposed: z.array(z.string()).default([]),
  patches: z.array(z.any()).default([]),
  testsRequired: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  tokenUsage: z.record(z.any()).default({}),
  estimatedCost: z.union([z.number(), z.string(), z.null()]).default(null),
  errors: z.array(z.string()).default([]),
});

export function parseJsonLoose(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export function validateAgentOutput(raw, defaults = {}) {
  const parsed = typeof raw === "string" ? parseJsonLoose(raw) : raw;
  const candidate = {
    taskId: defaults.taskId || "",
    agent: defaults.agent || "",
    provider: defaults.provider || "",
    model: defaults.model ?? null,
    status: defaults.status || "needs_review",
    summary: "",
    assumptions: [],
    sources: [],
    filesProposed: [],
    patches: [],
    testsRequired: [],
    risks: [],
    tokenUsage: defaults.tokenUsage || {},
    estimatedCost: defaults.estimatedCost ?? null,
    errors: [],
    ...(parsed || {}),
  };
  // Map common alternate keys
  if (!candidate.summary && parsed?.findings) {
    candidate.summary = Array.isArray(parsed.findings) ? parsed.findings.join("; ") : String(parsed.findings);
  }
  if (!candidate.summary && typeof parsed === "object" && parsed?.summary == null && defaults.fallbackSummary) {
    candidate.summary = defaults.fallbackSummary;
  }
  const result = AgentOutputSchema.safeParse(candidate);
  if (result.success) return { ok: true, data: result.data, repaired: false };
  return { ok: false, error: result.error.message, data: candidate };
}

export async function validateWithRepair(raw, defaults, repairFn) {
  const first = validateAgentOutput(raw, defaults);
  if (first.ok) return first;
  if (typeof repairFn !== "function") {
    return {
      ok: false,
      data: {
        ...first.data,
        status: "failed",
        errors: [`INVALID_STRUCTURED_OUTPUT:${first.error}`],
      },
      repaired: false,
    };
  }
  try {
    const repairedRaw = await repairFn(first.error, first.data);
    const second = validateAgentOutput(repairedRaw, defaults);
    if (second.ok) return { ...second, repaired: true };
    return {
      ok: false,
      data: {
        ...second.data,
        status: "failed",
        errors: [`INVALID_STRUCTURED_OUTPUT_AFTER_REPAIR:${second.error}`],
      },
      repaired: true,
    };
  } catch (err) {
    return {
      ok: false,
      data: {
        ...first.data,
        status: "failed",
        errors: [`REPAIR_FAILED:${String(err?.message || err)}`],
      },
      repaired: true,
    };
  }
}

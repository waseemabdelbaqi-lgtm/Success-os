/**
 * SUCCESS OS — Enterprise AI Operating System (AIOS)
 *
 * AI Gateway → Master Orchestrator → Planning → Queue → Parallel Agents →
 * Aggregator → Quality → Security → Performance → Docs → Git → Report
 *
 * Additive permanent brain. Does not modify existing Success OS routes/pages/schema/business logic.
 */
import fs from "node:fs";
import path from "node:path";
import { detectProviders } from "./providers/detect.js";
import { listGatewayProviders } from "./gateway/ai-gateway.js";
import { planRequest } from "./planning/engine.js";
import { dispatchParallel } from "./queue/dispatcher.js";
import { aggregateResults } from "./result-aggregator.js";
import { validateQuality } from "./quality-validator.js";
import { validateSecurity } from "./security/validator.js";
import { optimizePerformance } from "./performance/optimizer.js";
import { generateRunDocumentation } from "./documentation/auto-docs.js";
import { gitAutomationStatus, maybeAutoCommit } from "./git-automation.js";
import { probeMcpAvailability, mcpUsagePolicy } from "./mcp/bridge.js";
import { listAgents } from "./agents/registry.js";
import { buildExecutiveReport, formatAiosDisplay } from "./output/report-formatter.js";

function ensureReportDir(root) {
  const dir = path.join(root, "data/master-ai-orchestrator/reports");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function runAIOS(userRequest, options = {}) {
  const started = Date.now();
  const projectRoot = options.projectRoot || process.cwd();
  const context = options.context || {};

  // Foundation probes
  const providerDetection = await detectProviders();
  const mcp = await probeMcpAvailability({ callMcp: options.callMcp });
  const agentsCatalog = listAgents();

  // Planning
  const plan = planRequest(userRequest, { context });

  // Parallel dispatch
  const taskResults = await dispatchParallel(plan.tasks, { maxParallel: options.maxParallel });

  // Aggregate + conflict resolve
  const merged = aggregateResults(plan, taskResults);

  // Quality + Security + Performance
  const quality = validateQuality({
    merged,
    filesTouched: options.filesTouched || [],
    projectRoot,
  });
  const security = validateSecurity({
    merged,
    filesTouched: options.filesTouched || [],
  });
  const performance = optimizePerformance({
    plan,
    taskResults,
    durationMs: Date.now() - started,
  });

  // Documentation
  const documentation = generateRunDocumentation({
    projectRoot,
    plan,
    merged,
    quality,
    security,
    performance,
  });

  // Git integration (safe defaults: off / dry-run)
  const gitStatus = gitAutomationStatus(projectRoot);
  let gitResult = { skipped: true, reason: "quality_security_or_disabled" };
  const gatesPass = quality.ok && security.ok;
  if (gatesPass && options.allowGit !== false) {
    gitResult = maybeAutoCommit({
      cwd: projectRoot,
      message:
        options.commitMessage ||
        `chore(aios): ${plan.planId} — ${String(userRequest).slice(0, 60)}`,
      files: options.filesTouched || [],
    });
  } else if (!gatesPass) {
    gitResult = {
      skipped: true,
      reason: "GATES_FAILED",
      qualityOk: quality.ok,
      securityOk: security.ok,
    };
  }

  const agentsUsed = [...new Set(taskResults.filter((t) => t.status === "COMPLETED").map((t) => t.agent))];
  const testsExecuted = [];
  if (merged.testing) {
    for (const c of merged.testing.checks || []) {
      testsExecuted.push({
        name: c.name,
        ok: Boolean(c.ok),
        suite: "testing-agent",
      });
    }
    if (merged.testing.smoke) {
      testsExecuted.push({
        name: "playwright_smoke",
        ok: Boolean(merged.testing.smoke.ok),
        suite: "e2e",
      });
    }
  }

  const remainingWork = [
    ...new Set(
      (merged.summaries || [])
        .flatMap((s) => s.nextSteps || [])
        .concat(providerDetection.inactive.map((id) => `Activate provider adapter: ${id}`))
        .concat(performance.suggestions || []),
    ),
  ];

  const suggestedNextStep =
    remainingWork[0] ||
    (gatesPass
      ? "Review AIOS aggregated plans and approve implementation work"
      : "Resolve quality/security rejects before applying changes");

  const status = !gatesPass
    ? "COMPLETED_WITH_GATE_FAILURES"
    : taskResults.some((t) => t.status === "FAILED")
      ? "COMPLETED_WITH_PARTIAL_AGENT_FAILURES"
      : "COMPLETED";

  const report = {
    system: "SUCCESS-OS-AIOS",
    version: "2.0.0",
    status,
    durationMs: Date.now() - started,
    foundation: {
      gatewayProviders: listGatewayProviders(),
      agentsRegistered: agentsCatalog.length,
      modular: true,
      providerIndependentAppLayer: true,
    },
    aiProvidersUsed: merged.providersUsed,
    agentsUsed,
    providerDetection,
    mcp: { ...mcp, policy: mcpUsagePolicy() },
    plan,
    tasksCompleted: taskResults
      .filter((t) => t.status === "COMPLETED")
      .map((t) => ({
        taskId: t.taskId,
        agent: t.agent,
        provider: t.result?.provider,
        durationMs: t.durationMs,
      })),
    tasksFailed: taskResults.filter((t) => t.status === "FAILED"),
    filesModified: options.filesTouched || [],
    testsExecuted,
    testsPassed: testsExecuted.length ? testsExecuted.every((t) => t.ok) : null,
    quality,
    security,
    performance,
    documentation,
    merged,
    git: { status: gitStatus, result: gitResult, cursorProjectUpdate: "report-written" },
    remainingWork,
    suggestedNextStep,
    continuousImprovement: {
      reviewGeneratedPlans: true,
      suggestions: performance.suggestions,
      maintainability: "Prefer reusable AIOS modules over one-off scripts",
      scalability: "Register new providers/agents via adapters — no app rewrites",
    },
  };

  report.executive = buildExecutiveReport(report);

  const dir = ensureReportDir(projectRoot);
  const outPath = path.join(dir, `${plan.planId}.json`);
  // documentation path backfill
  if (documentation?.path) {
    fs.writeFileSync(
      documentation.path,
      fs.readFileSync(documentation.path, "utf8").replace("(in-memory)", outPath),
    );
  }
  report.reportPath = outPath;
  report.documentation = { ...documentation, path: documentation.path };
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/** Alias used by earlier CLI */
export async function runMasterOrchestrator(userRequest, options) {
  return runAIOS(userRequest, options);
}

export function formatOrchestratorDisplay(report) {
  return formatAiosDisplay(report);
}

export { formatAiosDisplay, buildExecutiveReport };

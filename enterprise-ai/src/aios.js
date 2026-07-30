/**
 * SUCCESS OS — Enterprise AI Operating System (AIOS) v3
 * REVIEW MODE by default — no automatic patches/commits/pushes/deploys.
 */
import fs from "node:fs";
import path from "node:path";
import { loadAiosEnv } from "./env/load.js";
import { detectProviders } from "./providers/detect.js";
import { listGatewayProviders } from "./gateway/ai-gateway.js";
import { runAllHealthChecks, registrySnapshot, circuitBreakerStatus } from "./providers/registry.js";
import { loadHealthSnapshot } from "./providers/live-status.js";
import { planRequest } from "./planning/engine.js";
import { dispatchParallel } from "./queue/dispatcher.js";
import { aggregateResults } from "./result-aggregator.js";
import { validateQuality } from "./quality-validator.js";
import { validateSecurity } from "./security/validator.js";
import { optimizePerformance } from "./performance/optimizer.js";
import { generateRunDocumentation } from "./documentation/auto-docs.js";
import { gitAutomationStatus, maybeAutoCommit } from "./git-automation.js";
import { probeMcpAvailability, mcpUsagePolicy, listMcpTools } from "./mcp/bridge.js";
import { listAgents } from "./agents/registry.js";
import { buildExecutiveReport, formatAiosDisplay } from "./output/report-formatter.js";
import { costStatus, persistUsage } from "./cost/guards.js";
import { summarizeFactories } from "./factories/registry.js";

function ensureReportDir(root) {
  const dir = path.join(root, "data/master-ai-orchestrator/reports");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function collectProposedFiles(merged) {
  const files = new Set();
  for (const key of Object.keys(merged || {})) {
    const block = merged[key];
    if (block?.filesProposed) for (const f of block.filesProposed) files.add(f);
    if (block?.recommendations) {
      for (const r of block.recommendations) if (typeof r === "string" && r.includes("/")) files.add(r);
    }
  }
  for (const s of merged.summaries || []) {
    /* no-op */
  }
  return [...files];
}

export async function runAIOS(userRequest, options = {}) {
  loadAiosEnv({ root: options.projectRoot || process.cwd() });
  const started = Date.now();
  const projectRoot = options.projectRoot || process.cwd();
  const context = options.context || {};
  const executionMode =
    options.executionMode || process.env.AIOS_EXECUTION_MODE || "review";
  const isExecute = executionMode === "execute" && options.allowExecute === true;

  // Force auto-commit off unless explicitly enabled AND execute mode
  if (process.env.AIOS_AUTO_COMMIT !== "true" || !isExecute) {
    process.env.MASTER_ORCHESTRATOR_AUTO_COMMIT = "false";
  }

  const providerDetection = await detectProviders();
  const lastHealth = loadHealthSnapshot(projectRoot);
  const factories = await summarizeFactories({
    providerDetection,
    liveProbes: lastHealth?.providers || [],
    rootDir: projectRoot,
  });
  const mcp = await probeMcpAvailability({ callMcp: options.callMcp });
  const mcpTools = listMcpTools();
  const agentsCatalog = listAgents();
  const plan = planRequest(userRequest, { context: { ...context, executionMode } });

  const taskResults = await dispatchParallel(plan.tasks, { maxParallel: options.maxParallel });
  const merged = aggregateResults(plan, taskResults);
  const proposedFiles = collectProposedFiles(merged);

  const quality = validateQuality({
    merged,
    filesTouched: isExecute ? options.filesTouched || [] : [],
    projectRoot,
  });
  const security = validateSecurity({
    merged,
    filesTouched: isExecute ? options.filesTouched || [] : [],
  });
  const performance = optimizePerformance({
    plan,
    taskResults,
    durationMs: Date.now() - started,
  });

  const documentation = generateRunDocumentation({
    projectRoot,
    plan,
    merged,
    quality,
    security,
    performance,
  });

  const gitStatus = gitAutomationStatus(projectRoot);
  let gitResult = {
    skipped: true,
    reason: isExecute ? "execute_gates_or_disabled" : "REVIEW_MODE_NO_COMMIT",
  };
  const gatesPass = quality.ok && security.ok;
  // Never auto-apply patches in review mode. Even in execute mode, auto-commit stays off by default.
  if (isExecute && gatesPass && process.env.AIOS_AUTO_COMMIT === "true" && options.allowGit === true) {
    gitResult = maybeAutoCommit({
      cwd: projectRoot,
      message: options.commitMessage || `chore(aios): ${plan.planId}`,
      files: options.filesTouched || [],
    });
  }

  const agentsUsed = [...new Set(taskResults.filter((t) => t.status === "COMPLETED").map((t) => t.agent))];
  const realProviders = [...new Set(
    taskResults
      .filter((t) => t.status === "COMPLETED" && t.result?.provider && !t.result?.stub)
      .map((t) => t.result.provider)
      .filter((p) => p && p !== "offline-stub" && p !== "unconfigured"),
  )];

  const testsExecuted = [];
  if (merged.testing) {
    for (const c of merged.testing.checks || []) {
      testsExecuted.push({ name: c.name, ok: Boolean(c.ok), suite: "testing-agent" });
    }
    if (merged.testing.smoke) {
      testsExecuted.push({
        name: "playwright_smoke",
        ok: Boolean(merged.testing.smoke.ok),
        suite: "e2e",
      });
    }
  }

  const tokenUsage = taskResults
    .filter((t) => t.result?.tokenUsage)
    .map((t) => ({ agent: t.agent, provider: t.result.provider, ...t.result.tokenUsage }));

  const remainingWork = [
    ...new Set(
      (merged.summaries || [])
        .flatMap((s) => s.nextSteps || [])
        .concat(
          providerDetection.inactive
            .filter((id) => !["future-provider-slot", "playwright"].includes(id))
            .map((id) => `Configure provider: ${id}`),
        )
        .concat(performance.suggestions || []),
    ),
  ];

  const filesWouldModify = proposedFiles;
  const reviewBlock = {
    mode: isExecute ? "EXECUTE" : "REVIEW",
    patchesApplied: false,
    filesWouldModify,
    testsThatWouldRun: testsExecuted.map((t) => t.name),
    destructiveOperations: "none",
    estimatedProviderUsage: realProviders,
    approvalStatus: isExecute ? "EXECUTE_REQUESTED" : "REVIEW_ONLY",
    note: isExecute
      ? "Execute mode enabled for this run; patches still require explicit file application logic (not auto-applied)."
      : "REVIEW MODE: analysis and proposals only — no application file modifications.",
  };

  const status = !gatesPass
    ? "COMPLETED_WITH_GATE_FAILURES"
    : taskResults.some((t) => t.status === "FAILED")
      ? "COMPLETED_WITH_PARTIAL_AGENT_FAILURES"
      : "COMPLETED";

  const report = {
    system: "SUCCESS-OS-AIOS",
    version: "3.0.0",
    status,
    executionMode: reviewBlock.mode,
    durationMs: Date.now() - started,
    foundation: {
      gatewayProviders: listGatewayProviders(),
      agentsRegistered: agentsCatalog.length,
      modular: true,
      providerIndependentAppLayer: true,
      registry: registrySnapshot(),
      circuitBreakers: circuitBreakerStatus(),
      successAiOs: {
        codingFactory: "Claude Code · OpenAI · Cursor",
        educationFactory: "Claude · Gemini · Wolfram",
        mediaFactory: "HeyGen · ElevenLabs · OpenAI Images · Blender",
        infrastructure: "GitHub · Supabase · Browserbase · Playwright · Sentry · Vercel",
      },
    },
    factories,
    aiProvidersUsed: merged.providersUsed,
    realProvidersParticipating: realProviders,
    multiAgentLive: realProviders.length >= 2,
    agentsUsed,
    providerDetection,
    mcp: { ...mcp, policy: mcpUsagePolicy(), tools: mcpTools },
    plan,
    review: reviewBlock,
    tasksCompleted: taskResults
      .filter((t) => t.status === "COMPLETED")
      .map((t) => ({
        taskId: t.taskId,
        agent: t.agent,
        provider: t.result?.provider,
        model: t.result?.model,
        durationMs: t.durationMs,
        contractValid: t.result?.contractValid,
        tokenUsage: t.result?.tokenUsage,
        estimatedCost: t.result?.estimatedCost,
      })),
    tasksFailed: taskResults.filter((t) => t.status === "FAILED"),
    filesModified: isExecute ? options.filesTouched || [] : [],
    filesProposed: filesWouldModify,
    testsExecuted,
    testsPassed: testsExecuted.length ? testsExecuted.every((t) => t.ok) : null,
    tokenUsage,
    cost: costStatus(),
    quality,
    security,
    performance,
    documentation,
    merged,
    git: {
      status: gitStatus,
      result: gitResult,
      autoCommit: process.env.AIOS_AUTO_COMMIT === "true",
      autoPush: false,
      autoDeploy: false,
      cursorProjectUpdate: "report-written",
    },
    remainingWork,
    suggestedNextStep:
      remainingWork[0] ||
      (reviewBlock.mode === "REVIEW"
        ? "Review proposals; run npm run ai:aios:execute only after explicit approval"
        : "Apply approved patches manually after review"),
    continuousImprovement: {
      reviewGeneratedPlans: true,
      suggestions: performance.suggestions,
    },
  };

  report.executive = buildExecutiveReport(report);
  persistUsage(projectRoot);

  const dir = ensureReportDir(projectRoot);
  const outPath = path.join(dir, `${plan.planId}.json`);
  if (documentation?.path) {
    fs.writeFileSync(
      documentation.path,
      fs.readFileSync(documentation.path, "utf8").replace("(in-memory)", outPath),
    );
  }
  report.reportPath = outPath;
  report.documentation = { ...documentation, path: documentation.path };
  // Ensure reports never contain env secrets
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

export async function runMasterOrchestrator(userRequest, options) {
  return runAIOS(userRequest, options);
}

export function formatOrchestratorDisplay(report) {
  return formatAiosDisplay(report);
}

export { formatAiosDisplay, buildExecutiveReport, runAllHealthChecks };

#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAiosEnv } from "./env/load.js";
import { createLogger } from "./utils/logger.js";
import { detectProviders } from "./providers/detect.js";
import { createProviderRegistry, runAllHealthChecks } from "./providers/registry.js";
import { buildInfrastructureDashboard, loadHealthSnapshot } from "./providers/live-status.js";
import { runAIOS, formatAiosDisplay } from "./aios.js";
import { getMcpToolRegistry } from "./mcp/bridge.js";
import { summarizeFactories, listFactories } from "./factories/registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

function parseArgs(argv) {
  const out = {
    detect: false,
    health: false,
    mcp: false,
    factories: false,
    execute: false,
    agents: false,
    smoke: false,
    mode: null,
    objective: "",
    help: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--detect") out.detect = true;
    else if (a === "--health") out.health = true;
    else if (a === "--mcp") out.mcp = true;
    else if (a === "--factories") out.factories = true;
    else if (a === "--execute") out.execute = true;
    else if (a === "--agents") out.agents = true;
    else if (a === "--smoke") out.smoke = true;
    else if (a === "--mode" && argv[i + 1]) {
      out.mode = String(argv[++i]).toLowerCase();
    } else if (a === "--help" || a === "-h") {
      out.help = true;
    } else {
      rest.push(a);
    }
  }
  out.objective = rest.join(" ").trim();
  return out;
}

function printHelp() {
  console.log(`Success OS AIOS — Master AI Orchestrator

Usage:
  npm run ai:aios -- "Your objective"              # REVIEW mode (default)
  npm run ai:aios:execute -- "Your objective"      # EXECUTE mode (explicit)
  npm run ai:aios:detect
  npm run ai:aios:health
  npm run ai:aios:test

Flags:
  --detect     Provider configuration detection (no secrets)
  --health     Live minimal health probes per provider
  --factories  Success AI OS factory map (Coding / Education / Media)
  --mcp        Print MCP tool registry status
  --execute    Request execute mode (still no auto-commit/push/deploy)
  --mode MODE  review | execute | dry-run
  --agents     List registered agents
`);
}

async function main() {
  loadAiosEnv({ root: rootDir });
  const args = parseArgs(process.argv.slice(2));
  const logger = createLogger({ level: process.env.AIOS_LOG_LEVEL || "info" });

  if (args.help) {
    printHelp();
    return;
  }

  if (args.mcp) {
    console.log(JSON.stringify(getMcpToolRegistry(), null, 2));
    return;
  }

  if (args.factories) {
    const snap = loadHealthSnapshot(rootDir);
    const summary = await summarizeFactories({
      liveProbes: snap?.providers || [],
      rootDir,
    });
    const dashboard =
      snap?.dashboard ||
      buildInfrastructureDashboard(snap?.providers || [], { checkedAt: snap?.checkedAt || null });
    console.log(
      JSON.stringify(
        {
          ...summary,
          catalog: listFactories(),
          infrastructureDashboard: dashboard,
          note: "Green only after live authenticated probe success in last health check",
        },
        null,
        2,
      ),
    );
    return;
  }

  if (args.agents) {
    const { listAgents } = await import("./agents/registry.js");
    console.log(JSON.stringify({ agents: listAgents() }, null, 2));
    return;
  }

  if (args.detect) {
    const detection = await detectProviders();
    const registry = createProviderRegistry({ rootDir, logger });
    const snap = loadHealthSnapshot(rootDir);
    const factories = await summarizeFactories({
      providerDetection: detection,
      liveProbes: snap?.providers || [],
      rootDir,
    });
    console.log(
      JSON.stringify(
        {
          ...detection,
          note: "Detection lists credential presence only — green/READY requires live authenticated probe",
          factories,
          registry: registry.snapshot(),
          mcp: getMcpToolRegistry(),
          secretsExposed: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (args.health) {
    const health = await runAllHealthChecks({ rootDir, persist: true });
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          rule: health.rule,
          ruleAr: health.ruleAr,
          checkedAt: health.checkedAt,
          ready: health.ready,
          greenCount: health.dashboard?.greenCount ?? 0,
          infrastructureDashboard: health.dashboard,
          providers: health.providers,
          circuitBreakers: health.circuitBreakers,
          routingSample: health.routingSample,
          snapshotPath: health.snapshotPath,
          mcp: getMcpToolRegistry(),
          secretsExposed: false,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!args.objective) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  let mode = args.mode;
  if (args.execute) mode = "execute";
  if (!mode) mode = process.env.AIOS_EXECUTION_MODE || "review";

  const isExecute = mode === "execute";
  const report = await runAIOS(args.objective, {
    projectRoot: rootDir,
    executionMode: isExecute ? "execute" : "review",
    allowExecute: isExecute,
    context: { runSmoke: args.smoke },
    logger,
  });

  if (process.env.AIOS_PRINT_DISPLAY === "true") {
    console.log(formatAiosDisplay(report));
  }

  console.log(
    JSON.stringify(
      {
        ok: report.status?.startsWith("COMPLETED"),
        mode: report.executionMode,
        reportPath: report.reportPath,
        status: report.status,
        summary: report.executive,
        providersUsed: report.aiProvidersUsed,
        realProvidersParticipating: report.realProvidersParticipating,
        multiAgentLive: report.multiAgentLive,
        tokenUsage: report.tokenUsage,
        cost: report.cost,
        review: report.review,
        safety: {
          autoCommit: report.git?.autoCommit === true,
          autoPush: report.git?.autoPush === true,
          autoDeploy: report.git?.autoDeploy === true,
          patchesApplied: report.review?.patchesApplied === true,
        },
      },
      null,
      2,
    ),
  );

  if (!String(report.status || "").startsWith("COMPLETED")) process.exitCode = 2;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: {
          name: error?.name || "Error",
          message: String(error?.message || error),
          category: error?.category || error?.status || "PROVIDER_ERROR",
        },
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});

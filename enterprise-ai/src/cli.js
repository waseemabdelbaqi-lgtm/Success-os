#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAiosEnv } from "./env/load.js";
import { createLogger } from "./utils/logger.js";
import { detectProviders } from "./providers/detect.js";
import { createProviderRegistry } from "./providers/registry.js";
import { runHealthCommand, certifyProviders, promoteMissionCritical } from "./providers/health-runner.js";
import { buildDashboardFromState, loadHealthState } from "./providers/health-store.js";
import { CanonicalStatus, LIFECYCLE_LADDER_LABELS } from "./providers/status-model.js";
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
    json: false,
    mode: null,
    healthMode: null,
    provider: null,
    factory: null,
    certify: false,
    missionCritical: false,
    executionMode: null,
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
    else if (a === "--json") out.json = true;
    else if (a === "--certify") {
      out.certify = true;
      out.health = true;
    } else if (a === "--mission-critical") {
      out.missionCritical = true;
      out.health = true;
    } else if (a === "--help" || a === "-h") out.help = true;
    else if (a.startsWith("--mode=")) {
      const v = a.slice("--mode=".length).toLowerCase();
      if (["config", "live", "full"].includes(v)) out.healthMode = v;
      else out.executionMode = v;
    } else if (a === "--mode" && argv[i + 1]) {
      const v = String(argv[++i]).toLowerCase();
      if (["config", "live", "full"].includes(v)) out.healthMode = v;
      else out.executionMode = v;
    } else if (a.startsWith("--provider=")) {
      out.provider = a.slice("--provider=".length).toLowerCase();
      out.health = true;
    } else if (a === "--provider" && argv[i + 1]) {
      out.provider = String(argv[++i]).toLowerCase();
      out.health = true;
    } else if (a.startsWith("--factory=")) {
      out.factory = a.slice("--factory=".length).toLowerCase();
      out.health = true;
    } else if (a === "--factory" && argv[i + 1]) {
      out.factory = String(argv[++i]).toLowerCase();
      out.health = true;
    } else {
      rest.push(a);
    }
  }
  out.objective = rest.join(" ").trim();
  // Bare health defaults to live
  if (out.health && !out.healthMode) out.healthMode = "live";
  out.mode = out.executionMode;
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

Health (accurate live verification):
  npm run ai:aios:health -- --mode=config
  npm run ai:aios:health -- --mode=live
  npm run ai:aios:health -- --mode=full
  npm run ai:aios:health -- --provider=ollama --mode=live
  npm run ai:aios:health -- --provider=playwright --certify
  npm run ai:aios:health -- --provider=playwright --mission-critical
  npm run ai:aios:health -- --factory=education --mode=live
  npm run ai:aios:health -- --mode=live --json

Flags:
  --detect              Credential/adapter detection only (never READY)
  --health              Run provider health (default --mode=live)
  --mode MODE           Health: config|live|full  OR run: review|execute|dry-run
  --provider=<id>       Test one provider
  --factory=<id>        Test one factory (coding|education|media|infrastructure)
  --certify             Grant PRODUCTION_CERTIFIED 🟢⭐ from READY (requires --provider)
  --mission-critical    Grant MISSION_CRITICAL 🟢⭐⭐ from PRODUCTION_CERTIFIED (requires --provider)
  --json                Machine-readable JSON (default for health)
  --factories           Factory map + readiness from persisted probes
  --mcp                 MCP tool registry
  --execute             Execute mode (no auto-commit/push/deploy)
  --agents              List agents

Lifecycle: SLOT ⚪ → NOT_CONFIGURED ⚪ → CREDENTIALS_DETECTED 🟡 → PROBE_RUNNING 🟡 → READY 🟢 → PRODUCTION_CERTIFIED 🟢⭐ → MISSION_CRITICAL 🟢⭐⭐
Rule: live authenticated probe + persisted evidence only. Star tiers require explicit --certify / --mission-critical. No stage skipping.
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
    const state = loadHealthState(rootDir);
    const summary = await summarizeFactories({
      liveProbes: (state?.providers || []).map((p) => ({
        provider: p.providerId,
        status: p.status === "READY" ? "READY" : p.status,
        authenticationValid: p.authenticated,
        minimalRequestPassed: p.status === "READY",
        latencyMs: p.latencyMs === "NOT_TESTED" ? null : p.latencyMs,
        model: p.model === "NOT_TESTED" ? null : p.model,
        checkedAt: p.testedAt === "NOT_TESTED" ? null : p.testedAt,
        configured: p.credentialsDetected,
      })),
      rootDir,
      factoryReadiness: state?.factories || null,
    });
    console.log(
      JSON.stringify(
        {
          ...summary,
          catalog: listFactories(),
          dashboard: buildDashboardFromState(state, rootDir),
          factoryReadiness: state?.factories || summary.factoryReadiness,
          note: "Factory readiness uses persisted live probe results only",
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
    const configHealth = await runHealthCommand({
      mode: "config",
      rootDir,
      persist: false,
    });
    console.log(
      JSON.stringify(
        {
          ...detection,
          note: "Detection/config never marks READY — live probe required",
          configHealth: {
            providers: configHealth.providers,
            factories: configHealth.factories,
          },
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
    if (args.missionCritical) {
      if (!args.provider) {
        console.log(
          JSON.stringify(
            {
              ok: false,
              error: "PROVIDER_REQUIRED",
              message:
                "--mission-critical requires --provider=<id> (must already be PRODUCTION CERTIFIED)",
            },
            null,
            2,
          ),
        );
        process.exitCode = 1;
        return;
      }
      await runHealthCommand({
        mode: args.healthMode || "live",
        provider: args.provider,
        rootDir,
        persist: true,
      });
      const promoted = await promoteMissionCritical({
        providerIds: [args.provider],
        rootDir,
        persist: true,
      });
      console.log(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            action: "MISSION_CRITICAL",
            mark: "🟢⭐⭐",
            ...promoted,
            secretsExposed: false,
          },
          null,
          2,
        ),
      );
      if (!promoted.ok) process.exitCode = 2;
      return;
    }

    if (args.certify) {
      if (!args.provider) {
        console.log(
          JSON.stringify(
            {
              ok: false,
              error: "PROVIDER_REQUIRED",
              message: "--certify requires --provider=<id> (provider must already be READY)",
            },
            null,
            2,
          ),
        );
        process.exitCode = 1;
        return;
      }
      // Ensure latest live evidence then certify
      await runHealthCommand({
        mode: args.healthMode || "live",
        provider: args.provider,
        rootDir,
        persist: true,
      });
      const certified = await certifyProviders({
        providerIds: [args.provider],
        rootDir,
        persist: true,
      });
      console.log(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            action: "PRODUCTION_CERTIFIED",
            mark: "🟢⭐",
            ...certified,
            secretsExposed: false,
          },
          null,
          2,
        ),
      );
      if (!certified.ok) process.exitCode = 2;
      return;
    }

    const health = await runHealthCommand({
      mode: args.healthMode || "live",
      provider: args.provider,
      factory: args.factory,
      rootDir,
      persist: true,
    });
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
          ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
          lifecycleLadder: [...LIFECYCLE_LADDER_LABELS],
          mode: health.mode,
          modes: health.modes,
          checkedAt: health.checkedAt,
          ready: health.ready,
          certified: health.certified || [],
          missionCritical: health.missionCritical || [],
          greenCount: health.dashboard?.greenCount ?? 0,
          certifiedCount: health.dashboard?.certifiedCount ?? 0,
          missionCriticalCount: health.dashboard?.missionCriticalCount ?? 0,
          factories: health.factories,
          dashboard: health.dashboard,
          providers: health.providers,
          alerts: health.alerts,
          snapshotPath: health.snapshotPath,
          vercelAutoDeployBlocked: true,
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

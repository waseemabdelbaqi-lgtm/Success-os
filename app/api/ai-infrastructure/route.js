/**
 * AI Infrastructure dashboard API.
 * GET reads persisted probe state from disk (no Next bundling of enterprise-ai).
 * POST spawns the AIOS health CLI for live/config/full probes.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rootDir = process.cwd();
const STATE_REL = "data/master-ai-orchestrator/health/provider-health-state.json";
const HISTORY_REL = "data/master-ai-orchestrator/health/provider-health-history.json";

const DISPLAY_IDS = [
  "openai",
  "anthropic",
  "gemini",
  "ollama",
  "wolfram",
  "heygen",
  "elevenlabs",
  "openai-images",
  "github",
  "supabase",
  "browserbase",
  "playwright",
  "sentry",
  "vercel",
];

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(rootDir, rel), "utf8"));
  } catch {
    return null;
  }
}

function colorForStatus(status) {
  if (
    status === "READY" ||
    status === "PRODUCTION_CERTIFIED" ||
    status === "MISSION_CRITICAL"
  ) {
    return "green";
  }
  if (
    [
      "DEGRADED",
      "RATE_LIMITED",
      "PROBE_PENDING",
      "PROBE_RUNNING",
      "CREDENTIALS_DETECTED",
      "CREDENTIALS_NOT_REQUIRED",
      "CONFIGURED",
      "LIVE_VERIFIED",
      "LOCAL_APP_UNAVAILABLE",
    ].includes(status)
  ) {
    return "yellow";
  }
  if (
    [
      "AUTH_FAILED",
      "MODEL_UNAVAILABLE",
      "NETWORK_FAILED",
      "PROBE_FAILED",
      "BROWSER_NOT_INSTALLED",
      "BROWSER_LAUNCH_FAILED",
      "TEST_ASSERTION_FAILED",
      "REMOTE_TESTING_BLOCKED",
    ].includes(status)
  ) {
    return "red";
  }
  return "grey";
}

function emptyRow(id) {
  return {
    providerId: id,
    id,
    displayName: id,
    Provider: id,
    Factory: "NOT_TESTED",
    Adapter: "NOT_TESTED",
    Credentials: "NOT_TESTED",
    "Live Probe": "NOT_RUN",
    Status: "NOT_TESTED",
    status: "NOT_TESTED",
    "Last Tested": "NOT_TESTED",
    testedAt: "NOT_TESTED",
    Result: "not_tested",
    Latency: "NOT_TESTED",
    latencyMs: "NOT_TESTED",
    "Model or Service": "NOT_TESTED",
    model: "NOT_TESTED",
    "Last Successful Test": "NOT_TESTED",
    "Last Error": "NOT_TESTED",
    safeErrorMessage: "NOT_TESTED",
    displayColor: "grey",
    liveProbe: "NOT_RUN",
  };
}

function buildDashboard(state) {
  const byId = new Map((state?.providers || []).map((p) => [p.providerId, p]));
  const providers = DISPLAY_IDS.map((id) => {
    const rec = byId.get(id);
    if (!rec) return emptyRow(id);
    const status = rec.status || "NOT_TESTED";
    return {
      ...rec,
      id: rec.providerId,
      Provider: rec.displayName || rec.providerId,
      Factory: rec.factory || "NOT_TESTED",
      Adapter: rec.adapterAvailable ? "available" : "missing",
      Credentials: rec.credentialsDetected ? "detected" : "missing",
      "Live Probe": rec.liveProbe || "NOT_RUN",
      Status: status,
      Lifecycle: rec.lifecycleStage || "SLOT",
      "Lifecycle Ladder": Array.isArray(rec.lifecycleProgress)
        ? rec.lifecycleProgress
            .map((s) =>
              s.current ? `[${s.label}${s.mark ? ` ${s.mark}` : ""}]` : s.reached ? s.label : "·",
            )
            .join(" → ")
        : "SLOT → NOT_CONFIGURED → CREDENTIALS_DETECTED → PROBE_RUNNING → READY 🟢 → PRODUCTION_CERTIFIED ⭐ → MISSION_CRITICAL ⭐⭐",
      productionCertified: Boolean(rec.productionCertified),
      missionCritical: Boolean(rec.missionCritical),
      displayMark:
        rec.displayMark ||
        (rec.lifecycleStage === "MISSION_CRITICAL"
          ? "🟢⭐⭐"
          : rec.lifecycleStage === "PRODUCTION_CERTIFIED"
            ? "🟢⭐"
            : rec.lifecycleStage === "READY"
              ? "🟢"
              : rec.lifecycleStage === "CREDENTIALS_DETECTED" ||
                  rec.lifecycleStage === "PROBE_RUNNING"
                ? "🟡"
                : "⚪"),
      Mark:
        rec.displayMark ||
        (rec.lifecycleStage === "MISSION_CRITICAL"
          ? "🟢⭐⭐"
          : rec.lifecycleStage === "PRODUCTION_CERTIFIED"
            ? "🟢⭐"
            : rec.lifecycleStage === "READY"
              ? "🟢"
              : rec.lifecycleStage === "CREDENTIALS_DETECTED" ||
                  rec.lifecycleStage === "PROBE_RUNNING"
                ? "🟡"
                : "⚪"),
      "Last Tested": rec.testedAt || "NOT_TESTED",
      Result: rec.result || "NOT_TESTED",
      Latency:
        rec.latencyMs === "NOT_TESTED" || rec.latencyMs == null
          ? "NOT_TESTED"
          : `${rec.latencyMs} ms`,
      "Model or Service": rec.model || "NOT_TESTED",
      "Last Successful Test": rec.lastSuccessfulProbeAt || "NOT_TESTED",
      "Last Error":
        rec.safeErrorMessage === "none" ? "none" : rec.safeErrorMessage || "NOT_TESTED",
      displayColor: rec.displayColor || colorForStatus(status),
    };
  });
  return {
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    lifecycleLadder: [
      "SLOT ⚪",
      "NOT_CONFIGURED ⚪",
      "CREDENTIALS_DETECTED 🟡",
      "PROBE_RUNNING 🟡",
      "READY 🟢",
      "PRODUCTION_CERTIFIED 🟢⭐",
      "MISSION_CRITICAL 🟢⭐⭐",
    ],
    trustMarks: {
      SLOT: "⚪",
      NOT_CONFIGURED: "⚪",
      CREDENTIALS_DETECTED: "🟡",
      PROBE_RUNNING: "🟡",
      READY: "🟢",
      PRODUCTION_CERTIFIED: "🟢⭐",
      MISSION_CRITICAL: "🟢⭐⭐",
    },
    checkedAt: state?.checkedAt || null,
    source: state ? "persisted-probe-state" : "empty-not-tested",
    greenCount: providers.filter((p) => p.displayColor === "green").length,
    certifiedCount: providers.filter(
      (p) =>
        p.Lifecycle === "PRODUCTION_CERTIFIED" || p.Lifecycle === "MISSION_CRITICAL",
    ).length,
    missionCriticalCount: providers.filter((p) => p.Lifecycle === "MISSION_CRITICAL").length,
    providers,
    factories: state?.factories || null,
    factoryReadiness: state?.factories || null,
    alerts: state?.alerts || [],
    vercelAutoDeployBlocked: true,
    secretsExposed: false,
    probeRequired: !state,
    actions: [
      "Run Configuration Check",
      "Run Live Probe",
      "Run Full Verification",
      "Test One Provider",
      "Test Factory",
      "View Probe Details",
      "View Error",
      "Copy Safe Diagnostic Report",
      "PRODUCTION CERTIFIED ⭐",
      "MISSION CRITICAL ⭐⭐",
    ],
  };
}

function runCliHealth({ mode = "live", provider = null, factory = null } = {}) {
  return new Promise((resolve, reject) => {
    const args = [path.join(rootDir, "enterprise-ai/src/cli.js"), "--health", `--mode=${mode}`];
    if (provider) args.push(`--provider=${provider}`);
    if (factory) args.push(`--factory=${factory}`);
    const child = spawn(process.execPath, args, {
      cwd: rootDir,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (err) {
        reject(
          new Error(
            `HEALTH_CLI_FAILED code=${code} err=${stderr.slice(0, 300)} out=${stdout.slice(0, 300)}`,
          ),
        );
      }
    });
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const providerId = url.searchParams.get("provider");
    const state = readJson(STATE_REL);
    const history = readJson(HISTORY_REL);
    const dashboard = buildDashboard(state);
    let probeDetails = null;
    if (providerId) {
      const row = dashboard.providers.find((p) => p.providerId === providerId || p.id === providerId);
      probeDetails = {
        provider: row || null,
        history: history?.byProvider?.[providerId] || [],
      };
    }
    return Response.json({ ...dashboard, probeDetails });
  } catch (error) {
    return Response.json(
      {
        error: String(error?.message || error),
        ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
        providers: [],
        greenCount: 0,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "approved-generation-test") {
      return Response.json(
        {
          ok: false,
          error: "APPROVAL_REQUIRED",
          message:
            "Paid media generation tests require explicit admin approval and are not run automatically.",
          generationVerified: false,
        },
        { status: 403 },
      );
    }
    if (body.action === "mission-critical") {
      const provider = body.provider;
      if (!provider) {
        return Response.json(
          {
            ok: false,
            error: "PROVIDER_REQUIRED",
            message: "mission-critical requires provider id",
          },
          { status: 400 },
        );
      }
      const promoted = await new Promise((resolve, reject) => {
        const args = [
          path.join(rootDir, "enterprise-ai/src/cli.js"),
          "--health",
          `--provider=${provider}`,
          "--mission-critical",
          "--json",
        ];
        const child = spawn(process.execPath, args, {
          cwd: rootDir,
          env: { ...process.env },
          stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => {
          stdout += d;
        });
        child.stderr.on("data", (d) => {
          stderr += d;
        });
        child.on("error", reject);
        child.on("close", (code) => {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error(`MISSION_CRITICAL_CLI_FAILED code=${code} ${stderr.slice(0, 200)}`));
          }
        });
      });
      const state = readJson(STATE_REL);
      const dashboard = buildDashboard(state);
      return Response.json({
        ...dashboard,
        ...promoted,
        source: "mission-critical",
        vercelAutoDeployBlocked: true,
        secretsExposed: false,
      });
    }
    if (body.action === "certify") {
      const provider = body.provider;
      if (!provider) {
        return Response.json(
          { ok: false, error: "PROVIDER_REQUIRED", message: "certify requires provider id" },
          { status: 400 },
        );
      }
      // CLI --certify runs a live probe then promotes READY → PRODUCTION CERTIFIED ⭐
      const certify = await new Promise((resolve, reject) => {
        const args = [
          path.join(rootDir, "enterprise-ai/src/cli.js"),
          "--health",
          `--provider=${provider}`,
          "--certify",
          "--json",
        ];
        const child = spawn(process.execPath, args, {
          cwd: rootDir,
          env: { ...process.env },
          stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => {
          stdout += d;
        });
        child.stderr.on("data", (d) => {
          stderr += d;
        });
        child.on("error", reject);
        child.on("close", (code) => {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error(`CERTIFY_CLI_FAILED code=${code} ${stderr.slice(0, 200)}`));
          }
        });
      });
      const state = readJson(STATE_REL);
      const dashboard = buildDashboard(state);
      return Response.json({
        ...dashboard,
        ...certify,
        source: "production-certify",
        vercelAutoDeployBlocked: true,
        secretsExposed: false,
      });
    }
    const mode = ["config", "live", "full"].includes(body.mode) ? body.mode : "live";
    const health = await runCliHealth({
      mode,
      provider: body.provider || null,
      factory: body.factory || null,
    });
    const state = readJson(STATE_REL);
    const dashboard = buildDashboard(state);
    return Response.json({
      ...dashboard,
      source: "live-probe",
      mode: health.mode || mode,
      modes: health.modes,
      factoryReadiness: health.factories || dashboard.factoryReadiness,
      snapshotPath: health.snapshotPath || null,
      vercelAutoDeployBlocked: true,
      secretsExposed: false,
    });
  } catch (error) {
    return Response.json(
      {
        error: String(error?.message || error),
        ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
        providers: [],
        greenCount: 0,
      },
      { status: 500 },
    );
  }
}

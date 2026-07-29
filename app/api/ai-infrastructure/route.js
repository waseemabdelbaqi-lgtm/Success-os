/**
 * AI Infrastructure dashboard API.
 * Green only after live authenticated probe success in the last health check.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rootDir = process.cwd();

async function loadLiveStatus() {
  const mod = await import(
    pathToFileURL(path.join(rootDir, "enterprise-ai/src/providers/live-status.js")).href
  );
  return mod;
}

async function loadRegistry() {
  const mod = await import(
    pathToFileURL(path.join(rootDir, "enterprise-ai/src/providers/registry.js")).href
  );
  return mod;
}

async function loadFactories() {
  const mod = await import(
    pathToFileURL(path.join(rootDir, "enterprise-ai/src/factories/registry.js")).href
  );
  return mod;
}

function dashboardPayload(snapshot, factories) {
  const dashboard =
    snapshot?.dashboard ||
    null;
  return {
    rule: "GREEN_ONLY_AFTER_LIVE_AUTHENTICATED_SUCCESS",
    ruleAr: "لا يظهر أي مزود باللون الأخضر إلا إذا نجح طلب حي موثّق خلال آخر فحص.",
    checkedAt: snapshot?.checkedAt || null,
    savedAt: snapshot?.savedAt || null,
    greenCount: dashboard?.greenCount ?? 0,
    ready: snapshot?.ready || [],
    providers: dashboard?.providers || [],
    factories: factories?.factories || [],
    infrastructure: factories?.infrastructure || [],
    secretsExposed: false,
  };
}

/** GET — last snapshot (no live network probes). Use POST to refresh. */
export async function GET() {
  try {
    const { loadHealthSnapshot, buildInfrastructureDashboard } = await loadLiveStatus();
    const { summarizeFactories } = await loadFactories();
    const snapshot = loadHealthSnapshot(rootDir);
    const dashboard =
      snapshot?.dashboard ||
      buildInfrastructureDashboard(snapshot?.providers || [], {
        checkedAt: snapshot?.checkedAt || null,
      });
    const factories = await summarizeFactories({
      liveProbes: snapshot?.providers || [],
      rootDir,
    });
    return Response.json({
      ...dashboardPayload({ ...snapshot, dashboard }, factories),
      source: snapshot ? "last-probe-snapshot" : "empty-untested",
      probeRequired: !snapshot,
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

/** POST — run live authenticated health checks and persist snapshot. */
export async function POST() {
  try {
    const { runAllHealthChecks } = await loadRegistry();
    const { summarizeFactories } = await loadFactories();
    const health = await runAllHealthChecks({ rootDir, persist: true });
    const factories = await summarizeFactories({
      liveProbes: health.providers || [],
      rootDir,
    });
    return Response.json({
      ...dashboardPayload(health, factories),
      source: "live-probe",
      snapshotPath: health.snapshotPath || null,
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

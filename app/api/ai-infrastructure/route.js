/**
 * AI Infrastructure dashboard API — reads persisted live probe state only.
 * POST runs config/live/full verification (never deploys, never paid media generation).
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rootDir = process.cwd();

async function load(rel) {
  return import(pathToFileURL(path.join(rootDir, rel)).href);
}

export async function GET(request) {
  try {
    const { loadHealthState, buildDashboardFromState, historyStatsFor } = await load(
      "enterprise-ai/src/providers/health-store.js",
    );
    const { summarizeFactories } = await load("enterprise-ai/src/factories/registry.js");
    const url = new URL(request.url);
    const providerId = url.searchParams.get("provider");

    const state = loadHealthState(rootDir);
    const dashboard = buildDashboardFromState(state, rootDir);
    const factories = await summarizeFactories({
      rootDir,
      factoryReadiness: state?.factories || null,
    });

    let probeDetails = null;
    if (providerId) {
      const row = dashboard.providers.find((p) => p.providerId === providerId || p.id === providerId);
      probeDetails = {
        provider: row || null,
        history: historyStatsFor(providerId, rootDir),
      };
    }

    return Response.json({
      ...dashboard,
      factories: factories.factories,
      factoryReadiness: state?.factories || factories.factoryReadiness,
      infrastructure: factories.infrastructure,
      probeDetails,
      actions: [
        "Run Configuration Check",
        "Run Live Probe",
        "Run Full Verification",
        "Test One Provider",
        "Test Factory",
        "View Probe Details",
        "View Error",
        "Copy Safe Diagnostic Report",
      ],
      vercelAutoDeployBlocked: true,
      secretsExposed: false,
      probeRequired: !state,
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

export async function POST(request) {
  try {
    const { runHealthCommand } = await load("enterprise-ai/src/providers/health-runner.js");
    const body = await request.json().catch(() => ({}));
    const mode = ["config", "live", "full"].includes(body.mode) ? body.mode : "live";

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

    const health = await runHealthCommand({
      mode,
      provider: body.provider || null,
      factory: body.factory || null,
      rootDir,
      persist: true,
    });

    const safeReport = {
      checkedAt: health.checkedAt,
      mode: health.mode,
      ready: health.ready,
      factories: health.factories,
      providers: (health.providers || []).map((p) => ({
        providerId: p.providerId,
        displayName: p.displayName,
        status: p.status,
        liveProbe: p.liveProbe,
        testedAt: p.testedAt,
        latencyMs: p.latencyMs,
        model: p.model,
        safeErrorMessage: p.safeErrorMessage,
        displayColor: p.displayColor,
        connectionReady: p.connectionReady,
        generationVerified: p.generationVerified,
      })),
      alerts: health.alerts,
      vercelAutoDeployBlocked: true,
      secretsExposed: false,
    };

    return Response.json({
      ...health.dashboard,
      factories: health.factories,
      factoryReadiness: health.factories,
      source: "live-probe",
      mode: health.mode,
      modes: health.modes,
      snapshotPath: health.snapshotPath,
      safeDiagnosticReport: safeReport,
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

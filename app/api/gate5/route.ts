import { NextRequest, NextResponse } from "next/server";
import { applyMigrations } from "@/src/lib/book-engine/db/client";
import {
  buildExpectedVsActualAudit,
  classifyGaps,
  computeGate5Readiness,
  getLiveTotals,
  persistGate5Snapshot,
  runContentQualityScan,
  scoreSampleBooks,
  validatePublishedBooks,
} from "@/src/lib/gate5/audit";
import {
  runAccessibilitySpotChecks,
  runBackupRestoreTest,
  runFinalCountryOnboardingTest,
  runInteractionSmoke,
  runPerformanceSpotChecks,
  runRouteAudit,
  runSecurityAudit,
} from "@/src/lib/gate5/qa";
import { advanceEligibleCompanionPublications, backfillMissingBookVersions } from "@/src/lib/gate5/advance-eligible";
import { getFactoryQueueStats } from "@/src/lib/curriculum-factory/queue/factory-queue";
import { getProductionMonitorSnapshot } from "@/src/lib/curriculum-factory/monitoring/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  try {
    applyMigrations();
    const view = req.nextUrl.searchParams.get("view") || "status";
    if (view === "status") {
      return json({
        ok: true,
        gate: 5,
        releaseCandidate: "rc-gate5-jordan-final",
        freeze: "unrelated features frozen",
        totals: getLiveTotals(),
        queue: getFactoryQueueStats(),
      });
    }
    if (view === "totals") return json({ ok: true, totals: getLiveTotals() });
    if (view === "audit") {
      const audit = buildExpectedVsActualAudit();
      const gaps = classifyGaps(audit.rows);
      return json({
        ok: true,
        summary: audit.summary,
        gapCounts: gaps.byCode,
        gapSample: gaps.gaps.slice(0, 50),
        expected: audit.expected,
      });
    }
    if (view === "quality") return json({ ok: true, quality: runContentQualityScan(), publishedValidation: validatePublishedBooks() });
    if (view === "scores") return json({ ok: true, scores: scoreSampleBooks(15) });
    if (view === "monitor") return json({ ok: true, snapshot: getProductionMonitorSnapshot() });
    return json({ ok: false, error: "unknown view" }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    applyMigrations();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "backfill_versions") {
      return json({ ok: true, backfilled: backfillMissingBookVersions(Number(body.limit || 500)) });
    }
    if (action === "advance_eligible") {
      return json({
        ok: true,
        result: advanceEligibleCompanionPublications(Number(body.limit || 50)),
      });
    }
    if (action === "run_final_audit") {
      const backfilled = backfillMissingBookVersions(1000);
      // Process eligible companions in batches (limit to avoid timeout; caller may loop)
      const advanced = advanceEligibleCompanionPublications(Number(body.publishLimit || 25));

      const audit = buildExpectedVsActualAudit();
      const gaps = classifyGaps(audit.rows);
      const quality = runContentQualityScan();
      const publishedValidation = validatePublishedBooks();

      const routes = await runRouteAudit();
      const security = await runSecurityAudit();
      const a11y = await runAccessibilitySpotChecks();
      const perf = await runPerformanceSpotChecks();
      const interaction = await runInteractionSmoke();
      const onboarding = runFinalCountryOnboardingTest();
      const backup = runBackupRestoreTest();

      const allOp = [...routes, ...security, ...a11y, ...perf, ...interaction, ...onboarding, backup];
      const operationalTestsPassed = allOp.filter((t) => t.severity === "critical").every((t) => t.passed);
      const securityCriticalFailures = security.filter((t) => t.severity === "critical" && !t.passed).length;
      const accessibilityCriticalFailures = a11y.filter((t) => t.severity === "critical" && !t.passed).length;
      const globalReusePassed = onboarding.filter((t) => t.name.includes("global") || t.name.includes("onboarding")).every((t) => t.passed);

      const readiness = computeGate5Readiness({
        auditSummary: audit.summary,
        gapsByCode: gaps.byCode,
        queue: getFactoryQueueStats(),
        quality,
        operationalTestsPassed,
        globalReusePassed,
        securityCriticalFailures,
        accessibilityCriticalFailures,
        backupRestorePassed: backup.passed,
      });

      const report = {
        releaseCandidate: "rc-gate5-jordan-final",
        generatedAt: new Date().toISOString(),
        backfilled,
        advanced,
        totals: getLiveTotals(),
        auditSummary: audit.summary,
        gapCounts: gaps.byCode,
        gapSample: gaps.gaps.slice(0, 40),
        quality,
        publishedValidation,
        tests: {
          routes,
          security,
          accessibility: a11y,
          performance: perf,
          interaction,
          onboarding,
          backup,
        },
        readiness,
        monitor: getProductionMonitorSnapshot(),
      };

      const snapshotId = persistGate5Snapshot(report, readiness.verdict, readiness.readyForNextCountry);
      return json({ ok: true, snapshotId, report });
    }

    return json({ ok: false, error: "unknown action" }, 400);
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      500,
    );
  }
}

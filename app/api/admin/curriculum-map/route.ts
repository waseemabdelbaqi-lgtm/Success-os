import { NextResponse } from "next/server";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function loadRecovery() {
  return import(
    /* webpackIgnore: true */ path.join(
      process.cwd(),
      "workers/curriculum-ingestion/src/pipelines/jordan-recovery.js",
    )
  );
}

export async function GET() {
  try {
    const recovery = await loadRecovery();
    const pack = recovery.getEvidencePack();
    const metrics = recovery.getJordanSeparatedMetrics();
    if (!pack) {
      return json({
        ok: false,
        error: "EVIDENCE_PACK_MISSING",
        hint: "Run: npm run curriculum:jordan:recovery",
        metrics,
      }, 404);
    }
    return json({
      ok: true,
      pack: {
        id: pack.id,
        status: pack.status,
        mode: pack.mode,
        target: pack.target,
        claims: pack.claims,
        officialSources: pack.officialSources,
        proposedMapForReview: pack.proposedMapForReview,
        gaps: pack.gaps,
        counts: pack.counts,
        autoGate: pack.autoGate,
        rights: pack.rights,
        reviews: pack.reviews || {},
        approvedAt: pack.approvedAt || null,
        approvedBy: pack.approvedBy || null,
      },
      metrics,
      lessonGenerationAllowed: pack.status === "APPROVED" && pack.autoGate?.lessonGenerationAllowed === false
        ? false
        : pack.status === "APPROVED",
      note:
        "Lesson generation remains blocked until curriculum map is approved AND a Jordan original lesson pipeline is explicitly run. OpenStax is never Jordan.",
    });
  } catch (err) {
    return json({ ok: false, error: String((err as Error)?.message || err) }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      reviews?: Record<string, string | boolean>;
      approvedBy?: string;
      itemId?: string;
      decision?: string;
      title?: string;
    };
    const recovery = await loadRecovery();
    const pack = recovery.getEvidencePack();
    if (!pack) return json({ ok: false, error: "EVIDENCE_PACK_MISSING" }, 404);

    if (body.action === "review-item") {
      const reviews = { ...(pack.reviews || {}) };
      if (!body.itemId || !body.decision) {
        return json({ ok: false, error: "ITEM_AND_DECISION_REQUIRED" }, 400);
      }
      reviews[body.itemId] = body.decision;
      if (body.title) reviews[`${body.itemId}__title`] = body.title;
      const updated = recovery.saveCurriculumMapReviews(pack.id, reviews);
      return json({ ok: true, reviews: updated?.reviews || reviews, status: updated?.status });
    }

    if (body.action === "save-reviews") {
      const reviews = { ...(pack.reviews || {}), ...(body.reviews || {}) };
      const updated = recovery.saveCurriculumMapReviews(pack.id, reviews);
      return json({ ok: true, reviews: updated?.reviews || reviews });
    }

    if (body.action === "approve-curriculum-map") {
      const result = recovery.approveCurriculumMap(pack.id, {
        approvedBy: body.approvedBy || "admin",
      });
      return json(result, result.ok ? 200 : 400);
    }

    return json({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  } catch (err) {
    return json({ ok: false, error: String((err as Error)?.message || err) }, 500);
  }
}

/**
 * Interactive Lesson Engine API — foundation.
 * No curriculum import. No AI video generation.
 */
import {
  engineStatus,
  listEngineCatalog,
  resolveLessonPackage,
  buildOutlines,
} from "@/lib/interactive-lesson-engine";
import { listBlockLibrary } from "@/lib/interactive-lesson-engine/block-library";
import { FUTURE_CAPABILITY_PLACEHOLDERS } from "@/lib/interactive-lesson-engine/future-placeholders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "status";

    if (action === "status") {
      return Response.json({ ok: true, ...engineStatus() });
    }

    if (action === "blocks") {
      return Response.json({ ok: true, blocks: listBlockLibrary() });
    }

    if (action === "placeholders") {
      return Response.json({
        ok: true,
        phase: "foundation",
        aiVideoGeneration: false,
        curriculumIngestion: false,
        placeholders: FUTURE_CAPABILITY_PLACEHOLDERS,
      });
    }

    if (action === "catalog") {
      const filters = {
        country: url.searchParams.get("country") || undefined,
        curriculum: url.searchParams.get("curriculum") || undefined,
        grade: url.searchParams.get("grade") || undefined,
        subject: url.searchParams.get("subject") || undefined,
        language: url.searchParams.get("language") || undefined,
        difficulty: url.searchParams.get("difficulty") || undefined,
      };
      const catalog = listEngineCatalog(filters).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        source: p.source,
        filters: p.filters,
        difficulty: p.difficulty,
        estimatedMinutes: p.estimatedMinutes,
      }));
      return Response.json({ ok: true, filters, count: catalog.length, catalog });
    }

    if (action === "lesson") {
      const pkg = resolveLessonPackage({
        packageId: url.searchParams.get("packageId"),
        bookId: url.searchParams.get("bookId"),
        unitId: url.searchParams.get("unitId"),
        lessonId: url.searchParams.get("lessonId"),
      });
      if (!pkg) {
        return Response.json({ ok: false, error: "LESSON_NOT_FOUND" }, { status: 404 });
      }
      return Response.json({
        ok: true,
        package: pkg,
        outlines: buildOutlines(pkg),
      });
    }

    return Response.json({
      ok: true,
      actions: ["status", "blocks", "placeholders", "catalog", "lesson"],
      note: "Do not import curricula yet. Do not generate AI videos yet.",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error && error.message ? error.message : error) },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "preview";

    if (action === "generate-ai-video" || action === "import-curriculum") {
      return Response.json(
        {
          ok: false,
          error: "PHASE_LOCKED",
          message:
            "Foundation phase only. Do not generate AI videos or import curricula yet.",
        },
        { status: 403 },
      );
    }

    if (action === "publish" || action === "unpublish" || action === "version") {
      return Response.json({
        ok: true,
        action,
        persisted: false,
        note: "Admin editor tracks changes client-side in this foundation phase.",
      });
    }

    return Response.json({
      ok: true,
      action,
      note: "Placeholder POST accepted without side effects.",
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error && error.message ? error.message : error) },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import {
  findEquivalentLessons,
  getUniversalCurriculumMappingSnapshot,
  listLearningObjectives,
  listMappings,
  runUniversalCurriculumMapping,
  searchUniversalCurriculum,
  uceEngineStatus,
} from "@/lib/universal-curriculum-mapping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Universal Curriculum Mapping Engine API — translation layer only.
 * Never generates lessons, videos, books, quizzes, or assessments.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  if (action === "status") {
    return NextResponse.json({ ok: true, ...uceEngineStatus() });
  }

  if (action === "snapshot" || action === "registry") {
    const result = runUniversalCurriculumMapping({ reset: true });
    return NextResponse.json({
      ok: result.ok,
      snapshot: result.snapshot,
      examplePathway: result.examplePathway,
      note: "Mappings reference Global IDs — curricula are related, not copied.",
    });
  }

  if (action === "mappings") {
    runUniversalCurriculumMapping({ reset: true });
    const relation = url.searchParams.get("relation") || undefined;
    const globalId = url.searchParams.get("globalId") || undefined;
    const minConfidence = url.searchParams.get("minConfidence");
    const rows = listMappings({
      relation: relation as never,
      globalId,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
    });
    return NextResponse.json({
      ok: true,
      mappings: rows,
      counts: { mappings: rows.length },
    });
  }

  if (action === "equivalents") {
    runUniversalCurriculumMapping({ reset: true });
    const lessonId = url.searchParams.get("lessonId") || "LSN-01001";
    const rows = findEquivalentLessons(lessonId);
    return NextResponse.json({
      ok: true,
      lessonId,
      mappings: rows,
      pathway: getUniversalCurriculumMappingSnapshot().examplePathway,
      note: "Jordan G8 Science → IGCSE → AP → NGSS → IB MYP → Cambridge LS → Future AI Recommendations",
    });
  }

  if (action === "objectives") {
    runUniversalCurriculumMapping({ reset: true });
    return NextResponse.json({
      ok: true,
      objectives: listLearningObjectives(),
      note: "Global Learning Objective Registry — links lessons, skills, assessments; digital books/videos/AI reserved.",
    });
  }

  if (action === "skill-graph") {
    const snap = runUniversalCurriculumMapping({ reset: true }).snapshot;
    return NextResponse.json({
      ok: true,
      skillGraph: snap.skillGraph,
      note: "Skills connect lessons across countries via Global Skill Registry ids.",
    });
  }

  if (action === "search") {
    runUniversalCurriculumMapping({ reset: true });
    const result = searchUniversalCurriculum({
      q: url.searchParams.get("q") || undefined,
      country: url.searchParams.get("country") || undefined,
      curriculum: url.searchParams.get("curriculum") || undefined,
      grade: url.searchParams.get("grade") || undefined,
      subject: url.searchParams.get("subject") || undefined,
      book: url.searchParams.get("book") || undefined,
      lesson: url.searchParams.get("lesson") || undefined,
      skill: url.searchParams.get("skill") || undefined,
      objective: url.searchParams.get("objective") || undefined,
      keyword: url.searchParams.get("keyword") || undefined,
      standard: url.searchParams.get("standard") || undefined,
      language: url.searchParams.get("language") || undefined,
      limit: url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : 25,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const action = String(body.action || "");

  if (action === "run" || action === "run-uce") {
    const result = runUniversalCurriculumMapping({ reset: true });
    return NextResponse.json({
      ok: result.ok,
      note: "Universal Curriculum Mapping Engine — relationships only, no content generation",
      result,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}

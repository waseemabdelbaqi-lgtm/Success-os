import { NextResponse } from "next/server";
import { applyMigrations, listTables } from "@/src/lib/book-engine/db/client";
import { seedGate2EngineTestBook } from "@/src/lib/book-engine/content/seed-g1-math-engine-test";
import {
  addBookmark,
  addHighlight,
  getBookBundle,
  getBookProgress,
  gradeQuestion,
  listAnnotations,
  publishVersion,
  saveAnnotation,
  searchBook,
  upsertBookProgress,
  upsertNote,
  createNewDraftVersion,
} from "@/src/lib/book-engine/repository";
import { validateBookVersion } from "@/src/lib/book-engine/validation/validate-book-version";
import { evaluateMathAnswer } from "@/src/lib/book-engine/math/evaluate";
import { ACTIVITY_TYPES, BLOCK_TYPES } from "@/src/lib/book-engine/schema/blocks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "status";

  if (view === "status") {
    const mig = applyMigrations();
    return NextResponse.json({
      ok: true,
      gate: 2,
      engine: "Success OS Interactive Book Engine",
      migrations: mig,
      tables: listTables(),
      blockTypes: BLOCK_TYPES.length,
      activityTypes: ACTIVITY_TYPES.length,
      activityTypesList: ACTIVITY_TYPES,
      note: "Mass book generation disabled. Engine test book only. Legacy /api/book-engine left untouched.",
    });
  }

  if (view === "seed") {
    const seeded = seedGate2EngineTestBook();
    return NextResponse.json({ ok: true, seeded, completenessClaim: "engine_test_only_not_complete" });
  }

  if (view === "book") {
    applyMigrations();
    seedGate2EngineTestBook();
    const id = searchParams.get("id") || "book-jo-g1-s1-math";
    const bundle = getBookBundle(id);
    if (!bundle) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      bundle,
      completenessClaim: bundle.completenessClaim,
      falselyMarkedComplete: false,
    });
  }

  if (view === "search") {
    const bookId = searchParams.get("bookId") || "book-jo-g1-s1-math";
    const q = searchParams.get("q") || "";
    const bundle = getBookBundle(bookId);
    if (!bundle) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      results: searchBook(String(bundle.version.id), q),
    });
  }

  if (view === "annotations") {
    const studentKey = searchParams.get("studentKey") || "gate2-tester";
    const bookId = searchParams.get("bookId") || "book-jo-g1-s1-math";
    const bundle = getBookBundle(bookId);
    if (!bundle) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      progress: getBookProgress(studentKey, String(bundle.version.id)),
      annotations: listAnnotations(studentKey, String(bundle.version.id)),
    });
  }

  if (view === "validate") {
    applyMigrations();
    seedGate2EngineTestBook();
    const bookId = searchParams.get("bookId") || "book-jo-g1-s1-math";
    const bundle = getBookBundle(bookId);
    if (!bundle) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const report = validateBookVersion(String(bundle.version.id));
    return NextResponse.json({ ok: true, report, completenessClaim: bundle.completenessClaim });
  }

  return NextResponse.json({ ok: false, error: "unknown_view" }, { status: 400 });
}

export async function POST(request: Request) {
  applyMigrations();
  seedGate2EngineTestBook();
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");
  const studentKey = String(body.studentKey || "gate2-tester");
  const bookId = String(body.bookId || "book-jo-g1-s1-math");
  const bundle = getBookBundle(bookId);
  if (!bundle && action !== "math_eval") {
    return NextResponse.json({ ok: false, error: "book_not_found" }, { status: 404 });
  }

  if (action === "progress") {
    const id = upsertBookProgress({
      studentKey,
      bookVersionId: String(bundle!.version.id),
      lastLessonId: body.lastLessonId ? String(body.lastLessonId) : undefined,
      lastPageId: body.lastPageId ? String(body.lastPageId) : undefined,
      lastBlockId: body.lastBlockId ? String(body.lastBlockId) : undefined,
      mode: body.mode ? String(body.mode) : "lesson",
    });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "bookmark") {
    const id = addBookmark({
      studentKey,
      bookVersionId: String(bundle!.version.id),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      blockId: body.blockId ? String(body.blockId) : undefined,
      label: body.label ? String(body.label) : undefined,
    });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "highlight") {
    const id = addHighlight({
      studentKey,
      bookVersionId: String(bundle!.version.id),
      blockId: String(body.blockId),
      color: String(body.color || "yellow"),
    });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "note") {
    const id = upsertNote({
      id: body.id ? String(body.id) : undefined,
      studentKey,
      bookVersionId: String(bundle!.version.id),
      lessonId: body.lessonId ? String(body.lessonId) : undefined,
      blockId: body.blockId ? String(body.blockId) : undefined,
      body: String(body.body || ""),
      noteType: body.noteType ? String(body.noteType) : "personal",
    });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "annotation") {
    const id = saveAnnotation({
      studentKey,
      bookVersionId: String(bundle!.version.id),
      pageId: body.pageId ? String(body.pageId) : undefined,
      blockId: body.blockId ? String(body.blockId) : undefined,
      strokeJson: String(body.strokeJson || "[]"),
      tool: body.tool ? String(body.tool) : "pen",
    });
    return NextResponse.json({ ok: true, id });
  }

  if (action === "grade") {
    const result = gradeQuestion({
      studentKey,
      questionId: String(body.questionId),
      response: body.response,
      hintLevel: Number(body.hintLevel || 0),
    });
    return NextResponse.json(result);
  }

  if (action === "math_eval") {
    const result = evaluateMathAnswer({
      student: String(body.student || ""),
      correct: body.correct as string | string[],
      tolerance: body.tolerance as number | undefined,
      unit: body.unit ? String(body.unit) : undefined,
      studentUnit: body.studentUnit ? String(body.studentUnit) : undefined,
    });
    return NextResponse.json({ ok: true, result });
  }

  if (action === "new_version") {
    const id = createNewDraftVersion(bookId, String(body.createdBy || "admin"));
    return NextResponse.json({ ok: true, versionId: id });
  }

  if (action === "publish") {
    const result = publishVersion(String(bundle!.version.id), String(body.reviewer || "admin"));
    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
}

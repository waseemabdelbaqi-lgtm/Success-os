#!/usr/bin/env node
/**
 * Gate 2 automated tests — executed, not claimed.
 * Run: node scripts/gate2-book-engine-tests.mjs
 */
import { createRequire } from "module";
import { spawn } from "child_process";

const require = createRequire(import.meta.url);

// Prefer direct library tests without needing Next server for DB/math/validation
async function runLocal() {
  // Dynamic import via next path won't work without ts; use compiled approach via API if server up.
  const base = process.env.BOOK_ENGINE_BASE || "http://127.0.0.1:3000";
  const results = [];
  const check = async (name, fn) => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log("PASS", name);
    } catch (e) {
      results.push({ name, passed: false, error: String(e.message || e) });
      console.log("FAIL", name, e.message || e);
    }
  };

  await check("migrations_and_status", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine?view=status`);
    const j = await r.json();
    if (!j.ok) throw new Error("status not ok");
    if (!j.tables || j.tables.length < 30) throw new Error(`tables=${j.tables?.length}`);
  });

  await check("seed_engine_test_book", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine?view=seed`);
    const j = await r.json();
    if (!j.ok) throw new Error("seed failed");
    if (j.completenessClaim !== "engine_test_only_not_complete") {
      throw new Error(`false complete claim: ${j.completenessClaim}`);
    }
  });

  let bundle;
  await check("book_open_bundle", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine?view=book&id=book-jo-g1-s1-math`);
    const j = await r.json();
    if (!j.ok || !j.bundle) throw new Error("no bundle");
    if (j.bundle.completenessClaim === "complete" || String(j.bundle.completenessClaim).includes("100%")) {
      throw new Error("book falsely marked complete");
    }
    bundle = j.bundle;
    if (!bundle.units?.[0]?.lessons?.[0]?.blocks?.length) throw new Error("no blocks");
  });

  await check("search", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine?view=search&bookId=book-jo-g1-s1-math&q=${encodeURIComponent("عدد")}`);
    const j = await r.json();
    if (!j.ok || !j.results.length) throw new Error("no search hits");
  });

  await check("progress_resume", async () => {
    const lessonId = bundle.units[0].lessons[0].id;
    let r = await fetch(`${base}/api/interactive-book-engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "progress",
        studentKey: "gate2-tester",
        bookId: "book-jo-g1-s1-math",
        lastLessonId: lessonId,
        mode: "lesson",
      }),
    });
    let j = await r.json();
    if (!j.ok) throw new Error("progress save failed");
    r = await fetch(`${base}/api/interactive-book-engine?view=annotations&bookId=book-jo-g1-s1-math&studentKey=gate2-tester`);
    j = await r.json();
    if (!j.ok || !j.progress) throw new Error("progress missing on resume");
  });

  await check("bookmark_highlight_note_handwriting", async () => {
    const lesson = bundle.units[0].lessons[0];
    const blockId = lesson.blocks[0].id;
    for (const body of [
      { action: "bookmark", lessonId: lesson.id, label: "test" },
      { action: "highlight", blockId, color: "yellow" },
      { action: "note", lessonId: lesson.id, body: "ملاحظة اختبار Gate2" },
      { action: "annotation", strokeJson: JSON.stringify([{ color: "#9e1722", width: 2, points: [{ x: 1, y: 1 }] }]) },
    ]) {
      const r = await fetch(`${base}/api/interactive-book-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, studentKey: "gate2-tester", bookId: "book-jo-g1-s1-math" }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(`${body.action} failed`);
    }
  });

  await check("correct_and_incorrect_answers_hints", async () => {
    const act = bundle.units[0].lessons[0].activities.find((a) => a.activity_type === "single_choice");
    const q = act.questions[0];
    // incorrect
    let r = await fetch(`${base}/api/interactive-book-engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "grade",
        studentKey: "gate2-tester",
        questionId: q.id,
        response: { index: 0 },
        hintLevel: 0,
      }),
    });
    let j = await r.json();
    if (!j.ok || j.correct) throw new Error("expected incorrect");
    if (!j.feedbackAr) throw new Error("missing hint/feedback");
    // correct
    r = await fetch(`${base}/api/interactive-book-engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "grade",
        studentKey: "gate2-tester",
        questionId: q.id,
        response: { index: 1 },
        hintLevel: 1,
      }),
    });
    j = await r.json();
    if (!j.ok || !j.correct) throw new Error("expected correct");
    if (typeof j.masteryScore !== "number") throw new Error("mastery missing");
  });

  await check("math_equivalence", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "math_eval", student: "١+١+١", correct: ["3", "1+1+1"] }),
    });
    const j = await r.json();
    if (!j.ok || !j.result.correct) throw new Error("math equivalence failed");
  });

  await check("validation_engine", async () => {
    const r = await fetch(`${base}/api/interactive-book-engine?view=validate`);
    const j = await r.json();
    if (!j.ok || !j.report) throw new Error("no report");
    if (j.completenessClaim !== "engine_test_only_not_complete") throw new Error("complete claim drift");
  });

  await check("reader_route", async () => {
    const r = await fetch(`${base}/interactive-books/reader/book-jo-g1-s1-math`);
    if (r.status !== 200) throw new Error(`reader status ${r.status}`);
    const html = await r.text();
    if (!html.includes("Book Engine") && !html.includes("محرك") && !html.includes("Gate 2")) {
      // still ok if client-rendered
      if (!html.includes("book-jo-g1-s1-math") && html.length < 500) throw new Error("reader html empty");
    }
  });

  await check("cms_route", async () => {
    const r = await fetch(`${base}/interactive-books/cms`);
    if (r.status !== 200) throw new Error(`cms ${r.status}`);
  });

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const summary = { gate: 2, passed, failed, total: results.length, results };
  console.log(JSON.stringify(summary, null, 2));
  if (failed) process.exit(1);
}

runLocal().catch((e) => {
  console.error(e);
  process.exit(1);
});

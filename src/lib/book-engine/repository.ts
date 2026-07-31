import { getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { evaluateMathAnswer } from "@/src/lib/book-engine/math/evaluate";
import { validateBookVersion } from "@/src/lib/book-engine/validation/validate-book-version";

export function getBookBundle(bookId: string) {
  const db = getBookEngineDb();
  const book = db.prepare("SELECT * FROM books WHERE id = ? AND deleted_at IS NULL").get(bookId) as
    | Record<string, unknown>
    | undefined;
  if (!book) return null;
  const version = db
    .prepare(
      "SELECT * FROM book_versions WHERE book_id = ? AND deleted_at IS NULL ORDER BY version_number DESC LIMIT 1",
    )
    .get(bookId) as Record<string, unknown>;
  const grade = db.prepare("SELECT * FROM grades WHERE id = ?").get(book.grade_id) as Record<string, unknown>;
  const subject = db.prepare("SELECT * FROM subjects WHERE id = ?").get(book.subject_id) as Record<
    string,
    unknown
  >;
  const semester = db.prepare("SELECT * FROM semesters WHERE id = ?").get(book.semester_id) as Record<
    string,
    unknown
  >;
  const units = db
    .prepare(
      "SELECT * FROM units WHERE book_version_id = ? AND deleted_at IS NULL ORDER BY position",
    )
    .all(version.id) as Array<Record<string, unknown>>;

  const unitPayload = units.map((u) => {
    const lessons = db
      .prepare("SELECT * FROM lessons WHERE unit_id = ? AND deleted_at IS NULL ORDER BY position")
      .all(u.id) as Array<Record<string, unknown>>;
    return {
      ...u,
      lessons: lessons.map((l) => {
        const blocks = db
          .prepare(
            "SELECT * FROM content_blocks WHERE lesson_id = ? AND deleted_at IS NULL ORDER BY position",
          )
          .all(l.id)
          .map((b: Record<string, unknown>) => ({
            ...b,
            content: JSON.parse(String(b.content_json || "{}")),
            configuration: b.config_json ? JSON.parse(String(b.config_json)) : null,
          }));
        const outcomes = db
          .prepare("SELECT * FROM learning_outcomes WHERE lesson_id = ? ORDER BY position")
          .all(l.id);
        const pages = db
          .prepare("SELECT * FROM book_pages WHERE lesson_id = ? ORDER BY position")
          .all(l.id);
        const activities = (
          db
            .prepare(
              "SELECT * FROM activities WHERE lesson_id = ? AND deleted_at IS NULL ORDER BY position",
            )
            .all(l.id) as Array<Record<string, unknown>>
        ).map((a) => {
          const questions = (
            db
              .prepare("SELECT * FROM questions WHERE activity_id = ? ORDER BY position")
              .all(a.id) as Array<Record<string, unknown>>
          ).map((q) => {
            const options = db
              .prepare("SELECT * FROM answer_options WHERE question_id = ? ORDER BY position")
              .all(q.id);
            const hints = db
              .prepare("SELECT * FROM hints WHERE question_id = ? ORDER BY level")
              .all(q.id);
            const explanation = db
              .prepare("SELECT * FROM answer_explanations WHERE question_id = ? LIMIT 1")
              .get(q.id);
            const answer = db.prepare("SELECT * FROM answers WHERE question_id = ? LIMIT 1").get(q.id) as
              | { value_json?: string; answer_kind?: string; tolerance?: number }
              | undefined;
            return {
              ...q,
              config: q.config_json ? JSON.parse(String(q.config_json)) : null,
              options,
              hints,
              explanation,
              // Do not expose correct answer payload to client until submit — keep id only for server eval
              hasAnswer: Boolean(answer),
            };
          });
          return {
            ...a,
            config: a.config_json ? JSON.parse(String(a.config_json)) : null,
            questions,
          };
        });
        return { ...l, blocks, outcomes, pages, activities };
      }),
    };
  });

  const sources = db.prepare("SELECT * FROM book_sources WHERE book_version_id = ?").all(version.id);
  const rights = db.prepare("SELECT * FROM book_rights WHERE book_version_id = ?").all(version.id);

  return {
    book,
    version,
    grade,
    subject,
    semester,
    units: unitPayload,
    sources,
    rights,
    completenessClaim: book.completeness_claim,
    gate1Verified: Boolean(book.gate1_verified),
  };
}

export function searchBook(bookVersionId: string, query: string) {
  const db = getBookEngineDb();
  const q = query.trim();
  if (!q) return [];
  const rows = db
    .prepare(
      `SELECT cb.id as blockId, cb.type, cb.content_json, l.id as lessonId, l.title_ar as lessonTitle,
              u.id as unitId, u.title_ar as unitTitle, b.title_ar as bookTitle, bp.official_page_label as pageLabel
       FROM content_blocks cb
       JOIN lessons l ON l.id = cb.lesson_id
       JOIN units u ON u.id = l.unit_id
       JOIN book_versions bv ON bv.id = u.book_version_id
       JOIN books b ON b.id = bv.book_id
       LEFT JOIN book_pages bp ON bp.id = cb.page_id
       WHERE u.book_version_id = ? AND cb.deleted_at IS NULL AND cb.content_json LIKE ?
       LIMIT 50`,
    )
    .all(bookVersionId, `%${q}%`) as Array<Record<string, unknown>>;

  return rows.map((r) => {
    const content = JSON.parse(String(r.content_json || "{}"));
    const blob = JSON.stringify(content);
    const idx = blob.indexOf(q);
    const snippet = idx >= 0 ? blob.slice(Math.max(0, idx - 40), idx + q.length + 40) : blob.slice(0, 80);
    return {
      bookTitle: r.bookTitle,
      unitId: r.unitId,
      unitTitle: r.unitTitle,
      lessonId: r.lessonId,
      lessonTitle: r.lessonTitle,
      blockId: r.blockId,
      pageLabel: r.pageLabel,
      matchingText: snippet,
      openPath: `?lesson=${r.lessonId}&block=${r.blockId}`,
    };
  });
}

export function upsertBookProgress(input: {
  studentKey: string;
  bookVersionId: string;
  lastLessonId?: string;
  lastPageId?: string;
  lastBlockId?: string;
  mode?: string;
}) {
  const db = getBookEngineDb();
  const existing = db
    .prepare("SELECT id FROM student_book_progress WHERE student_key = ? AND book_version_id = ?")
    .get(input.studentKey, input.bookVersionId) as { id: string } | undefined;
  const t = nowIso();
  if (existing) {
    db.prepare(
      `UPDATE student_book_progress SET last_lesson_id=?, last_page_id=?, last_block_id=?, mode=?, updated_at=? WHERE id=?`,
    ).run(
      input.lastLessonId || null,
      input.lastPageId || null,
      input.lastBlockId || null,
      input.mode || "lesson",
      t,
      existing.id,
    );
    return existing.id;
  }
  const id = uuid();
  db.prepare(
    `INSERT INTO student_book_progress (id,student_key,book_version_id,last_lesson_id,last_page_id,last_block_id,mode,updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.studentKey,
    input.bookVersionId,
    input.lastLessonId || null,
    input.lastPageId || null,
    input.lastBlockId || null,
    input.mode || "lesson",
    t,
  );
  return id;
}

export function getBookProgress(studentKey: string, bookVersionId: string) {
  const db = getBookEngineDb();
  return db
    .prepare("SELECT * FROM student_book_progress WHERE student_key = ? AND book_version_id = ?")
    .get(studentKey, bookVersionId);
}

export function addBookmark(input: {
  studentKey: string;
  bookVersionId: string;
  lessonId?: string;
  pageId?: string;
  blockId?: string;
  label?: string;
}) {
  const db = getBookEngineDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO student_bookmarks (id,student_key,book_version_id,lesson_id,page_id,block_id,label,created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.studentKey,
    input.bookVersionId,
    input.lessonId || null,
    input.pageId || null,
    input.blockId || null,
    input.label || null,
    nowIso(),
  );
  return id;
}

export function addHighlight(input: {
  studentKey: string;
  bookVersionId: string;
  blockId: string;
  color: string;
}) {
  const db = getBookEngineDb();
  const id = uuid();
  const t = nowIso();
  db.prepare(
    `INSERT INTO student_highlights (id,student_key,book_version_id,block_id,color,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(id, input.studentKey, input.bookVersionId, input.blockId, input.color, t, t);
  return id;
}

export function upsertNote(input: {
  id?: string;
  studentKey: string;
  bookVersionId: string;
  lessonId?: string;
  blockId?: string;
  body: string;
  noteType?: string;
}) {
  const db = getBookEngineDb();
  const t = nowIso();
  if (input.id) {
    db.prepare(`UPDATE student_notes SET body=?, updated_at=? WHERE id=? AND student_key=?`).run(
      input.body,
      t,
      input.id,
      input.studentKey,
    );
    return input.id;
  }
  const id = uuid();
  db.prepare(
    `INSERT INTO student_notes (id,student_key,book_version_id,lesson_id,block_id,note_type,body,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.studentKey,
    input.bookVersionId,
    input.lessonId || null,
    input.blockId || null,
    input.noteType || "personal",
    input.body,
    t,
    t,
  );
  return id;
}

export function saveAnnotation(input: {
  studentKey: string;
  bookVersionId: string;
  pageId?: string;
  blockId?: string;
  strokeJson: string;
  tool?: string;
}) {
  const db = getBookEngineDb();
  const id = uuid();
  const t = nowIso();
  db.prepare(
    `INSERT INTO student_annotations (id,student_key,book_version_id,page_id,block_id,stroke_json,tool,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    input.studentKey,
    input.bookVersionId,
    input.pageId || null,
    input.blockId || null,
    input.strokeJson,
    input.tool || "pen",
    t,
    t,
  );
  return id;
}

export function listAnnotations(studentKey: string, bookVersionId: string) {
  const db = getBookEngineDb();
  return {
    bookmarks: db
      .prepare("SELECT * FROM student_bookmarks WHERE student_key=? AND book_version_id=?")
      .all(studentKey, bookVersionId),
    highlights: db
      .prepare(
        "SELECT * FROM student_highlights WHERE student_key=? AND book_version_id=? AND deleted_at IS NULL",
      )
      .all(studentKey, bookVersionId),
    notes: db
      .prepare(
        "SELECT * FROM student_notes WHERE student_key=? AND book_version_id=? AND deleted_at IS NULL",
      )
      .all(studentKey, bookVersionId),
    drawings: db
      .prepare(
        "SELECT * FROM student_annotations WHERE student_key=? AND book_version_id=? AND deleted_at IS NULL",
      )
      .all(studentKey, bookVersionId),
  };
}

export function gradeQuestion(input: {
  studentKey: string;
  questionId: string;
  response: unknown;
  hintLevel?: number;
}) {
  const db = getBookEngineDb();
  const question = db.prepare("SELECT * FROM questions WHERE id = ?").get(input.questionId) as
    | Record<string, unknown>
    | undefined;
  if (!question) return { ok: false as const, error: "question_not_found" };

  const answer = db.prepare("SELECT * FROM answers WHERE question_id = ? LIMIT 1").get(input.questionId) as
    | { value_json: string; answer_kind: string; tolerance?: number }
    | undefined;
  const explanation = db
    .prepare("SELECT * FROM answer_explanations WHERE question_id = ? LIMIT 1")
    .get(input.questionId) as { explanation_ar?: string; step_by_step_ar?: string } | undefined;
  const hints = db
    .prepare("SELECT * FROM hints WHERE question_id = ? ORDER BY level")
    .all(input.questionId) as Array<{ level: number; text_ar: string }>;

  let correct = false;
  let feedbackAr = "";
  const value = answer ? JSON.parse(answer.value_json) : null;
  const response = input.response;

  if (question.kind === "single_choice" || question.kind === "true_false") {
    const idx = Number((response as { index?: number }).index);
    correct = idx === value?.correctIndex;
  } else if (question.kind === "drag_drop" || question.kind === "matching") {
    const pairs = (response as { pairs?: Record<string, string> }).pairs || {};
    correct = Object.keys(value || {}).every((k) => pairs[k] === value[k]);
  } else if (question.kind === "math_input" || question.kind === "fill_blank") {
    const student = String((response as { text?: string }).text || "");
    const evalResult = evaluateMathAnswer({
      student,
      correct: value?.correct || [],
      tolerance: answer?.tolerance ?? value?.tolerance ?? 0,
    });
    correct = evalResult.correct;
    feedbackAr = evalResult.messageAr;
  } else {
    correct = JSON.stringify(response) === JSON.stringify(value);
  }

  const hintLevel = input.hintLevel || 0;
  if (!correct) {
    const hint = hints.find((h) => h.level === Math.min(hintLevel + 1, 2));
    feedbackAr = hint?.text_ar || feedbackAr || "حاول مرة أخرى.";
  } else {
    feedbackAr = explanation?.explanation_ar || "صحيح.";
  }

  const attemptRow = db
    .prepare(
      "SELECT COUNT(*) as n FROM student_answers WHERE student_key=? AND question_id=?",
    )
    .get(input.studentKey, input.questionId) as { n: number };
  const attempt = Number(attemptRow.n) + 1;

  db.prepare(
    `INSERT INTO student_answers (id,student_key,question_id,attempt,response_json,is_correct,hint_level,created_at)
     VALUES (?,?,?,?,?,?,?,?)`,
  ).run(
    uuid(),
    input.studentKey,
    input.questionId,
    attempt,
    JSON.stringify(response),
    correct ? 1 : 0,
    correct ? hintLevel : Math.min(hintLevel + 1, 2),
    nowIso(),
  );

  // Mastery update for lesson
  const activity = db.prepare("SELECT lesson_id FROM activities WHERE id = ?").get(question.activity_id) as {
    lesson_id: string;
  };
  const stats = db
    .prepare(
      `SELECT AVG(is_correct) as acc FROM student_answers sa
       JOIN questions q ON q.id = sa.question_id
       JOIN activities a ON a.id = q.activity_id
       WHERE sa.student_key=? AND a.lesson_id=?`,
    )
    .get(input.studentKey, activity.lesson_id) as { acc: number };
  const score = Number(stats.acc || 0);
  db.prepare(
    `INSERT INTO student_mastery (id,student_key,lesson_id,score,updated_at) VALUES (?,?,?,?,?)`,
  ).run(uuid(), input.studentKey, activity.lesson_id, score, nowIso());

  const lessonProg = db
    .prepare("SELECT id FROM student_lesson_progress WHERE student_key=? AND lesson_id=?")
    .get(input.studentKey, activity.lesson_id) as { id: string } | undefined;
  if (lessonProg) {
    db.prepare(
      `UPDATE student_lesson_progress SET accuracy=?, status=?, updated_at=? WHERE id=?`,
    ).run(score, score >= 0.7 ? "completed" : "started", nowIso(), lessonProg.id);
  } else {
    db.prepare(
      `INSERT INTO student_lesson_progress (id,student_key,lesson_id,status,accuracy,time_spent_sec,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      input.studentKey,
      activity.lesson_id,
      score >= 0.7 ? "completed" : "started",
      score,
      0,
      nowIso(),
    );
  }

  return {
    ok: true as const,
    correct,
    feedbackAr,
    explanationAr: correct || hintLevel >= 2 ? explanation?.explanation_ar : undefined,
    stepsAr: correct || hintLevel >= 2 ? explanation?.step_by_step_ar : undefined,
    nextHintLevel: correct ? hintLevel : Math.min(hintLevel + 1, 2),
    masteryScore: score,
    showAnswer: correct || hintLevel >= 2,
  };
}

export function createNewDraftVersion(bookId: string, createdBy: string) {
  const db = getBookEngineDb();
  const latest = db
    .prepare(
      "SELECT * FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1",
    )
    .get(bookId) as { id: string; version_number: number; status: string };
  if (!latest) throw new Error("no_version");
  // Do not edit published in place — new draft
  const id = uuid();
  const t = nowIso();
  db.prepare(
    `INSERT INTO book_versions (id,book_id,version_number,status,edition_label,language,replaces_version_id,created_by,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    bookId,
    latest.version_number + 1,
    "DRAFT",
    "NEEDS VERIFICATION",
    "ar",
    latest.id,
    createdBy,
    t,
    t,
  );
  return id;
}

export function publishVersion(bookVersionId: string, reviewer: string) {
  const db = getBookEngineDb();
  const report = validateBookVersion(bookVersionId);
  db.prepare(
    `INSERT INTO validation_reports (id,book_version_id,passed,report_json,created_at) VALUES (?,?,?,?,?)`,
  ).run(uuid(), bookVersionId, report.passed ? 1 : 0, JSON.stringify(report), nowIso());
  if (!report.passed) {
    return { ok: false as const, report };
  }
  // For Gate 2 engine test we allow publishing DRAFT after technical validation only if reviewer approves
  // but still require no false completeness — seed book stays engine_test_only
  const t = nowIso();
  db.prepare(
    `INSERT INTO approvals (id,book_version_id,approval_type,decision,reviewer,comments,decided_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(uuid(), bookVersionId, "TECHNICAL_REVIEW", "approved", reviewer, "Gate 2 engine technical approval", t);
  db.prepare(`UPDATE book_versions SET status='PUBLISHED', published_at=?, updated_at=? WHERE id=?`).run(
    t,
    t,
    bookVersionId,
  );
  const ver = db.prepare("SELECT book_id FROM book_versions WHERE id=?").get(bookVersionId) as {
    book_id: string;
  };
  db.prepare(
    `INSERT OR IGNORE INTO published_versions (id,book_id,book_version_id,published_by,published_at,notes)
     VALUES (?,?,?,?,?,?)`,
  ).run(uuid(), ver.book_id, bookVersionId, reviewer, t, "Engine-test publication — book NOT curriculum-complete");
  // Ensure completeness claim unchanged
  db.prepare(`UPDATE books SET completeness_claim='engine_test_only_not_complete', updated_at=? WHERE id=?`).run(
    t,
    ver.book_id,
  );
  return { ok: true as const, report };
}

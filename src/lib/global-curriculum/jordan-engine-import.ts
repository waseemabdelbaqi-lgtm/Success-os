import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { validateContentBlock } from "@/src/lib/book-engine/schema/blocks";
import { G1_MATH_S1_STUDENT_BOOK } from "@/src/lib/jordan-books/content/g1-math-s1/student-book";
import type { BookRecord, ContentBlock, LessonRecord } from "@/src/lib/jordan-books/schema/types";
import { listAuthoredBooks } from "@/src/lib/jordan-books/production/queue-processor";
import { buildCompanionBook } from "@/src/lib/jordan-books/content/companion-factory";
import { buildMasterInventory } from "@/src/lib/jordan-books/matrix/master-inventory";

function ensureSharedTaxonomy(db: ReturnType<typeof getBookEngineDb>, t: string) {
  if (!db.prepare("SELECT id FROM curriculum_versions WHERE id=?").get("cv-jo-national")) {
    db.prepare(
      `INSERT INTO curriculum_versions (id,country,curriculum,version_label,authority,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run("cv-jo-national", "Jordan", "national", "NEEDS VERIFICATION", "NCCD / MoE", "Gate 3", t, t);
  }
  if (!db.prepare("SELECT id FROM academic_years WHERE id=?").get("ay-jo-unverified")) {
    db.prepare(`INSERT INTO academic_years (id,label,created_at,updated_at) VALUES (?,?,?,?)`).run(
      "ay-jo-unverified",
      "NEEDS VERIFICATION",
      t,
      t,
    );
  }
}

function mapBlockType(type: ContentBlock["type"]): string {
  const map: Record<string, string> = {
    heading: "heading",
    paragraph: "paragraph",
    definition: "definition",
    example: "worked_example",
    formula: "formula",
    table: "table",
    image: "image",
    diagram: "svg_diagram",
    graph: "graph",
    timeline: "timeline",
    map: "map",
    worked_solution: "step_solution",
    callout: "important_note",
    activity: "question",
    question: "question",
    writing_space: "writing_area",
    interactive: "question",
    source_citation: "citation",
    vocabulary: "vocabulary_card",
    common_mistakes: "warning",
    real_life: "important_note",
    practice: "question",
    hook: "paragraph",
    objectives: "paragraph",
    materials: "paragraph",
    closure: "reflection",
    exit_question: "question",
    hint: "hint",
  };
  return map[type] || "paragraph";
}

function blockContent(block: ContentBlock): Record<string, unknown> {
  const t = mapBlockType(block.type);
  if (t === "heading") return { textAr: block.titleAr || block.bodyAr, level: 2 };
  if (t === "paragraph") return { bodyAr: block.bodyAr };
  if (t === "definition") return { termAr: block.titleAr || "تعريف", definitionAr: block.bodyAr };
  if (t === "vocabulary_card") return { termAr: block.titleAr || "مفردة", definitionAr: block.bodyAr };
  if (t === "formula") return { latex: block.formula || block.bodyAr, textAr: block.bodyAr };
  if (t === "worked_example")
    return {
      problemAr: block.titleAr || block.bodyAr,
      stepsAr: block.bodyAr,
      answerAr: block.question?.correctAnswer || "",
    };
  if (t === "step_solution") return { stepsAr: block.bodyAr, answerAr: block.question?.correctAnswer || "" };
  if (t === "important_note" || t === "warning") return { textAr: block.bodyAr };
  if (t === "reflection") return { promptAr: block.bodyAr };
  if (t === "citation") return { textAr: block.bodyAr, url: "" };
  if (t === "hint") return { textAr: block.bodyAr };
  if (t === "question")
    return {
      promptAr: block.question?.promptAr || block.bodyAr,
      options: block.question?.options || [],
    };
  if (t === "writing_area") return { promptAr: block.bodyAr };
  if (t === "svg_diagram") return { svg: "", captionAr: block.bodyAr };
  return { bodyAr: block.bodyAr, textAr: block.bodyAr };
}

function upsertBookFromRecord(
  book: BookRecord,
  claim: string,
): { bookId: string; versionId: string; lessons: number; activities: number } {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  ensureSharedTaxonomy(db, t);

  const stageCode = /ثانوي|secondary/i.test(book.stage) ? "secondary" : /طفل|kg|early/i.test(book.stage) ? "early_childhood" : "basic";
  let stageId = `stage-${stageCode}`;
  const existingStage = db.prepare("SELECT id FROM educational_stages WHERE code=?").get(stageCode) as
    | { id: string }
    | undefined;
  if (existingStage) {
    stageId = existingStage.id;
  } else if (!db.prepare("SELECT id FROM educational_stages WHERE id=?").get(stageId)) {
    db.prepare(
      `INSERT INTO educational_stages (id,code,title_ar,title_en,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(stageId, stageCode, book.stage, stageCode, 1, t, t);
  }

  const gradeCode = String(book.grade || "1");
  let gradeId = `grade-${gradeCode}`;
  const existingGrade = db.prepare("SELECT id FROM grades WHERE code=? AND stage_id=?").get(gradeCode, stageId) as
    | { id: string }
    | undefined;
  if (existingGrade) {
    gradeId = existingGrade.id;
  } else if (!db.prepare("SELECT id FROM grades WHERE id=?").get(gradeId)) {
    const age =
      ["kg1", "kg2"].includes(gradeCode)
        ? "early_childhood"
        : ["1", "2", "3"].includes(gradeCode)
          ? "grades_1_3"
          : ["4", "5", "6"].includes(gradeCode)
            ? "grades_4_6"
            : ["7", "8", "9", "10"].includes(gradeCode)
              ? "grades_7_10"
              : "grades_11_12";
    db.prepare(
      `INSERT INTO grades (id,stage_id,code,title_ar,title_en,age_profile,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(gradeId, stageId, gradeCode, book.gradeAr, `Grade ${gradeCode}`, age, Number(gradeCode) || 0, t, t);
  }

  const semCode = String(book.semester || "1");
  let semId = `sem-${semCode}`;
  const existingSem = db.prepare("SELECT id FROM semesters WHERE code=?").get(semCode) as { id: string } | undefined;
  if (existingSem) {
    semId = existingSem.id;
  } else if (!db.prepare("SELECT id FROM semesters WHERE id=?").get(semId)) {
    db.prepare(
      `INSERT INTO semesters (id,code,title_ar,title_en,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(semId, semCode, book.semesterAr || semCode, `Term ${semCode}`, 1, t, t);
  }

  let pathwayId = "pathway-general";
  const existingPathway = db.prepare("SELECT id FROM pathways WHERE code=?").get("general") as { id: string } | undefined;
  if (existingPathway) {
    pathwayId = existingPathway.id;
  } else if (!db.prepare("SELECT id FROM pathways WHERE id=?").get(pathwayId)) {
    db.prepare(`INSERT INTO pathways (id,code,title_ar,title_en,created_at,updated_at) VALUES (?,?,?,?,?,?)`).run(
      pathwayId,
      "general",
      "عام",
      "General",
      t,
      t,
    );
  }

  const subjectCode = (book.subject || book.id).replace(/\s+/g, "-").slice(0, 60);
  let subjectId = `subject-${subjectCode}`;
  const existingSubject = db.prepare("SELECT id FROM subjects WHERE code=?").get(subjectCode) as { id: string } | undefined;
  if (existingSubject) {
    subjectId = existingSubject.id;
  } else if (!db.prepare("SELECT id FROM subjects WHERE id=?").get(subjectId)) {
    db.prepare(`INSERT INTO subjects (id,code,title_ar,title_en,created_at,updated_at) VALUES (?,?,?,?,?,?)`).run(
      subjectId,
      subjectCode,
      book.subjectAr,
      book.subject,
      t,
      t,
    );
  }

  const bookId = `engine-${book.id}`;
  const existing = db.prepare("SELECT id FROM books WHERE id=?").get(bookId) as { id: string } | undefined;
  if (existing) {
    const ver = db
      .prepare("SELECT id FROM book_versions WHERE book_id=? ORDER BY version_number DESC LIMIT 1")
      .get(bookId) as { id: string };
    const lessons = (
      db
        .prepare(`SELECT COUNT(*) AS n FROM lessons l JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=?`)
        .get(ver.id) as { n: number }
    ).n;
    const activities = (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM activities a
           JOIN lessons l ON l.id=a.lesson_id
           JOIN units u ON u.id=l.unit_id WHERE u.book_version_id=?`,
        )
        .get(ver.id) as { n: number }
    ).n;
    return { bookId, versionId: ver.id, lessons, activities };
  }

  const versionId = uuid();
  let lessonCount = 0;
  let activityCount = 0;
  let pagePosition = 1;

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO books (
        id, curriculum_version_id, academic_year_id, stage_id, grade_id, semester_id, pathway_id, subject_id,
        title_ar, title_en, book_type, official_source_url, completeness_claim, gate1_verified, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      bookId,
      "cv-jo-national",
      "ay-jo-unverified",
      stageId,
      gradeId,
      semId,
      pathwayId,
      subjectId,
      book.officialTitleAr,
      book.officialTitleEn || book.officialTitleAr,
      book.bookType || "sos_companion",
      book.officialSourceUrl || null,
      claim,
      0,
      t,
      t,
    );

    db.prepare(
      `INSERT INTO book_versions (
        id, book_id, version_number, status, edition_label, language, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?)`,
    ).run(versionId, bookId, 1, "DRAFT", "NEEDS VERIFICATION", "ar", t, t);

    db.prepare(
      `INSERT INTO book_rights (id, book_version_id, rights_status, notes, classified_at) VALUES (?,?,?,?,?)`,
    ).run(uuid(), versionId, "original_companion_required", "SOS companion / original explanations", t);

    const partId = uuid();
    db.prepare(
      `INSERT INTO book_parts (id, book_version_id, position, title_ar, title_en, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(partId, versionId, 1, "المحتوى", "Content", t, t);

    for (const unit of book.units || []) {
      const unitId = `${bookId}-${unit.id}`;
      db.prepare(
        `INSERT INTO units (id, book_version_id, part_id, position, title_ar, title_en, description_ar, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      ).run(unitId, versionId, partId, unit.order, unit.titleAr, unit.titleEn || null, unit.descriptionAr || null, t, t);

      for (const lesson of unit.lessons || []) {
        const counts = insertLesson(db, t, versionId, unitId, lesson, pagePosition);
        pagePosition += 1;
        lessonCount += 1;
        activityCount += counts.activities;
      }
    }
  });
  run();

  return { bookId, versionId, lessons: lessonCount, activities: activityCount };
}

function insertLesson(
  db: ReturnType<typeof getBookEngineDb>,
  t: string,
  versionId: string,
  unitId: string,
  lesson: LessonRecord,
  pagePosition: number,
): { activities: number } {
  const lessonId = `${unitId}-${lesson.id}`;
  db.prepare(
    `INSERT INTO lessons (id, unit_id, position, title_ar, title_en, estimated_minutes, difficulty, editorial_status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    lessonId,
    unitId,
    lesson.order,
    lesson.titleAr,
    lesson.titleEn || null,
    lesson.estimatedMinutes || 25,
    lesson.difficulty || "core",
    "DRAFT",
    t,
    t,
  );

  (lesson.learningOutcomes || []).forEach((o, i) => {
    db.prepare(
      `INSERT INTO learning_outcomes (id, lesson_id, position, statement_ar, created_at) VALUES (?,?,?,?,?)`,
    ).run(uuid(), lessonId, i + 1, o, t);
  });

  const pageId = uuid();
  db.prepare(
    `INSERT INTO book_pages (id, book_version_id, lesson_id, position, official_page_label, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?)`,
  ).run(pageId, versionId, lessonId, pagePosition, lesson.officialPageRange || "NEEDS VERIFICATION", t, t);

  let pos = 1;
  for (const block of lesson.blocks || []) {
    const type = mapBlockType(block.type);
    const content = blockContent(block);
    const engineBlock = {
      blockId: uuid(),
      type,
      position: pos,
      language: (block.language as "ar" | "en" | "math" | "mixed") || "ar",
      direction: (block.direction as "rtl" | "ltr" | "isolate") || "rtl",
      content,
      configuration: {},
      officialPageReference: block.officialPageRef || "NEEDS VERIFICATION",
      rightsStatus: "original_companion_required",
      accessibilityText: block.bodyAr?.slice(0, 200) || lesson.titleAr,
      reviewStatus: "DRAFT",
      version: 1,
    };
    const validated = validateContentBlock(engineBlock);
    if (!validated.ok) {
      // fall back to paragraph if typed validation fails
      engineBlock.type = "paragraph";
      engineBlock.content = { bodyAr: block.bodyAr || lesson.titleAr };
      const retry = validateContentBlock(engineBlock);
      if (!retry.ok) continue;
    }
    db.prepare(
      `INSERT INTO content_blocks (
        id, lesson_id, page_id, position, type, language, direction, content_json, config_json,
        official_page_reference, rights_status, accessibility_text, review_status, version, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      engineBlock.blockId,
      lessonId,
      pageId,
      pos,
      engineBlock.type,
      engineBlock.language,
      engineBlock.direction,
      JSON.stringify(engineBlock.content),
      JSON.stringify(engineBlock.configuration),
      engineBlock.officialPageReference,
      engineBlock.rightsStatus,
      engineBlock.accessibilityText,
      engineBlock.reviewStatus,
      engineBlock.version,
      t,
      t,
    );
    pos += 1;

    if (block.type === "question" && block.question) {
      insertActivityFromQuestion(db, t, lessonId, block, pos);
    }
  }

  const activities = (
    db.prepare(`SELECT COUNT(*) AS n FROM activities WHERE lesson_id=?`).get(lessonId) as { n: number }
  ).n;
  return { activities };
}

function insertActivityFromQuestion(
  db: ReturnType<typeof getBookEngineDb>,
  t: string,
  lessonId: string,
  block: ContentBlock,
  position: number,
): void {
  const q = block.question!;
  const actId = uuid();
  const qId = uuid();
  const activityType =
    block.interactiveKind === "type"
      ? "short_answer"
      : block.interactiveKind === "true_false"
        ? "true_false"
        : "single_choice";
  db.prepare(
    `INSERT INTO activities (
      id, lesson_id, position, activity_type, instructions_ar, difficulty, max_attempts,
      points, mastery_weight, review_status, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(actId, lessonId, position, activityType, q.promptAr, q.difficulty || "basic", 3, q.points || 10, 1, "DRAFT", t, t);
  db.prepare(
    `INSERT INTO questions (id, activity_id, position, prompt_ar, kind, created_at) VALUES (?,?,?,?,?,?)`,
  ).run(qId, actId, 1, q.promptAr, activityType, t);
  (q.options || []).forEach((opt, i) => {
    db.prepare(
      `INSERT INTO answer_options (id, question_id, position, label_ar, is_correct) VALUES (?,?,?,?,?)`,
    ).run(uuid(), qId, i + 1, opt, i === (q.correctIndex ?? -1) ? 1 : 0);
  });
  db.prepare(
    `INSERT INTO answers (id, question_id, answer_kind, value_json, created_at) VALUES (?,?,?,?,?)`,
  ).run(
    uuid(),
    qId,
    activityType,
    JSON.stringify({
      correctIndex: q.correctIndex,
      correctAnswer: q.correctAnswer,
      acceptedAnswers: q.acceptedAnswers || [],
    }),
    t,
  );
  db.prepare(
    `INSERT INTO answer_explanations (id, question_id, explanation_ar, created_at) VALUES (?,?,?,?)`,
  ).run(uuid(), qId, q.explanationAr || "", t);
  if (q.hint1Ar) {
    db.prepare(`INSERT INTO hints (id, question_id, level, text_ar) VALUES (?,?,?,?)`).run(uuid(), qId, 1, q.hint1Ar);
  }
  if (q.hint2Ar) {
    db.prepare(`INSERT INTO hints (id, question_id, level, text_ar) VALUES (?,?,?,?)`).run(uuid(), qId, 2, q.hint2Ar);
  }
}

export function importAuthoredJordanBooksIntoEngine(): {
  imported: number;
  totalLessons: number;
  totalActivities: number;
  books: Array<{ bookId: string; lessons: number; claim: string }>;
} {
  const authored = listAuthoredBooks();
  const books = [G1_MATH_S1_STUDENT_BOOK, ...authored.filter((b) => b.id !== G1_MATH_S1_STUDENT_BOOK.id)];
  const out: Array<{ bookId: string; lessons: number; claim: string }> = [];
  let totalLessons = 0;
  let totalActivities = 0;
  for (const book of books) {
    const isG1Math = book.id.includes("g1") && /math|رياض/i.test(book.subjectAr + book.id);
    const claim = isG1Math
      ? "companion_full_lessons_edition_unverified"
      : "companion_structured_not_official_complete";
    const r = upsertBookFromRecord(book, claim);
    out.push({ bookId: r.bookId, lessons: r.lessons, claim });
    totalLessons += r.lessons;
    totalActivities += r.activities;
  }
  return { imported: out.length, totalLessons, totalActivities, books: out };
}

export function processJordanCompanionJobs(limit = 50): {
  processed: number;
  skippedBlocked: number;
  errors: string[];
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();
  const jobs = db
    .prepare(
      `SELECT * FROM production_jobs
       WHERE job_type='gate3_book_production' AND status='queued'
       ORDER BY priority ASC, created_at ASC LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;

  const inventory = buildMasterInventory();
  const byId = Object.fromEntries(inventory.map((c) => [c.id, c]));
  let processed = 0;
  let skippedBlocked = 0;
  const errors: string[] = [];

  for (const job of jobs) {
    const cp = JSON.parse(String(job.checkpoint_json || job.checkpoint || "{}")) as {
      inventoryCellId?: string;
    };
    const cellId =
      cp.inventoryCellId ||
      String(job.notes || "").replace(/^gate3-jordan:/, "") ||
      String(job.book_id || "").replace(/^inv:/, "");
    const cell = byId[cellId];
    if (!cell) {
      db.prepare(`UPDATE production_jobs SET status=?, error_log=?, updated_at=?, attempts=COALESCE(attempts,0)+1 WHERE id=?`).run(
        "failed",
        "inventory cell missing",
        t,
        job.id,
      );
      errors.push(`missing cell ${cellId}`);
      continue;
    }
    if (cell.bookType !== "sos_companion") {
      db.prepare(`UPDATE production_jobs SET status=?, error_log=?, updated_at=? WHERE id=?`).run(
        "blocked",
        cell.blocker || "official_book_requires_edition_and_rights",
        t,
        job.id,
      );
      skippedBlocked += 1;
      continue;
    }

    try {
      db.prepare(`UPDATE production_jobs SET status=?, locked_at=?, updated_at=? WHERE id=?`).run("running", t, t, job.id);
      const seedBook = buildCompanionBook({
        id: cell.structuredBookId || `jo-${cell.gradeKey}-${cell.semester}-${cell.subjectSlug}-companion`,
        grade: cell.gradeKey.replace(/\D/g, "") || cell.gradeKey,
        gradeAr: cell.gradeAr,
        semester: String(cell.semester),
        semesterAr: cell.semesterAr,
        subject: cell.subjectSlug,
        subjectAr: cell.subjectAr,
        stage: cell.stage,
        officialSourceUrl: cell.officialSourceUrl,
        units: [
          {
            id: "u1",
            order: 1,
            titleAr: `وحدة تأسيسية — ${cell.subjectAr}`,
            titleEn: "Foundation unit",
            descriptionAr: "وحدة Success OS أصلية — المراجعة الأكاديمية مطلوبة قبل COMPLETE.",
            lessons: [1, 2, 3, 4].map((n) => ({
              id: `u1-l${n}`,
              order: n,
              titleAr: `درس ${n}: ${cell.subjectAr}`,
              titleEn: `Lesson ${n}`,
              outcomes: [`نواتج أولية في ${cell.subjectAr}`],
              hookAr: `مدخل إلى ${cell.subjectAr}`,
              explanationAr: `شرح تفاعلي أصلي لمبحث ${cell.subjectAr} (${cell.gradeAr}). ليس نص الكتاب الرسمي.`,
              exampleAr: `نشاط تطبيقي ${n}`,
              answer: "نعم",
              options: ["نعم", "لا", "أراجع"],
              correctIndex: 0,
            })),
          },
        ],
      });
      const imported = upsertBookFromRecord(seedBook, "companion_structured_not_official_complete");
      db.prepare(
        `UPDATE inventory_matrix_cells SET structured_book_id=?, matrix_status=?, completeness_claim=?, updated_at=? WHERE id=?`,
      ).run(imported.bookId, "STRUCTURED", "companion_structured_not_official_complete", t, cellId);
      db.prepare(
        `UPDATE production_jobs SET status=?, checkpoint_json=?, updated_at=?, attempts=COALESCE(attempts,0)+1 WHERE id=?`,
      ).run("done", JSON.stringify({ ...cp, engineBookId: imported.bookId, lessons: imported.lessons }), t, job.id);
      db.prepare(
        `INSERT INTO production_checkpoints (id, job_id, label, payload_json, created_at) VALUES (?,?,?,?,?)`,
      ).run(uuid(), job.id, "companion_structured", JSON.stringify(imported), t);
      processed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      db.prepare(
        `UPDATE production_jobs SET status=?, error_log=?, updated_at=?, attempts=COALESCE(attempts,0)+1 WHERE id=?`,
      ).run("failed", msg, t, job.id);
    }
  }

  return { processed, skippedBlocked, errors };
}

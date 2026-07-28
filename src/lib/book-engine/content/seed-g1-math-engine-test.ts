import { applyMigrations, getBookEngineDb, nowIso, uuid } from "@/src/lib/book-engine/db/client";
import { validateContentBlock } from "@/src/lib/book-engine/schema/blocks";

/**
 * Seeds Gate 2 engine-test content:
 * Jordan G1 Sem1 Mathematics — ONE complete real lesson (Numbers 1,2,3)
 * Book completeness_claim remains not_complete / engine_test_only.
 */
export function seedGate2EngineTestBook(): {
  bookId: string;
  versionId: string;
  lessonId: string;
  previewPath: string;
} {
  applyMigrations();
  const db = getBookEngineDb();
  const t = nowIso();

  const existing = db.prepare("SELECT id FROM books WHERE id = ?").get("book-jo-g1-s1-math") as
    | { id: string }
    | undefined;
  if (existing) {
    const ver = db
      .prepare("SELECT id FROM book_versions WHERE book_id = ? ORDER BY version_number DESC LIMIT 1")
      .get(existing.id) as { id: string };
    const lesson = db
      .prepare(
        `SELECT l.id FROM lessons l
         JOIN units u ON u.id = l.unit_id
         WHERE u.book_version_id = ? AND l.id = ?`,
      )
      .get(ver.id, "lesson-u0-l1-numbers-123") as { id: string } | undefined;
    return {
      bookId: existing.id,
      versionId: ver.id,
      lessonId: lesson?.id || "lesson-u0-l1-numbers-123",
      previewPath: `/interactive-books/reader/${existing.id}?mode=lesson`,
    };
  }

  const ids = {
    cv: uuid(),
    ay: uuid(),
    stage: uuid(),
    grade: uuid(),
    sem: uuid(),
    pathway: uuid(),
    subject: uuid(),
    series: uuid(),
    book: "book-jo-g1-s1-math",
    version: uuid(),
    part: uuid(),
    unit: uuid(),
    lesson: "lesson-u0-l1-numbers-123",
    page1: uuid(),
    page2: uuid(),
    outcome1: uuid(),
    outcome2: uuid(),
    outcome3: uuid(),
    skillCount: uuid(),
    skillMatch: uuid(),
    skillWrite: uuid(),
  };

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO curriculum_versions (id,country,curriculum,version_label,authority,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run(
      ids.cv,
      "Jordan",
      "national",
      "NEEDS VERIFICATION",
      "NCCD / MoE",
      "Edition year pending Gate 1 close",
      t,
      t,
    );
    db.prepare(
      `INSERT INTO academic_years (id,label,created_at,updated_at) VALUES (?,?,?,?)`,
    ).run(ids.ay, "NEEDS VERIFICATION", t, t);
    db.prepare(
      `INSERT INTO educational_stages (id,code,title_ar,title_en,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(ids.stage, "basic", "التعليم الأساسي", "Basic Education", 2, t, t);
    db.prepare(
      `INSERT INTO grades (id,stage_id,code,title_ar,title_en,age_profile,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(ids.grade, ids.stage, "1", "الصف الأول", "Grade 1", "grades_1_3", 1, t, t);
    db.prepare(
      `INSERT INTO semesters (id,code,title_ar,title_en,sort_order,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(ids.sem, "1", "الفصل الدراسي الأول", "Semester 1", 1, t, t);
    db.prepare(
      `INSERT INTO pathways (id,code,title_ar,title_en,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
    ).run(ids.pathway, "general", "عام", "General", t, t);
    db.prepare(
      `INSERT INTO subjects (id,code,title_ar,title_en,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
    ).run(ids.subject, "math", "الرياضيات", "Mathematics", t, t);
    db.prepare(
      `INSERT INTO book_series (id,title_ar,title_en,subject_id,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
    ).run(ids.series, "الرياضيات — الصف الأول", "Grade 1 Mathematics", ids.subject, t, t);

    db.prepare(
      `INSERT INTO books (
        id,series_id,curriculum_version_id,academic_year_id,stage_id,grade_id,semester_id,pathway_id,subject_id,
        title_ar,title_en,book_type,official_source_url,inventory_cell_id,completeness_claim,gate1_verified,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      ids.book,
      ids.series,
      ids.cv,
      ids.ay,
      ids.stage,
      ids.grade,
      ids.sem,
      ids.pathway,
      ids.subject,
      "الرياضيات — كتاب الطالب — الفصل الدراسي الأول (محرك Gate 2 — اختبار محرك فقط)",
      "Mathematics Student Book Sem1 — Gate 2 engine test (NOT complete book)",
      "student",
      "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
      "jo-1-general-s1-math-student",
      "engine_test_only_not_complete",
      0,
      t,
      t,
    );

    db.prepare(
      `INSERT INTO book_versions (id,book_id,version_number,status,edition_label,language,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(ids.version, ids.book, 1, "DRAFT", "NEEDS VERIFICATION", "ar", "gate2-seed", t, t);

    db.prepare(
      `INSERT INTO book_sources (id,book_version_id,name,url,authority_type,usage,license,verification_date,notes,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      uuid(),
      ids.version,
      "NCCD Grade 1 catalog",
      "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
      "official-authority",
      "official-discovery-link-only",
      "official-framework-reference",
      "2026-07-28",
      "Live NCCD fetch often blocked; edition pending Gate 1",
      t,
    );

    db.prepare(
      `INSERT INTO book_rights (id,book_version_id,rights_status,notes,classified_by,classified_at)
       VALUES (?,?,?,?,?,?)`,
    ).run(
      uuid(),
      ids.version,
      "sos_original_aligned",
      "SOS original explanations aligned to G1 outcomes; official PDF not republished",
      "gate2-seed",
      t,
    );

    db.prepare(
      `INSERT INTO book_parts (id,book_version_id,position,title_ar,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
    ).run(ids.part, ids.version, 1, "القسم الأول", t, t);

    db.prepare(
      `INSERT INTO units (id,book_version_id,part_id,position,title_ar,title_en,description_ar,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      ids.unit,
      ids.version,
      ids.part,
      0,
      "الوحدة التمهيدية: الأعداد حتى 20",
      "Introductory Unit: Numbers to 20",
      "محتوى اختبار المحرك — درس واحد كامل فقط في Gate 2",
      t,
      t,
    );

    db.prepare(
      `INSERT INTO lessons (id,unit_id,position,title_ar,title_en,estimated_minutes,difficulty,editorial_status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      ids.lesson,
      ids.unit,
      1,
      "الأعداد 1 ، 2 ، 3",
      "Numbers 1, 2, 3",
      25,
      "intro",
      "DRAFT",
      t,
      t,
    );

    db.prepare(
      `INSERT INTO book_pages (id,book_version_id,lesson_id,position,official_page_label,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(ids.page1, ids.version, ids.lesson, 1, "NEEDS VERIFICATION — page map pending NCCD PDF", t, t);
    db.prepare(
      `INSERT INTO book_pages (id,book_version_id,lesson_id,position,official_page_label,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(ids.page2, ids.version, ids.lesson, 2, "NEEDS VERIFICATION — page map pending NCCD PDF", t, t);

    const outcomes = [
      [ids.outcome1, "أعدّ حتى 3 وأتعرّف الرموز 1 و2 و3."],
      [ids.outcome2, "أربط كل عدد بمجموعة أشياء مناسبة."],
      [ids.outcome3, "أكتب الأعداد 1 و2 و3 بخط واضح."],
    ] as const;
    outcomes.forEach(([id, text], i) => {
      db.prepare(
        `INSERT INTO learning_outcomes (id,lesson_id,position,statement_ar,official_note,created_at)
         VALUES (?,?,?,?,?,?)`,
      ).run(id, ids.lesson, i + 1, text, "SOS-aligned outcome — not copied official prose", t);
    });

    db.prepare(`INSERT INTO skills (id,code,title_ar,created_at) VALUES (?,?,?,?)`).run(
      ids.skillCount,
      "counting",
      "العدّ",
      t,
    );
    db.prepare(`INSERT INTO skills (id,code,title_ar,created_at) VALUES (?,?,?,?)`).run(
      ids.skillMatch,
      "matching",
      "المطابقة",
      t,
    );
    db.prepare(`INSERT INTO skills (id,code,title_ar,created_at) VALUES (?,?,?,?)`).run(
      ids.skillWrite,
      "writing",
      "الكتابة",
      t,
    );
    for (const sid of [ids.skillCount, ids.skillMatch, ids.skillWrite]) {
      db.prepare(`INSERT INTO lesson_skills (lesson_id,skill_id) VALUES (?,?)`).run(ids.lesson, sid);
    }

    const blocks: Array<{
      type: string;
      lang: string;
      dir: string;
      content: Record<string, unknown>;
      page?: string;
      a11y?: string;
    }> = [
      {
        type: "heading",
        lang: "ar",
        dir: "rtl",
        content: { textAr: "الأعداد 1 ، 2 ، 3" },
        page: ids.page1,
        a11y: "عنوان الدرس: الأعداد واحد واثنان وثلاثة",
      },
      {
        type: "paragraph",
        lang: "ar",
        dir: "rtl",
        content: {
          bodyAr:
            "أمامك تفاحة واحدة، ثم تفاحتان، ثم ثلاث. اليوم نتعلّم الرموز 1 و2 و3 ونربط كل رمز بمجموعة أشياء.",
        },
        page: ids.page1,
      },
      {
        type: "vocabulary_card",
        lang: "ar",
        dir: "rtl",
        content: {
          term: "عدد",
          definition: "رمز يخبرنا كم يوجد من الشيء.",
          example: "3 أقلام",
          nonExample: "لون القلم",
        },
      },
      {
        type: "vocabulary_card",
        lang: "ar",
        dir: "rtl",
        content: {
          term: "عدّ",
          definition: "قول الأعداد بالترتيب لمعرفة الكمية.",
          example: "واحد، اثنان، ثلاثة",
          nonExample: "أرقام عشوائية",
        },
      },
      {
        type: "definition",
        lang: "ar",
        dir: "rtl",
        content: {
          bodyAr: "الأعداد 1 و2 و3 تخبرنا عن كمية صغيرة مرتبة: واحد ثم اثنان ثم ثلاثة.",
        },
      },
      {
        type: "svg_diagram",
        lang: "ar",
        dir: "rtl",
        content: {
          visualAr: "★ = 1     ★★ = 2     ★★★ = 3",
          descriptionAr: "مخطط بصري يربط النجوم بالأعداد",
        },
        a11y: "نجمة واحدة تساوي 1، نجمتان تساويان 2، ثلاث نجوم تساوي 3",
      },
      {
        type: "worked_example",
        lang: "ar",
        dir: "rtl",
        content: {
          problemAr: "كم نجمة في المجموعة ★★★؟",
          stepsAr: "1) أشر إلى الأولى وقل واحد. 2) أشر إلى الثانية وقل اثنان. 3) أشر إلى الثالثة وقل ثلاثة.",
          answerAr: "3",
        },
        page: ids.page1,
      },
      {
        type: "worked_example",
        lang: "ar",
        dir: "rtl",
        content: {
          problemAr: "كم مربعاً؟ ■ ■",
          stepsAr: "نعدّ: واحد، اثنان.",
          answerAr: "2",
        },
      },
      {
        type: "number_line",
        lang: "math",
        dir: "ltr",
        content: { min: 0, max: 5, highlight: 3, labelAr: "موضع العدد 3 على خط الأعداد" },
        a11y: "خط أعداد من صفر إلى خمسة مع تمييز العدد ثلاثة",
        page: ids.page2,
      },
      {
        type: "formula",
        lang: "math",
        dir: "isolate",
        content: { latex: "1 + 1 + 1 = 3", noteAr: "ثلاثة آحاد تكون 3" },
      },
      {
        type: "step_solution",
        lang: "ar",
        dir: "rtl",
        content: {
          steps: ["ابدأ من الصفر", "اقفز قفزة واحدة → 1", "قفزة ثانية → 2", "قفزة ثالثة → 3"],
        },
      },
      {
        type: "important_note",
        lang: "ar",
        dir: "rtl",
        content: { bodyAr: "لا تتخطَّ عدداً عند العدّ، ولا تعدّ نفس الشيء مرتين." },
      },
      {
        type: "writing_area",
        lang: "ar",
        dir: "rtl",
        content: { promptAr: "اكتب الأعداد 1 و2 و3 بخط واضح." },
      },
      {
        type: "drawing_area",
        lang: "ar",
        dir: "rtl",
        content: { promptAr: "ارسم مجموعة من 3 نجوم." },
      },
      {
        type: "reflection",
        lang: "ar",
        dir: "rtl",
        content: { promptAr: "أين تستخدم العدّ حتى 3 في بيتك أو مدرستك؟" },
      },
      {
        type: "citation",
        lang: "ar",
        dir: "rtl",
        content: {
          textAr: "مرجع هيكل: كتالوج NCCD للصف الأول — طبعة/صفحات NEEDS VERIFICATION",
          url: "https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68",
        },
      },
    ];

    blocks.forEach((b, i) => {
      const blockId = uuid();
      const payload = {
        blockId,
        type: b.type,
        position: i + 1,
        language: b.lang,
        direction: b.dir,
        content: b.content,
        rightsStatus: "sos_original_aligned",
        accessibilityText: b.a11y || "",
        reviewStatus: "DRAFT",
        version: 1,
        officialPageReference: "NEEDS VERIFICATION",
      };
      const v = validateContentBlock(payload);
      if (!v.ok) throw new Error(`Block validation failed: ${v.errors.join("; ")}`);
      db.prepare(
        `INSERT INTO content_blocks (
          id,lesson_id,page_id,position,type,language,direction,content_json,config_json,
          official_page_reference,rights_status,accessibility_text,review_status,version,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        blockId,
        ids.lesson,
        b.page || null,
        i + 1,
        b.type,
        b.lang,
        b.dir,
        JSON.stringify(b.content),
        null,
        "NEEDS VERIFICATION",
        "sos_original_aligned",
        b.a11y || null,
        "DRAFT",
        1,
        t,
        t,
      );
    });

    // Activities: MCQ, matching/drag, math input
    const actMcq = uuid();
    db.prepare(
      `INSERT INTO activities (
        id,lesson_id,position,activity_type,instructions_ar,outcome_id,difficulty,max_attempts,points,mastery_weight,review_status,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      actMcq,
      ids.lesson,
      1,
      "single_choice",
      "اختر العدد الصحيح.",
      ids.outcome2,
      "basic",
      3,
      10,
      1,
      "DRAFT",
      t,
      t,
    );
    const q1 = uuid();
    db.prepare(
      `INSERT INTO questions (id,activity_id,position,prompt_ar,kind,config_json,created_at) VALUES (?,?,?,?,?,?,?)`,
    ).run(q1, actMcq, 1, "كم شيئاً هنا: ■ ■ ؟", "single_choice", null, t);
    [
      ["1", 0],
      ["2", 1],
      ["3", 0],
    ].forEach(([label, correct], i) => {
      db.prepare(
        `INSERT INTO answer_options (id,question_id,position,label_ar,is_correct) VALUES (?,?,?,?,?)`,
      ).run(uuid(), q1, i + 1, label, correct);
    });
    db.prepare(
      `INSERT INTO answers (id,question_id,answer_kind,value_json,created_at) VALUES (?,?,?,?,?)`,
    ).run(uuid(), q1, "option_index", JSON.stringify({ correctIndex: 1 }), t);
    db.prepare(
      `INSERT INTO answer_explanations (id,question_id,explanation_ar,step_by_step_ar,created_at) VALUES (?,?,?,?,?)`,
    ).run(uuid(), q1, "هناك مربعان، إذن العدد 2.", "عدّ المربعات واحداً واحداً.", t);
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q1,
      1,
      "عدّ المربعات بإصبعك.",
    );
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q1,
      2,
      "ليس واحداً وليس ثلاثة — الجواب في الوسط.",
    );

    const actMatch = uuid();
    db.prepare(
      `INSERT INTO activities (
        id,lesson_id,position,activity_type,instructions_ar,outcome_id,difficulty,max_attempts,points,mastery_weight,config_json,review_status,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      actMatch,
      ids.lesson,
      2,
      "drag_drop",
      "طابق المجموعة بالعدد.",
      ids.outcome2,
      "developing",
      3,
      15,
      1.2,
      JSON.stringify({
        pairs: [
          { left: "★", right: "1" },
          { left: "★★", right: "2" },
          { left: "★★★", right: "3" },
        ],
      }),
      "DRAFT",
      t,
      t,
    );
    const q2 = uuid();
    db.prepare(
      `INSERT INTO questions (id,activity_id,position,prompt_ar,kind,config_json,created_at) VALUES (?,?,?,?,?,?,?)`,
    ).run(
      q2,
      actMatch,
      1,
      "صل كل مجموعة بعددها",
      "drag_drop",
      JSON.stringify({
        pairs: [
          { left: "★", right: "1" },
          { left: "★★", right: "2" },
          { left: "★★★", right: "3" },
        ],
      }),
      t,
    );
    db.prepare(
      `INSERT INTO answers (id,question_id,answer_kind,value_json,created_at) VALUES (?,?,?,?,?)`,
    ).run(
      uuid(),
      q2,
      "pairs",
      JSON.stringify({
        "★": "1",
        "★★": "2",
        "★★★": "3",
      }),
      t,
    );
    db.prepare(
      `INSERT INTO answer_explanations (id,question_id,explanation_ar,created_at) VALUES (?,?,?,?)`,
    ).run(uuid(), q2, "كل مجموعة تطابق عدد نجومها.", t);
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q2,
      1,
      "ابدأ بنجمة واحدة.",
    );
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q2,
      2,
      "★★★ تعني ثلاثة.",
    );

    const actMath = uuid();
    db.prepare(
      `INSERT INTO activities (
        id,lesson_id,position,activity_type,instructions_ar,outcome_id,difficulty,max_attempts,points,mastery_weight,review_status,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      actMath,
      ids.lesson,
      3,
      "math_input",
      "أدخل العدد الصحيح.",
      ids.outcome1,
      "basic",
      3,
      12,
      1,
      "DRAFT",
      t,
      t,
    );
    const q3 = uuid();
    db.prepare(
      `INSERT INTO questions (id,activity_id,position,prompt_ar,kind,config_json,created_at) VALUES (?,?,?,?,?,?,?)`,
    ).run(q3, actMath, 1, "ما العدد الذي يأتي بعد 2؟", "math_input", JSON.stringify({ accepted: ["3", "٣"] }), t);
    db.prepare(
      `INSERT INTO answers (id,question_id,answer_kind,value_json,tolerance,created_at) VALUES (?,?,?,?,?,?)`,
    ).run(uuid(), q3, "math", JSON.stringify({ correct: ["3", "1+1+1", "٦/٢"], tolerance: 0 }), null, t);
    db.prepare(
      `INSERT INTO answer_explanations (id,question_id,explanation_ar,step_by_step_ar,created_at) VALUES (?,?,?,?,?)`,
    ).run(uuid(), q3, "بعد 2 مباشرة يأتي 3.", "الترتيب: 1 ثم 2 ثم 3.", t);
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q3,
      1,
      "واحد، اثنان، …؟",
    );
    db.prepare(`INSERT INTO hints (id,question_id,level,text_ar) VALUES (?,?,?,?)`).run(
      uuid(),
      q3,
      2,
      "الرمز 3.",
    );

    db.prepare(
      `INSERT INTO curriculum_coverage (id,inventory_cell_id,book_id,status,notes,updated_at)
       VALUES (?,?,?,?,?,?)`,
    ).run(
      uuid(),
      "jo-1-general-s1-math-student",
      ids.book,
      "engine_test_seeded_not_complete",
      "Gate 2 engine test only — one lesson. Book NOT complete.",
      t,
    );

    db.prepare(
      `INSERT INTO production_jobs (id,book_id,stage,status,checkpoint,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(uuid(), ids.book, "gate2_engine", "seeded", "engine_test_lesson_only", t, t);
  });

  run();

  return {
    bookId: ids.book,
    versionId: ids.version,
    lessonId: ids.lesson,
    previewPath: `/interactive-books/reader/${ids.book}?mode=lesson`,
  };
}

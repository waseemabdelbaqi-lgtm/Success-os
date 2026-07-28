import fs from "node:fs";
import { spawnSync } from "node:child_process";
import {
  getDb,
  upsertCountry,
  upsertSource,
  upsertBook,
  updateBook,
  insertJob,
  updateJob,
  saveSampleLesson,
  nowIso,
  getBook,
} from "../db/store.js";
import { JordanNccdAdapter } from "../adapters/jordan-nccd.js";
import { OpenStaxOerAdapter } from "../adapters/openstax-oer.js";
import { BOOK_STATUS, canStoreFullPdf, canRepublishSourceTextOrImages } from "../rights/policy.js";
import { putStreamFromUrl, objectKey, newId, resolveObjectPath } from "../storage/object-store.js";
import { enqueue, QUEUE_NAMES } from "../queue/bull.js";

export async function runJordanDiscovery() {
  const jobId = newId("job");
  insertJob({
    id: jobId,
    type: "discovery",
    country_code: "JO",
    status: "RUNNING",
    started_at: nowIso(),
  });
  try {
    upsertCountry("JO", "Jordan", "الأردن");
    upsertCountry("OER", "Open Educational Resources", "مصادر تعليمية مفتوحة");

    const nccd = new JordanNccdAdapter();
    const nccdResult = await nccd.discoverCatalog();
    upsertSource(nccdResult.source);
    for (const book of nccdResult.books) upsertBook(book);

    // Also index OpenStax OER for downloadable verification pipeline (not Jordan substitutes).
    const oer = new OpenStaxOerAdapter();
    const oerResult = await oer.discoverCatalog();
    upsertSource(oerResult.source);
    for (const book of oerResult.books) upsertBook(book);

    updateJob(jobId, {
      status: "COMPLETED",
      progress: 1,
      finished_at: nowIso(),
      result_json: JSON.stringify({
        jordanBooks: nccdResult.books.length,
        oerBooks: oerResult.books.length,
        nccdStatus: nccdResult.source.status,
      }),
    });
    return {
      jobId,
      jordanBooks: nccdResult.books.length,
      oerBooks: oerResult.books.length,
      nccdStatus: nccdResult.source.status,
    };
  } catch (err) {
    updateJob(jobId, {
      status: "FAILED",
      error: String(err?.message || err),
      finished_at: nowIso(),
    });
    throw err;
  }
}

export async function downloadAndVerifyBook(bookId) {
  const book = getBook(bookId);
  if (!book) throw new Error("BOOK_NOT_FOUND");
  if (!book.official_url) {
    updateBook(bookId, {
      status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED,
      last_error: "NO_OFFICIAL_URL",
    });
    return { status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED };
  }
  if (!canStoreFullPdf(book.rights_status)) {
    // Metadata-only path for official Jordan books.
    updateBook(bookId, {
      status: BOOK_STATUS.RIGHTS_RESTRICTED,
      last_error: "FULL_PDF_STORAGE_NOT_PERMITTED_BY_RIGHTS_POLICY",
    });
    // Still probe accessibility without storing protected content when blocked network.
    try {
      const probe = await fetch(book.official_url, {
        method: "GET",
        headers: { "User-Agent": "SUCCESS-OS-CurriculumWorker/1.0", Range: "bytes=0-1023" },
        signal: AbortSignal.timeout(12000),
      });
      if (!probe.ok && probe.status !== 206) {
        updateBook(bookId, {
          status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED,
          last_error: `SOURCE_ACCESS_BLOCKED:HTTP_${probe.status}`,
        });
        return { status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED };
      }
    } catch (err) {
      updateBook(bookId, {
        status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED,
        last_error: `SOURCE_ACCESS_BLOCKED:${String(err?.message || err)}`,
      });
      return { status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED };
    }
    return { status: BOOK_STATUS.RIGHTS_RESTRICTED };
  }

  updateBook(bookId, { status: BOOK_STATUS.DOWNLOADING, last_error: null });
  const key = objectKey(book.country_code, book.id, "source.pdf");
  try {
    const saved = await putStreamFromUrl(book.official_url, key, {
      timeoutMs: 280000,
      resume: true,
      headers: { Referer: book.catalog_url || "https://openstax.org/" },
    });
    const validation = validatePdfFile(saved.path);
    if (!validation.ok) {
      updateBook(bookId, {
        status: BOOK_STATUS.FAILED,
        last_error: validation.reason,
        file_size: saved.size,
        sha256: saved.sha256,
      });
      return { status: BOOK_STATUS.FAILED, reason: validation.reason };
    }
    updateBook(bookId, {
      status: BOOK_STATUS.VERIFIED,
      file_size: saved.size,
      page_count: validation.pageCount,
      sha256: saved.sha256,
      storage_key: key,
      last_error: null,
    });
    return { status: BOOK_STATUS.VERIFIED, ...validation, ...saved };
  } catch (err) {
    updateBook(bookId, {
      status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED,
      last_error: `SOURCE_ACCESS_BLOCKED:${String(err?.message || err)}`,
    });
    return { status: BOOK_STATUS.SOURCE_ACCESS_BLOCKED, error: String(err?.message || err) };
  }
}

export function validatePdfFile(filePath) {
  if (!fs.existsSync(filePath)) return { ok: false, reason: "missing" };
  const size = fs.statSync(filePath).size;
  // Open/OER books may be large; Jordan threshold was 20MB but OER web PDFs vary.
  // Keep a sanity floor of 100KB for open resources and require PDF markers.
  if (size < 100_000) return { ok: false, reason: `size_too_small:${size}` };
  const fd = fs.openSync(filePath, "r");
  const head = Buffer.alloc(8);
  fs.readSync(fd, head, 0, 8, 0);
  const tail = Buffer.alloc(8192);
  fs.readSync(fd, tail, 0, 8192, Math.max(0, size - 8192));
  fs.closeSync(fd);
  if (!head.toString("utf8").startsWith("%PDF")) return { ok: false, reason: "bad_header" };
  if (!tail.includes(Buffer.from("%%EOF"))) return { ok: false, reason: "missing_eof" };

  const py = `
import fitz, sys
doc=fitz.open(sys.argv[1])
n=doc.page_count
if n<=0: raise SystemExit('pageCount_zero')
doc[0].get_pixmap(matrix=fitz.Matrix(0.1,0.1))
doc[n-1].get_pixmap(matrix=fitz.Matrix(0.1,0.1))
print(n)
doc.close()
`;
  const r = spawnSync("python3", ["-c", py, filePath], { encoding: "utf8", timeout: 180000 });
  if (r.status !== 0) return { ok: false, reason: `page_open_failed:${(r.stderr || r.stdout || "").slice(0, 160)}` };
  const pageCount = Number((r.stdout || "").trim());
  if (!pageCount) return { ok: false, reason: "pageCount_zero" };
  return { ok: true, pageCount, size };
}

export async function extractStructure(bookId, { maxPages = 40 } = {}) {
  const book = getBook(bookId);
  if (!book || book.status !== BOOK_STATUS.VERIFIED && book.status !== BOOK_STATUS.STRUCTURED) {
    throw new Error("BOOK_NOT_VERIFIED");
  }
  if (!canRepublishSourceTextOrImages(book.rights_status) && !canStoreFullPdf(book.rights_status)) {
    throw new Error("RIGHTS_GATE");
  }
  updateBook(bookId, { status: BOOK_STATUS.EXTRACTING });
  const filePath = resolveObjectPath(book.storage_key);
  const py = `
import fitz, json, sys, re
path, max_pages = sys.argv[1], int(sys.argv[2])
doc = fitz.open(path)
pages = []
for i in range(min(max_pages, doc.page_count)):
    text = doc[i].get_text('text')
    headings = [ln.strip() for ln in text.splitlines() if ln.strip() and (len(ln.strip())<80)]
    pages.append({'pdfPageIndex': i, 'officialPageNumber': i+1, 'text': text[:4000], 'headings': headings[:20]})
# naive unit/lesson detection from headings
units=[]; lessons=[]
unit_re=re.compile(r'(?i)(unit|chapter|الوحدة)\\s*([0-9٠-٩]+)?[:.\\-\\s]*(.*)')
lesson_re=re.compile(r'(?i)(lesson|section|الدرس)\\s*([0-9٠-٩]+)?[:.\\-\\s]*(.*)')
current_unit=None
for p in pages:
    for h in p['headings']:
        um=unit_re.search(h)
        lm=lesson_re.search(h)
        if um:
            title=(um.group(0) or h).strip()
            current_unit={'title': title, 'startPage': p['officialPageNumber'], 'endPage': p['officialPageNumber'], 'lessons':[]}
            units.append(current_unit)
        if lm:
            title=(lm.group(0) or h).strip()
            lesson={'title': title, 'startPage': p['officialPageNumber'], 'endPage': p['officialPageNumber']}
            lessons.append(lesson)
            if current_unit: current_unit['lessons'].append(lesson)
            if current_unit: current_unit['endPage']=p['officialPageNumber']
print(json.dumps({'pageCount': doc.page_count, 'scanned': len(pages), 'units': units, 'lessons': lessons, 'reviewPages': [p['officialPageNumber'] for p in pages if len(p['text'].strip())<40]}))
doc.close()
`;
  const r = spawnSync("python3", ["-c", py, filePath, String(maxPages)], {
    encoding: "utf8",
    timeout: 300000,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0) {
    updateBook(bookId, { status: BOOK_STATUS.FAILED, last_error: (r.stderr || r.stdout || "").slice(0, 300) });
    throw new Error("EXTRACT_FAILED");
  }
  const parsed = JSON.parse(r.stdout || "{}");
  const db = getDb();
  db.prepare(`DELETE FROM lessons WHERE book_id=?`).run(bookId);
  db.prepare(`DELETE FROM units WHERE book_id=?`).run(bookId);
  let uOrder = 0;
  for (const unit of parsed.units || []) {
    const unitId = newId("unit");
    db.prepare(
      `INSERT INTO units(id,book_id,title,start_page,end_page,sort_order,created_at) VALUES(?,?,?,?,?,?,?)`,
    ).run(unitId, bookId, unit.title, unit.startPage || null, unit.endPage || null, uOrder++, nowIso());
    for (const lesson of unit.lessons || []) {
      db.prepare(
        `INSERT INTO lessons(id,book_id,unit_id,title,start_page,end_page,objectives_json,concepts_json,status,created_at)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        newId("lesson"),
        bookId,
        unitId,
        lesson.title,
        lesson.startPage || null,
        lesson.endPage || null,
        "[]",
        "[]",
        "DISCOVERED",
        nowIso(),
      );
    }
  }
  // orphan lessons
  for (const lesson of parsed.lessons || []) {
    const exists = db
      .prepare(`SELECT id FROM lessons WHERE book_id=? AND title=? AND start_page=?`)
      .get(bookId, lesson.title, lesson.startPage || null);
    if (exists) continue;
    db.prepare(
      `INSERT INTO lessons(id,book_id,unit_id,title,start_page,end_page,objectives_json,concepts_json,status,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      newId("lesson"),
      bookId,
      null,
      lesson.title,
      lesson.startPage || null,
      lesson.endPage || null,
      "[]",
      "[]",
      "DISCOVERED",
      nowIso(),
    );
  }
  updateBook(bookId, { status: BOOK_STATUS.STRUCTURED, page_count: parsed.pageCount || book.page_count });
  return parsed;
}

export async function createSampleLessonFromBook(bookId) {
  const book = getBook(bookId);
  if (!book) throw new Error("BOOK_NOT_FOUND");
  if (!canStoreFullPdf(book.rights_status)) throw new Error("RIGHTS_GATE");
  const filePath = resolveObjectPath(book.storage_key);
  // Extract a concrete early section for original rewrite (do not copy protected/long prose).
  const py = `
import fitz, json, sys, re
doc=fitz.open(sys.argv[1])
# gather text from pages 8-20 (skip covers)
chunks=[]
for i in range(min(8, doc.page_count), min(25, doc.page_count)):
    t=doc[i].get_text('text').strip()
    if t: chunks.append({'page': i+1, 'text': t[:2500]})
print(json.dumps({'pages': chunks, 'pageCount': doc.page_count}))
doc.close()
`;
  const r = spawnSync("python3", ["-c", py, filePath], { encoding: "utf8", timeout: 120000, maxBuffer: 10 << 20 });
  if (r.status !== 0) throw new Error("SAMPLE_EXTRACT_FAILED");
  const extracted = JSON.parse(r.stdout || "{}");
  const sourcePages = (extracted.pages || []).map((p) => p.page);
  const joined = (extracted.pages || []).map((p) => p.text).join("\n\n");

  // Deterministic original lesson scaffold grounded in detected topic keywords.
  const topic = detectMathTopic(joined);
  const lesson = buildOriginalLesson(topic, book, sourcePages);

  // Optional Ollama polish (draft only)
  const polished = await maybePolishWithOllama(lesson);
  const content = polished || lesson;
  content.reviewStatus = "REVIEW_REQUIRED";
  content.rightsStatus = book.rights_status;
  content.sourceBookId = book.id;

  const id = newId("sample");
  saveSampleLesson({
    id,
    book_id: bookId,
    lesson_id: null,
    title: content.title,
    status: "REVIEW_REQUIRED",
    content_json: JSON.stringify(content),
    source_pages: sourcePages.join(","),
  });
  updateBook(bookId, { status: BOOK_STATUS.AI_DRAFT });
  return content;
}

function detectMathTopic(text) {
  const t = text.toLowerCase();
  if (/integer|whole number|عدد|الأعداد/.test(t)) return "numbers";
  if (/add|addition|جمع|plus/.test(t)) return "addition";
  if (/subtract|minus|طرح/.test(t)) return "subtraction";
  if (/variable|معاد|equation/.test(t)) return "variables";
  return "addition";
}

function buildOriginalLesson(topic, book, sourcePages) {
  // Original Arabic Grade-1 friendly lesson for addition (demo), grounded as educational rewrite —
  // NOT a copy of OpenStax English prose. For OER math books we create an age-adapted original
  // sample demonstrating the pipeline; admin review required before publish.
  const title =
    topic === "addition"
      ? "نجمع الأشياء معاً"
      : topic === "subtraction"
        ? "نأخذ ونرى الباقي"
        : topic === "variables"
          ? "نبحث عن العدد المجهول"
          : "نعدّ ونتعرّف على الأعداد";

  return {
    title,
    unitTitle: "الوحدة التجريبية الأولى",
    gradeBand: "6–7 سنوات (عرض تجريبي من مصدر مفتوح)",
    language: "ar",
    whatWeLearn: ["نجمع مجموعتين صغيرتين", "نعد الناتج بصوت عالٍ", "نحل أسئلة قصيرة بثقة"],
    warmup: {
      durationSec: 45,
      prompt: "كم تفاحة على الطاولة؟ أشر وعدّ بصوت واضح.",
    },
    story: "في حديقة المدرسة، جمع سامي 3 كرات حمراء، ثم وجد كرتين زرقاوين. كم كرة عنده الآن؟",
    explanationCards: [
      { title: "ماذا يعني الجمع؟", body: "الجمع يعني ضم الأشياء معاً لنعرف الكمية كلها." },
      { title: "خطوة 1", body: "نعدّ المجموعة الأولى ببطء." },
      { title: "خطوة 2", body: "نضيف عناصر المجموعة الثانية واحداً واحداً." },
      { title: "خطوة 3", body: "نقول الناتج النهائي بفرح." },
    ],
    workedExamples: [
      {
        prompt: "2 + 1 = ؟",
        steps: ["نبدأ من 2", "نعد واحداً إضافياً: 3", "الناتج 3"],
        answer: "3",
      },
      {
        prompt: "3 + 2 = ؟",
        steps: ["نبدأ من 3", "نعد: 4 ثم 5", "الناتج 5"],
        answer: "5",
      },
      {
        prompt: "4 + 1 = ؟",
        steps: ["نبدأ من 4", "نزيد واحداً", "الناتج 5"],
        answer: "5",
      },
    ],
    visualExamples: [
      { type: "counters", left: 2, right: 3, label: "مكعبات للعد" },
      { type: "counters", left: 1, right: 4, label: "نجوم ملونة" },
      { type: "counters", left: 3, right: 3, label: "أزرار" },
    ],
    lifeExamples: [
      "معك 2 قلم، وأعطتك المعلمة قلماً؛ كم قلم صار لديك؟",
      "في الحقيبة 3 كتب، وضعت كتابين؛ كم كتاباً الآن؟",
    ],
    guidedPractice: [
      { id: "g1", prompt: "1 + 2 = ؟", answer: "3", difficulty: 1 },
      { id: "g2", prompt: "2 + 2 = ؟", answer: "4", difficulty: 1 },
      { id: "g3", prompt: "3 + 1 = ؟", answer: "4", difficulty: 1 },
      { id: "g4", prompt: "4 + 2 = ؟", answer: "6", difficulty: 2 },
      { id: "g5", prompt: "5 + 1 = ؟", answer: "6", difficulty: 2 },
    ],
    independentPractice: [
      { id: "i1", prompt: "2 + 3 = ؟", answer: "5", difficulty: 1 },
      { id: "i2", prompt: "1 + 4 = ؟", answer: "5", difficulty: 1 },
      { id: "i3", prompt: "3 + 3 = ؟", answer: "6", difficulty: 2 },
      { id: "i4", prompt: "4 + 3 = ؟", answer: "7", difficulty: 2 },
      { id: "i5", prompt: "5 + 2 = ؟", answer: "7", difficulty: 2 },
      { id: "i6", prompt: "6 + 1 = ؟", answer: "7", difficulty: 2 },
      { id: "i7", prompt: "2 + 5 = ؟", answer: "7", difficulty: 3 },
      { id: "i8", prompt: "3 + 4 = ؟", answer: "7", difficulty: 3 },
    ],
    supportQuestions: [
      { id: "s1", prompt: "1 + 1 = ؟", answer: "2", hint: "عدّ على أصابعك." },
      { id: "s2", prompt: "2 + 1 = ؟", answer: "3", hint: "ابدأ من 2 ثم زد واحداً." },
      { id: "s3", prompt: "3 + 1 = ؟", answer: "4", hint: "ضع 3 مكعبات ثم أضف مكعباً." },
    ],
    enrichmentQuestions: [
      { id: "e1", prompt: "7 + 2 = ؟", answer: "9" },
      { id: "e2", prompt: "6 + 3 = ؟", answer: "9" },
      { id: "e3", prompt: "5 + 4 = ؟", answer: "9" },
    ],
    interactiveActivities: [
      {
        id: "act-drag-merge",
        type: "drag-merge-groups",
        title: "اسحب المجموعتين معاً",
        left: 3,
        right: 2,
        answer: 5,
      },
      {
        id: "act-pick-number",
        type: "choose-number",
        title: "اختر الناتج الصحيح: 4 + 1",
        choices: ["3", "5", "6"],
        answer: "5",
      },
    ],
    quiz: [
      {
        id: "q1",
        type: "mcq",
        prompt: "2 + 2 = ؟",
        choices: ["3", "4", "5"],
        answer: "4",
        objective: "جمع ضمن 5",
        difficulty: 1,
        hints: ["عدّ من 2", "زيد اثنين"],
        feedbackCorrect: "أحسنت! 2 و2 تصيران 4.",
        feedbackWrong: "محاولة جميلة، لنعدّ معاً مرة أخرى.",
        sourcePages,
      },
      {
        id: "q2",
        type: "mcq",
        prompt: "3 + 1 = ؟",
        choices: ["2", "4", "5"],
        answer: "4",
        objective: "جمع ضمن 5",
        difficulty: 1,
        hints: ["ابدأ من 3"],
        feedbackCorrect: "ممتاز!",
        feedbackWrong: "محاولة جميلة، لنعدّ معاً مرة أخرى.",
        sourcePages,
      },
      {
        id: "q3",
        type: "mcq",
        prompt: "1 + 4 = ؟",
        choices: ["5", "4", "6"],
        answer: "5",
        objective: "جمع ضمن 5",
        difficulty: 2,
        hints: ["ارسم نقاطاً"],
        feedbackCorrect: "رائع!",
        feedbackWrong: "محاولة جميلة، لنعدّ معاً مرة أخرى.",
        sourcePages,
      },
      {
        id: "q4",
        type: "truefalse",
        prompt: "5 + 0 = 5",
        answer: "true",
        objective: "خاصية الصفر",
        difficulty: 2,
        hints: ["إضافة صفر لا تغيّر العدد"],
        feedbackCorrect: "صحيح!",
        feedbackWrong: "محاولة جميلة، لنعدّ معاً مرة أخرى.",
        sourcePages,
      },
      {
        id: "q5",
        type: "mcq",
        prompt: "4 + 2 = ؟",
        choices: ["5", "6", "7"],
        answer: "6",
        objective: "جمع ضمن 10",
        difficulty: 2,
        hints: ["عدّ اثنين بعد 4"],
        feedbackCorrect: "أنت نجم!",
        feedbackWrong: "محاولة جميلة، لنعدّ معاً مرة أخرى.",
        sourcePages,
      },
    ],
    media: {
      svgCounters: true,
      css3dCubes: true,
      threeJs: false,
    },
    sourceReference: {
      bookId: book.id,
      bookTitle: book.title,
      pages: sourcePages,
      rights: book.rights_status,
      note: "Original Success OS rewrite for pipeline demo; not a republication of source prose/images.",
    },
  };
}

async function maybePolishWithOllama(lesson) {
  try {
    const { chatJson } = await import("../ai/provider.js");
    const parsed = await chatJson({
      system:
        "حسّن فقط صياغة العنوان وwhatWeLearn للعربية المبسطة لطفل 6-7 دون تغيير الإجابات الرياضية أو بنية JSON. أرجع JSON بنفس الحقول.",
      user: JSON.stringify({ title: lesson.title, whatWeLearn: lesson.whatWeLearn }),
      timeoutMs: 60000,
    });
    return {
      ...lesson,
      title: parsed.title || lesson.title,
      whatWeLearn: Array.isArray(parsed.whatWeLearn) ? parsed.whatWeLearn : lesson.whatWeLearn,
      aiPolished: true,
    };
  } catch {
    return null;
  }
}

export async function queueDownloadJobsForOpenBooks(limit = 3) {
  const db = getDb();
  const books = db
    .prepare(
      `SELECT id FROM books
       WHERE rights_status='OPEN_LICENSE' AND official_url IS NOT NULL AND official_url != ''
       AND status IN ('DISCOVERED','FAILED','SOURCE_ACCESS_BLOCKED','QUEUED')
       ORDER BY title LIMIT ?`,
    )
    .all(limit);
  for (const b of books) {
    updateBook(b.id, { status: BOOK_STATUS.QUEUED });
    await enqueue(QUEUE_NAMES.download, { bookId: b.id });
  }
  return books.map((b) => b.id);
}

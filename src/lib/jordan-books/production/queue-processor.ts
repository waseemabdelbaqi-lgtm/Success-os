import { G1_MATH_S1_STUDENT_BOOK } from "@/src/lib/jordan-books/content/g1-math-s1/student-book";
import { G1_SEM1_SUBJECT_BOOKS } from "@/src/lib/jordan-books/content/g1-sem1-subjects";
import {
  PRIORITY_AUTHORED_PACKS,
  buildCellToBookMap,
} from "@/src/lib/jordan-books/content/subject-packs";
import { loadProductionStore, saveProductionStore } from "@/src/lib/jordan-books/matrix/queue-store";
import type { BookRecord } from "@/src/lib/jordan-books/schema/types";
import { buildCompanionBook, type CompanionBookSeed } from "@/src/lib/jordan-books/content/companion-factory";
import type { InventoryCell } from "@/src/lib/jordan-books/matrix/types";

export function listAuthoredBooks(): BookRecord[] {
  return [G1_MATH_S1_STUDENT_BOOK, ...G1_SEM1_SUBJECT_BOOKS, ...PRIORITY_AUTHORED_PACKS];
}

const CELL_TO_BOOK: Record<string, string> = buildCellToBookMap();

function stubSeedFromCell(cell: InventoryCell): CompanionBookSeed {
  const gradeNum = cell.gradeKey.replace(/\D/g, "") || cell.gradeKey;
  const unitCount = 2;
  const lessonCount = 4;
  const units = Array.from({ length: unitCount }, (_, ui) => {
    const unitOrder = ui + 1;
    return {
      id: `u${unitOrder}`,
      order: unitOrder,
      titleAr: `وحدة ${unitOrder} تأسيسية — ${cell.subjectAr}`,
      titleEn: `Foundation unit ${unitOrder} — ${cell.subjectSlug}`,
      descriptionAr:
        "وحدة تأسيسية Success OS. عناوين الوحدات الرسمية الكاملة NEEDS VERIFICATION مقابل طبعة NCCD الحالية.",
      lessons: Array.from({ length: lessonCount }, (_, li) => {
        const lessonOrder = li + 1;
        return {
          id: `u${unitOrder}-l${lessonOrder}`,
          order: lessonOrder,
          titleAr: `درس ${lessonOrder}: ${cell.subjectAr}`,
          titleEn: `Lesson ${lessonOrder}`,
          outcomes: [`أتعرّف مفهوماً أولياً في ${cell.subjectAr}`, "أشارك في نشاط صفّي بسيط"],
          hookAr: `لماذا نتعلّم ${cell.subjectAr}؟`,
          explanationAr: `مدخل تفاعلي أصلي لمبحث ${cell.subjectAr} في ${cell.gradeAr}. مسودة للمراجعة الأكاديمية — لا يدّعي أنه نص الكتاب الحكومي.`,
          exampleAr: `هل ${cell.subjectAr} مادة مهمة؟`,
          answer: "نعم",
          options: ["نعم", "لا", "غير متأكد"],
          correctIndex: 0,
        };
      }),
    };
  });

  return {
    id: cell.structuredBookId || `jo-g${gradeNum}-s${cell.semester}-${cell.subjectSlug}-companion`,
    grade: String(gradeNum || cell.gradeKey),
    gradeAr: cell.gradeAr,
    semester: String(cell.semester),
    semesterAr: cell.semesterAr,
    subject: cell.subjectSlug,
    subjectAr: cell.subjectAr,
    stage: cell.stage,
    officialSourceUrl: cell.officialSourceUrl,
    units,
  };
}

export function buildStubBookForCell(cell: InventoryCell): BookRecord {
  const book = buildCompanionBook(stubSeedFromCell(cell));
  book.id = cell.structuredBookId || book.id;
  book.completenessClaim = "not_complete";
  book.verificationNote =
    (book.verificationNote || "") +
    " Foundation stub from production queue — expand to full official unit map before CONTENT_COMPLETE.";
  return book;
}

export async function processProductionQueue(limit = 50): Promise<{
  processed: number;
  results: Array<{ cellId: string; status: string; bookId?: string; note?: string }>;
  storeSummary: { pending: number; done: number; blocked: number };
}> {
  const store = await loadProductionStore();
  const authored = listAuthoredBooks();
  const authoredIds = new Set(authored.map((b) => b.id));
  const results: Array<{ cellId: string; status: string; bookId?: string; note?: string }> = [];

  for (const [cellId, bookId] of Object.entries(CELL_TO_BOOK)) {
    if (!authoredIds.has(bookId)) continue;
    const book = authored.find((b) => b.id === bookId)!;
    store.cells = store.cells.map((c) =>
      c.id === cellId
        ? {
            ...c,
            matrixStatus: "CONTENT_COMPLETE",
            structuredBookId: book.id,
            unitsDone: book.units.length,
            lessonsDone: book.units.reduce((n, u) => n + u.lessons.length, 0),
            exercisesDone: book.answerBank?.length || 0,
            answersDone: book.answerBank?.length || 0,
            blocker: undefined,
          }
        : c,
    );
    store.queue = store.queue.map((q) => (q.cellId === cellId ? { ...q, state: "done" } : q));
    if (!store.processedBookIds.includes(bookId)) store.processedBookIds.push(bookId);
  }

  const pending = store.queue
    .filter((q) => q.state === "pending")
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);

  for (const item of pending) {
    const cell = store.cells.find((c) => c.id === item.cellId);
    if (!cell) {
      results.push({ cellId: item.cellId, status: "blocked", note: "cell missing" });
      continue;
    }
    if (cell.matrixStatus === "NOT_DISCOVERED") {
      store.queue = store.queue.map((q) =>
        q.cellId === item.cellId ? { ...q, state: "blocked", lastError: cell.blocker } : q,
      );
      results.push({ cellId: cell.id, status: "blocked", note: cell.blocker });
      continue;
    }

    const mapped = CELL_TO_BOOK[cell.id];
    if (mapped && authoredIds.has(mapped)) {
      results.push({ cellId: cell.id, status: "CONTENT_COMPLETE", bookId: mapped });
      continue;
    }

    const gradeKey = cell.gradeKey;
    const bookId = `jo-${gradeKey}-s${cell.semester}-${cell.subjectSlug}-companion`;
    const stub = buildStubBookForCell({ ...cell, structuredBookId: bookId });
    store.cells = store.cells.map((c) =>
      c.id === cell.id
        ? {
            ...c,
            matrixStatus: "STRUCTURED",
            structuredBookId: bookId,
            unitsDone: stub.units.length,
            lessonsDone: stub.units.reduce((n, u) => n + u.lessons.length, 0),
            exercisesDone: stub.answerBank?.length || 0,
            answersDone: stub.answerBank?.length || 0,
          }
        : c,
    );
    store.queue = store.queue.map((q) =>
      q.cellId === cell.id ? { ...q, state: "done", attempts: q.attempts + 1 } : q,
    );
    if (!store.processedBookIds.includes(bookId)) store.processedBookIds.push(bookId);
    results.push({ cellId: cell.id, status: "STRUCTURED", bookId, note: "Foundation stub — not COMPLETE" });
  }

  await saveProductionStore(store);
  return {
    processed: results.length,
    results,
    storeSummary: {
      pending: store.queue.filter((q) => q.state === "pending").length,
      done: store.queue.filter((q) => q.state === "done").length,
      blocked: store.queue.filter((q) => q.state === "blocked").length,
    },
  };
}

export async function loadStubBooks(): Promise<BookRecord[]> {
  const store = await loadProductionStore();
  return store.cells
    .filter((c) => c.bookType === "sos_companion" && c.matrixStatus === "STRUCTURED" && c.structuredBookId)
    .map((c) => buildStubBookForCell(c));
}

export async function getStubBookById(bookId: string): Promise<BookRecord | null> {
  const store = await loadProductionStore();
  const cell = store.cells.find((c) => c.structuredBookId === bookId && c.matrixStatus === "STRUCTURED");
  return cell ? buildStubBookForCell(cell) : null;
}

export async function getAnyBookById(bookId: string): Promise<BookRecord | null> {
  const authored = listAuthoredBooks().find((b) => b.id === bookId);
  if (authored) return authored;
  return getStubBookById(bookId);
}

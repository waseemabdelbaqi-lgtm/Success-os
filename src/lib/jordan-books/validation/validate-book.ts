import type { BookRecord, ValidationIssue } from "@/src/lib/jordan-books/schema/types";
import { expectedSem1LessonCount, G1_MATH_S1_UNITS } from "@/src/lib/jordan-books/content/g1-math-s1/structure";

const PLACEHOLDER_RE = /TODO|TBD|lorem ipsum|placeholder|xxx|coming soon/i;

export function validateBook(book: BookRecord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!book.officialTitleAr) {
    issues.push({ severity: "error", code: "missing_title", message: "Missing book title", bookId: book.id });
  }
  if (!book.edition || book.edition === "NEEDS VERIFICATION") {
    issues.push({
      severity: "warning",
      code: "missing_edition",
      message: "Edition NEEDS VERIFICATION",
      bookId: book.id,
    });
  }
  if (!book.officialSourceUrl) {
    issues.push({ severity: "error", code: "missing_source", message: "Missing official source URL", bookId: book.id });
  }
  if (!book.rightsStatus) {
    issues.push({ severity: "error", code: "missing_rights", message: "Missing rights status", bookId: book.id });
  }
  if (!book.semester) {
    issues.push({ severity: "error", code: "missing_semester", message: "Missing semester", bookId: book.id });
  }
  if (book.completenessClaim === "complete") {
    issues.push({
      severity: "error",
      code: "invalid_complete_claim",
      message: "Book marked complete while automated gate may disagree — review required",
      bookId: book.id,
    });
  }

  if (book.id === "jo-g1-s1-math-student-book") {
    const expectedIds = new Set(G1_MATH_S1_UNITS.map((u) => u.id));
    for (const expected of G1_MATH_S1_UNITS) {
      const unit = book.units.find((u) => u.id === expected.id);
      if (!unit) {
        issues.push({
          severity: "error",
          code: "missing_unit",
          message: `Missing expected unit ${expected.titleAr}`,
          bookId: book.id,
          unitId: expected.id,
        });
        continue;
      }
      if (unit.lessons.length !== expected.lessons.length) {
        issues.push({
          severity: "error",
          code: "lesson_count_mismatch",
          message: `Unit ${unit.id} expected ${expected.lessons.length} lessons, found ${unit.lessons.length}`,
          bookId: book.id,
          unitId: unit.id,
        });
      }
      expected.lessons.forEach((el, idx) => {
        const lesson = unit.lessons[idx];
        if (!lesson || lesson.id !== el.id) {
          issues.push({
            severity: "error",
            code: "incorrect_lesson_order",
            message: `Expected lesson ${el.id} at position ${idx + 1}`,
            bookId: book.id,
            unitId: unit.id,
            lessonId: el.id,
          });
        }
      });
    }
    for (const unit of book.units) {
      if (!expectedIds.has(unit.id)) {
        issues.push({
          severity: "warning",
          code: "extra_unit",
          message: `Unexpected unit in Sem1 math book: ${unit.id}`,
          bookId: book.id,
          unitId: unit.id,
        });
      }
    }
    const lessonCount = book.units.reduce((n, u) => n + u.lessons.length, 0);
    const expected = expectedSem1LessonCount();
    if (lessonCount !== expected) {
      issues.push({
        severity: "error",
        code: "sem1_lesson_total_mismatch",
        message: `Expected ${expected} Sem1 core lessons, found ${lessonCount}`,
        bookId: book.id,
      });
    }
  } else if (book.units.length === 0) {
    issues.push({
      severity: "error",
      code: "missing_unit",
      message: "Companion book has no units",
      bookId: book.id,
    });
  }

  for (const unit of book.units) {
    const lessonIds = unit.lessons.map((l) => l.id);
    const dup = lessonIds.filter((id, i) => lessonIds.indexOf(id) !== i);
    for (const id of dup) {
      issues.push({
        severity: "error",
        code: "duplicate_lesson",
        message: `Duplicate lesson id ${id}`,
        bookId: book.id,
        unitId: unit.id,
        lessonId: id,
      });
    }

    for (const lesson of unit.lessons) {
      if (!lesson.blocks.length) {
        issues.push({
          severity: "error",
          code: "empty_section",
          message: "Lesson has no blocks",
          bookId: book.id,
          unitId: unit.id,
          lessonId: lesson.id,
        });
      }
      if (lesson.blocks.length < 12) {
        issues.push({
          severity: "warning",
          code: "suspiciously_short_lesson",
          message: `Lesson has only ${lesson.blocks.length} blocks`,
          bookId: book.id,
          unitId: unit.id,
          lessonId: lesson.id,
        });
      }
      if (!lesson.learningOutcomes.length) {
        issues.push({
          severity: "error",
          code: "missing_learning_outcome",
          message: "Missing learning outcomes",
          bookId: book.id,
          lessonId: lesson.id,
        });
      }
      if (!lesson.sources.length) {
        issues.push({
          severity: "error",
          code: "missing_source",
          message: "Lesson missing sources",
          bookId: book.id,
          lessonId: lesson.id,
        });
      }
      if (lesson.editorialStatus === "published" && lesson.aiGeneratedFlag) {
        issues.push({
          severity: "error",
          code: "ai_published_without_clearance",
          message: "AI-flagged lesson cannot be published without human approval trail",
          bookId: book.id,
          lessonId: lesson.id,
        });
      }

      for (const block of lesson.blocks) {
        if (!block.bodyAr?.trim()) {
          issues.push({
            severity: "error",
            code: "empty_section",
            message: `Empty block ${block.id}`,
            bookId: book.id,
            lessonId: lesson.id,
          });
        }
        if (PLACEHOLDER_RE.test(block.bodyAr || "") || PLACEHOLDER_RE.test(block.titleAr || "")) {
          issues.push({
            severity: "error",
            code: "placeholder_text",
            message: `Placeholder text in ${block.id}`,
            bookId: book.id,
            lessonId: lesson.id,
          });
        }
        if (block.type === "question") {
          if (!block.question?.explanationAr) {
            issues.push({
              severity: "error",
              code: "answer_without_explanation",
              message: `Question ${block.id} missing explanation`,
              bookId: book.id,
              lessonId: lesson.id,
            });
          }
          const hasAnswer =
            typeof block.question?.correctIndex === "number" || Boolean(block.question?.correctAnswer);
          if (!hasAnswer) {
            issues.push({
              severity: "error",
              code: "question_without_answer",
              message: `Question ${block.id} missing answer`,
              bookId: book.id,
              lessonId: lesson.id,
            });
          }
        }
      }
    }
  }

  return issues;
}

export function summarizeValidation(issues: ValidationIssue[]) {
  return {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
    issues,
  };
}

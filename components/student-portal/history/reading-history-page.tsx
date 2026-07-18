"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { getLocalizedText } from "@/content/demo/catalog";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { Button } from "@/components/ui/button";

export function ReadingHistoryPage(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { history } = useStudentData();

  const items = useMemo(
    () =>
      history.map((entry) => {
        const book = bookCatalogService.getBookById(entry.bookId);
        const lesson = bookCatalogService.getLesson(
          entry.bookId,
          entry.unitId,
          entry.lessonId,
        );
        return { entry, book, lesson };
      }),
    [history],
  );

  return (
    <div>
      <StudentTopBar title={t("readingHistory")} subtitle="Every chapter of your reading journey." />
      <div className="space-y-3 p-4 sm:p-7">
        {items.map(({ entry, book, lesson }) => (
          <article
            key={entry.id}
            className="luxury-card luxury-card-hover flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-black text-[#671016]">
                {lesson
                  ? getLocalizedText(lesson.title, locale)
                  : entry.lessonId}
              </h3>
              <p className="mt-1 text-sm text-[#806d65]">
                {book ? getLocalizedText(book.title, locale) : entry.bookId}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#a18b82]">
                {new Date(entry.visitedAt).toLocaleString(locale)}
                {entry.durationMinutes
                  ? ` · ${entry.durationMinutes} min`
                  : ""}
              </p>
            </div>
            <Link
              href={STUDENT_ROUTES.lesson(
                entry.bookId,
                entry.unitId,
                entry.lessonId,
              )}
            >
              <Button size="sm">{t("continueLesson")}</Button>
            </Link>
          </article>
        ))}
        {items.length === 0 && (
          <p className="luxury-card rounded-[2rem] border-dashed p-12 text-center text-sm text-[#806d65]">
            {t("noResults")}
          </p>
        )}
      </div>
    </div>
  );
}

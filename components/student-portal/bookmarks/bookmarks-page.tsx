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

export function BookmarksPage(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { bookmarks, removeBookmark } = useStudentData();

  const items = useMemo(
    () =>
      bookmarks.map((bookmark) => {
        const book = bookCatalogService.getBookById(bookmark.bookId);
        const lesson = bookCatalogService.getLesson(
          bookmark.bookId,
          bookmark.unitId,
          bookmark.lessonId,
        );
        return { bookmark, book, lesson };
      }),
    [bookmarks],
  );

  return (
    <div>
      <StudentTopBar title={t("bookmarks")} subtitle="Return to the lessons that matter most." />
      <div className="space-y-4 p-4 sm:p-7">
        {items.map(({ bookmark, book, lesson }) => (
          <article
            key={bookmark.id}
            className="luxury-card luxury-card-hover flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-black text-[#671016]">
                {lesson
                  ? getLocalizedText(lesson.title, locale)
                  : bookmark.label}
              </h3>
              <p className="mt-1 text-sm text-[#806d65]">
                {book ? getLocalizedText(book.title, locale) : bookmark.bookId}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={STUDENT_ROUTES.lesson(
                  bookmark.bookId,
                  bookmark.unitId,
                  bookmark.lessonId,
                )}
              >
                <Button size="sm">{t("openLesson")}</Button>
              </Link>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => removeBookmark(bookmark.id)}
              >
                Remove
              </Button>
            </div>
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

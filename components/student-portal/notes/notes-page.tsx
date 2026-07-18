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

export function NotesPage(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { notes, deleteNote } = useStudentData();

  const items = useMemo(
    () =>
      notes.map((note) => {
        const book = bookCatalogService.getBookById(note.bookId);
        const lesson = bookCatalogService.getLesson(
          note.bookId,
          note.unitId,
          note.lessonId,
        );
        return { note, book, lesson };
      }),
    [notes],
  );

  return (
    <div>
      <StudentTopBar title={t("notes")} subtitle="Your thinking, connected to every lesson." />
      <div className="space-y-4 p-4 sm:p-7">
        {items.map(({ note, book, lesson }) => (
          <article
            key={note.id}
            className="luxury-card luxury-card-hover rounded-[1.5rem] p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-black text-[#671016]">
                  {lesson
                    ? getLocalizedText(lesson.title, locale)
                    : note.lessonId}
                </h3>
                <p className="mt-1 text-sm text-[#806d65]">
                  {book ? getLocalizedText(book.title, locale) : note.bookId}
                </p>
                <p className="mt-3 text-sm leading-7 text-[#654f48]">
                  {note.content}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={STUDENT_ROUTES.lesson(
                    note.bookId,
                    note.unitId,
                    note.lessonId,
                  )}
                >
                  <Button size="sm" variant="secondary">
                    {t("openLesson")}
                  </Button>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNote(note.id)}
                >
                  Delete
                </Button>
              </div>
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

"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { getLocalizedText } from "@/content/demo/catalog";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { ProgressBar } from "@/components/student-portal/shared/progress-bar";
import { Button } from "@/components/ui/button";
import type { BookDefinition } from "@/types/student-portal";

type BookDetailViewProps = {
  book: BookDefinition;
};

export function BookDetailView({ book }: BookDetailViewProps): ReactNode {
  const { locale, t } = useStudentPortal();
  const { getBookProgress, toggleSavedBook, isBookSaved } = useStudentData();

  const journey = bookCatalogService.resolveJourneyLabels(book.id, locale);
  const progress = getBookProgress(book.id);
  const totalLessons = bookCatalogService.getTotalLessons(book.id);

  const continueTarget = useMemo(() => {
    if (progress?.lastUnitId && progress.lastLessonId) {
      return {
        unitId: progress.lastUnitId,
        lessonId: progress.lastLessonId,
      };
    }
    const firstUnit = book.units[0];
    const firstLesson = firstUnit?.lessons[0];
    if (!firstUnit || !firstLesson) return null;
    return { unitId: firstUnit.id, lessonId: firstLesson.id };
  }, [book.units, progress]);

  return (
    <div>
      <StudentTopBar
        title={getLocalizedText(book.title, locale)}
        subtitle={journey?.subject}
      />
      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px] lg:p-7">
        <div className="space-y-6">
          <section className="luxury-card relative overflow-hidden rounded-[2rem]">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-[#8b1e1e]/7 via-[#d4af37]/10 to-transparent" />
            <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[210px_1fr]">
              <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#f7e8c9] to-[#fffaf0] p-7">
                <div
                  className="book-3d flex aspect-[3/4] w-full max-w-36 flex-col justify-between rounded-l-lg rounded-r-sm p-5 text-white"
                  style={{ backgroundColor: book.coverColor }}
                >
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#f2d77c]">
                    Success Academy
                  </span>
                  <span className="text-center text-2xl font-black">
                    {book.coverLabel}
                  </span>
                  <span className="h-px bg-[#f2d77c]/50" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a711a]">
                  Digital textbook • Official reading journey
                </p>
                <h2 className="text-3xl font-black tracking-[-0.04em] text-[#671016]">
                  {getLocalizedText(book.title, locale)}
                </h2>
                <div className="grid gap-2 text-sm text-[#6f5c55] sm:grid-cols-2">
                  <Meta label={t("country")} value={journey?.country} />
                  <Meta label={t("system")} value={journey?.system} />
                  <Meta label={t("curriculum")} value={journey?.curriculum} />
                  <Meta label={t("grade")} value={journey?.grade} />
                  <Meta label={t("subject")} value={journey?.subject} />
                  <Meta label={t("language")} value={book.language === "ar" ? "العربية" : "English"} />
                  <Meta label={t("version")} value={book.version} />
                  <Meta label={t("bookType")} value={book.bookType} />
                </div>
                <p className="text-sm leading-7 text-[#654f48]">
                  {getLocalizedText(book.description, locale)}
                </p>
                <div className="flex flex-wrap gap-3">
                  {continueTarget && (
                    <Link
                      href={STUDENT_ROUTES.lesson(
                        book.id,
                        continueTarget.unitId,
                        continueTarget.lessonId,
                      )}
                    >
                      <Button>{t("continueLesson")}</Button>
                    </Link>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => toggleSavedBook(book.id)}
                  >
                    {isBookSaved(book.id) ? t("unsaveBook") : t("saveBook")}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="luxury-card rounded-[2rem] p-6 sm:p-8">
            <h2 className="text-xl font-black text-[#671016]">
              {t("tableOfContents")}
            </h2>
            <div className="mt-4 space-y-4">
              {book.units.map((unit) => (
                <div key={unit.id} className="rounded-2xl border border-[#d4af37]/25 bg-[#fffaf0]/65 p-4 transition hover:border-[#d4af37]/55">
                  <h3 className="font-black text-[#671016]">
                    {getLocalizedText(unit.title, locale)}
                  </h3>
                  <p className="mt-1 text-sm text-[#806d65]">
                    {getLocalizedText(unit.description, locale)}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {unit.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={STUDENT_ROUTES.lesson(book.id, unit.id, lesson.id)}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-[#6a514b] transition hover:bg-white hover:text-[#8b1e1e] hover:shadow-sm"
                        >
                          <span>{getLocalizedText(lesson.title, locale)}</span>
                          <span className="rounded-full bg-[#d4af37]/12 px-2 py-1 text-[10px] font-bold text-[#8d6716]">
                            {lesson.estimatedMinutes} min
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="luxury-card sticky top-28 rounded-[1.75rem] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9a711a]">
              Reading journey
            </p>
            <h3 className="mt-2 font-black text-[#671016]">{t("progress")}</h3>
            <div className="mt-3">
              <ProgressBar
                value={progress?.progressPercent ?? 0}
                label={t("progress")}
              />
            </div>
            <p className="mt-3 text-xs text-[#806d65]">
              {progress?.completedLessons.length ?? 0} / {totalLessons} {t("lessons")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value?: string;
}): ReactNode {
  return (
    <div>
      <span className="text-[#9b8880]">{label}: </span>
      <span className="font-bold text-[#5e4540]">{value ?? "—"}</span>
    </div>
  );
}

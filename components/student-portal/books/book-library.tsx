"use client";

import { useMemo, type ReactNode } from "react";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import {
  BookFiltersPanel,
  useBookFiltersState,
} from "@/components/student-portal/books/book-filters";
import { BookCard } from "@/components/student-portal/books/book-card";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { Button } from "@/components/ui/button";

export function BookLibrary(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { filters, setFilters } = useBookFiltersState();
  const { bookProgress, toggleSavedBook, isBookSaved } = useStudentData();

  const books = useMemo(
    () => bookCatalogService.filterBooks(filters),
    [filters],
  );

  return (
    <div>
      <StudentTopBar
        title="The Success Library"
        subtitle="Discover books by curriculum, grade, subject, and language."
      />
      <div className="space-y-6 p-4 sm:p-7">
        <BookFiltersPanel filters={filters} onChange={setFilters} />

        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a711a]">
            {books.length} curated {t("books").toLowerCase()}
          </p>
          <p className="hidden text-xs text-[#8b7770] sm:block">
            Books • Summaries • Full lessons
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {books.map((book) => {
            const progress = bookProgress.find((p) => p.bookId === book.id);
            return (
              <BookCard
                key={book.id}
                book={book}
                locale={locale}
                progressPercent={progress?.progressPercent}
                saved={isBookSaved(book.id)}
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleSavedBook(book.id)}
                  >
                    {isBookSaved(book.id) ? t("unsaveBook") : t("saveBook")}
                  </Button>
                }
              />
            );
          })}
        </div>

        {books.length === 0 && (
          <div className="luxury-card rounded-[1.75rem] border-dashed p-12 text-center text-sm text-[#8b7770]">
            {t("noResults")}
          </div>
        )}
      </div>
    </div>
  );
}

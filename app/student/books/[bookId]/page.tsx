import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BookDetailView } from "@/components/student-portal/books/book-detail";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { getLocalizedText } from "@/content/demo/catalog";
import { getMiddleEastLiveBookVersion } from "@/app/lib/student/middle-east-live-book-store";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { bookId } = await params;
  const book = bookCatalogService.getBookById(bookId);
  return {
    title: book ? getLocalizedText(book.title, "en") : "Book",
  };
}

export default async function StudentBookPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { bookId } = await params;
  const book = bookCatalogService.getBookById(bookId);

  if (!book) {
    // Live Middle East books use /read, not the demo detail shelf.
    if (getMiddleEastLiveBookVersion(bookId)) {
      redirect(STUDENT_ROUTES.read(bookId));
    }
    notFound();
  }

  return <BookDetailView book={book} />;
}

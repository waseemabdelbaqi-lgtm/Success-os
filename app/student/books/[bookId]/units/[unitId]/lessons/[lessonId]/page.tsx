import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LessonReader } from "@/components/student-portal/reader/lesson-reader";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { getLocalizedText } from "@/content/demo/catalog";

type PageProps = {
  params: Promise<{
    bookId: string;
    unitId: string;
    lessonId: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { bookId, unitId, lessonId } = await params;
  const lesson = bookCatalogService.getLesson(bookId, unitId, lessonId);
  return {
    title: lesson ? getLocalizedText(lesson.title, "en") : "Lesson",
  };
}

export default async function StudentLessonPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { bookId, unitId, lessonId } = await params;
  const path = bookCatalogService.getLessonPath(bookId, unitId, lessonId);

  if (!path) {
    notFound();
  }

  return (
    <LessonReader
      book={path.book}
      unit={path.unit}
      lesson={path.lesson}
    />
  );
}

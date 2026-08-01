import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LessonReader } from "@/components/student-portal/reader/lesson-reader";
import { InteractiveLessonViewer } from "@/components/interactive-lesson-engine/interactive-lesson-viewer";
import { S4sIntelligenceTeacher } from "@/components/student-ai-learning-stack/s4s-intelligence-teacher";
import { S4sTeacherDock } from "@/components/student-ai-learning-stack/s4s-teacher-dock";
import { StudioLessonLauncher } from "@/components/ai-teachers/studio-lesson-launcher";
import { bookCatalogService } from "@/services/student/book-catalog.service";
import { getLocalizedText } from "@/content/demo/catalog";
import { buildPackageFromBookPath } from "@/lib/interactive-lesson-engine";

type PageProps = {
  params: Promise<{
    bookId: string;
    unitId: string;
    lessonId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

/**
 * Default viewer = Interactive Lesson Engine (books-first adaptation).
 * Classic reader preserved via ?classic=1 (no architecture break).
 */
export default async function StudentLessonPage({
  params,
  searchParams,
}: PageProps): Promise<ReactNode> {
  const { bookId, unitId, lessonId } = await params;
  const sp = await searchParams;
  const path = bookCatalogService.getLessonPath(bookId, unitId, lessonId);

  if (!path) {
    notFound();
  }

  const classic =
    sp.classic === "1" || sp.classic === "true" || sp.viewer === "classic";

  if (classic) {
    return (
      <div>
        <div style={{ padding: "0.5rem 1rem", fontSize: 12 }}>
          <Link
            href={`/student/books/${bookId}/units/${unitId}/lessons/${lessonId}`}
            style={{ color: "#0f766e" }}
          >
            Open Interactive Lesson Engine
          </Link>
        </div>
        <LessonReader book={path.book} unit={path.unit} lesson={path.lesson} />
      </div>
    );
  }

  const pkg = buildPackageFromBookPath(bookId, unitId, lessonId);
  if (!pkg) {
    return (
      <LessonReader book={path.book} unit={path.unit} lesson={path.lesson} />
    );
  }

  const locale = path.book.language === "en" ? "en" : "ar";

  const lessonTitle = getLocalizedText(path.lesson.title, "en");
  const lessonTitleAr = getLocalizedText(path.lesson.title, "ar");
  const lessonTexts = [lessonTitleAr || lessonTitle].filter(Boolean);

  return (
    <div>
      <StudioLessonLauncher
        lessonId={`${bookId}/${unitId}/${lessonId}`}
        title={lessonTitle}
        titleAr={lessonTitleAr}
        subject={path.book.subjectId}
        grade={path.book.gradeId}
        texts={lessonTexts}
      />
      <S4sIntelligenceTeacher
        locale={locale}
        studentName="Ahmad"
        lessonKey={`${bookId}/${unitId}/${lessonId}`}
      />
      <S4sTeacherDock locale={locale} topicEn="Fractions" topicAr="الكسور" />
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.5rem 1rem 0",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        Interactive Lesson Engine · Digital Human Studio
        {" · "}
        <Link
          href={`/student/books/${bookId}/units/${unitId}/lessons/${lessonId}?classic=1`}
          style={{ color: "#0f766e" }}
        >
          Classic reader
        </Link>
        {" · "}
        <Link href="/ai-teacher/studio" style={{ color: "#0f766e" }}>
          Studio
        </Link>
      </div>
      <InteractiveLessonViewer pkg={pkg} locale={locale} />
    </div>
  );
}

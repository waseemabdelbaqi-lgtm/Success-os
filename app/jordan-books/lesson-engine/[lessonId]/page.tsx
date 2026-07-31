import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInteractiveLesson } from "@/src/lib/sos-lesson-engine/registry";
import { LessonJourneyPlayer } from "@/src/components/sos-lesson-engine/LessonJourneyPlayer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getInteractiveLesson(decodeURIComponent(lessonId));
  return { title: `${lesson?.identity.lessonTitleAr || "درس تفاعلي"} | Success OS` };
}

export default async function InteractiveLessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = getInteractiveLesson(decodeURIComponent(lessonId));
  if (!lesson) notFound();

  return (
    <main>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0.75rem 1rem" }} dir="rtl">
        <p style={{ fontSize: 14 }}>
          <Link href={`/jordan-books/book/${lesson.identity.bookId}`}>وضع صفحات الكتاب</Link>
          {" · "}
          <Link href={`/jordan-books/lesson-engine/${lesson.id}/review-game`}>لعبة مراجعة</Link>
          {" · "}
          <Link href={`/teacher/live-lesson?lessonId=${encodeURIComponent(lesson.id)}`}>جلسة معلم</Link>
          {" · "}
          <Link href="/admin/lesson-studio">استوديو الدروس</Link>
        </p>
      </div>
      <LessonJourneyPlayer lesson={lesson} />
    </main>
  );
}

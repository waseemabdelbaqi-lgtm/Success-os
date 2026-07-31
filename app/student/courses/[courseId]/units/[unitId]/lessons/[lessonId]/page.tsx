import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LessonWorkspace } from "@/components/student-portal/courses/lesson-workspace";
import {
  getLesson,
  getLocalized,
} from "@/services/student/course-structure.service";

type PageProps = {
  params: Promise<{
    courseId: string;
    unitId: string;
    lessonId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId, unitId, lessonId } = await params;
  const path = getLesson(courseId, unitId, lessonId);
  return {
    title: path ? getLocalized(path.lesson.title, "en") : "Lesson",
  };
}

export default async function StudentCourseLessonPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { courseId, unitId, lessonId } = await params;
  const path = getLesson(courseId, unitId, lessonId);
  if (!path) notFound();

  return (
    <LessonWorkspace
      course={path.course}
      unit={path.unit}
      lesson={path.lesson}
      locale="ar"
    />
  );
}

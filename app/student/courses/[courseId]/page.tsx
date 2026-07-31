import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  buildCourseTree,
  getCourse,
  getLocalized,
} from "@/services/student/course-structure.service";
import { LESSON_BLOCK_LABELS, LESSON_BLOCK_ORDER } from "@/types/course-structure";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  return {
    title: course ? getLocalized(course.title, "en") : "Course",
  };
}

export default async function StudentCourseDetailPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  const tree = buildCourseTree(course);

  return (
    <div dir="rtl" style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
        <Link href="/student/courses" style={{ color: "#0f766e" }}>
          الدورات
        </Link>
      </p>
      <h1 style={{ margin: "0.35rem 0", fontSize: "1.55rem" }}>
        {getLocalized(course.title, "ar")}
      </h1>
      <p style={{ color: "#4b5563", lineHeight: 1.55 }}>
        {getLocalized(course.description, "ar")}
      </p>
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        {course.curriculum} · {course.grade} · {course.subject} · schema{" "}
        {course.schema}
      </p>

      <section style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 0.5rem" }}>شجرة المحتوى</h2>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            padding: "0.85rem 1rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <div>Course · {getLocalized(tree.title, "ar")}</div>
          {course.units.map((unit) => (
            <div key={unit.id} style={{ marginInlineStart: 16, marginTop: 8 }}>
              └── Unit · {getLocalized(unit.title, "ar")}
              {unit.lessons.map((lesson) => (
                <div key={lesson.id} style={{ marginInlineStart: 16 }}>
                  └──{" "}
                  <Link
                    href={`/student/courses/${course.slug}/units/${unit.id}/lessons/${lesson.id}`}
                    style={{ color: "#0f766e" }}
                  >
                    Lesson · {getLocalized(lesson.title, "ar")}
                  </Link>
                  <div style={{ marginInlineStart: 16, color: "#6b7280" }}>
                    {LESSON_BLOCK_ORDER.map((id) => (
                      <div key={id}>
                        ├── {getLocalized(LESSON_BLOCK_LABELS[id], "ar")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "1.25rem" }}>
        <h2 style={{ fontSize: 16, margin: "0 0 0.5rem" }}>الوحدات والدروس</h2>
        {course.units.map((unit) => (
          <div
            key={unit.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "0.85rem",
              marginBottom: 10,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700 }}>{getLocalized(unit.title, "ar")}</div>
            <p style={{ margin: "0.35rem 0 0.6rem", fontSize: 13, color: "#4b5563" }}>
              {getLocalized(unit.description, "ar")}
            </p>
            <ul style={{ margin: 0, paddingInlineStart: 18 }}>
              {unit.lessons.map((lesson) => (
                <li key={lesson.id} style={{ marginBottom: 4 }}>
                  <Link
                    href={`/student/courses/${course.slug}/units/${unit.id}/lessons/${lesson.id}`}
                    style={{ color: "#0f766e" }}
                  >
                    {getLocalized(lesson.title, "ar")}
                  </Link>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    {" "}
                    · {lesson.estimatedMinutes} د
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  COURSE_DEMO_META,
  getLocalized,
  listCourses,
} from "@/services/student/course-structure.service";

export const metadata: Metadata = {
  title: "Courses · Success OS",
};

export default function StudentCoursesPage(): ReactNode {
  const courses = listCourses();

  return (
    <div dir="rtl" style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.6rem" }}>الدورات · Courses</h1>
        <p style={{ color: "#4b5563", margin: "0.5rem 0 0", lineHeight: 1.55 }}>
          الهيكل: Course → Unit → Lesson مع كتل المحتوى الكاملة داخل كل درس.
        </p>
        {COURSE_DEMO_META.isDemo ? (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#92400e",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
            }}
          >
            {COURSE_DEMO_META.disclaimer}
          </p>
        ) : null}
      </header>

      <div style={{ display: "grid", gap: 12 }}>
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/student/courses/${course.slug}`}
            style={{
              display: "block",
              textDecoration: "none",
              color: "inherit",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "1rem",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {getLocalized(course.title, "ar")}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              {getLocalized(course.title, "en")}
            </div>
            <p style={{ margin: "0.5rem 0 0", color: "#4b5563", fontSize: 14 }}>
              {getLocalized(course.description, "ar")}
            </p>
            <div style={{ marginTop: 8, fontSize: 12, color: "#0f766e" }}>
              {course.units.length} وحدات ·{" "}
              {course.units.reduce((n, u) => n + u.lessons.length, 0)} دروس ·{" "}
              {course.hierarchy.lessonBlocks.length} كتل درس
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

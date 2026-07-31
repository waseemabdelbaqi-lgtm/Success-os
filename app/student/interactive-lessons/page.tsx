import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { InteractiveLessonViewer } from "@/components/interactive-lesson-engine/interactive-lesson-viewer";
import { getDemoEngineLesson, engineStatus } from "@/lib/interactive-lesson-engine";

export const metadata: Metadata = {
  title: "Interactive Lesson Engine · Success OS",
};

export default function InteractiveLessonHomePage(): ReactNode {
  const pkg = getDemoEngineLesson();
  const status = engineStatus();

  return (
    <div>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.75rem 1rem 0",
          fontSize: 13,
          color: "#475569",
        }}
      >
        <Link href="/student/books" style={{ color: "#0f766e" }}>
          Books
        </Link>
        {" · "}
        <Link href="/admin/interactive-lessons" style={{ color: "#0f766e" }}>
          Admin editor
        </Link>
        {" · "}
        Foundation · books-first · AI video locked · catalog size via API
        <span style={{ marginInlineStart: 8, color: "#94a3b8" }}>
          blocks: {status.blockLibrary.length}
        </span>
      </div>
      <InteractiveLessonViewer pkg={pkg} locale="ar" />
    </div>
  );
}

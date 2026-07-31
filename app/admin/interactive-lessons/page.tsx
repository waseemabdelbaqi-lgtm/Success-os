import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLessonEditor } from "@/components/interactive-lesson-engine/admin-lesson-editor";
import { getDemoEngineLesson } from "@/lib/interactive-lesson-engine";

export const metadata: Metadata = {
  title: "Admin · Interactive Lessons",
};

export default function AdminInteractiveLessonsPage(): ReactNode {
  const initial = getDemoEngineLesson();
  return <AdminLessonEditor initial={initial} />;
}

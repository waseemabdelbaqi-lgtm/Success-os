import type { Metadata } from "next";
import { G1MathInteractiveClass } from "@/src/components/interactive-lesson/G1MathInteractiveClass";

export const metadata: Metadata = {
  title: "حصة تفاعلية · الجمع بخط الأعداد | Success OS",
  description:
    "Interactive Grade 1 Math class — animated explanation, pause for answers, hints, and mastery. Not an MP4 slideshow.",
  robots: { index: false, follow: false },
};

/** Canonical interactive lesson route — NOT /ai-lessons/g1-math/lesson.mp4 */
export default function G1MathInteractiveLessonPage() {
  return <G1MathInteractiveClass />;
}

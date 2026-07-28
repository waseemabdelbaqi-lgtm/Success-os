import type { Metadata } from "next";
import { G1MathInteractiveClass } from "@/src/components/interactive-lesson/G1MathInteractiveClass";

export const metadata: Metadata = {
  title: "بروف سينمائي ثلاثي الأبعاد · الجمع بخط الأعداد | Success OS",
  description:
    "Approach C cinematic 3D teacher proof — visible teacher, smartboard, lip-sync driven mouth, interactive pause. Not an MP4 slideshow.",
  robots: { index: false, follow: false },
};

/** Canonical interactive lesson route — NOT /ai-lessons/g1-math/lesson.mp4 */
export default function G1MathInteractiveLessonPage() {
  return <G1MathInteractiveClass />;
}

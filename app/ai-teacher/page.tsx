import { Suspense } from "react";
import { HumanEngineProofStudio } from "@/components/ai-teachers/human-engine-proof-studio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "سارة وعلي · معلما المنصة | Success OS",
  description:
    "ادخل الحصة مباشرة مع المعلمة سارة والمعلم علي — معلمان رقميان واقعيان داخل استوديو تعليمي احترافي",
};

/**
 * Production entry — Sara & Ali photoreal teaching studio.
 * Lesson starts after choosing the teacher (unlocks browser audio).
 */
export default function AiTeacherPlatformPage() {
  return (
    <Suspense fallback={null}>
      <HumanEngineProofStudio />
    </Suspense>
  );
}

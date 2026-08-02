import { PlatformTeacherStudio } from "@/components/ai-teachers/platform-teacher-studio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "سارة وعلي · معلما المنصة | Success OS",
  description:
    "المعلمان الرسميان لـ Success OS — يدرّسان أي مادة عبر Human Engine داخل استوديو تعليمي ثلاثي الأبعاد",
};

/**
 * Production entry — Sara & Ali only.
 * Demo/proof labs remain under /ai-teacher/demo and /ai-teacher/proof.
 */
export default function AiTeacherPlatformPage() {
  return <PlatformTeacherStudio />;
}

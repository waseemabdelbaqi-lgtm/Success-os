import { TeacherMindAdmin } from "@/components/ai-teachers/teacher-mind-admin";
import { listTeacherProfiles } from "@/lib/human-engine";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "إدارة عقول المعلمين · Teacher Mind | Success OS",
  description:
    "عدّل شخصية سارة وعلي: الأسلوب، الصوت، السرعة، الرسمية، التفاعل، وطريقة الإجابة — قابل للتوسّع لمئات المعلمين",
};

export default function AdminAiTeachersPage() {
  const profiles = listTeacherProfiles();
  return <TeacherMindAdmin initialProfiles={profiles} />;
}

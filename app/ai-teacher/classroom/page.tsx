import { InteractiveClassroom } from "@/components/ai-teachers/interactive-classroom";

export const metadata = {
  title: "سارة وعلي · حصة شبه الحقيقية | Success OS",
  description:
    "معلم يقف ويكتب ويشير جنب السبورة بصوت صفّي أردني — أوضح وأسرع تغذية راجعة من الحصة التقليدية",
};

export default function AiTeacherClassroomPage() {
  return <InteractiveClassroom initialTeacher="sara" />;
}

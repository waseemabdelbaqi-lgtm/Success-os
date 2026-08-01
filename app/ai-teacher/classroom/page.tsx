import { InteractiveClassroom } from "@/components/ai-teachers/interactive-classroom";

export const metadata = {
  title: "سارة وعلي · صف المعلم الذكي | Success OS",
  description:
    "معلمان حيّان أوضح من الحصة التقليدية — حركة وجه، صوت عربي، سبورة متزامنة، وفحص فهم لحظي",
};

export default function AiTeacherClassroomPage() {
  return <InteractiveClassroom initialTeacher="sara" />;
}

import { InteractiveClassroom } from "@/components/ai-teachers/interactive-classroom";

export const metadata = {
  title: "سارة وعلي · الصف السينمائي | Success OS",
  description:
    "صوت عصبي أردني، وجه يتحرك، وسبورة حيّة — صف تفاعلي أوضح من المعلم الحقيقي",
};

export default function AiTeacherClassroomPage() {
  return <InteractiveClassroom initialTeacher="sara" />;
}

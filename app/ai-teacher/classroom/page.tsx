import { InteractiveClassroom } from "@/components/ai-teachers/interactive-classroom";

export const metadata = {
  title: "AI Teacher Live Classroom | Success OS",
  description: "Interactive AI teachers Sara and Ali — live voice, moving face, synced board",
};

export default function AiTeacherClassroomPage() {
  return <InteractiveClassroom initialTeacher="sara" />;
}

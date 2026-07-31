import { redirect } from "next/navigation";
import { getUnit } from "@/services/student/course-structure.service";

type PageProps = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function StudentCourseUnitPage({ params }: PageProps) {
  const { courseId, unitId } = await params;
  const path = getUnit(courseId, unitId);
  if (!path || !path.unit.lessons[0]) {
    redirect(`/student/courses/${courseId}`);
  }
  const first = path.unit.lessons[0];
  redirect(
    `/student/courses/${path.course.slug}/units/${unitId}/lessons/${first.id}`,
  );
}

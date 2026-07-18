import { redirect } from "next/navigation";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { bookCatalogService } from "@/services/student/book-catalog.service";

type UnitPageProps = {
  params: Promise<{ bookId: string; unitId: string }>;
};

export default async function StudentUnitRedirectPage({
  params,
}: UnitPageProps): Promise<never> {
  const { bookId, unitId } = await params;
  const unit = bookCatalogService.getUnit(bookId, unitId);
  const firstLesson = unit?.lessons[0];

  if (!firstLesson) {
    redirect(STUDENT_ROUTES.book(bookId));
  }

  redirect(STUDENT_ROUTES.lesson(bookId, unitId, firstLesson.id));
}

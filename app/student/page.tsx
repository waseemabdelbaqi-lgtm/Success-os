import { redirect } from "next/navigation";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

export default function StudentIndexPage(): never {
  redirect(STUDENT_ROUTES.dashboard);
}

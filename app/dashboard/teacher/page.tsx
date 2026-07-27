import { redirect } from "next/navigation";

/** Canonical teacher OS is plural /dashboard/teachers */
export default function TeacherDashboardRedirect() {
  redirect("/dashboard/teachers");
}

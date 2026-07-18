import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudentDashboard } from "@/components/student-portal/dashboard/student-dashboard";

export const metadata: Metadata = {
  title: "Student Dashboard",
};

export default function StudentDashboardPage(): ReactNode {
  return <StudentDashboard />;
}

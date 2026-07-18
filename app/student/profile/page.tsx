import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StudentProfilePage } from "@/components/student-portal/profile/student-profile-page";

export const metadata: Metadata = {
  title: "Student Profile",
};

export default function StudentProfileRoutePage(): ReactNode {
  return <StudentProfilePage />;
}

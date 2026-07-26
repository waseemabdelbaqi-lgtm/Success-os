import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { EmployeesOsControlRoom } from "@/components/admin/employees-os-control-room";

export const metadata = {
  title: "لوحات الموظفين · Employees OS · SUCCESS OS",
  description:
    "أعلى مستوى لتشغيل لوحات موظفي SUCCESS OS — الموارد البشرية، المالية، القانونية، التقنية، والدوائر الداخلية.",
};

/**
 * Employees OS — highest-level staff operating room for company departments.
 */
export default function EmployeesOsPage(): ReactNode {
  return (
    <RoleGuard roleSlug="employee">
      <EmployeesOsControlRoom />
    </RoleGuard>
  );
}

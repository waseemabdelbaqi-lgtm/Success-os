import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { RoleControlDashboard } from "@/components/dashboard/role-control-dashboard";
import { buildRoleControlDashboard } from "@/app/lib/admin/role-permission-bridge";
import { USER_ROLES } from "@/types/roles";
import Link from "next/link";

export const metadata = {
  title: "لوحة الموظف · SUCCESS OS",
};

/**
 * Personal employee board (self-service). Highest staff OS room is /dashboard/employees.
 */
export default function EmployeePersonalBoardPage(): ReactNode {
  const initialData = buildRoleControlDashboard(USER_ROLES.EMPLOYEE, {
    lang: "ar",
  });

  return (
    <RoleGuard roleSlug="employee">
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ead9db] bg-white px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a711a]">
              EMPLOYEE · SELF SERVICE
            </p>
            <p className="text-sm text-[#73636a]">
              لوحتك الشخصية — للمهام والإجازات والموارد. لوحات كل دوائر الموظفين على أعلى مستوى من هنا:
            </p>
          </div>
          <Link
            href="/dashboard/employees"
            className="rounded-xl bg-[#9e1722] px-4 py-2 text-sm font-bold text-white"
          >
            لوحات الموظفين (OS)
          </Link>
        </div>
        <RoleControlDashboard
          role={USER_ROLES.EMPLOYEE}
          initialData={initialData}
        />
      </main>
    </RoleGuard>
  );
}

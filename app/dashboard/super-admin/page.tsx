import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { OsControlRoom } from "@/components/admin/os-control-room";

export const metadata = {
  title: "لوحة المشرف · Super Admin OS · SUCCESS OS",
  description:
    "أعلى مستوى لإدارة نظام التشغيل SUCCESS OS — الصحة، الصلاحيات، ERP، البوابات، والتدقيق.",
};

/**
 * Dedicated Super Admin route (takes precedence over /dashboard/[roleSlug]).
 */
export default function SuperAdminOsPage(): ReactNode {
  return (
    <RoleGuard roleSlug="super-admin">
      <OsControlRoom />
    </RoleGuard>
  );
}

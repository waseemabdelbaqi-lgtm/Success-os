import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRoleAccess } from "@/components/auth/role-guard";
import { RoleDashboardShell } from "@/components/dashboard/role-dashboard-shell";
import { permissionService } from "@/services/auth/permission.service";
import { getRoleLabel, roleFromSlug, USER_ROLES } from "@/types/roles";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type PageProps = {
  params: Promise<{ roleSlug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = roleFromSlug(roleSlug);

  return {
    title: role ? `${getRoleLabel(role)} Dashboard` : "Dashboard",
  };
}

export default async function RoleDashboardPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { roleSlug } = await params;
  const role = await requireRoleAccess(roleSlug);

  if (role === USER_ROLES.STUDENT) {
    redirect(STUDENT_ROUTES.dashboard);
  }

  const userResult = await permissionService.getAuthenticatedUser();
  const user = userResult.ok ? userResult.data : null;

  return (
    <RoleDashboardShell
      role={role}
      userEmail={user?.email}
      userName={user?.displayName}
    />
  );
}

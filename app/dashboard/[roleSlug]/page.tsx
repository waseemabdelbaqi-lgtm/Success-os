import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRoleAccess } from "@/components/auth/role-guard";
import { RoleControlDashboard } from "@/components/dashboard/role-control-dashboard";
import { buildRoleControlDashboard } from "@/app/lib/admin/role-permission-bridge";
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

  if (role === USER_ROLES.ADMIN) {
    redirect("/dashboard/admin");
  }

  let userEmail: string | null = null;
  let userName: string | null = null;

  if (process.env.FEATURE_AUTH_ENABLED === "true") {
    try {
      const { permissionService } = await import(
        "@/services/auth/permission.service"
      );
      const userResult = await permissionService.getAuthenticatedUser();
      if (userResult.ok && userResult.data) {
        userEmail = userResult.data.email;
        userName = userResult.data.displayName;
      }
    } catch {
      // Preview without session remains available.
    }
  }

  const initialData = buildRoleControlDashboard(role, { lang: "ar" });

  return (
    <RoleControlDashboard
      role={role}
      userEmail={userEmail}
      userName={userName}
      initialData={initialData}
    />
  );
}

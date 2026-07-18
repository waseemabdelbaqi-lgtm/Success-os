import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { permissionService } from "@/services/auth/permission.service";
import { requireDashboardAccess, getUserDashboardPath } from "@/lib/auth/rbac";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/roles";
import { roleFromSlug } from "@/types/roles";

type RoleGuardProps = {
  roleSlug: string;
  children: ReactNode;
};

export async function RoleGuard({
  roleSlug,
  children,
}: RoleGuardProps): Promise<ReactNode> {
  if (process.env.FEATURE_AUTH_ENABLED !== "true") {
    return <>{children}</>;
  }

  const result = await permissionService.getAuthenticatedUser();

  if (!result.ok || !result.data) {
    redirect(ROUTES.login);
  }

  try {
    requireDashboardAccess(result.data.role, roleSlug);
    return <>{children}</>;
  } catch {
    redirect(getUserDashboardPath(result.data.role));
  }
}

export async function requireRoleAccess(roleSlug: string): Promise<UserRole> {
  if (process.env.FEATURE_AUTH_ENABLED !== "true") {
    const role = roleFromSlug(roleSlug);
    if (!role) {
      redirect("/dashboard");
    }
    return role;
  }

  const user = await permissionService.requireAuthenticatedUser();
  const role = roleFromSlug(roleSlug);

  if (!role) {
    redirect("/dashboard");
  }

  requireDashboardAccess(user.role, roleSlug);
  return role;
}

"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  ROLE_DEFINITIONS,
  getRoleDashboardPath,
  getRoleLabel,
} from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { canAccessRoleDashboard } from "@/types/permissions";

export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const roleDefinition = role ? ROLE_DEFINITIONS[role] : null;
  const dashboardPath = role ? getRoleDashboardPath(role) : null;
  const roleLabel = role ? getRoleLabel(role) : null;

  const canAccessDashboard = (targetRole: UserRole): boolean => {
    if (!role) return false;
    return canAccessRoleDashboard(role, targetRole);
  };

  return {
    role,
    roleDefinition,
    dashboardPath,
    roleLabel,
    canAccessDashboard,
  };
}

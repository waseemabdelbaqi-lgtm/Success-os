"use client";

import type { Permission } from "@/types/permissions";
import { useAuth } from "@/hooks/use-auth";

export function usePermissions() {
  const { user } = useAuth();

  const permissions = user?.permissions ?? [];

  const hasPermission = (permission: Permission): boolean =>
    permissions.includes(permission);

  const hasAnyPermission = (required: Permission[]): boolean =>
    required.some((p) => permissions.includes(p));

  const hasAllPermissions = (required: Permission[]): boolean =>
    required.every((p) => permissions.includes(p));

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

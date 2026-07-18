import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";

export default async function RoleDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ roleSlug: string }>;
}): Promise<ReactNode> {
  const { roleSlug } = await params;
  return <RoleGuard roleSlug={roleSlug}>{children}</RoleGuard>;
}

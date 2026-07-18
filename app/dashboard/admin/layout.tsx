import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { EnterpriseAdminShell } from '@/components/admin/enterprise-admin-shell';

export default function EnterpriseAdminLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <RoleGuard roleSlug="admin">
      <EnterpriseAdminShell>{children}</EnterpriseAdminShell>
    </RoleGuard>
  );
}

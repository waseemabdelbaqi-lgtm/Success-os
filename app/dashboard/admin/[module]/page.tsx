'use client';

import { useParams } from 'next/navigation';
import { EnterpriseAdminModulePage } from '@/components/admin/enterprise-admin-module';

export default function EnterpriseAdminModuleRoute() {
  const params = useParams();
  const moduleId = String(params?.module || '');
  if (!moduleId || moduleId === 'jordan-ops' || moduleId === 'dashboard') {
    return <p>Module not found.</p>;
  }
  return <EnterpriseAdminModulePage moduleId={moduleId} />;
}

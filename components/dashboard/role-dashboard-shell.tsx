import type { ReactNode } from "react";
import { ROLE_DEFINITIONS } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { getPermissionsForRole } from "@/types/permissions";
import { EmailVerificationBanner } from "@/components/auth/email-verification";

type RoleDashboardShellProps = {
  role: UserRole;
  userEmail?: string | null;
  userName?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  platform: "Platform Management",
  education: "Education",
  employment: "Employment",
  content: "Content & Media",
  support: "Customer Support",
};

export function RoleDashboardShell({
  role,
  userEmail,
  userName,
}: RoleDashboardShellProps): ReactNode {
  const definition = ROLE_DEFINITIONS[role];
  const permissions = getPermissionsForRole(role);

  return (
    <div className="phase11-role-dashboard space-y-8">
      <EmailVerificationBanner />

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9e1722]">
          {CATEGORY_LABELS[definition.category] ?? definition.category}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#4b0a11]">
          {definition.label} Dashboard
        </h1>
        <p className="max-w-2xl text-[#6b5a52]">{definition.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title="Account" value={userName ?? "—"} subtitle={userEmail ?? "—"} />
        <DashboardCard title="Role" value={definition.label} subtitle={role} />
        <DashboardCard
          title="Permissions"
          value={String(permissions.length)}
          subtitle="Active capabilities"
        />
      </div>

      <section className="rounded-2xl border border-[#eadde0] bg-white p-6 shadow-[0_14px_34px_rgba(75,10,17,0.06)]">
        <h2 className="text-lg font-semibold text-[#4b0a11]">Your permissions</h2>
        <p className="mt-1 text-sm text-[#6b5a52]">
          These permissions control what you can access within Success OS.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <span
              key={permission}
              className="rounded-full bg-[#fff4f4] px-3 py-1 text-xs font-medium text-[#9e1722]"
            >
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-[#dcc8cc] bg-[#fff8f6] p-6">
        <h2 className="text-sm font-medium text-[#4b0a11]">Feature modules</h2>
        <p className="mt-1 text-sm text-[#6b5a52]">
          Role-specific features for {definition.label} will be mounted here in
          upcoming development phases. The permission system and route protection
          are fully active.
        </p>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}): ReactNode {
  return (
    <div className="rounded-2xl border border-[#eadde0] bg-white p-5 shadow-[0_14px_34px_rgba(75,10,17,0.06)]">
      <p className="text-sm text-[#6b5a52]">{title}</p>
      <p className="mt-1 text-xl font-semibold text-[#1a1212]">{value}</p>
      <p className="mt-0.5 truncate text-xs text-[#8a7872]">{subtitle}</p>
    </div>
  );
}

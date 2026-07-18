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
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          {CATEGORY_LABELS[definition.category] ?? definition.category}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {definition.label} Dashboard
        </h1>
        <p className="max-w-2xl text-zinc-600">{definition.description}</p>
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

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Your permissions</h2>
        <p className="mt-1 text-sm text-zinc-500">
          These permissions control what you can access within Success OS.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {permissions.map((permission) => (
            <span
              key={permission}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6">
        <h2 className="text-sm font-medium text-zinc-700">Feature modules</h2>
        <p className="mt-1 text-sm text-zinc-500">
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-400">{subtitle}</p>
    </div>
  );
}

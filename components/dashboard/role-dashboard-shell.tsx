import type { ReactNode } from "react";
import { ROLE_DEFINITIONS } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import { getPermissionsForRole } from "@/types/permissions";
import { EmailVerificationBanner } from "@/components/auth/email-verification";
import {
  CONTROL_HUB_SECTIONS,
  CONTROL_HUBS,
} from "@/app/data/control-hubs-catalog";

type RoleDashboardShellProps = {
  role: UserRole;
  userEmail?: string | null;
  userName?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  platform: "الشركة · Platform",
  education: "تعليم / شراكة",
  employment: "توظيف",
  content: "محتوى",
  support: "دعم",
};

/** Map dashboard roles → control-hub section */
function sectionForRole(role: UserRole): "company" | "partners" | "users" {
  if (
    role === "super_admin" ||
    role === "owner" ||
    role === "admin" ||
    role === "academic_director" ||
    role === "content_creator" ||
    role === "social_media_manager" ||
    role === "customer_support"
  ) {
    return "company";
  }
  if (
    role === "teacher" ||
    role === "school" ||
    role === "university" ||
    role === "educational_center" ||
    role === "employer"
  ) {
    return "partners";
  }
  return "users";
}

export function RoleDashboardShell({
  role,
  userEmail,
  userName,
}: RoleDashboardShellProps): ReactNode {
  const definition = ROLE_DEFINITIONS[role];
  const permissions = getPermissionsForRole(role);
  const sectionId = sectionForRole(role);
  const section = CONTROL_HUB_SECTIONS.find((s) => s.id === sectionId);
  const relatedHubs = CONTROL_HUBS.filter((h) => h.section === sectionId).slice(
    0,
    4,
  );
  const ownActions =
    CONTROL_HUBS.find(
      (h) =>
        h.href.includes(definition.dashboardPath) ||
        h.subtitle?.toLowerCase().includes(definition.label.toLowerCase()),
    )?.actions || relatedHubs[0]?.actions || [];

  return (
    <div className="phase11-role-dashboard space-y-8">
      <EmailVerificationBanner />

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9e1722]">
          {CATEGORY_LABELS[definition.category] ?? definition.category} ·{" "}
          {section?.titleAr}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#4b0a11]">
          {definition.label} Dashboard
        </h1>
        <p className="max-w-2xl text-[#6b5a52]">{definition.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Account"
          value={userName ?? "—"}
          subtitle={userEmail ?? "—"}
        />
        <DashboardCard title="Role" value={definition.label} subtitle={role} />
        <DashboardCard
          title="Classification"
          value={section?.titleAr ?? "—"}
          subtitle={section?.titleEn ?? ""}
        />
      </div>

      <section className="rounded-2xl border border-[#eadde0] bg-white p-6 shadow-[0_14px_34px_rgba(75,10,17,0.06)]">
        <h2 className="text-lg font-semibold text-[#4b0a11]">أزرار التحكم</h2>
        <p className="mt-1 text-sm text-[#6b5a52]">
          إجراءات مرتبطة بهذا الدور ضمن تصنيف {section?.titleAr}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ownActions.map((action) => (
            <a
              key={`${action.href}-${action.label}`}
              href={action.href}
              className="rounded-full bg-[#9e1722] px-3 py-1.5 text-xs font-semibold text-white"
            >
              {action.label}
            </a>
          ))}
          <a
            href="/control-hubs"
            className="rounded-full border border-[#9e1722] px-3 py-1.5 text-xs font-semibold text-[#9e1722]"
          >
            كل لوحات التحكم
          </a>
        </div>
      </section>

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
        <h2 className="text-sm font-medium text-[#4b0a11]">
          لوحات ضمن {section?.titleAr}
        </h2>
        <p className="mt-1 text-sm text-[#6b5a52]">{section?.blurbAr}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {relatedHubs.map((hub) => (
            <a
              key={hub.id}
              href={hub.href}
              className="rounded-xl border border-[#eadde0] bg-white p-4 text-[#4b0a11] no-underline shadow-sm"
            >
              <b className="block">{hub.title}</b>
              <small className="text-[#6b5a52]">{hub.note}</small>
            </a>
          ))}
        </div>
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

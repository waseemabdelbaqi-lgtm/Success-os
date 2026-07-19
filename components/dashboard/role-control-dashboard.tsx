"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { UserRole } from "@/types/roles";
import { ROLE_DEFINITIONS } from "@/types/roles";
type DashboardModule = {
  id: string;
  title: string;
  description: string;
  href?: string;
  unlocked: boolean;
  permissions?: string[];
};

type DashboardPayload = {
  ok: boolean;
  roleKey: string;
  label: string;
  labelAr: string;
  labelEn: string;
  permissions: string[];
  modules: DashboardModule[];
  lockedModules: DashboardModule[];
  dashboardPath: string;
  permissionsHref: string;
  previewMode?: boolean;
  role?: {
    key: string;
    name: string;
    description?: string;
    permissionCount: number;
    source?: string;
  } | null;
  generatedAt?: string;
};

type RoleControlDashboardProps = {
  role: UserRole;
  userEmail?: string | null;
  userName?: string | null;
  initialData?: DashboardPayload | null;
};

export function RoleControlDashboard({
  role,
  userEmail,
  userName,
  initialData = null,
}: RoleControlDashboardProps): ReactNode {
  const definition = ROLE_DEFINITIONS[role];
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [data, setData] = useState<DashboardPayload | null>(initialData);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(
      `/api/role-dashboard?view=role&role=${encodeURIComponent(role)}&lang=${lang}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`DASHBOARD_${res.status}`);
    setData((await res.json()) as DashboardPayload);
  }, [role, lang]);

  useEffect(() => {
    load().catch((reason: unknown) => {
      if (!initialData) {
        setError(reason instanceof Error ? reason.message : "LOAD_FAILED");
      }
    });
  }, [load, initialData]);

  const isAr = lang === "ar";

  return (
    <div className="phase11-role-dashboard space-y-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            {isAr ? "لوحة تحكم المستخدم" : "User control dashboard"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {data?.label || definition.label}
          </h1>
          <p className="max-w-2xl text-zinc-600">
            {isAr
              ? "الوحدات الظاهرة هنا تعتمد على الصلاحيات التي يوزّعها المشرف من لوحة الإدارة."
              : "Visible modules depend on permissions distributed by admin."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as "ar" | "en")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <Link
            href="/dashboard/admin/permissions"
            className="rounded-xl bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white"
          >
            {isAr ? "توزيع الصلاحيات" : "Distribute permissions"}
          </Link>
          <button
            type="button"
            onClick={() => load().catch(() => {})}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            {isAr ? "تحديث" : "Refresh"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={isAr ? "الحساب" : "Account"}
          value={userName || (isAr ? "معاينة" : "Preview")}
          subtitle={userEmail || role}
        />
        <StatCard
          title={isAr ? "الدور" : "Role"}
          value={data?.label || definition.label}
          subtitle={role}
        />
        <StatCard
          title={isAr ? "الصلاحيات" : "Permissions"}
          value={String(data?.permissions.length ?? "—")}
          subtitle={
            isAr ? "من مصفوفة المشرف" : "From admin matrix"
          }
        />
        <StatCard
          title={isAr ? "الوحدات المفتوحة" : "Unlocked modules"}
          value={String(data?.modules.length ?? "—")}
          subtitle={`${data?.lockedModules.length ?? 0} ${isAr ? "مقفلة" : "locked"}`}
        />
      </div>

      {data?.previewMode ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {isAr
            ? "وضع معاينة المشرف — يمكنك رؤية لوحة هذا الدور حسب الصلاحيات الحالية."
            : "Admin preview mode — viewing this role dashboard from current permissions."}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {isAr ? "وحدات التحكم المتاحة" : "Available control modules"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isAr
                ? "تظهر فقط الوحدات التي فُتحت بصلاحيات الدور."
                : "Only modules unlocked by role permissions are shown."}
            </p>
          </div>
        </div>

        {!data ? (
          <p className="text-sm text-zinc-500">{isAr ? "جاري التحميل…" : "Loading…"}</p>
        ) : data.modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
            {isAr
              ? "لا توجد وحدات مفتوحة لهذا الدور. افتح الصلاحيات من لوحة المشرف ثم حدّث الصفحة."
              : "No unlocked modules for this role. Grant permissions in Enterprise Admin, then refresh."}
            <div className="mt-3">
              <Link className="font-semibold text-[#0f766e] underline" href="/dashboard/admin/permissions">
                {isAr ? "الذهاب لتوزيع الصلاحيات" : "Open permission distribution"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.modules.map((mod) => (
              <article
                key={mod.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-zinc-900">{mod.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{mod.description}</p>
                {mod.href ? (
                  <Link
                    href={mod.href}
                    className="mt-4 inline-flex rounded-xl bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white"
                  >
                    {isAr ? "فتح" : "Open"}
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-500">
                    {isAr ? "قريبًا داخل اللوحة" : "In-dashboard soon"}
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {data?.lockedModules?.length ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isAr ? "وحدات مقفلة بانتظار صلاحيات" : "Locked modules awaiting permissions"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {isAr
              ? "يمكن للمشرف فتحها من صفحة الصلاحيات."
              : "Admin can unlock these from the permissions page."}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {data.lockedModules.map((mod) => (
              <li
                key={mod.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2"
              >
                <span>
                  <strong>{mod.title}</strong>
                  <span className="text-zinc-500"> — {mod.description}</span>
                </span>
                <span className="text-xs text-zinc-400">
                  {(mod.permissions || []).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          {isAr ? "الصلاحيات الفعّالة" : "Effective permissions"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {isAr
            ? "مصدرها مصفوفة الأدوار في لوحة المشرف (Enterprise Admin)."
            : "Sourced from the Enterprise Admin role matrix."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(data?.permissions || []).length === 0 ? (
            <span className="text-sm text-zinc-500">
              {isAr ? "لا صلاحيات بعد" : "No permissions yet"}
            </span>
          ) : (
            data?.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {permission}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
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

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type DirectoryRole = {
  roleKey: string;
  label: string;
  labelAr: string;
  labelEn: string;
  dashboardPath: string;
  permissionCount: number;
  unlockedModules: number;
  lockedModules: number;
};

type DirectoryPayload = {
  ok: boolean;
  roles: DirectoryRole[];
  permissionsHref: string;
};

export function UserDashboardsDirectory(): ReactNode {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [data, setData] = useState<DirectoryPayload | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch(
      `/api/role-dashboard?view=directory&lang=${lang}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`DIRECTORY_${res.status}`);
    setData((await res.json()) as DirectoryPayload);
  }, [lang]);

  useEffect(() => {
    load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
    );
  }, [load]);

  const isAr = lang === "ar";

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {isAr ? "لوحات تحكم المستخدمين" : "User control dashboards"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {isAr
              ? "كل لوحة تُفتح وحداتها حسب الصلاحيات الموزّعة من الأدمن."
              : "Each dashboard unlocks modules from admin-distributed permissions."}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.roles || []).map((role) => (
          <article
            key={role.roleKey}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">
              {role.roleKey}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              {isAr ? role.labelAr : role.labelEn}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              {role.permissionCount} {isAr ? "صلاحية" : "permissions"} ·{" "}
              {role.unlockedModules} {isAr ? "وحدة مفتوحة" : "unlocked"} ·{" "}
              {role.lockedModules} {isAr ? "مقفلة" : "locked"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={role.dashboardPath}
                className="rounded-xl bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white"
              >
                {isAr ? "فتح اللوحة" : "Open dashboard"}
              </Link>
              <Link
                href="/dashboard/admin/permissions"
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              >
                {isAr ? "تعديل الصلاحيات" : "Edit permissions"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

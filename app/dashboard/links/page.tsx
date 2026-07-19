import type { ReactNode } from "react";
import Link from "next/link";
import { PUBLIC_DASHBOARD_LINKS } from "@/app/data/role-dashboard-modules";

export const metadata = {
  title: "روابط لوحات المستخدمين · Success OS",
};

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export default function DashboardLinksPage(): ReactNode {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
      <h1 className="text-3xl font-semibold text-zinc-900">روابط لوحات المستخدمين</h1>
      <p className="mt-2 text-sm text-zinc-600">
        كل مستخدم له رابط لوحة مستقل. الصلاحيات تُوزَّع من الأدمن.
      </p>

      <ol className="mt-8 space-y-3">
        {PUBLIC_DASHBOARD_LINKS.map((item, index) => {
          const absolute = `${BASE}${item.href}`;
          return (
            <li
              key={item.key}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#0f766e]">
                    {index + 1}. {item.labelAr}
                  </p>
                  <p className="mt-1 break-all text-sm text-zinc-700">{absolute}</p>
                </div>
                <Link
                  href={item.href}
                  className="rounded-xl bg-[#0f766e] px-3 py-2 text-sm font-semibold text-white"
                >
                  فتح اللوحة
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link className="underline text-[#0f766e]" href="/dashboard/admin/permissions">
          توزيع الصلاحيات من الأدمن
        </Link>
        <Link className="underline text-[#0f766e]" href="/dashboard/user-dashboards">
          دليل كل اللوحات
        </Link>
      </div>
    </main>
  );
}

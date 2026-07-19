import type { ReactNode } from "react";
import Link from "next/link";
import { PUBLIC_DASHBOARD_LINKS } from "@/app/data/role-dashboard-modules";

export const metadata = {
  title: "روابط لوحات المستخدمين · Success OS",
};

export default function DashboardLinksPage(): ReactNode {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
      <h1 className="text-3xl font-semibold text-zinc-900">روابط لوحات المستخدمين</h1>
      <p className="mt-2 text-sm text-zinc-600">
        اضغط فتح اللوحة — الروابط نسبية وتعمل من نفس السيرفر الحالي بدون localhost.
      </p>

      <ol className="mt-8 space-y-3">
        {PUBLIC_DASHBOARD_LINKS.map((item, index) => (
          <li
            key={item.key}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0f766e]">
                  {index + 1}. {item.labelAr}
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{item.href}</p>
              </div>
              <Link
                href={item.href}
                className="rounded-xl bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white"
              >
                فتح اللوحة
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link className="font-semibold text-[#0f766e] underline" href="/dashboard/admin/permissions">
          توزيع الصلاحيات من الأدمن
        </Link>
        <Link className="font-semibold text-[#0f766e] underline" href="/dashboard/user-dashboards">
          دليل كل اللوحات
        </Link>
        <Link className="font-semibold text-[#0f766e] underline" href="/dashboard/admin">
          لوحة الأدمن
        </Link>
      </div>
    </main>
  );
}

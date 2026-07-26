"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PUBLIC_DASHBOARD_LINKS } from "@/app/data/role-dashboard-modules";
import { CONTROL_HUB_SECTIONS, CONTROL_HUBS } from "@/app/data/control-hubs-catalog";

type HealthPayload = {
  status?: string;
  version?: string;
  environment?: string;
  timestamp?: string;
  services?: { firebase?: string };
};

type EnterpriseHome = {
  generatedAt?: string;
  users?: {
    totalUsers?: number;
    activeUsers?: number;
    onlineUsers?: number;
  };
  finance?: {
    mrr?: number;
    revenue30d?: number;
    pendingPayouts?: number;
  };
  performance?: {
    courseCompletionRate?: number;
    supportOpenTickets?: number;
  };
};

type OsDomain = {
  id: string;
  tag: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  href: string;
  links: { label: string; href: string }[];
};

const OS_DOMAINS: OsDomain[] = [
  {
    id: "identity",
    tag: "01 · ACCESS",
    titleAr: "الهوية والصلاحيات",
    titleEn: "Identity & Access",
    descAr: "أعلى طبقة تحكم: الأدوار، توزيع الصلاحيات، وحماية النظام.",
    href: "/dashboard/admin/permissions",
    links: [
      { label: "مصفوفة الصلاحيات", href: "/dashboard/admin/permissions" },
      { label: "لوحات المستخدمين", href: "/dashboard/links" },
      { label: "دليل اللوحات", href: "/dashboard/user-dashboards" },
    ],
  },
  {
    id: "erp",
    tag: "02 · ERP",
    titleAr: "غرفة العمليات المؤسسية",
    titleEn: "Enterprise Operations",
    descAr: "إدارة الناس والمؤسسات والمالية والمبيعات والدعم من مركز واحد.",
    href: "/dashboard/admin",
    links: [
      { label: "Enterprise Admin", href: "/dashboard/admin" },
      { label: "لوحات الموظفين", href: "/dashboard/employees" },
      { label: "المالية", href: "/dashboard/admin/finance" },
      { label: "الطلاب", href: "/dashboard/admin/students" },
      { label: "المعلمون", href: "/dashboard/admin/teachers" },
      { label: "الشركاء", href: "/dashboard/admin/partners" },
    ],
  },
  {
    id: "employees",
    tag: "02B · STAFF",
    titleAr: "لوحات الموظفين",
    titleEn: "Employees OS",
    descAr: "أعلى طبقة لتشغيل موظفي الشركة ودوائرها: HR، مالية، قانونية، تقنية، ودعم.",
    href: "/dashboard/employees",
    links: [
      { label: "غرفة موظفي الشركة", href: "/dashboard/employees" },
      { label: "لوحة الموظف", href: "/dashboard/employee" },
      { label: "الموارد البشرية", href: "/dashboard/admin/human-resources" },
      { label: "سجل الموظفين", href: "/dashboard/admin/employees" },
    ],
  },
  {
    id: "portals",
    tag: "03 · PORTALS",
    titleAr: "خريطة بوابات النظام",
    titleEn: "OS Portals Map",
    descAr: "كل بوابة مستخدم ولوحة دور — مراقبة وتشغيل من طبقة المشرف.",
    href: "/control-hubs",
    links: [
      { label: "Control Hubs", href: "/control-hubs" },
      { label: "Control Center", href: "/control-center?role=owner" },
      { label: "روابط اللوحات", href: "/dashboard/links" },
    ],
  },
  {
    id: "academic",
    tag: "04 · ACADEMIC",
    titleAr: "نظام المحتوى والأكاديميا",
    titleEn: "Academic & Content OS",
    descAr: "المناهج، الكتب، الدروس، القبول، ومسارات الأردن.",
    href: "/admin",
    links: [
      { label: "تشغيل الأردن", href: "/admin" },
      { label: "الدورات", href: "/dashboard/admin/courses" },
      { label: "القبول", href: "/dashboard/admin/admissions" },
      { label: "Content Studio", href: "/content-studio" },
      { label: "المكتبة الرقمية", href: "/digital-library" },
    ],
  },
  {
    id: "money",
    tag: "05 · MONEY",
    titleAr: "المحركات المالية",
    titleEn: "Money Engines",
    descAr: "العمولات، الفواتير، المدفوعات، والاستردادات.",
    href: "/dashboard/admin/finance",
    links: [
      { label: "المالية", href: "/dashboard/admin/finance" },
      { label: "العمولات", href: "/dashboard/admin/commission" },
      { label: "الفواتير", href: "/dashboard/admin/invoices" },
      { label: "المدفوعات", href: "/dashboard/admin/payouts" },
    ],
  },
  {
    id: "trust",
    tag: "06 · TRUST",
    titleAr: "التدقيق والتكوين",
    titleEn: "Audit & Configuration",
    descAr: "سجلات التدقيق، إعدادات النظام، والأمان التشغيلي.",
    href: "/dashboard/admin/audit-logs",
    links: [
      { label: "سجلات التدقيق", href: "/dashboard/admin/audit-logs" },
      { label: "تكوين النظام", href: "/dashboard/admin/system-configuration" },
      { label: "الإعدادات", href: "/dashboard/admin/settings" },
      { label: "سلة المحذوفات", href: "/dashboard/admin/recycle-bin" },
    ],
  },
];

function statusTone(status?: string): string {
  if (status === "ok" || status === "healthy") return "#1f7a3a";
  if (status === "degraded" || status === "unknown") return "#9a711a";
  if (status === "error") return "#9e1722";
  return "#73636a";
}

/**
 * أعلى طبقة تشغيل لـ SUCCESS OS — لوحة المشرف (Super Admin).
 */
export function OsControlRoom(): ReactNode {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [home, setHome] = useState<EnterpriseHome | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [healthRes, homeRes] = await Promise.all([
      fetch("/api/health", { cache: "no-store" }),
      fetch("/api/enterprise-admin?view=home", { cache: "no-store" }),
    ]);

    if (healthRes.ok) {
      const raw = await healthRes.json();
      setHealth((raw?.data ?? raw) as HealthPayload);
    }

    if (homeRes.ok) {
      setHome((await homeRes.json()) as EnterpriseHome);
    } else if (!healthRes.ok) {
      throw new Error("FAILED_TO_LOAD_OS_CONTROL");
    }
  }, []);

  useEffect(() => {
    load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
    );
    const timer = setInterval(() => {
      load().catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const isAr = lang === "ar";
  const kpis = useMemo(
    () => [
      {
        label: isAr ? "إجمالي المستخدمين" : "Total users",
        value: home?.users?.totalUsers ?? "—",
      },
      {
        label: isAr ? "نشطون الآن" : "Online now",
        value: home?.users?.onlineUsers ?? "—",
      },
      {
        label: isAr ? "إيراد 30 يوم" : "Revenue 30d",
        value: home?.finance?.revenue30d ?? "—",
      },
      {
        label: isAr ? "تذاكر مفتوحة" : "Open tickets",
        value: home?.performance?.supportOpenTickets ?? "—",
      },
    ],
    [home, isAr],
  );

  const firebase = health?.services?.firebase ?? "unknown";

  return (
    <div
      className="sos-os-control min-h-screen bg-[#fff8f8] text-[#301218]"
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-4 py-8 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
              SUCCESS OS · SUPER ADMIN
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold sm:text-5xl">
              {isAr
                ? "لوحة المشرف — أعلى مستوى لإدارة نظام التشغيل"
                : "Supervisor Console — highest OS management layer"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              {isAr
                ? "غرفة تحكم المنصة الكاملة: الصحة التشغيلية، الصلاحيات، ERP، البوابات، المحتوى، المالية، والتدقيق — من طبقة واحدة فوق كل اللوحات."
                : "Full-platform control room: health, access, ERP, portals, content, finance, and audit — one layer above every dashboard."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/dashboard/admin"
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
              >
                {isAr ? "افتح Enterprise Admin" : "Open Enterprise Admin"}
              </Link>
              <Link
                href="/dashboard/admin/permissions"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "توزيع الصلاحيات" : "Permissions"}
              </Link>
              <Link
                href="/dashboard/employees"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "لوحات الموظفين" : "Employees OS"}
              </Link>
              <Link
                href="/dashboard/teachers"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "لوحات المعلمين" : "Teachers OS"}
              </Link>
              <Link
                href="/teachers/register?by=supervisor"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "تسجيل معلم (مشرف)" : "Register teacher (supervisor)"}
              </Link>
              <Link
                href="/teachers/platform"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "AI المنصة / المعلمون" : "Platform AI · Teachers"}
              </Link>
              <Link
                href="/students/dashboard"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "غرفة تحكم الطالب" : "Students OS"}
              </Link>
              <Link
                href="/jobs/dashboard"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "غرفة قيادة الباحث" : "Careers OS"}
              </Link>
              <Link
                href="/roots"
                className="rounded-xl bg-[#f2d77c] px-4 py-2.5 text-sm font-bold text-[#301218]"
              >
                {isAr ? "جذور المنظومة" : "OS Roots"}
              </Link>
              <Link
                href="/guide"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "دليل الشريك الحي" : "Living Partner Guide"}
              </Link>
              <Link
                href="/partners/dashboard"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "لوحات الشركاء" : "Partners OS"}
              </Link>
              <Link
                href="/partners/discover"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "اكتشاف الشركاء" : "Partner discover"}
              </Link>
              <Link
                href="/admissions"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "قبول الجامعات" : "Admissions"}
              </Link>
              <Link
                href="/dashboard/links"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "كل لوحات المستخدمين" : "All user dashboards"}
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "← المنصة" : "← Platform"}
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as "ar" | "en")}
              className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <div className="rounded-2xl border border-white/20 bg-black/15 px-4 py-3 text-sm backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#f2d77c]">
                {isAr ? "حالة النظام" : "System status"}
              </p>
              <p
                className="mt-1 text-lg font-bold"
                style={{ color: statusTone(health?.status) === "#1f7a3a" ? "#b8f0c4" : "#f2d77c" }}
              >
                {(health?.status || "…").toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-white/75">
                {health?.environment || "—"} · v{health?.version || "—"}
              </p>
              <p className="mt-1 text-xs text-white/75">
                Firebase: {firebase}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(75,10,17,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a711a]">
                {kpi.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[#4b0a11]">{kpi.value}</p>
            </article>
          ))}
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
                {isAr ? "طبقات نظام التشغيل" : "OS layers"}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-sos-display)] text-2xl font-semibold text-[#301218] sm:text-3xl">
                {isAr ? "ستة مجالات تشغيل عليا" : "Six top-level operating domains"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => load().catch(() => {})}
              className="rounded-xl border border-[#ead9db] bg-white px-3 py-2 text-sm font-semibold text-[#9e1722]"
            >
              {isAr ? "تحديث الحالة" : "Refresh status"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {OS_DOMAINS.map((domain) => (
              <article
                key={domain.id}
                className="rounded-2xl border border-[#ead9db] bg-white p-5 shadow-[0_12px_28px_rgba(75,10,17,0.05)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a711a]">
                  {domain.tag}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[#4b0a11]">
                  {isAr ? domain.titleAr : domain.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#73636a]">
                  {domain.descAr}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={domain.href}
                    className="rounded-xl bg-[#9e1722] px-3 py-2 text-sm font-bold text-white"
                  >
                    {isAr ? "افتح المجال" : "Open domain"}
                  </Link>
                  {domain.links.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="rounded-xl border border-[#ead9db] px-3 py-2 text-sm font-semibold text-[#4b0a11] hover:border-[#9e1722]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">
              {isAr ? "خريطة لوحات المستخدمين" : "User dashboards map"}
            </h2>
            <p className="mt-1 text-sm text-[#73636a]">
              {isAr
                ? "وصول مباشر لكل لوحة دور من طبقة المشرف."
                : "Direct access to every role board from the supervisor layer."}
            </p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {PUBLIC_DASHBOARD_LINKS.slice(0, 14).map((item, index) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#f0e4e6] px-3 py-2 text-sm hover:border-[#9e1722]"
                  >
                    <span className="font-semibold text-[#301218]">
                      {index + 1}. {isAr ? item.labelAr : item.labelEn}
                    </span>
                    <span className="text-[#9e1722]">←</span>
                  </Link>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-[#ead9db] bg-white p-5">
            <h2 className="text-lg font-bold text-[#4b0a11]">
              {isAr ? "مراكز التحكم" : "Control hubs"}
            </h2>
            <p className="mt-1 text-sm text-[#73636a]">
              {isAr
                ? "شركة · شركاء · مستخدمون — حسب تصنيف المنصة."
                : "Company · Partners · Users — platform classification."}
            </p>
            <div className="mt-4 space-y-3">
              {CONTROL_HUB_SECTIONS.map((section) => {
                const count = CONTROL_HUBS.filter((h) => h.section === section.id).length;
                return (
                  <Link
                    key={section.id}
                    href="/control-hubs"
                    className="block rounded-xl border border-[#f0e4e6] px-3 py-3 hover:border-[#9e1722]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#4b0a11]">
                        {section.icon} {isAr ? section.titleAr : section.titleEn}
                      </strong>
                      <span className="text-xs font-bold text-[#9a711a]">
                        {count} {isAr ? "لوحة" : "hubs"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#73636a]">
                      {section.blurbAr}
                    </p>
                  </Link>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-[#ead9db] bg-[#4b0a11] px-5 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2d77c]">
            {isAr ? "أوامر سريعة للمشرف" : "Supervisor quick commands"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/dashboard/admin/permissions", label: isAr ? "تعديل صلاحية" : "Edit permission" },
              { href: "/dashboard/admin/audit-logs", label: isAr ? "مراجعة تدقيق" : "Review audit" },
              { href: "/dashboard/admin/system-configuration", label: isAr ? "تكوين النظام" : "System config" },
              { href: "/admin/jordan-curriculum", label: isAr ? "منهاج الأردن" : "Jordan curriculum" },
              { href: "/onboard", label: isAr ? "مسار القبول" : "Admissions funnel" },
              { href: "/security-center", label: isAr ? "مركز الأمان" : "Security center" },
            ].map((cmd) => (
              <Link
                key={cmd.href}
                href={cmd.href}
                className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              >
                {cmd.label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/65">
            {isAr ? "آخر تحديث للبيانات:" : "Last data refresh:"}{" "}
            {home?.generatedAt || health?.timestamp || "—"}
          </p>
        </section>
      </main>
    </div>
  );
}

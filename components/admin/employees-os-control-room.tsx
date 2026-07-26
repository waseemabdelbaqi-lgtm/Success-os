"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CONTROL_HUBS } from "@/app/data/control-hubs-catalog";

type StaffDomain = {
  id: string;
  tag: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  href: string;
  links: { label: string; href: string }[];
};

const STAFF_DOMAINS: StaffDomain[] = [
  {
    id: "self",
    tag: "01 · SELF",
    titleAr: "لوحة الموظف الشخصية",
    titleEn: "Personal employee board",
    descAr: "المهام، الإجازات، الإشعارات، والموارد الداخلية لكل موظف.",
    href: "/dashboard/employee",
    links: [
      { label: "مهامي", href: "/dashboard/admin/tasks" },
      { label: "الإجازات", href: "/dashboard/admin/hr-leave" },
      { label: "الإشعارات", href: "/notifications" },
    ],
  },
  {
    id: "hr",
    tag: "02 · HR",
    titleAr: "الموارد البشرية",
    titleEn: "Human Resources",
    descAr: "الموظفون، العقود، الرواتب، الحضور، والأداء — أعلى طبقة تشغيل HR.",
    href: "/dashboard/admin/human-resources",
    links: [
      { label: "سجل الموظفين", href: "/dashboard/admin/employees" },
      { label: "الأقسام", href: "/dashboard/admin/hr-departments" },
      { label: "المناصب", href: "/dashboard/admin/hr-positions" },
      { label: "العقود", href: "/dashboard/admin/hr-contracts" },
      { label: "الرواتب", href: "/dashboard/admin/hr-payroll" },
      { label: "الحضور", href: "/dashboard/admin/hr-attendance" },
      { label: "تقييم الأداء", href: "/dashboard/admin/hr-performance" },
    ],
  },
  {
    id: "finance",
    tag: "03 · FINANCE",
    titleAr: "المالية والمحاسبة",
    titleEn: "Finance & Accounting",
    descAr: "دائرة مالية الشركة: الرواتب، العمولات، المكافآت، والتقارير.",
    href: "/dashboard/admin/finance",
    links: [
      { label: "المالية", href: "/dashboard/admin/finance" },
      { label: "العمولات", href: "/dashboard/admin/commission-rules" },
      { label: "المكافآت", href: "/dashboard/admin/hr-bonuses" },
      { label: "الحسابات البنكية", href: "/dashboard/admin/hr-bank-accounts" },
      { label: "المبيعات", href: "/dashboard/admin/sales" },
    ],
  },
  {
    id: "legal",
    tag: "04 · LEGAL",
    titleAr: "القانونية والامتثال",
    titleEn: "Legal & Compliance",
    descAr: "عقود الموظفين والشركاء، التوقيع، والصلاحيات والتدقيق.",
    href: "/dashboard/admin/partner-contracts",
    links: [
      { label: "عقود الشركاء", href: "/dashboard/admin/partner-contracts" },
      { label: "عقود الموظفين", href: "/dashboard/admin/hr-contracts" },
      { label: "التوقيع الرقمي", href: "/dashboard/admin/hr-signatures" },
      { label: "التدقيق", href: "/dashboard/admin/audit-logs" },
    ],
  },
  {
    id: "engineering",
    tag: "05 · TECH",
    titleAr: "الهندسة والتقنية",
    titleEn: "Engineering",
    descAr: "استقرار المنصة، الأمان، QA، وتكوين النظام.",
    href: "/control-center?role=engineer",
    links: [
      { label: "Control Center", href: "/control-center?role=engineer" },
      { label: "الأمان", href: "/security-center" },
      { label: "QA", href: "/qa-dashboard" },
      { label: "تكوين النظام", href: "/dashboard/admin/system-configuration" },
    ],
  },
  {
    id: "growth",
    tag: "06 · GROWTH",
    titleAr: "التسويق والمبيعات",
    titleEn: "Marketing & Sales",
    descAr: "حملات النمو، المبيعات، والسوشيال ميديا لموظفي الشركة.",
    href: "/dashboard/admin/marketing",
    links: [
      { label: "التسويق", href: "/dashboard/admin/marketing" },
      { label: "المبيعات", href: "/dashboard/admin/sales" },
      { label: "السوشيال", href: "/dashboard/admin/social-media" },
      { label: "لوحة المدير", href: "/dashboard/social-media-manager" },
    ],
  },
  {
    id: "content",
    tag: "07 · CONTENT",
    titleAr: "المحتوى والإنتاج",
    titleEn: "Content & Production",
    descAr: "استوديو المحتوى، الكتب، الحصص المسجلة، وAI Content.",
    href: "/content-studio",
    links: [
      { label: "Content Studio", href: "/content-studio" },
      { label: "AI Content", href: "/dashboard/admin/ai-content" },
      { label: "الكتب", href: "/dashboard/admin/books" },
      { label: "حصص مسجلة", href: "/dashboard/admin/recorded-lessons" },
    ],
  },
  {
    id: "academic",
    tag: "08 · ACADEMIC",
    titleAr: "الدائرة الأكاديمية",
    titleEn: "Academic staff",
    descAr: "الجودة، القبول، المناهج، ومعلمو الشركة الداخليون.",
    href: "/dashboard/academic-director",
    links: [
      { label: "المدير الأكاديمي", href: "/dashboard/academic-director" },
      { label: "القبول", href: "/dashboard/admin/admissions" },
      { label: "منهاج الأردن", href: "/admin/jordan-curriculum" },
      { label: "معلم الشركة", href: "/control-center?role=houseTeacher" },
    ],
  },
  {
    id: "support",
    tag: "09 · SUPPORT",
    titleAr: "الدعم وخدمة العملاء",
    titleEn: "Support & CS",
    descAr: "طوابير الدعم، التذاكر، ومتابعة المستخدمين.",
    href: "/dashboard/admin/support-center",
    links: [
      { label: "مركز الدعم", href: "/dashboard/admin/support-center" },
      { label: "لوحة الدعم", href: "/dashboard/customer-support" },
      { label: "الإشعارات", href: "/dashboard/admin/notifications" },
    ],
  },
  {
    id: "leadership",
    tag: "10 · LEAD",
    titleAr: "القيادة والمشرف",
    titleEn: "Leadership & Supervisor",
    descAr: "أعلى طبقات القيادة فوق موظفي الشركة: المشرف، المالك، وERP.",
    href: "/dashboard/super-admin",
    links: [
      { label: "لوحة المشرف", href: "/dashboard/super-admin" },
      { label: "المالك", href: "/dashboard/owner" },
      { label: "Enterprise Admin", href: "/dashboard/admin" },
      { label: "الصلاحيات", href: "/dashboard/admin/permissions" },
    ],
  },
];

/**
 * لوحات الموظفين — أعلى مستوى تشغيل لدوائر الشركة وموظفيها.
 */
export function EmployeesOsControlRoom(): ReactNode {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const isAr = lang === "ar";

  const companyHubs = useMemo(
    () => CONTROL_HUBS.filter((hub) => hub.section === "company"),
    [],
  );

  return (
    <div
      className="sos-employees-os min-h-screen bg-[#fff8f8] text-[#301218]"
      dir={isAr ? "rtl" : "ltr"}
    >
      <header className="border-b border-[#ead9db] bg-gradient-to-br from-[#4b0a11] via-[#6b1018] to-[#9e1722] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-4 px-4 py-8 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2d77c]">
              SUCCESS OS · EMPLOYEES OS
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-sos-display)] text-3xl font-semibold sm:text-5xl">
              {isAr
                ? "لوحات الموظفين — أعلى مستوى تشغيل للشركة"
                : "Employee boards — highest company operating layer"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              {isAr
                ? "غرفة تحكم موظفي SUCCESS OS: الموارد البشرية، المالية، القانونية، التقنية، التسويق، المحتوى، الأكاديميا، والدعم — مع لوحة الموظف الشخصية."
                : "SUCCESS OS staff control room: HR, finance, legal, engineering, marketing, content, academic, and support — plus the personal employee board."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/dashboard/employee"
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#9e1722]"
              >
                {isAr ? "لوحة الموظف الشخصية" : "Personal employee board"}
              </Link>
              <Link
                href="/dashboard/admin/human-resources"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "الموارد البشرية" : "Human Resources"}
              </Link>
              <Link
                href="/dashboard/super-admin"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "لوحة المشرف" : "Super Admin"}
              </Link>
              <Link
                href="/dashboard/links"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {isAr ? "كل اللوحات" : "All dashboards"}
              </Link>
            </div>
          </div>

          <select
            value={lang}
            onChange={(event) => setLang(event.target.value as "ar" | "en")}
            className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: isAr ? "دوائر الشركة" : "Company departments",
              value: companyHubs.length,
            },
            {
              label: isAr ? "مجالات تشغيل الموظفين" : "Staff OS domains",
              value: STAFF_DOMAINS.length,
            },
            {
              label: isAr ? "سجل الموظفين" : "Employee registry",
              value: isAr ? "ERP" : "ERP",
              href: "/dashboard/admin/employees",
            },
            {
              label: isAr ? "طبقة المشرف" : "Supervisor layer",
              value: "OS",
              href: "/dashboard/super-admin",
            },
          ].map((card) => {
            const inner = (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a711a]">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#4b0a11]">{card.value}</p>
              </>
            );
            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(75,10,17,0.05)] transition hover:border-[#9e1722]"
              >
                {inner}
              </Link>
            ) : (
              <article
                key={card.label}
                className="rounded-2xl border border-[#ead9db] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(75,10,17,0.05)]"
              >
                {inner}
              </article>
            );
          })}
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a711a]">
            {isAr ? "طبقات تشغيل الموظفين" : "Employee operating layers"}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-sos-display)] text-2xl font-semibold text-[#301218] sm:text-3xl">
            {isAr
              ? "كل دوائر الموظفين على أعلى مستوى"
              : "Every staff department at OS level"}
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {STAFF_DOMAINS.map((domain) => (
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
                    {isAr ? "افتح اللوحة" : "Open board"}
                  </Link>
                  {domain.links.map((link) => (
                    <Link
                      key={`${domain.id}-${link.href}-${link.label}`}
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

        <section className="rounded-2xl border border-[#ead9db] bg-white p-5">
          <h2 className="text-lg font-bold text-[#4b0a11]">
            {isAr ? "مراكز تحكم الشركة" : "Company control hubs"}
          </h2>
          <p className="mt-1 text-sm text-[#73636a]">
            {isAr
              ? "نفس تصنيف المنصة: قيادة، تقنية، موارد بشرية، قانونية، مالية، تسويق، محتوى، أكاديمي، دعم."
              : "Platform classification: leadership, engineering, HR, legal, finance, marketing, content, academic, support."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {companyHubs.map((hub) => (
              <Link
                key={hub.id}
                href={hub.href}
                className="rounded-xl border border-[#f0e4e6] px-3 py-3 hover:border-[#9e1722]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a711a]">
                  {hub.dept}
                </p>
                <h3 className="mt-1 font-bold text-[#301218]">{hub.title}</h3>
                <p className="mt-1 text-xs text-[#73636a]">{hub.note}</p>
                <span className="mt-2 inline-block text-sm font-bold text-[#9e1722]">
                  {isAr ? "افتح ←" : "Open →"}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#ead9db] bg-[#4b0a11] px-5 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2d77c]">
            {isAr ? "أوامر سريعة لموظفي الشركة" : "Staff quick commands"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { href: "/dashboard/admin/employees", label: isAr ? "سجل الموظفين" : "Employee registry" },
              { href: "/dashboard/admin/hr-payroll", label: isAr ? "الرواتب" : "Payroll" },
              { href: "/dashboard/admin/hr-leave", label: isAr ? "الإجازات" : "Leave" },
              { href: "/dashboard/admin/tasks", label: isAr ? "المهام" : "Tasks" },
              { href: "/dashboard/admin/permissions", label: isAr ? "الصلاحيات" : "Permissions" },
              { href: "/control-hubs", label: isAr ? "كل مراكز التحكم" : "All control hubs" },
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
        </section>
      </main>
    </div>
  );
}

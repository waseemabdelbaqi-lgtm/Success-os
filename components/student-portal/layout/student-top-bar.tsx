"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { Button } from "@/components/ui/button";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type StudentTopBarProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

export function StudentTopBar({
  title,
  subtitle,
  children,
}: StudentTopBarProps): ReactNode {
  const { locale, setLocale } = useStudentPortal();

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-[#d4af37]/20 bg-[#fffdf7]/88 px-4 py-4 shadow-[0_10px_32px_rgba(81,31,22,0.05)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="min-w-0">
        {title && (
          <h1 className="truncate text-xl font-black tracking-[-0.03em] text-[#671016] sm:text-2xl">
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-1 text-sm text-[#78635b]">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Link
          href={STUDENT_ROUTES.books}
          className="hidden min-w-48 items-center gap-2 rounded-xl border border-[#d4af37]/25 bg-white/80 px-4 py-2.5 text-sm text-[#8b7770] shadow-sm transition hover:border-[#d4af37]/60 md:flex"
        >
          <span>⌕</span>
          Search your library
        </Link>
        <Link
          href={STUDENT_ROUTES.notifications}
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af37]/25 bg-white text-[#76151a] shadow-sm transition hover:-translate-y-0.5"
        >
          ♢
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#8b1e1e] ring-2 ring-white" />
        </Link>
        <Link
          href={STUDENT_ROUTES.profile}
          aria-label="Student profile"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8b1e1e] to-[#5f0e12] text-xs font-black text-[#f0d37a] shadow-lg"
        >
          ST
        </Link>
        <div className="flex rounded-xl border border-[#d4af37]/25 bg-white p-1 shadow-sm">
          <Button
            type="button"
            size="sm"
            variant={locale === "en" ? "primary" : "ghost"}
            onClick={() => setLocale("en")}
          >
            EN
          </Button>
          <Button
            type="button"
            size="sm"
            variant={locale === "ar" ? "primary" : "ghost"}
            onClick={() => setLocale("ar")}
          >
            عربي
          </Button>
        </div>
      </div>
    </header>
  );
}

export function DemoContentBanner(): ReactNode {
  const { t } = useStudentPortal();

  return (
    <div className="border-b border-[#d4af37]/25 bg-gradient-to-r from-[#f5e7ba] via-[#fff8e8] to-[#f5e7ba] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#815e15] sm:px-6">
      ✦ {t("demoNotice")} ✦
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: STUDENT_ROUTES.dashboard, labelKey: "dashboard", icon: "⌂" },
  { href: STUDENT_ROUTES.books, labelKey: "books", icon: "▤" },
  { href: STUDENT_ROUTES.courses, labelKey: "courses", icon: "▣" },
  { href: STUDENT_ROUTES.favorites, labelKey: "savedBooks", icon: "♥" },
  { href: STUDENT_ROUTES.bookmarks, labelKey: "bookmarks", icon: "◆" },
  { href: STUDENT_ROUTES.highlights, labelKey: "highlights", icon: "✦" },
  { href: STUDENT_ROUTES.notes, labelKey: "notes", icon: "✎" },
  { href: STUDENT_ROUTES.readingHistory, labelKey: "readingHistory", icon: "◷" },
  { href: STUDENT_ROUTES.assistant, labelKey: "AI Assistant", icon: "✧" },
  { href: STUDENT_ROUTES.notifications, labelKey: "Notifications", icon: "●" },
  { href: STUDENT_ROUTES.profile, labelKey: "profile", icon: "◎" },
  { href: STUDENT_ROUTES.settings, labelKey: "Settings", icon: "⚙" },
] as const;

type StudentSidebarProps = {
  activePath: string;
  t: (key: string) => string;
  className?: string;
};

export function StudentSidebar({
  activePath,
  t,
  className,
}: StudentSidebarProps): ReactNode {
  return (
    <aside
      className={cn(
        "flex h-full w-[17.5rem] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-[#7d171c] via-[#671016] to-[#43090d] text-white shadow-[16px_0_45px_rgba(81,16,20,0.16)]",
        className,
      )}
    >
      <div className="border-b border-[#d4af37]/20 px-6 py-6">
        <Link href={STUDENT_ROUTES.dashboard} className="block">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f2d77c]/35 bg-white/8 text-lg font-black text-[#f2d77c] shadow-inner">
              S
            </span>
            <div>
              <p className="text-base font-black tracking-[0.08em] text-white">
                SUCCESS
              </p>
              <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-[#e8c660]">
                Student Academy
              </p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const active =
            activePath === item.href || activePath.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-300",
                active
                  ? "bg-gradient-to-r from-[#d4af37] to-[#f0d477] text-[#4b100f] shadow-[0_10px_24px_rgba(212,175,55,0.2)]"
                  : "text-white/68 hover:translate-x-1 hover:bg-white/8 hover:text-white",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-sm transition",
                  active
                    ? "bg-[#671016]/10"
                    : "bg-white/7 text-[#e8c660] group-hover:bg-white/12",
                )}
              >
                {item.icon}
              </span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl border border-[#d4af37]/20 bg-white/7 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e8c660]">
          Reading streak
        </p>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-2xl font-black">12 days</span>
          <span className="text-xl">🔥</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f3df99]" />
        </div>
      </div>
    </aside>
  );
}

export function StudentMobileNav({
  activePath,
  t,
}: {
  activePath: string;
  t: (key: string) => string;
}): ReactNode {
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-[#d4af37]/30 bg-[#6b1016] px-2 py-2 shadow-[0_-10px_30px_rgba(71,12,16,0.12)] lg:hidden">
      {NAV_ITEMS.slice(0, 7).map((item) => {
        const active =
          activePath === item.href || activePath.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition",
              active
                ? "bg-[#d4af37] text-[#4b100f]"
                : "bg-white/7 text-white/70",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

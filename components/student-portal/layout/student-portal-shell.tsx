"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { StudentPortalProvider, useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import {
  StudentMobileNav,
  StudentSidebar,
} from "@/components/student-portal/layout/student-sidebar";
import { DemoContentBanner } from "@/components/student-portal/layout/student-top-bar";
import { cn } from "@/lib/utils";

type StudentPortalShellProps = {
  children: ReactNode;
};

function ShellInner({ children }: StudentPortalShellProps): ReactNode {
  const pathname = usePathname();
  const { t, direction, settings } = useStudentPortal();

  return (
    <div
      dir={direction}
      className={cn(
        "phase11-student-portal brand-surface flex h-screen min-h-screen flex-col overflow-hidden text-[#2b1c18]",
        settings.theme === "dark" && "bg-[#180c0d]",
      )}
    >
      <DemoContentBanner />
      <div className="flex min-h-0 flex-1">
        <StudentSidebar
          activePath={pathname}
          t={t}
          className="hidden lg:flex"
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto premium-grid">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, rotateY: direction === "rtl" ? -2 : 2, x: 12 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: direction === "rtl" ? "right center" : "left center" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
          <StudentMobileNav activePath={pathname} t={t} />
        </div>
      </div>
    </div>
  );
}

export function StudentPortalShell({
  children,
}: StudentPortalShellProps): ReactNode {
  return (
    <StudentPortalProvider>
      <ShellInner>{children}</ShellInner>
    </StudentPortalProvider>
  );
}

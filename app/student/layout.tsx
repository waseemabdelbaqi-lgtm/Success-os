"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StudentPortalShell } from "@/components/student-portal/layout/student-portal-shell";

const BOOK_PORTAL_PREFIXES = [
  "/student/dashboard",
  "/student/books",
  "/student/subjects",
  "/student/predictor",
  "/student/bookmarks",
  "/student/notes",
  "/student/highlights",
  "/student/favorites",
  "/student/reading-history",
  "/student/assistant",
  "/student/notifications",
  "/student/profile",
  "/student/settings",
] as const;

function isBookPortalPath(pathname: string): boolean {
  if (pathname === "/student") {
    return true;
  }

  // Fullscreen digital reader — avoid double chrome with p11-reader-shell.
  if (/^\/student\/books\/.+\/read\/?$/.test(pathname)) {
    return false;
  }

  return BOOK_PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function StudentSegmentLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const pathname = usePathname() ?? "";

  if (!isBookPortalPath(pathname)) {
    return children;
  }

  return <StudentPortalShell>{children}</StudentPortalShell>;
}

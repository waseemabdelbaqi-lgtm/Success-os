"use client";

import { usePathname } from "next/navigation";
import { LibrarySidebar } from "@/src/components/digital-library/LibrarySidebar";

/** Client wrapper so the sidebar can highlight the active taxonomic path. */
export function LibrarySidebarActive() {
  const pathname = usePathname() || "";
  const parts = pathname.replace(/^\/digital-library\/?/, "").split("/").filter(Boolean);
  return <LibrarySidebar activePath={parts.length ? parts : undefined} />;
}

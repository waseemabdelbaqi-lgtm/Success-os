import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";

export function SiteFooter(): ReactNode {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p>Foundation build — features not yet implemented.</p>
      </div>
    </footer>
  );
}

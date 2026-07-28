import type { ReactNode } from "react";
import { LibrarySidebarActive } from "@/src/components/digital-library/LibrarySidebarActive";
import "./digital-library.css";

export const metadata = {
  title: {
    default: "Global Digital Library",
    template: "%s | Global Digital Library",
  },
  description:
    "Multi-tenant global curriculum library with interactive STEM lessons — knowledge, 3D, workspace, calculator, examples, and quizzes.",
};

export default function DigitalLibraryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dl-shell">
      <div className="dl-frame">
        <LibrarySidebarActive />
        <main className="dl-main">{children}</main>
      </div>
    </div>
  );
}

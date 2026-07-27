import type { ReactNode } from "react";

/**
 * Admission funnel shell (imported by route pages).
 * Note: root `app/` takes priority over `src/app` in Next.js, so this layout
 * is not auto-mounted — pages wrap children with <AdmissionLayout>.
 */
export function AdmissionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(158,23,34,0.08),transparent_32%),linear-gradient(180deg,#fffdfd_0%,#f7f2f3_100%)]">
      {children}
    </div>
  );
}

export default AdmissionLayout;

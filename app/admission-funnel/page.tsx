import { InnerNav } from "../components";
import { AdmissionFunnelApp } from "@/src/components/admission-funnel/admission-funnel-app";

export const metadata = {
  title: "Admission funnel",
  description:
    "Filter universities by nationality, pay a $5 unlock fee, and submit via partner notifications or official email.",
};

export default function AdmissionFunnelPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(158,23,34,0.08),transparent_32%),linear-gradient(180deg,#fffdfd_0%,#f7f2f3_100%)]">
      <InnerNav active="admissions" />
      <AdmissionFunnelApp />
    </main>
  );
}

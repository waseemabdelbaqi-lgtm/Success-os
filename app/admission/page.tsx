import { InnerNav } from "../components";
import DiscoveryPage from "@/src/app/page";

export const metadata = {
  title: "فحص شروط القبول الذكي | SUCCESS OS",
  description: "جمع ومطابقة شروط القبول تلقائياً حسب الجنسية والمعدل.",
};

interface PageProps {
  searchParams: Promise<{ nationality?: string; gpa?: string }>;
}

/**
 * Mount point for the discovery board (`src/app/page.tsx`).
 * Marketing keeps `/`; funnel dashboard is `/admission` (also via `/?nationality&gpa` redirect).
 */
export default function AdmissionDiscoveryRoute({ searchParams }: PageProps) {
  return (
    <>
      <InnerNav active="admissions" />
      <DiscoveryPage searchParams={searchParams} />
    </>
  );
}

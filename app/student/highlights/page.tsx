import type { Metadata } from "next";
import { HighlightsPage } from "@/components/student-portal/extras/portal-tools";

export const metadata: Metadata = { title: "Highlights" };

export default function Page() {
  return <HighlightsPage />;
}

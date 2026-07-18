import type { Metadata } from "next";
import { AssistantPage } from "@/components/student-portal/extras/portal-tools";

export const metadata: Metadata = { title: "AI Study Assistant" };

export default function Page() {
  return <AssistantPage />;
}

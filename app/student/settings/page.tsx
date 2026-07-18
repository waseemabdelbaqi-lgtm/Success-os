import type { Metadata } from "next";
import { SettingsPage } from "@/components/student-portal/extras/portal-tools";

export const metadata: Metadata = { title: "Reading Settings" };

export default function Page() {
  return <SettingsPage />;
}

import type { Metadata } from "next";
import { NotificationsPage } from "@/components/student-portal/extras/portal-tools";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsPage />;
}

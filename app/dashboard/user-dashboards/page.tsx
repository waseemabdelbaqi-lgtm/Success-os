import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserDashboardsDirectory } from "@/components/dashboard/user-dashboards-directory";

export const metadata = {
  title: "User Dashboards · Success OS",
};

export default function UserDashboardsPage(): ReactNode {
  return (
    <RoleGuard roleSlug="admin">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <UserDashboardsDirectory />
      </main>
    </RoleGuard>
  );
}

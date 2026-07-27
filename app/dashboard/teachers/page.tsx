import type { ReactNode } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { TeachersOsWorkspace } from "@/components/teachers/teachers-os-workspace";

export const metadata = {
  title: "لوحات المعلمين · Teachers OS · SUCCESS OS",
  description:
    "تشغيل حصص المعلمين: تسجيل وثائق، حصص مسجلة، أونلاين/وجاهي، تسعير، مواعيد، مبيعات بعد خصم المنصة، وتبليغ التخلف للمشرف.",
};

export default function TeachersOsPage(): ReactNode {
  return (
    <RoleGuard roleSlug="teacher">
      <TeachersOsWorkspace />
    </RoleGuard>
  );
}

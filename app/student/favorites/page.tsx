import type { Metadata } from "next";
import { FavoritesPage } from "@/components/student-portal/extras/portal-tools";

export const metadata: Metadata = { title: "My Library" };

export default function Page() {
  return <FavoritesPage />;
}

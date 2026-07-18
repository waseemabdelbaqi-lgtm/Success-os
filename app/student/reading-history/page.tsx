import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ReadingHistoryPage } from "@/components/student-portal/history/reading-history-page";

export const metadata: Metadata = {
  title: "Reading History",
};

export default function StudentReadingHistoryPage(): ReactNode {
  return <ReadingHistoryPage />;
}

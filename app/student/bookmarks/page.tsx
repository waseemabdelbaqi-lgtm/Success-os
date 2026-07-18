import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BookmarksPage } from "@/components/student-portal/bookmarks/bookmarks-page";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default function StudentBookmarksPage(): ReactNode {
  return <BookmarksPage />;
}

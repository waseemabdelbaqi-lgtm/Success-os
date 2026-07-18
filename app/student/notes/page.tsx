import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NotesPage } from "@/components/student-portal/notes/notes-page";

export const metadata: Metadata = {
  title: "Notes",
};

export default function StudentNotesPage(): ReactNode {
  return <NotesPage />;
}

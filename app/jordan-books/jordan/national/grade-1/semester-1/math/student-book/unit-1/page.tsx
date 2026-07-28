import type { Metadata } from "next";
import { getPilotBook } from "@/src/lib/jordan-books/registry";
import { readEditorialOverrides } from "@/src/lib/jordan-books/store/editorial-store";
import { InteractiveBookReader } from "@/src/components/jordan-books/InteractiveBookReader";

export const metadata: Metadata = {
  title: "الوحدة الأولى: الجمع · رياضيات صف 1 | Success OS",
  description:
    "Interactive Jordan Grade 1 Mathematics Unit 1 — Success OS original explanations aligned to national outcomes. Official PDF linked only.",
};

export const dynamic = "force-dynamic";

/** Exact pilot route required by BOOKS FIRST mandate. */
export default async function Grade1MathUnit1Page() {
  const overrides = await readEditorialOverrides();
  const book = getPilotBook(overrides);

  return <InteractiveBookReader book={book} unitId="unit-1" />;
}

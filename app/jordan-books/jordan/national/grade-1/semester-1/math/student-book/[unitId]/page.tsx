import type { Metadata } from "next";
import { getPilotBook } from "@/src/lib/jordan-books/registry";
import { readEditorialOverrides } from "@/src/lib/jordan-books/store/editorial-store";
import { InteractiveBookReader } from "@/src/components/jordan-books/InteractiveBookReader";

export const metadata: Metadata = {
  title: "وحدة داخل كتاب الرياضيات صف 1 | Success OS",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ unitId: string }> };

/** Deep-link into one unit of the Sem1 Math companion book. */
export default async function Grade1MathUnitPage({ params }: Props) {
  const { unitId } = await params;
  const overrides = await readEditorialOverrides();
  const book = getPilotBook(overrides);
  const normalized = unitId.startsWith("unit-") ? unitId : `unit-${unitId}`;

  return <InteractiveBookReader book={book} unitId={normalized} />;
}

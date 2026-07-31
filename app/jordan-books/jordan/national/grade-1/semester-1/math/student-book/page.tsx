import { g1MathS1Stats, G1_MATH_RESERVED_UNITS } from "@/src/lib/jordan-books/content/g1-math-s1/student-book";
import { InteractiveBookReader } from "@/src/components/jordan-books/InteractiveBookReader";
import { getPilotBook } from "@/src/lib/jordan-books/registry";
import { readEditorialOverrides } from "@/src/lib/jordan-books/store/editorial-store";
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "رياضيات صف 1 فصل 1 — كتاب تفاعلي كامل (وحدات 0–3) | Success OS",
  description:
    "Complete Grade 1 Semester 1 Mathematics interactive companion — all Sem1 core units. Official PDF linked only.",
};

export const dynamic = "force-dynamic";

/** Full Sem1 Math companion book route (not a single-unit demo). */
export default async function Grade1MathStudentBookPage() {
  const overrides = await readEditorialOverrides();
  const book = getPilotBook(overrides);
  const stats = g1MathS1Stats();

  return (
    <>
      <div dir="rtl" style={{ padding: "0.75rem 1rem", background: "#fff8f1", borderBottom: "1px solid rgba(158,23,34,.2)" }}>
        <p style={{ margin: 0, fontWeight: 800, color: "#4b0a11" }}>
          Pilot book · {stats.units} وحدات · {stats.lessons} دروس · {stats.questions} أسئلة · اكتمال معلن:{" "}
          {book.completenessClaim} (ليس COMPLETE رسمي)
        </p>
        <p style={{ margin: "0.35rem 0 0", color: "#6b3a40" }}>
          وحدات مؤجلة لحين التحقق من حدود الفصل:{" "}
          {G1_MATH_RESERVED_UNITS.map((u) => u.titleAr).join(" · ")}
        </p>
        <p style={{ margin: "0.35rem 0 0" }}>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1/math">← صفحة المبحث</Link>
          {" · "}
          <Link href="/admin/jordan-books-dashboard">لوحة التغطية</Link>
        </p>
      </div>
      <InteractiveBookReader book={book} />
    </>
  );
}

import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import { STRUCTURED_BOOKS } from "@/src/lib/jordan-books/registry";

type Props = { params: Promise<{ gradeSlug: string }> };

function resolveGradeKey(gradeSlug: string): string | null {
  if (gradeSlug === "kg1" || gradeSlug === "kg2") return gradeSlug;
  if (gradeSlug.startsWith("grade-")) return gradeSlug.replace(/^grade-/, "");
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gradeSlug } = await params;
  const gradeKey = resolveGradeKey(gradeSlug);
  const sample = MASTER_INVENTORY.find((c) => c.gradeKey === gradeKey);
  return { title: `${sample?.gradeAr || gradeSlug} | Success OS Books` };
}

export default async function GradeLibraryPage({ params }: Props) {
  const { gradeSlug } = await params;
  const gradeKey = resolveGradeKey(gradeSlug);
  if (!gradeKey) notFound();

  const cells = MASTER_INVENTORY.filter((c) => c.gradeKey === gradeKey);
  if (!cells.length) notFound();

  const sample = cells[0]!;
  const semesters = Array.from(new Set(cells.map((c) => String(c.semester))));
  const subjects = Array.from(
    new Set(cells.filter((c) => !c.subjectAr.startsWith("(")).map((c) => c.subjectAr)),
  );
  const blockers = cells.filter((c) => c.matrixStatus === "NOT_DISCOVERED");

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>
          {sample.stage} · {sample.pathwayAr}
        </p>
        <h1 style={h1}>{sample.gradeAr}</h1>
        <p style={warn}>
          تُعرض كل المباحث المكتشفة لهذا الصف/المسار. لا تُخفى المباحث «غير الرئيسية». حالة قائمة المباحث:{" "}
          {sample.subjectListStatus}.
        </p>

        {blockers.length > 0 && subjects.length === 0 ? (
          <section style={card}>
            <h2 style={h2}>قائمة المباحث غير مكتشفة</h2>
            <p>{blockers[0]?.blocker}</p>
            <a href={sample.officialSourceUrl} target="_blank" rel="noreferrer">
              مصدر NCCD الرسمي
            </a>
          </section>
        ) : (
          <>
            <section style={card}>
              <h2 style={h2}>الفصول / العام</h2>
              <ul>
                {semesters.map((sem) => {
                  const semAr =
                    cells.find((c) => String(c.semester) === sem)?.semesterAr || sem;
                  const href =
                    sem === "year"
                      ? `/jordan-books/jordan/national/${gradeSlug}/year`
                      : `/jordan-books/jordan/national/${gradeSlug}/semester-${sem}`;
                  return (
                    <li key={sem}>
                      <Link href={href}>{semAr} — كل المباحث ({subjects.length})</Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section style={card}>
              <h2 style={h2}>ملخص المباحث ({subjects.length})</h2>
              <ul>
                {subjects.map((s) => {
                  const book = STRUCTURED_BOOKS.find(
                    (b) =>
                      b.subjectAr === s &&
                      (b.grade === gradeKey ||
                        b.grade === gradeKey.replace(/\D/g, "") ||
                        (gradeKey.startsWith("kg") && b.grade === gradeKey)),
                  );
                  return (
                    <li key={s}>
                      <strong>{s}</strong>
                      {book ? (
                        <>
                          {" · "}
                          <Link href={`/jordan-books/book/${book.id}`}>كتاب تفاعلي مسجّل</Link>
                        </>
                      ) : (
                        <span style={{ color: "#6b3a40" }}> · اختر الفصل لعرض كل أنواع الكتب</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}

        <p>
          <Link href="/jordan-books/jordan/national">← المنهاج الوطني</Link>
          {" · "}
          <a href={sample.officialSourceUrl} target="_blank" rel="noreferrer">
            كتالوج NCCD
          </a>
        </p>
      </div>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  padding: "1.25rem",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const wrap: CSSProperties = { maxWidth: 900, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const warn: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  borderRadius: 10,
  padding: "0.65rem 0.8rem",
  fontWeight: 700,
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};

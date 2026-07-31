import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import { STRUCTURED_BOOKS } from "@/src/lib/jordan-books/registry";

type Props = { params: Promise<{ gradeSlug: string; semesterSlug: string }> };

function resolveGradeKey(gradeSlug: string): string | null {
  if (gradeSlug === "kg1" || gradeSlug === "kg2") return gradeSlug;
  if (gradeSlug.startsWith("grade-")) return gradeSlug.replace(/^grade-/, "");
  return null;
}

function resolveSemester(semesterSlug: string): string | null {
  if (semesterSlug === "year") return "year";
  if (semesterSlug === "semester-1" || semesterSlug === "1") return "1";
  if (semesterSlug === "semester-2" || semesterSlug === "2") return "2";
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gradeSlug, semesterSlug } = await params;
  return { title: `${gradeSlug} · ${semesterSlug} | Success OS Books` };
}

export default async function GradeSemesterLibraryPage({ params }: Props) {
  const { gradeSlug, semesterSlug } = await params;
  const gradeKey = resolveGradeKey(gradeSlug);
  const semester = resolveSemester(semesterSlug);
  if (!gradeKey || !semester) notFound();

  const cells = MASTER_INVENTORY.filter(
    (c) => c.gradeKey === gradeKey && String(c.semester) === semester,
  );
  if (!cells.length) notFound();

  const sample = cells[0]!;
  const subjects = Array.from(
    new Set(cells.filter((c) => !c.subjectAr.startsWith("(")).map((c) => c.subjectAr)),
  );

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>
          Jordan · National · {sample.gradeAr} · {sample.semesterAr} · {sample.pathwayAr}
        </p>
        <h1 style={h1}>
          {sample.semesterAr} — كل المباحث
        </h1>
        <p style={warn}>
          عند فتح المبحث تظهر كل أنواع الكتب: كتاب طالب · نشاط · دليل معلم · مرافق Success OS · مواد داعمة
          (حسب الجرد). المرافقون الأصليون ليست إعادة نشر للكتب الحكومية.
        </p>

        <section style={card}>
          <h2 style={h2}>المباحث ({subjects.length})</h2>
          <ul>
            {subjects.map((subject) => {
              const subjectCells = cells.filter((c) => c.subjectAr === subject);
              const companionCell = subjectCells.find((c) => c.bookType === "sos_companion");
              const authored = STRUCTURED_BOOKS.find(
                (b) =>
                  b.subjectAr === subject &&
                  String(b.semester) === semester &&
                  (b.grade === gradeKey ||
                    b.grade === String(gradeKey.replace(/\D/g, "")) ||
                    (gradeKey.startsWith("kg") && b.grade === gradeKey)),
              );
              const bookId = authored?.id || companionCell?.structuredBookId;
              return (
                <li key={subject} style={{ marginBottom: "1.1rem" }}>
                  <strong>{subject}</strong>
                  <div style={{ color: "#6b3a40", fontSize: 14, margin: "0.25rem 0" }}>
                    {subjectCells.map((c) => `${c.bookType}:${c.matrixStatus}`).join(" · ")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", fontSize: 14 }}>
                    {subjectCells.map((c) => (
                      <span key={c.id} style={chip}>
                        {c.bookType === "sos_companion"
                          ? "مرافق Success OS"
                          : c.bookType === "student"
                            ? "كتاب الطالب"
                            : c.bookType === "activity"
                              ? "نشاط / تمارين"
                              : c.bookType === "teacher_guide"
                                ? "دليل المعلم"
                                : c.bookType === "support"
                                  ? "مواد داعمة"
                                  : c.bookType}
                        {c.bookType !== "sos_companion" && c.officialSourceUrl ? (
                          <>
                            {" "}
                            <a href={c.officialSourceUrl} target="_blank" rel="noreferrer">
                              رابط رسمي
                            </a>
                          </>
                        ) : null}
                      </span>
                    ))}
                    {bookId ? (
                      <Link href={`/jordan-books/book/${bookId}`}>فتح الكتاب التفاعلي</Link>
                    ) : (
                      <span>في الطابور / قيد الهيكلة</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <p>
          <Link href={`/jordan-books/jordan/national/${gradeSlug}`}>← {sample.gradeAr}</Link>
          {" · "}
          <Link href="/admin/jordan-curriculum-matrix">مصفوفة الاكتمال</Link>
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
const wrap: CSSProperties = { maxWidth: 960, margin: "0 auto" };
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
const chip: CSSProperties = {
  background: "rgba(158,23,34,.06)",
  borderRadius: 8,
  padding: "0.2rem 0.5rem",
};

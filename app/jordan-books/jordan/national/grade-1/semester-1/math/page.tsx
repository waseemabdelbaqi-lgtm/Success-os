import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPilotBook } from "@/src/lib/jordan-books/registry";
import { G1_SEM1_INVENTORY } from "@/src/lib/jordan-books/inventory/g1-semester1";

export const metadata: Metadata = {
  title: "الرياضيات · الصف الأول · فصل 1 | Success OS Books",
};

export default function MathSubjectPage() {
  const book = getPilotBook();
  const inventory = G1_SEM1_INVENTORY.filter((i) => i.subjectAr === "الرياضيات");

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>الرياضيات · الصف الأول · الفصل الأول</p>
        <h1 style={h1}>الرياضيات</h1>
        <p>
          الكتاب الرسمي مرتبط من NCCD فقط. النسخة التفاعلية Success OS أصلية ومحاذاة للنواتج — ليست إعادة نشر
          للكتاب الحكومي.
        </p>

        <section style={card}>
          <h2 style={h2}>كتب الجرد</h2>
          <ul>
            {inventory.map((i) => (
              <li key={i.id}>
                {i.officialTitleAr}
                <br />
                <a href={i.officialSourceUrl} target="_blank" rel="noreferrer">
                  المصدر الرسمي
                </a>{" "}
                · {i.rightsStatus}
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={h2}>الكتاب التفاعلي (Sem1 core — وحدات 0–3)</h2>
          <p>
            <strong>{book.officialTitleAr}</strong>
          </p>
          <p>
            الطبعة / السنة: {book.edition} / {book.publicationYear}
          </p>
          <p>
            الحالة التحريرية: {book.editorialStatus} · اكتمال معلن: {book.completenessClaim}
          </p>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1/math/student-book" style={cta}>
            فتح الكتاب التفاعلي كاملاً
          </Link>
          <ul>
            {book.units.map((u) => (
              <li key={u.id}>
                <Link href={`/jordan-books/jordan/national/grade-1/semester-1/math/student-book/${u.id}`}>
                  {u.titleAr} — {u.lessons.length} دروس
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Link href="/jordan-books/jordan/national/grade-1/semester-1">← الفصل الأول</Link>
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
const wrap: CSSProperties = { maxWidth: 860, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};
const cta: CSSProperties = {
  display: "inline-block",
  margin: "0.5rem 0 1rem",
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  padding: "0.65rem 0.9rem",
  borderRadius: 10,
};


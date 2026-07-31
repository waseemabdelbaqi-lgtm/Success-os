import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MASTER_INVENTORY } from "@/src/lib/jordan-books/matrix/master-inventory";
import { STRUCTURED_BOOKS } from "@/src/lib/jordan-books/registry";

export const metadata: Metadata = {
  title: "الصف الأول · الفصل الثاني · كل المباحث | Success OS Books",
};

export default function Grade1Semester2AllSubjectsPage() {
  const subjects = Array.from(
    new Set(
      MASTER_INVENTORY.filter((c) => c.gradeKey === "1" && c.semester === "2" && !c.subjectAr.startsWith("(")).map(
        (c) => c.subjectAr,
      ),
    ),
  );
  const books = STRUCTURED_BOOKS.filter((b) => b.grade === "1" && b.semester === "2");

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Jordan · National · Grade 1 · Semester 2 · All subjects</p>
        <h1 style={h1}>الفصل الدراسي الثاني — كل المباحث الموثّقة</h1>
        <p style={warn}>
          مرافقون Success OS أصليون (مسودة). ليست إعادة نشر للكتب الحكومية. لا يُعلن COMPLETE دون مراجعة.
        </p>
        <section style={card}>
          <h2 style={h2}>المباحث ({subjects.length})</h2>
          <ul>
            {subjects.map((subject) => {
              const companion = books.find((b) => b.subjectAr === subject);
              return (
                <li key={subject} style={{ marginBottom: "0.85rem" }}>
                  <strong>{subject}</strong>
                  {companion ? (
                    <div>
                      <Link href={`/jordan-books/book/${companion.id}`}>
                        فتح الكتاب التفاعلي ({companion.units.length} وحدات ·{" "}
                        {companion.units.reduce((n, u) => n + u.lessons.length, 0)} دروس)
                      </Link>
                    </div>
                  ) : (
                    <div style={{ color: "#6b3a40" }}>في الطابور / قيد الهيكلة</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <p>
          <Link href="/jordan-books/jordan/national/grade-1">← الصف الأول</Link>
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

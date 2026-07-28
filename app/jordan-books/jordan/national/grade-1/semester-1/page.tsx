import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { G1_SEM1_INVENTORY } from "@/src/lib/jordan-books/inventory/g1-semester1";

export const metadata: Metadata = {
  title: "الصف الأول · الفصل الأول | Success OS Books",
};

export default function Grade1Semester1Page() {
  const subjects = Array.from(new Set(G1_SEM1_INVENTORY.map((i) => i.subjectAr)));

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Grade 1 · Semester 1</p>
        <h1 style={h1}>الفصل الدراسي الأول</h1>
        <p style={warn}>
          يمكن معاينة تفاصيل الكتب دون تسجيل دخول. حفظ التقدم والملاحظات يتطلب تخزيناً محلياً في هذه المرحلة
          التجريبية.
        </p>
        <ul>
          {subjects.map((subject) => {
            const rows = G1_SEM1_INVENTORY.filter((i) => i.subjectAr === subject);
            const isMath = subject === "الرياضيات";
            return (
              <li key={subject} style={{ marginBottom: "1rem" }}>
                {isMath ? (
                  <Link href="/jordan-books/jordan/national/grade-1/semester-1/math">
                    <strong>{subject}</strong>
                  </Link>
                ) : (
                  <strong>{subject}</strong>
                )}
                <ul>
                  {rows.map((r) => (
                    <li key={r.id}>
                      {r.officialTitleAr} · {r.rightsStatus}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <Link href="/jordan-books/jordan/national/grade-1">← الصف الأول</Link>
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
const warn: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  borderRadius: 10,
  padding: "0.65rem 0.8rem",
  fontWeight: 700,
};

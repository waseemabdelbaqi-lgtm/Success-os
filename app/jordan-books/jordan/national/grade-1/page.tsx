import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { jordanVerifiedSubjects } from "@/app/data/jordan-curriculum";
import { G1_SEM1_INVENTORY } from "@/src/lib/jordan-books/inventory/g1-semester1";

export const metadata: Metadata = {
  title: "الصف الأول · المنهاج الوطني | Success OS Books",
};

const SUBJECT_SLUG: Record<string, string> = {
  الرياضيات: "math",
};

export default function Grade1Page() {
  const subjects = jordanVerifiedSubjects("الصف 1");

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Jordan · National · Grade 1</p>
        <h1 style={h1}>الصف الأول</h1>
        <p>قائمة المباحث موثّقة (subject-list-verified). افتح الفصل الدراسي:</p>
        <div style={row}>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1" style={cta}>
            الفصل الدراسي الأول
          </Link>
          <span style={badge}>الفصل الدراسي الثاني — inventory not started</span>
        </div>
        <h2 style={h2}>المباحث (موثّقة)</h2>
        <ul>
          {subjects.map((s: string) => (
            <li key={s}>
              {SUBJECT_SLUG[s] ? (
                <Link href={`/jordan-books/jordan/national/grade-1/semester-1/${SUBJECT_SLUG[s]}`}>{s}</Link>
              ) : (
                <span>
                  {s} —{" "}
                  {G1_SEM1_INVENTORY.some((i) => i.subjectAr === s)
                    ? "مدرج في الجرد · لا كتاب تفاعلي بعد"
                    : "NEEDS VERIFICATION"}
                </span>
              )}
            </li>
          ))}
        </ul>
        <Link href="/jordan-books/jordan/national">← المنهاج الوطني</Link>
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
const h2: CSSProperties = { color: "#9e1722" };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" };
const cta: CSSProperties = {
  display: "inline-block",
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  padding: "0.7rem 1rem",
  borderRadius: 10,
};
const badge: CSSProperties = {
  border: "1px solid rgba(158,23,34,.25)",
  borderRadius: 8,
  padding: "0.45rem 0.7rem",
  fontWeight: 700,
  color: "#6b3a40",
};

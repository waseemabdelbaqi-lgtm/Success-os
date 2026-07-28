import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { jordanGradeRegistry, jordanAuthority } from "@/app/data/jordan-curriculum";

export const metadata: Metadata = {
  title: "المنهاج الوطني الأردني | Success OS Books",
};

export default function JordanNationalPage() {
  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>{jordanAuthority.curriculumAr}</p>
        <h1 style={h1}>المنهاج الوطني</h1>
        <p style={muted}>
          السلطة: {jordanAuthority.curriculumCenterAr} / {jordanAuthority.ministryAr}
        </p>
        <p style={warn}>
          لا يُدّعى اكتمال كل الكتب. الأرقام أدناه من السجل الحالي فقط — الجرد التفصيلي بدأ بالصف الأول.
        </p>
        <ul style={list}>
          {jordanGradeRegistry.map((g) => (
            <li key={g.grade}>
              {g.grade === "الصف 1" ? (
                <Link href="/jordan-books/jordan/national/grade-1">
                  {g.gradeAr} — {g.catalogueStatus}
                </Link>
              ) : (
                <span>
                  {g.gradeAr} — {g.catalogueStatus} · inventory pending
                </span>
              )}
            </li>
          ))}
        </ul>
        <Link href="/jordan-books/jordan">← الأردن</Link>
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
const muted: CSSProperties = { color: "#6b3a40" };
const warn: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  borderRadius: 10,
  padding: "0.65rem 0.8rem",
  fontWeight: 700,
};
const list: CSSProperties = { lineHeight: 1.9 };

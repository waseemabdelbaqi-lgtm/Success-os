import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { jordanAuthority } from "@/app/data/jordan-curriculum";
import { MASTER_INVENTORY, inventoryStats } from "@/src/lib/jordan-books/matrix/master-inventory";

export const metadata: Metadata = {
  title: "المنهاج الوطني الأردني | Success OS Books",
};

type GradeRow = {
  gradeKey: string;
  gradeAr: string;
  stage: string;
  pathwayAr: string;
  href: string;
  subjectCount: number;
  listStatus: string;
};

function gradeHref(gradeKey: string): string {
  if (gradeKey === "kg1") return "/jordan-books/jordan/national/kg1";
  if (gradeKey === "kg2") return "/jordan-books/jordan/national/kg2";
  if (gradeKey === "11-vocational") return "/jordan-books/jordan/national/grade-11-vocational";
  if (gradeKey === "12-vocational") return "/jordan-books/jordan/national/grade-12-vocational";
  return `/jordan-books/jordan/national/grade-${gradeKey}`;
}

function buildGradeRows(): GradeRow[] {
  const keys = Array.from(new Set(MASTER_INVENTORY.map((c) => c.gradeKey)));
  return keys.map((gradeKey) => {
    const sample = MASTER_INVENTORY.find((c) => c.gradeKey === gradeKey)!;
    const subjects = new Set(
      MASTER_INVENTORY.filter((c) => c.gradeKey === gradeKey && !c.subjectAr.startsWith("(")).map(
        (c) => c.subjectAr,
      ),
    );
    return {
      gradeKey,
      gradeAr: sample.gradeAr,
      stage: sample.stage,
      pathwayAr: sample.pathwayAr,
      href: gradeHref(gradeKey),
      subjectCount: subjects.size,
      listStatus: sample.subjectListStatus,
    };
  });
}

export default function JordanNationalPage() {
  const rows = buildGradeRows();
  const stats = inventoryStats();

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>{jordanAuthority.curriculumAr}</p>
        <h1 style={h1}>المنهاج الوطني — مكتبة المراحل</h1>
        <p style={muted}>
          السلطة: {jordanAuthority.curriculumCenterAr} / {jordanAuthority.ministryAr}
        </p>
        <p style={warn}>
          المسار: بوابة الطالب → مواد المدرسة → الأردن → المنهاج الوطني → المرحلة → الصف → الفصل → المسار →
          المبحث → الكتاب التفاعلي. المكتبة <strong>ليست</strong> مكتملة بعد — {stats.totalCells} خلية جرد ·{" "}
          honestCompleteClaim=false.
        </p>

        <section style={card}>
          <h2 style={h2}>كل الصفوف والمسارات ({rows.length})</h2>
          <ul style={list}>
            {rows.map((g) => (
              <li key={g.gradeKey}>
                <Link href={g.href}>
                  {g.gradeAr} · {g.pathwayAr}
                </Link>
                <div style={{ color: "#6b3a40", fontSize: 14 }}>
                  {g.stage} · مباحث مكتشفة: {g.subjectCount} · حالة القائمة: {g.listStatus}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p>
          <Link href="/jordan-books/jordan">← الأردن</Link>
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
const wrap: CSSProperties = { maxWidth: 900, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const muted: CSSProperties = { color: "#6b3a40" };
const warn: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  borderRadius: 10,
  padding: "0.65rem 0.8rem",
  fontWeight: 700,
};
const list: CSSProperties = { lineHeight: 1.9 };
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};

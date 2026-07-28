import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Video متوقف · BOOKS FIRST | Success OS",
  description:
    "AI teacher video / HeyGen / cinema prototypes are archived. Jordan interactive books are the active product path.",
  robots: { index: false, follow: false },
};

/**
 * VIDEO DEVELOPMENT STOPPED — BOOKS FIRST pivot.
 * Reusable interactive lesson code remains in repo but is not the product path.
 * No HeyGen / video API spend from this route.
 */
export default function G1MathVideoArchivedPage() {
  return (
    <main dir="rtl" lang="ar" style={page}>
      <div style={card}>
        <p style={eyebrow}>Success OS · Critical Pivot</p>
        <h1 style={h1}>تم إيقاف تطوير فيديو المعلم الذكي</h1>
        <p style={body}>
          الأولوية الحالية: بناء المكتبة التفاعلية الكاملة للمنهاج الوطني الأردني (كتب رقمية — ليس عارضاً
          لملفات PDF، وليس دروس فيديو HeyGen).
        </p>
        <ul style={list}>
          <li>لا استهلاك لرصيد أو واجهات توليد فيديو من هذا المسار.</li>
          <li>نماذج السينما / الصور الرمزية مؤرشفة داخل المستودع وغير مفعّلة كمنتج.</li>
          <li>الكود القابل لإعادة الاستخدام للدروس محفوظ دون حذف.</li>
        </ul>
        <Link href="/jordan-books/jordan/national/grade-1/semester-1/math/student-book/unit-1" style={cta}>
          فتح تجريبي الرياضيات — الوحدة الأولى
        </Link>
        <p style={{ marginTop: 14 }}>
          <Link href="/jordan-books" style={link}>
            مكتبة الكتب الأردنية
          </Link>
          {" · "}
          <Link href="/admin/jordan-books-dashboard" style={link}>
            لوحة التغطية
          </Link>
        </p>
      </div>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "1.25rem",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const card: CSSProperties = {
  maxWidth: 720,
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.18)",
  borderRadius: 18,
  padding: "1.4rem",
  boxShadow: "0 14px 36px rgba(75,10,17,.08)",
};
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900, margin: 0 };
const h1: CSSProperties = { color: "#4b0a11", margin: "0.4rem 0 0.8rem" };
const body: CSSProperties = { lineHeight: 1.75, fontWeight: 600 };
const list: CSSProperties = { lineHeight: 1.8, fontWeight: 600 };
const cta: CSSProperties = {
  display: "inline-block",
  marginTop: 8,
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  padding: "0.75rem 1.05rem",
  borderRadius: 10,
};
const link: CSSProperties = { color: "#9e1722", fontWeight: 800 };

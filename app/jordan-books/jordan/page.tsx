import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الأردن · المنهاج الوطني | Success OS Books",
};

export default function JordanCountryPage() {
  return (
    <main dir="rtl" style={s.page}>
      <div style={s.wrap}>
        <p style={s.eyebrow}>Middle East → Jordan</p>
        <h1 style={s.h1}>الأردن</h1>
        <p>المنهاج الوطني الأردني — كتب Success OS التفاعلية (محاذاة رسمية، محتوى أصلي).</p>
        <Link href="/jordan-books/jordan/national" style={s.cta}>
          المنهاج الوطني
        </Link>
        <p style={{ marginTop: 16 }}>
          <Link href="/jordan-books">← المكتبة</Link>
        </p>
      </div>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: "1.25rem",
    background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
    fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
    color: "#2a0c10",
  } as CSSProperties,
  wrap: { maxWidth: 800, margin: "0 auto" } as CSSProperties,
  eyebrow: { color: "#9e1722", fontWeight: 900 } as CSSProperties,
  h1: { color: "#4b0a11" } as CSSProperties,
  cta: {
    display: "inline-block",
    background: "#9e1722",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
    padding: "0.7rem 1rem",
    borderRadius: 10,
  } as CSSProperties,
};

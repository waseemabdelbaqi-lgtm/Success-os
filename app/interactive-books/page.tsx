import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Success OS Book Engine | Gate 2",
};

export default function BookEngineHome() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "1.25rem",
        background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
        fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
        color: "#2a0c10",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <p style={{ color: "#9e1722", fontWeight: 900 }}>Gate 2 · Interactive Book Engine</p>
        <h1 style={{ color: "#4b0a11" }}>محرك الكتب التفاعلية — Success OS</h1>
        <p style={{ fontWeight: 700, background: "rgba(242,215,124,.4)", padding: 12, borderRadius: 12 }}>
          اختبار محرك فقط على درس واحد من رياضيات الصف الأول. الكتاب غير مكتمل. لا توليد جماعي.
        </p>
        <ul style={{ lineHeight: 2 }}>
          <li>
            <Link href="/interactive-books/reader/book-jo-g1-s1-math">معاينة القارئ (الطالب)</Link>
          </li>
          <li>
            <Link href="/interactive-books/cms">لوحة CMS</Link>
          </li>
          <li>
            <Link href="/api/interactive-book-engine?view=status">API الحالة</Link>
          </li>
          <li>
            <Link href="/jordan-books">مكتبة المنهاج الأردني</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

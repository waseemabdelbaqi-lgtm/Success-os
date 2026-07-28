import type { CSSProperties } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getPilotBook } from "@/src/lib/jordan-books/registry";
import { G1_SEM1_INVENTORY, OFFICIAL_SOURCES } from "@/src/lib/jordan-books/inventory/g1-semester1";

export const metadata: Metadata = {
  title: "مكتبة الكتب التفاعلية الأردنية | Success OS",
  description: "Jordan National Curriculum interactive digital books — BOOKS FIRST phase.",
};

export default function JordanBooksHomePage() {
  const pilot = getPilotBook();

  return (
    <main dir="rtl" lang="ar" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Success OS · Success 4 Sure</p>
        <h1 style={h1}>المكتبة التفاعلية للمنهاج الوطني الأردني</h1>
        <p style={lead}>
          مرحلة BOOKS FIRST — كتب رقمية تفاعلية من رياض الأطفال حتى التوجيهي. تم إيقاف تطوير فيديو المعلم
          الذكي / HeyGen في هذه المرحلة.
        </p>

        <section style={card}>
          <h2 style={h2}>مسار الطالب</h2>
          <p style={muted}>
            بوابة الطالب → المواد المدرسية → الشرق الأوسط → الأردن → المنهاج الوطني → الصف → الفصل → المبحث →
            الكتاب → الوحدة → الدرس
          </p>
          <ol style={path}>
            <li>
              <Link href="/jordan-books/jordan">الأردن</Link>
            </li>
            <li>
              <Link href="/jordan-books/jordan/national">المنهاج الوطني</Link>
            </li>
            <li>
              <Link href="/jordan-books/jordan/national/grade-1">الصف الأول</Link>
            </li>
            <li>
              <Link href="/jordan-books/jordan/national/grade-1/semester-1">الفصل الدراسي الأول</Link>
            </li>
            <li>
              <Link href="/jordan-books/jordan/national/grade-1/semester-1/math">الرياضيات</Link>
            </li>
          </ol>
        </section>

        <section style={card}>
          <h2 style={h2}>محرك التعلم التفاعلي Success OS</h2>
          <p style={muted}>
            كتاب كامل → درس تفاعلي (15 مرحلة) → تدريب → تعاون → لعبة مراجعة → تقييم → إتقان → تقارير. لا تضمين
            Nearpod/Kahoot/Padlet — بدائل أصلية مستقلة.
          </p>
          <ol style={path}>
            <li>
              <Link href="/jordan-books/lesson-engine/sos-il-jo-g1-math-u0-l1-numbers-123">
                الدرس المرجعي الكامل: الأعداد 1 ، 2 ، 3
              </Link>
            </li>
            <li>
              <Link href="/teacher/live-lesson?lessonId=sos-il-jo-g1-math-u0-l1-numbers-123">
                وضع المعلم المباشر
              </Link>
            </li>
            <li>
              <Link href="/admin/lesson-studio">استوديو إنشاء الدروس</Link>
            </li>
            <li>
              <Link href="/admin/lesson-reports">التقارير</Link>
            </li>
            <li>
              <Link href="/admin/jordan-curriculum-matrix">مصفوفة المنهاج + طابور الإنتاج</Link>
            </li>
          </ol>
        </section>

        <section style={card}>
          <h2 style={h2}>التجريبي الحالي (Pilot)</h2>
          <p>
            <strong>{pilot.officialTitleAr}</strong>
          </p>
          <p>
            {pilot.gradeAr} · {pilot.semesterAr} · وحدات 0–3 (تمهيدي + جمع + طرح + منزلتين) — مسودة تحريرية ·
            اكتمال معلن: {pilot.completenessClaim}
          </p>
          <p style={warn}>
            المحتوى Success OS أصلي بمحاذاة النواتج. الكتاب الرسمي PDF مرتبط فقط — لا إعادة نشر.
          </p>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1/math/student-book" style={cta}>
            فتح كتاب الرياضيات التفاعلي — وحدات 0–3 كاملة
          </Link>
        </section>

        <section style={card}>
          <h2 style={h2}>جرد الصف الأول — الفصل الأول</h2>
          <ul>
            {G1_SEM1_INVENTORY.map((item) => (
              <li key={item.id} style={{ marginBottom: "0.55rem" }}>
                <strong>{item.officialTitleAr}</strong>
                <br />
                <span style={muted}>
                  {item.rightsStatus} · {item.availabilityStatus}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={h2}>مصادر رسمية</h2>
          <ul>
            {OFFICIAL_SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
          <p>
          <Link href="/admin/jordan-books-dashboard" style={link}>
            لوحة التغطية
          </Link>
          {" · "}
          <Link href="/admin/jordan-curriculum-matrix" style={link}>
            مصفوفة الاكتمال + الطابور
          </Link>
        </p>
        </section>
      </div>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 10% 0%, rgba(242,215,124,.4), transparent 40%), linear-gradient(165deg,#fff8f1,#f3e6db)",
  color: "#2a0c10",
  fontFamily: '"IBM Plex Sans Arabic","Noto Naskh Arabic",Tahoma,sans-serif',
  padding: "1.25rem",
};
const wrap: CSSProperties = { maxWidth: 920, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900, margin: 0 };
const h1: CSSProperties = { color: "#4b0a11", fontSize: "clamp(1.6rem,4vw,2.4rem)", margin: "0.35rem 0" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const lead: CSSProperties = { lineHeight: 1.7, fontWeight: 600 };
const muted: CSSProperties = { color: "#6b3a40" };
const warn: CSSProperties = {
  background: "rgba(242,215,124,.35)",
  border: "1px solid rgba(158,23,34,.2)",
  borderRadius: 10,
  padding: "0.65rem 0.8rem",
  fontWeight: 700,
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem 1.1rem",
  marginTop: "1rem",
  boxShadow: "0 10px 28px rgba(75,10,17,.06)",
};
const path: CSSProperties = { lineHeight: 1.9 };
const cta: CSSProperties = {
  display: "inline-block",
  marginTop: 8,
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  padding: "0.7rem 1rem",
  borderRadius: 10,
};
const link: CSSProperties = { color: "#9e1722", fontWeight: 800 };

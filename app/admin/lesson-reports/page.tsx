"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export default function LessonReportsPage(): ReactNode {
  const [data, setData] = useState<{
    lessonId: string;
    studentReports: Array<{ studentKey: string; lessonMastery: number; attempts: number; timeSpentSec: number }>;
    teacherSummary: { learners: number; avgMastery: number; needingSupport: string[] };
    adminSummary: { interactiveLessons: number; videoTeacherDisabled: boolean };
  } | null>(null);

  useEffect(() => {
    fetch("/api/sos-lesson-engine?view=report")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j);
      });
  }, []);

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Reports · Student / Teacher / Parent / Admin</p>
        <h1 style={h1}>تقارير محرك الدروس التفاعلية</h1>
        {!data ? (
          <p>جاري التحميل…</p>
        ) : (
          <>
            <section style={card}>
              <h2 style={h2}>تقرير المعلّم</h2>
              <p>الدرس: {data.lessonId}</p>
              <p>المتعلمون: {data.teacherSummary.learners}</p>
              <p>متوسط الإتقان: {data.teacherSummary.avgMastery}%</p>
              <p>
                يحتاجون دعم (مفاتيح داخلية فقط — بلا أسماء علنية):{" "}
                {data.teacherSummary.needingSupport.join(", ") || "—"}
              </p>
            </section>
            <section style={card}>
              <h2 style={h2}>تقرير الطالب (مجمّع)</h2>
              <ul>
                {data.studentReports.map((s) => (
                  <li key={s.studentKey}>
                    {s.studentKey}: إتقان {Math.round(s.lessonMastery * 100)}% · محاولات {s.attempts} · وقت{" "}
                    {s.timeSpentSec}ث
                  </li>
                ))}
                {data.studentReports.length === 0 && <li>لا سجلات بعد — أكمل درساً واحفظ التقدّم.</li>}
              </ul>
            </section>
            <section style={card}>
              <h2 style={h2}>تقرير ولي الأمر (ملخص آمن)</h2>
              <p>يعرض التقدّم والإكمال ونقاط القوة ومجالات الدعم دون مقارنة علنية مع الأقران.</p>
            </section>
            <section style={card}>
              <h2 style={h2}>تقرير الإدارة</h2>
              <p>دروس تفاعلية مسجّلة: {data.adminSummary.interactiveLessons}</p>
              <p>فيديو المعلّم الآلي: {data.adminSummary.videoTeacherDisabled ? "متوقف" : "نشط"}</p>
            </section>
          </>
        )}
        <p>
          <Link href="/admin/lesson-studio">← الاستوديو</Link>
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
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};

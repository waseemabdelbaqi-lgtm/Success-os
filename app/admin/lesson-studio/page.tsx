"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

type LessonMeta = {
  id: string;
  titleAr: string;
  bookId: string;
  lessonId: string;
  validation: { ok: boolean; errors: string[] };
};

export default function LessonStudioPage(): ReactNode {
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [timeline, setTimeline] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [assignment, setAssignment] = useState("");

  useEffect(() => {
    fetch("/api/sos-lesson-engine?view=lessons")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setLessons(j.lessons);
          if (j.lessons[0]) setSelected(j.lessons[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/sos-lesson-engine?view=lesson&id=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        setTimeline([
          "Hook",
          "Explain ×" + j.lesson.explanationSections.length,
          "Check",
          "Practice ×" + j.lesson.guidedPractice.length,
          "Collaborate",
          "Assess ×" + j.lesson.assessment.questions.length,
          "Reflect",
        ]);
      });
  }, [selected]);

  async function createAssignment() {
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_assignment",
        lessonId: selected,
        groupLabel: "الصف الأول أ",
        allowedAttempts: 2,
        requiredScorePercent: 70,
        feedbackMode: "immediate",
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setAssignment(json.assignment.id);
      setMsg("تم إنشاء واجب من الدرس المعتمد.");
    }
  }

  const current = lessons.find((l) => l.id === selected);

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Admin · Lesson Creation Studio · Success OS</p>
        <h1 style={h1}>استوديو إنشاء الدروس التفاعلية</h1>
        <p style={banner}>
          المنهاج الأردني أولاً. لا نشر مباشر من الذكاء الاصطناعي. لا فيديو معلّم آلي. المراحل التعليمية
          إلزامية مع إمكانية إعادة الترتيب لاحقاً ضمن القيود.
        </p>

        <section style={card}>
          <h2 style={h2}>اختر درساً معتمداً / مرجعياً</h2>
          <select style={input} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titleAr} ({l.validation.ok ? "valid" : "errors"})
              </option>
            ))}
          </select>
          {current && (
            <p>
              book: {current.bookId} · lesson: {current.lessonId}
              {!current.validation.ok && (
                <span style={{ color: "#9e1722" }}> · {current.validation.errors.join(", ")}</span>
              )}
            </p>
          )}
        </section>

        <section style={card}>
          <h2 style={h2}>الخط الزمني التعليمي</h2>
          <div style={timelineRow}>
            {timeline.map((t) => (
              <div key={t} style={node}>
                {t}
              </div>
            ))}
          </div>
          <p style={{ color: "#6b3a40" }}>
            Hook → Explain → Check → Practice → Collaborate → Assess → Reflect
          </p>
        </section>

        <section style={card}>
          <h2 style={h2}>إجراءات</h2>
          <div style={actions}>
            <Link href={`/jordan-books/lesson-engine/${selected}`} style={btn}>
              معاينة طالب
            </Link>
            <Link href={`/teacher/live-lesson?lessonId=${encodeURIComponent(selected)}`} style={btn}>
              معاينة معلم مباشر
            </Link>
            <Link href={`/jordan-books/lesson-engine/${selected}/review-game`} style={btn}>
              لعبة مراجعة
            </Link>
            <button type="button" style={btnGhost} onClick={createAssignment}>
              إنشاء واجب (Assignment mode)
            </button>
            <Link href="/admin/lesson-reports" style={btnGhost}>
              التقارير
            </Link>
          </div>
          {msg && <p>{msg} {assignment && `· ${assignment}`}</p>}
        </section>

        <section style={card}>
          <h2 style={h2}>مسودة مساعدة بالذكاء الاصطناعي (غير منشورة)</h2>
          <p>
            يمكن للموظفين المصرّح لهم لاحقاً طلب مسودة شرح/أسئلة من مصادر معتمدة فقط. كل مسودة تُخزَّن مع:
            المزوّد · النموذج · نسخة الأمر · السياق · المراجع · المراجع البشري · التصحيحات · الموافقة.
          </p>
          <p style={{ fontWeight: 800 }}>الحالة الحالية: مسارات المسودة مقفلة عن النشر التلقائي.</p>
        </section>

        <Link href="/admin/jordan-curriculum-matrix">← مصفوفة المنهاج</Link>
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
const wrap: CSSProperties = { maxWidth: 960, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const banner: CSSProperties = {
  background: "rgba(242,215,124,.4)",
  borderRadius: 12,
  padding: "0.75rem 0.9rem",
  fontWeight: 800,
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};
const input: CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
};
const timelineRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const node: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  borderRadius: 999,
  padding: "0.35rem 0.7rem",
  fontWeight: 800,
  fontSize: 13,
};
const actions: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 10,
  padding: "0.55rem 0.85rem",
  fontWeight: 800,
  border: 0,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "#fff",
  color: "#9e1722",
  border: "1px solid rgba(158,23,34,.3)",
};

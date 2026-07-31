"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Lesson = {
  title: string;
  unitTitle: string;
  whatWeLearn: string[];
  story: string;
  explanationCards: Array<{ title: string; body: string }>;
  workedExamples: Array<{ prompt: string; steps: string[]; answer: string }>;
  interactiveActivities: Array<any>;
  quiz: Array<any>;
  media?: { css3dCubes?: boolean };
};

const shell: CSSProperties = {
  minHeight: "100vh",
  padding: "1rem",
  fontFamily: "'Noto Kufi Arabic', Tahoma, sans-serif",
  color: "#10233d",
  background:
    "radial-gradient(circle at 80% 0%, rgba(34,211,182,.18), transparent 28%), linear-gradient(180deg,#f4f8fb,#e7eef5)",
};

export default function StudentCurriculumSamplePage() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState<Record<string, unknown>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [dragMerged, setDragMerged] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/curriculum-sample", { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "missing");
        setLesson(j.content);
        const saved = localStorage.getItem(`sos-sample-progress:${j.id}`);
        if (saved) setProgress(JSON.parse(saved));
      })
      .catch((e) => setError(String(e.message || e)));
  }, []);

  useEffect(() => {
    if (!lesson) return;
    localStorage.setItem(
      "sos-sample-progress:latest",
      JSON.stringify({ step, score, dragMerged, chosen, quizIndex }),
    );
  }, [lesson, step, score, dragMerged, chosen, quizIndex]);

  const stages = useMemo(() => {
    if (!lesson) return [];
    return ["التهيئة", "القصة", "الشرح", "أمثلة", "أنشطة", "اختبار قصير", "إنجاز"];
  }, [lesson]);

  if (error) {
    return (
      <main dir="rtl" lang="ar" style={shell}>
        <div style={card}>لا يوجد درس تجريبي بعد. شغّل مرحلة الاستيعاب أولاً.</div>
      </main>
    );
  }
  if (!lesson) {
    return (
      <main dir="rtl" lang="ar" style={shell}>
        <div style={card}>جاري تحميل الدرس…</div>
      </main>
    );
  }

  const quiz = lesson.quiz[quizIndex];

  return (
    <main dir="rtl" lang="ar" style={shell}>
      <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gap: 12 }}>
        <header style={card}>
          <div style={{ color: "#0f766e", fontWeight: 800 }}>{lesson.unitTitle}</div>
          <h1 style={{ margin: "6px 0", fontSize: "1.6rem" }}>{lesson.title}</h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {stages.map((s, i) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: i === step ? "#0f766e" : "#dbe7f2",
                  color: i === step ? "#fff" : "#334155",
                  fontWeight: 700,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </header>

        {step === 0 && (
          <section style={card}>
            <h2>ماذا سنتعلم؟</h2>
            <ul>
              {lesson.whatWeLearn.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <p>تهيئة قصيرة: كم عنصراً أمامك؟ أشر وعدّ بصوت واضح.</p>
            <CubeRow count={3} />
          </section>
        )}

        {step === 1 && (
          <section style={card}>
            <h2>قصة اليوم</h2>
            <p style={{ lineHeight: 1.9, fontSize: 18 }}>{lesson.story}</p>
          </section>
        )}

        {step === 2 && (
          <section style={{ display: "grid", gap: 10 }}>
            {lesson.explanationCards.map((c) => (
              <article key={c.title} style={card}>
                <h3 style={{ marginTop: 0 }}>{c.title}</h3>
                <p style={{ marginBottom: 0, lineHeight: 1.8 }}>{c.body}</p>
              </article>
            ))}
          </section>
        )}

        {step === 3 && (
          <section style={{ display: "grid", gap: 10 }}>
            {lesson.workedExamples.map((ex) => (
              <article key={ex.prompt} style={card}>
                <h3 style={{ marginTop: 0 }}>{ex.prompt}</h3>
                <ol>
                  {ex.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <strong>الناتج: {ex.answer}</strong>
              </article>
            ))}
          </section>
        )}

        {step === 4 && (
          <section style={{ display: "grid", gap: 12 }}>
            <article style={card}>
              <h3>نشاط 1: اسحب المجموعتين معاً</h3>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <CubeRow count={3} label="مجموعة أ" />
                <span style={{ fontSize: 28 }}>+</span>
                <CubeRow count={2} label="مجموعة ب" />
                <button
                  type="button"
                  onClick={() => {
                    setDragMerged(true);
                    setScore((s) => s + 10);
                  }}
                  style={btn}
                >
                  دمج المجموعتين
                </button>
              </div>
              {dragMerged && (
                <div style={{ marginTop: 12 }}>
                  <CubeRow count={5} label="معاً" />
                  <p style={{ color: "#0f766e", fontWeight: 700 }}>أحسنت! 3 و2 تصيران 5.</p>
                </div>
              )}
            </article>

            <article style={card}>
              <h3>نشاط 2: اختر الناتج الصحيح لـ 4 + 1</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["3", "5", "6"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      ...btn,
                      background: chosen === c ? (c === "5" ? "#0f766e" : "#b91c1c") : "#0f172a",
                    }}
                    onClick={() => {
                      setChosen(c);
                      if (c === "5") setScore((s) => s + 10);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {chosen && (
                <p style={{ marginTop: 10, fontWeight: 700 }}>
                  {chosen === "5"
                    ? "ممتاز!"
                    : "محاولة جميلة، لنعدّ معاً مرة أخرى."}
                </p>
              )}
            </article>
          </section>
        )}

        {step === 5 && quiz && (
          <section style={card}>
            <h3>
              سؤال {quizIndex + 1} من {lesson.quiz.length}
            </h3>
            <p style={{ fontSize: 20 }}>{quiz.prompt}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(quiz.choices || ["true", "false"]).map((c: string) => (
                <button
                  key={c}
                  type="button"
                  style={btn}
                  onClick={() => {
                    const ok =
                      String(c) === String(quiz.answer) ||
                      (quiz.type === "truefalse" &&
                        (String(c).toLowerCase() === "true" || c === "صح") ===
                          (quiz.answer === true ||
                            String(quiz.answer).toLowerCase() === "true" ||
                            quiz.answer === "صح"));
                    setQuizFeedback(ok ? quiz.feedbackCorrect : quiz.feedbackWrong);
                    if (ok) setScore((s) => s + 5);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            {quizFeedback && <p style={{ fontWeight: 700 }}>{quizFeedback}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                style={btn}
                disabled={quizIndex >= lesson.quiz.length - 1}
                onClick={() => {
                  setQuizIndex((i) => Math.min(lesson.quiz.length - 1, i + 1));
                  setQuizFeedback(null);
                }}
              >
                التالي
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section style={card}>
            <h2>بطاقة إنجاز</h2>
            <p style={{ fontSize: 22, fontWeight: 800 }}>نقاطك: {score}</p>
            <p>أحسنت! أكملت نموذج الدرس التجريبي. المراجعة الإدارية مطلوبة قبل النشر.</p>
          </section>
        )}

        <nav style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btn} disabled={step <= 0} onClick={() => setStep((s) => s - 1)}>
            السابق
          </button>
          <button
            type="button"
            style={btn}
            disabled={step >= stages.length - 1}
            onClick={() => setStep((s) => s + 1)}
          >
            التالي
          </button>
        </nav>
      </div>
    </main>
  );
}

function CubeRow({ count, label }: { count: number; label?: string }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, marginBottom: 4 }}>{label}</div>}
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            aria-label={`مكعب ${i + 1}`}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(145deg,#22d3b6,#75a5ff)",
              boxShadow: "4px 4px 0 rgba(15,23,42,.2)",
              transform: "perspective(120px) rotateX(12deg) rotateY(-12deg)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const card: CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: "1rem 1.1rem",
  border: "1px solid #dbe4ee",
  boxShadow: "0 10px 30px rgba(15,23,42,.06)",
};

const btn: CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "0.7rem 1rem",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

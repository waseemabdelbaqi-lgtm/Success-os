"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CourseDefinition,
  CourseLesson,
  CourseUnit,
  LessonBlockId,
} from "@/types/course-structure";
import { LESSON_BLOCK_LABELS, LESSON_BLOCK_ORDER } from "@/types/course-structure";
import {
  getAdjacentLessons,
  getLocalized,
} from "@/services/student/course-structure.service";
import {
  getLessonBlockProgress,
  markBlockComplete,
  recordQuizResult,
  type LessonBlockProgressRecord,
} from "@/services/student/course-lesson-progress.service";

type Locale = "en" | "ar";

type LessonWorkspaceProps = {
  course: CourseDefinition;
  unit: CourseUnit;
  lesson: CourseLesson;
  locale?: Locale;
};

function btnStyle(active = false): React.CSSProperties {
  return {
    border: "1px solid #d1d5db",
    background: active ? "#0f766e" : "#fff",
    color: active ? "#fff" : "#111827",
    borderRadius: 8,
    padding: "0.4rem 0.7rem",
    fontSize: 13,
    cursor: "pointer",
  };
}

export function LessonWorkspace({
  course,
  unit,
  lesson,
  locale = "ar",
}: LessonWorkspaceProps): ReactNode {
  const [block, setBlock] = useState<LessonBlockId>("interactive_slides");
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState<LessonBlockProgressRecord | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [iqAnswers, setIqAnswers] = useState<Record<string, string>>({});
  const [iqReveal, setIqReveal] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "assistant"; text: string }[]>(
    [],
  );

  const dir = locale === "ar" ? "rtl" : "ltr";
  const adjacent = getAdjacentLessons(course.id, unit.id, lesson.id);
  const slides = lesson.blocks.interactiveSlides;
  const currentSlide = slides[slideIndex] || slides[0];

  useEffect(() => {
    setProgress(getLessonBlockProgress(course.id, unit.id, lesson.id));
    setSlideIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setIqAnswers({});
    setIqReveal({});
    setChatLog([]);
    setBlock("interactive_slides");
  }, [course.id, unit.id, lesson.id]);

  const treeHref = `/student/courses/${course.slug || course.id}`;

  const completedSet = useMemo(
    () => new Set(progress?.blocksCompleted || []),
    [progress],
  );

  function complete(blockId: LessonBlockId) {
    const next = markBlockComplete(course.id, unit.id, lesson.id, blockId);
    setProgress(next);
  }

  function submitQuiz() {
    const items = lesson.blocks.quiz;
    let correct = 0;
    for (const item of items) {
      if (quizAnswers[item.id] === item.answerIndex) correct += 1;
    }
    const next = recordQuizResult(
      course.id,
      unit.id,
      lesson.id,
      correct,
      items.length,
    );
    setProgress(next);
    setQuizSubmitted(true);
  }

  function sendChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply =
      locale === "ar"
        ? `ضمن درس «${getLocalized(lesson.title, "ar")}»: ركّز على I = Q ÷ t وتحقق من الوحدات. (${trimmed.slice(0, 80)})`
        : `Staying on “${getLocalized(lesson.title, "en")}”: focus on I = Q ÷ t and check units. (${trimmed.slice(0, 80)})`;
    setChatLog((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setChatInput("");
    complete("ai_chat");
  }

  return (
    <div dir={dir} style={{ maxWidth: 1200, margin: "0 auto", padding: "1.25rem 1rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
          <Link href="/student/courses" style={{ color: "#0f766e" }}>
            {locale === "ar" ? "الدورات" : "Courses"}
          </Link>
          {" · "}
          <Link href={treeHref} style={{ color: "#0f766e" }}>
            {getLocalized(course.title, locale)}
          </Link>
          {" · "}
          {getLocalized(unit.title, locale)}
        </p>
        <h1 style={{ margin: "0.35rem 0 0.25rem", fontSize: "1.55rem" }}>
          {getLocalized(lesson.title, locale)}
        </h1>
        <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.5 }}>
          {getLocalized(lesson.summary, locale)}
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#6b7280" }}>
          Course → Unit → Lesson · {locale === "ar" ? "التقدم" : "Progress"}:{" "}
          {progress?.masteryPercent ?? 0}% · {lesson.estimatedMinutes}{" "}
          {locale === "ar" ? "دقيقة" : "min"}
        </p>
      </header>

      <div
        className="course-lesson-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(200px, 240px) 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        <style>{`
          @media (max-width: 800px) {
            .course-lesson-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        <aside
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            padding: "0.75rem",
          }}
        >
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            {locale === "ar" ? "كتل الدرس" : "Lesson blocks"}
          </div>
          <nav style={{ display: "grid", gap: 6 }}>
            {LESSON_BLOCK_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setBlock(id)}
                style={{
                  ...btnStyle(block === id),
                  textAlign: dir === "rtl" ? "right" : "left",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{getLocalized(LESSON_BLOCK_LABELS[id], locale)}</span>
                <span style={{ opacity: 0.7 }}>{completedSet.has(id) ? "✓" : ""}</span>
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
            {adjacent.previous ? (
              <Link
                href={`/student/courses/${course.slug}/units/${unit.id}/lessons/${adjacent.previous.id}`}
                style={{ fontSize: 12, color: "#0f766e" }}
              >
                ← {getLocalized(adjacent.previous.title, locale)}
              </Link>
            ) : null}
            {adjacent.next ? (
              <Link
                href={`/student/courses/${course.slug}/units/${unit.id}/lessons/${adjacent.next.id}`}
                style={{ fontSize: 12, color: "#0f766e" }}
              >
                {getLocalized(adjacent.next.title, locale)} →
              </Link>
            ) : null}
          </div>
        </aside>

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            padding: "1rem",
            minHeight: 420,
          }}
        >
          {block === "interactive_slides" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.interactive_slides, locale)}
              </h2>
              <div
                style={{
                  borderRadius: 10,
                  background: "linear-gradient(145deg, #ecfdf5, #f0f9ff)",
                  padding: "1.25rem",
                  minHeight: 180,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {slideIndex + 1} / {slides.length}
                </div>
                <h3 style={{ margin: "0.35rem 0" }}>
                  {getLocalized(currentSlide?.title, locale)}
                </h3>
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  {getLocalized(currentSlide?.body, locale)}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={btnStyle()}
                  disabled={slideIndex <= 0}
                  onClick={() => setSlideIndex((v) => Math.max(0, v - 1))}
                >
                  {locale === "ar" ? "السابق" : "Prev"}
                </button>
                <button
                  type="button"
                  style={btnStyle(true)}
                  onClick={() => {
                    if (slideIndex < slides.length - 1) setSlideIndex((v) => v + 1);
                    else complete("interactive_slides");
                  }}
                >
                  {slideIndex < slides.length - 1
                    ? locale === "ar"
                      ? "التالي"
                      : "Next"
                    : locale === "ar"
                      ? "إكمال الشرائح"
                      : "Complete slides"}
                </button>
              </div>
            </div>
          ) : null}

          {block === "teacher_video" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(lesson.blocks.teacherVideo.title, locale)}
              </h2>
              <div
                style={{
                  aspectRatio: "16 / 9",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#e2e8f0",
                  display: "grid",
                  placeItems: "center",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                {lesson.blocks.teacherVideo.videoUrl ? (
                  <video
                    controls
                    src={lesson.blocks.teacherVideo.videoUrl}
                    style={{ width: "100%", height: "100%", borderRadius: 8 }}
                  />
                ) : (
                  <div>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>
                      {locale === "ar" ? "الفيديو غير مُنتَج بعد" : "Video not produced yet"}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, opacity: 0.85, maxWidth: 420 }}>
                      {getLocalized(lesson.blocks.teacherVideo.note, locale)}
                    </p>
                  </div>
                )}
              </div>
              {lesson.blocks.teacherVideo.chapters?.length ? (
                <ul style={{ marginTop: 12, paddingInlineStart: 18, fontSize: 13 }}>
                  {lesson.blocks.teacherVideo.chapters.map((c) => (
                    <li key={c.id}>
                      {getLocalized(c.title, locale)} · {c.startSeconds}s
                    </li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                style={{ ...btnStyle(true), marginTop: 12 }}
                onClick={() => complete("teacher_video")}
              >
                {locale === "ar" ? "تسجيل المشاهدة" : "Mark watched"}
              </button>
            </div>
          ) : null}

          {block === "ai_explanation" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.ai_explanation, locale)}
              </h2>
              <p style={{ lineHeight: 1.6 }}>
                {getLocalized(lesson.blocks.aiExplanation.summary, locale)}
              </p>
              <h3 style={{ fontSize: 15 }}>{locale === "ar" ? "الخطوات" : "Steps"}</h3>
              <ol>
                {lesson.blocks.aiExplanation.steps.map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {getLocalized(s, locale)}
                  </li>
                ))}
              </ol>
              <h3 style={{ fontSize: 15 }}>{locale === "ar" ? "أخطاء شائعة" : "Common mistakes"}</h3>
              <ul>
                {lesson.blocks.aiExplanation.commonMistakes.map((s, i) => (
                  <li key={i}>{getLocalized(s, locale)}</li>
                ))}
              </ul>
              <button
                type="button"
                style={btnStyle(true)}
                onClick={() => complete("ai_explanation")}
              >
                {locale === "ar" ? "فهمت الشرح" : "Mark explained"}
              </button>
            </div>
          ) : null}

          {block === "simulation_3d" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(lesson.blocks.simulation3d.title, locale)}
              </h2>
              <p>{getLocalized(lesson.blocks.simulation3d.purpose, locale)}</p>
              <div
                style={{
                  borderRadius: 10,
                  border: "1px dashed #94a3b8",
                  padding: "2rem 1rem",
                  textAlign: "center",
                  background: "#f8fafc",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {locale === "ar" ? "محاكاة 3D" : "3D Simulation"} ·{" "}
                  {lesson.blocks.simulation3d.status}
                </div>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  {getLocalized(lesson.blocks.simulation3d.placeholderNote, locale)}
                </p>
              </div>
              <button
                type="button"
                style={{ ...btnStyle(true), marginTop: 12 }}
                onClick={() => complete("simulation_3d")}
              >
                {locale === "ar" ? "تسجيل الاطلاع" : "Mark viewed"}
              </button>
            </div>
          ) : null}

          {block === "notes" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.notes, locale)}
              </h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                {getLocalized(lesson.blocks.notes.studentNotes, locale)}
              </p>
              <h3 style={{ fontSize: 15 }}>{locale === "ar" ? "الخلاصات" : "Takeaways"}</h3>
              <ul>
                {lesson.blocks.notes.keyTakeaways.map((t, i) => (
                  <li key={i}>{getLocalized(t, locale)}</li>
                ))}
              </ul>
              <button
                type="button"
                style={btnStyle(true)}
                onClick={() => complete("notes")}
              >
                {locale === "ar" ? "إكمال الملاحظات" : "Complete notes"}
              </button>
            </div>
          ) : null}

          {block === "attachments" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.attachments, locale)}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {lesson.blocks.attachments.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "0.75rem",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{getLocalized(a.title, locale)}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {a.kind}
                      {a.protected ? ` · ${locale === "ar" ? "محمي" : "protected"}` : ""}
                    </div>
                    {a.description ? (
                      <p style={{ margin: "0.35rem 0 0", fontSize: 13 }}>
                        {getLocalized(a.description, locale)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={btnStyle(true)}
                onClick={() => complete("attachments")}
              >
                {locale === "ar" ? "تم الاطلاع على المرفقات" : "Mark attachments reviewed"}
              </button>
            </div>
          ) : null}

          {block === "interactive_questions" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.interactive_questions, locale)}
              </h2>
              {lesson.blocks.interactiveQuestions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "0.75rem",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {getLocalized(q.prompt, locale)}
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {(q.options || []).map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        style={btnStyle(iqAnswers[q.id] === String(idx))}
                        onClick={() =>
                          setIqAnswers((prev) => ({ ...prev, [q.id]: String(idx) }))
                        }
                      >
                        {getLocalized(opt, locale)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    style={{ ...btnStyle(), marginTop: 8 }}
                    onClick={() => {
                      setIqReveal((prev) => ({ ...prev, [q.id]: true }));
                      complete("interactive_questions");
                    }}
                  >
                    {locale === "ar" ? "تحقق" : "Check"}
                  </button>
                  {iqReveal[q.id] ? (
                    <p style={{ margin: "0.5rem 0 0", fontSize: 13, color: "#0f766e" }}>
                      {iqAnswers[q.id] === q.answer
                        ? locale === "ar"
                          ? "صحيح"
                          : "Correct"
                        : locale === "ar"
                          ? "راجع الإجابة"
                          : "Review answer"}
                      {" — "}
                      {getLocalized(q.explanation, locale)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {block === "ai_chat" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.ai_chat, locale)}
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                {getLocalized(lesson.blocks.aiChat.systemHint, locale)}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {lesson.blocks.aiChat.starterPrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    style={btnStyle()}
                    onClick={() => sendChat(getLocalized(p, locale))}
                  >
                    {getLocalized(p, locale)}
                  </button>
                ))}
              </div>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "0.75rem",
                  minHeight: 160,
                  marginBottom: 8,
                  background: "#f9fafb",
                }}
              >
                {chatLog.length === 0 ? (
                  <span style={{ color: "#9ca3af", fontSize: 13 }}>
                    {locale === "ar" ? "ابدأ محادثة ضمن هذا الدرس" : "Start a lesson-scoped chat"}
                  </span>
                ) : (
                  chatLog.map((m, i) => (
                    <div key={i} style={{ marginBottom: 8, fontSize: 13 }}>
                      <b>{m.role === "user" ? (locale === "ar" ? "أنت" : "You") : "AI"}:</b>{" "}
                      {m.text}
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب سؤالك…" : "Ask a question…"}
                  style={{
                    flex: 1,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: "0.5rem 0.7rem",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChat(chatInput);
                  }}
                />
                <button type="button" style={btnStyle(true)} onClick={() => sendChat(chatInput)}>
                  {locale === "ar" ? "إرسال" : "Send"}
                </button>
              </div>
            </div>
          ) : null}

          {block === "homework" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.homework, locale)}
              </h2>
              {lesson.blocks.homework.map((hw) => (
                <div
                  key={hw.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "0.75rem",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{getLocalized(hw.title, locale)}</div>
                  <p style={{ margin: "0.35rem 0", fontSize: 14 }}>
                    {getLocalized(hw.instructions, locale)}
                  </p>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    ~{hw.estimatedMinutes} {locale === "ar" ? "دقيقة" : "min"}
                  </div>
                </div>
              ))}
              <button
                type="button"
                style={btnStyle(true)}
                onClick={() => complete("homework")}
              >
                {locale === "ar" ? "استلمت الواجب" : "Homework acknowledged"}
              </button>
            </div>
          ) : null}

          {block === "quiz" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.quiz, locale)}
              </h2>
              {lesson.blocks.quiz.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "0.75rem",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {getLocalized(item.question, locale)}
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {item.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={quizSubmitted}
                        style={btnStyle(quizAnswers[item.id] === idx)}
                        onClick={() =>
                          setQuizAnswers((prev) => ({ ...prev, [item.id]: idx }))
                        }
                      >
                        {getLocalized(opt, locale)}
                      </button>
                    ))}
                  </div>
                  {quizSubmitted ? (
                    <p style={{ margin: "0.5rem 0 0", fontSize: 13, color: "#0f766e" }}>
                      {getLocalized(item.explanation, locale)}
                    </p>
                  ) : null}
                </div>
              ))}
              {!quizSubmitted ? (
                <button type="button" style={btnStyle(true)} onClick={submitQuiz}>
                  {locale === "ar" ? "تسليم الاختبار" : "Submit quiz"}
                </button>
              ) : (
                <p style={{ fontWeight: 600 }}>
                  {locale === "ar" ? "النتيجة" : "Score"}: {progress?.quizScore ?? 0}%
                </p>
              )}
            </div>
          ) : null}

          {block === "progress" ? (
            <div>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                {getLocalized(LESSON_BLOCK_LABELS.progress, locale)}
              </h2>
              <p style={{ fontSize: 28, fontWeight: 700, margin: "0.25rem 0" }}>
                {progress?.masteryPercent ?? 0}%
              </p>
              <p style={{ color: "#6b7280", fontSize: 13 }}>
                {locale === "ar" ? "كتل مكتملة" : "Blocks completed"}:{" "}
                {(progress?.blocksCompleted || []).length} / {LESSON_BLOCK_ORDER.length}
              </p>
              <h3 style={{ fontSize: 15 }}>{locale === "ar" ? "الأهداف" : "Objectives"}</h3>
              <ul>
                {lesson.blocks.progress.objectives.map((o, i) => (
                  <li key={i}>{getLocalized(o, locale)}</li>
                ))}
              </ul>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {LESSON_BLOCK_ORDER.map((id) => (
                  <li key={id} style={{ padding: "0.25rem 0", fontSize: 13 }}>
                    {completedSet.has(id) ? "✓" : "○"}{" "}
                    {getLocalized(LESSON_BLOCK_LABELS[id], locale)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                style={btnStyle(true)}
                onClick={() => complete("progress")}
              >
                {locale === "ar" ? "تحديث التقدم" : "Refresh progress mark"}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

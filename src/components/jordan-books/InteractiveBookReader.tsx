"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BookRecord } from "@/src/lib/jordan-books/schema/types";
import { rightsLabel } from "@/src/lib/jordan-books/registry";
import { useBookAnnotations } from "@/src/lib/jordan-books/hooks/useBookAnnotations";
import { ContentBlockView } from "@/src/components/jordan-books/ContentBlockView";

type Props = {
  book: BookRecord;
  unitId?: string;
  initialLessonId?: string;
};

export function InteractiveBookReader({ book, unitId, initialLessonId }: Props) {
  const units = unitId ? book.units.filter((u) => u.id === unitId) : book.units;
  const unit = units[0];
  const allLessons = units.flatMap((u) => u.lessons);
  const [mastery, setMastery] = useState<Record<string, boolean>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeUnitFilter, setActiveUnitFilter] = useState<string | "all">(unitId || "all");
  const lessons =
    activeUnitFilter === "all"
      ? allLessons
      : units.find((u) => u.id === activeUnitFilter)?.lessons || allLessons;
  const totalLessons = allLessons.length;
  const masteryScore = Object.values(mastery).filter(Boolean).length;

  const {
    ready,
    state,
    toggleBookmark,
    addHighlight,
    removeHighlight,
    upsertNote,
    saveHandwriting,
    markProgress,
  } = useBookAnnotations(book.id, totalLessons);

  const [lessonId, setLessonId] = useState(
    initialLessonId || state.progress.lastLessonId || allLessons[0]?.id || "",
  );
  const [query, setQuery] = useState("");
  const [fontScale, setFontScale] = useState(1.05);
  const [dyslexia, setDyslexia] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fullscreen, setFullscreen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (state.progress.lastLessonId && !initialLessonId) {
      setLessonId(state.progress.lastLessonId);
    }
  }, [ready, state.progress.lastLessonId, initialLessonId]);

  const lesson = allLessons.find((l) => l.id === lessonId) || allLessons[0];

  useEffect(() => {
    if (!lesson) return;
    const existing = state.notes.find((n) => n.lessonId === lesson.id && !n.blockId);
    setNoteText(existing?.text || "");
    markProgress(lesson.id, lesson.blocks[0]?.id || null, false);
  }, [lesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchHits = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return allLessons.flatMap((l) =>
      l.blocks
        .filter((b) => `${b.titleAr || ""} ${b.bodyAr}`.includes(q))
        .map((b) => ({
          lessonId: l.id,
          lessonTitle: l.titleAr,
          blockId: b.id,
          snippet: b.bodyAr.slice(0, 80),
        })),
    );
  }, [query, allLessons]);

  if (!unit || !lesson) {
    return (
      <div className="jb-shell" dir="rtl">
        <p>الوحدة غير موجودة في هذا الكتاب.</p>
        <Link href="/jordan-books">العودة للمكتبة</Link>
      </div>
    );
  }

  function goLesson(id: string) {
    setLessonId(id);
    const el = document.getElementById("jb-reader-main");
    el?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function readAloud() {
    if (!lesson || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const current = lesson;
    const text = [current.titleAr, ...current.blocks.map((b) => `${b.titleAr || ""} ${b.bodyAr}`)].join(
      ". ",
    );
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-JO";
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function toggleFullscreen() {
    const root = document.getElementById("jb-reader-root");
    if (!root) return;
    if (!document.fullscreenElement) {
      root.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const hlSet = new Set(state.highlights.map((h) => h.blockId));
  const currentUnit = book.units.find((u) => u.lessons.some((l) => l.id === lesson.id));
  const lessonAnswers =
    book.answerBank?.filter((a) => a.lessonId === lesson.id && mastery[a.questionBlockId]) || [];

  return (
    <div
      id="jb-reader-root"
      className={`jb-shell ${theme} ${dyslexia ? "dyslexia" : ""} ${fullscreen ? "fs" : ""}`}
      dir="rtl"
      lang="ar"
    >
      <header className="jb-top">
        <div>
          <p className="jb-eyebrow">Success OS · Jordan National Curriculum · BOOKS FIRST</p>
          <h1>{book.officialTitleAr}</h1>
          <p className="jb-meta">
            {book.gradeAr} · {book.semesterAr} · {book.subjectAr} · {units.length} وحدات · {totalLessons}{" "}
            دروس · اكتمال معلن: {book.completenessClaim}
          </p>
        </div>
        <div className="jb-top-actions">
          <a className="jb-link" href={book.officialSourceUrl} target="_blank" rel="noreferrer">
            المصدر الرسمي (NCCD)
          </a>
          <span className="jb-badge">{rightsLabel(book.rightsStatus)}</span>
          <span className="jb-badge muted">حالة التحرير: {book.editorialStatus}</span>
        </div>
      </header>

      {book.verificationNote ? (
        <div className="jb-banner warn" role="status">
          NEEDS VERIFICATION — {book.verificationNote}
        </div>
      ) : null}

      <div className="jb-banner" role="note">
        هذا كتاب تفاعلي مرافق Success OS — ليس إعادة نشر للكتاب الحكومي. الشروحات أصلية. الاعتماد يظهر على
        المحتوى الأصلي فقط.
      </div>

      <div className="jb-toolbar">
        <button type="button" onClick={() => setTocOpen((v) => !v)}>
          المحتويات
        </button>
        <label className="jb-search">
          <span>بحث</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث داخل الكتاب…" />
        </label>
        <button type="button" onClick={() => setFontScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2)))}>
          تكبير الخط
        </button>
        <button type="button" onClick={() => setFontScale((s) => Math.max(0.85, +(s - 0.1).toFixed(2)))}>
          تصغير الخط
        </button>
        <button type="button" onClick={() => setDyslexia((v) => !v)}>
          {dyslexia ? "خط عادي" : "قراءة ميسّرة"}
        </button>
        <button type="button" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
          {theme === "light" ? "وضع داكن" : "وضع فاتح"}
        </button>
        <button type="button" onClick={readAloud}>
          {speaking ? "إيقاف القراءة" : "اقرأ بصوت"}
        </button>
        <button type="button" onClick={toggleFullscreen}>
          ملء الشاشة
        </button>
        <button type="button" onClick={() => setShowAnswers((v) => !v)}>
          {showAnswers ? "إخفاء بنك الإجابات" : "بنك الإجابات (بعد التحقق)"}
        </button>
        <span className="jb-progress" aria-live="polite">
          التقدم: {state.progress.percent}% · إتقان أسئلة: {masteryScore}
        </span>
      </div>

      {searchHits.length > 0 ? (
        <div className="jb-search-hits">
          {searchHits.map((hit) => (
            <button
              key={`${hit.lessonId}-${hit.blockId}`}
              type="button"
              onClick={() => {
                goLesson(hit.lessonId);
                setTimeout(() => document.getElementById(hit.blockId)?.scrollIntoView({ behavior: "smooth" }), 50);
              }}
            >
              <strong>{hit.lessonTitle}</strong> — {hit.snippet}…
            </button>
          ))}
        </div>
      ) : null}

      <div className="jb-layout">
        {tocOpen ? (
          <aside className="jb-toc" aria-label="جدول المحتويات">
            <h2>فهرس الكتاب</h2>
            {!unitId ? (
              <div className="jb-unit-filters">
                <button
                  type="button"
                  className={activeUnitFilter === "all" ? "active" : ""}
                  onClick={() => setActiveUnitFilter("all")}
                >
                  كل الوحدات
                </button>
                {units.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={activeUnitFilter === u.id ? "active" : ""}
                    onClick={() => {
                      setActiveUnitFilter(u.id);
                      const first = u.lessons[0];
                      if (first) goLesson(first.id);
                    }}
                  >
                    {u.titleAr}
                  </button>
                ))}
              </div>
            ) : null}
            <ol>
              {(activeUnitFilter === "all" ? units : units.filter((u) => u.id === activeUnitFilter)).map(
                (u) => (
                  <li key={u.id} className="jb-toc-unit">
                    <strong>{u.titleAr}</strong>
                    <ol>
                      {u.lessons.map((l) => (
                        <li key={l.id}>
                          <button
                            type="button"
                            className={l.id === lesson.id ? "active" : ""}
                            onClick={() => goLesson(l.id)}
                          >
                            {l.order}. {l.titleAr}
                            {state.bookmarks.includes(l.id) ? " ★" : ""}
                            {state.progress.completedLessonIds.includes(l.id) ? " ✓" : ""}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </li>
                ),
              )}
            </ol>
            <p className="jb-credit-safe">
              شروحات Success OS الأصلية فقط تحمل اعتماد: Prepared by Mr Waseem Allabadi — دون ادعاء ملكية الكتاب
              الحكومي الرسمي.
            </p>
          </aside>
        ) : null}

        <main id="jb-reader-main" className="jb-main">
          <div className="jb-lesson-head">
            <h2>
              {currentUnit?.titleAr} · الدرس {lesson.order}: {lesson.titleAr}
            </h2>
            <div className="jb-lesson-actions">
              <button type="button" onClick={() => toggleBookmark(lesson.id)}>
                {state.bookmarks.includes(lesson.id) ? "إزالة إشارة" : "إشارة مرجعية"}
              </button>
              <button
                type="button"
                onClick={() => markProgress(lesson.id, null, true)}
              >
                تعليم كمكتمل
              </button>
            </div>
          </div>

          <section className="jb-outcomes">
            <h3>نواتج التعلم الرسمية المستهدفة</h3>
            <ul>
              {lesson.learningOutcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>

          <section className="jb-prereq">
            <h3>المتطلبات السابقة</h3>
            <ul>
              {lesson.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section className="jb-vocab">
            <h3>المفردات</h3>
            <dl>
              {lesson.vocabulary.map((v) => (
                <div key={v.term}>
                  <dt>{v.term}</dt>
                  <dd>{v.definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          {lesson.blocks.map((block) => (
            <ContentBlockView
              key={block.id}
              block={block}
              highlighted={hlSet.has(block.id)}
              handwritingUrl={state.handwriting[block.id]}
              onHighlight={addHighlight}
              onClearHighlight={removeHighlight}
              onSaveHandwriting={saveHandwriting}
              onMastery={(id, correct) =>
                setMastery((prev) => ({ ...prev, [id]: correct ? true : prev[id] || false }))
              }
              fontScale={fontScale}
            />
          ))}

          {showAnswers ? (
            <section className="jb-notes">
              <h3>بنك إجابات هذا الدرس (يظهر للأسئلة التي أجبت عنها صحيحاً أو راجعتها)</h3>
              <ul>
                {(book.answerBank || [])
                  .filter((a) => a.lessonId === lesson.id)
                  .map((a) => (
                    <li key={a.id}>
                      <strong>{a.promptAr}</strong> → {a.correctAnswer}
                      <br />
                      <span>{a.explanationAr}</span>
                      <br />
                      <em>verification: {a.verificationStatus}</em>
                    </li>
                  ))}
              </ul>
              {lessonAnswers.length === 0 ? (
                <p>أجب عن الأسئلة أولاً، أو افتح البنك للمراجعة الأكاديمية (مسودة).</p>
              ) : null}
            </section>
          ) : null}

          <section className="jb-notes">
            <h3>ملاحظاتي على الدرس</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="اكتب ملاحظة شخصية…"
            />
            <button type="button" onClick={() => upsertNote(lesson.id, noteText)}>
              حفظ الملاحظة
            </button>
          </section>

          {lesson.preparedBy ? <p className="jb-prepared">{lesson.preparedBy}</p> : null}

          <nav className="jb-pager">
            <button
              type="button"
              disabled={lessonIndex <= 0}
              onClick={() => goLesson(allLessons[lessonIndex - 1]!.id)}
            >
              الدرس السابق
            </button>
            <span>
              {lessonIndex + 1} / {allLessons.length}
            </span>
            <button
              type="button"
              disabled={lessonIndex >= allLessons.length - 1}
              onClick={() => goLesson(allLessons[lessonIndex + 1]!.id)}
            >
              الدرس التالي
            </button>
          </nav>
        </main>
      </div>

      <style jsx global>{`
        .jb-shell {
          --b: #9e1722;
          --d: #4b0a11;
          --g: #f2d77c;
          --bg: #fff8f1;
          --paper: #fffdf8;
          --ink: #2a0c10;
          --muted: #6b3a40;
          --line: rgba(158, 23, 34, 0.16);
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 8%, rgba(242, 215, 124, 0.35), transparent 42%),
            linear-gradient(165deg, #fff8f1, #f3e6db 55%, #efe0d4);
          color: var(--ink);
          font-family: "IBM Plex Sans Arabic", "Noto Naskh Arabic", Tahoma, sans-serif;
          padding: 1rem;
        }
        .jb-shell.dark {
          --bg: #1a0d10;
          --paper: #241418;
          --ink: #f7ece8;
          --muted: #d2b0b4;
          --line: rgba(242, 215, 124, 0.22);
          background: linear-gradient(165deg, #1a0d10, #2a1218 60%, #1a0d10);
        }
        .jb-shell.dyslexia {
          font-family: "Comic Neue", "Trebuchet MS", "IBM Plex Sans Arabic", sans-serif;
          letter-spacing: 0.03em;
          word-spacing: 0.08em;
          line-height: 1.85;
        }
        .jb-top {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        .jb-eyebrow {
          margin: 0;
          color: var(--b);
          font-weight: 800;
          font-size: 0.85rem;
        }
        .jb-top h1 {
          margin: 0.2rem 0;
          font-size: clamp(1.35rem, 3vw, 2rem);
          color: var(--d);
        }
        .jb-shell.dark .jb-top h1 {
          color: var(--g);
        }
        .jb-meta {
          margin: 0;
          color: var(--muted);
        }
        .jb-top-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .jb-link {
          color: var(--b);
          font-weight: 800;
        }
        .jb-badge {
          background: var(--b);
          color: #fff;
          border-radius: 0.45rem;
          padding: 0.35rem 0.6rem;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .jb-badge.muted {
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--line);
        }
        .jb-banner {
          border: 1px solid var(--line);
          background: rgba(242, 215, 124, 0.35);
          padding: 0.7rem 0.9rem;
          border-radius: 0.7rem;
          margin-bottom: 0.75rem;
          font-weight: 700;
        }
        .jb-toolbar,
        .jb-search-hits,
        .jb-lesson-actions,
        .jb-pager,
        .jb-options,
        .jb-type,
        .jb-block-actions,
        .jb-handwrite-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          align-items: center;
        }
        .jb-toolbar {
          margin-bottom: 0.75rem;
          padding: 0.65rem;
          background: color-mix(in srgb, var(--paper) 88%, white);
          border: 1px solid var(--line);
          border-radius: 0.85rem;
        }
        .jb-toolbar button,
        .jb-lesson-actions button,
        .jb-pager button,
        .jb-opt,
        .jb-type button,
        .jb-notes button,
        .jb-handwrite-bar button,
        .jb-mini,
        .jb-search-hits button,
        .jb-toc button {
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          border-radius: 0.55rem;
          padding: 0.45rem 0.7rem;
          font-weight: 800;
          cursor: pointer;
          min-height: 2.5rem;
        }
        .jb-toolbar button:hover,
        .jb-toc button:hover,
        .jb-opt:hover {
          border-color: var(--b);
        }
        .jb-search {
          display: flex;
          gap: 0.35rem;
          align-items: center;
          flex: 1;
          min-width: 12rem;
        }
        .jb-search input,
        .jb-type input,
        .jb-notes textarea {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 0.55rem;
          padding: 0.5rem 0.65rem;
          background: var(--paper);
          color: var(--ink);
        }
        .jb-progress {
          margin-inline-start: auto;
          font-weight: 900;
          color: var(--b);
        }
        .jb-search-hits {
          margin-bottom: 0.75rem;
        }
        .jb-search-hits button {
          text-align: right;
          max-width: 100%;
        }
        .jb-layout {
          display: grid;
          grid-template-columns: minmax(220px, 280px) 1fr;
          gap: 0.85rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .jb-layout {
            grid-template-columns: 1fr;
          }
        }
        .jb-toc,
        .jb-main {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 1rem;
          padding: 1rem;
          box-shadow: 0 10px 30px rgba(75, 10, 17, 0.06);
        }
        .jb-toc {
          position: sticky;
          top: 0.5rem;
          max-height: calc(100vh - 1rem);
          overflow: auto;
        }
        .jb-toc h2 {
          margin-top: 0;
          color: var(--b);
        }
        .jb-toc ol {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .jb-toc button {
          width: 100%;
          text-align: right;
          margin-bottom: 0.35rem;
        }
        .jb-toc button.active {
          background: var(--b);
          color: #fff;
          border-color: var(--b);
        }
        .jb-unit-filters {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }
        .jb-toc-unit {
          margin-bottom: 0.75rem;
        }
        .jb-toc-unit > strong {
          display: block;
          color: var(--b);
          margin-bottom: 0.35rem;
        }
        .jb-diff {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 800;
          background: rgba(158, 23, 34, 0.1);
          padding: 0.15rem 0.45rem;
          border-radius: 0.35rem;
          margin-bottom: 0.35rem;
        }
        .jb-q-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
          margin-top: 0.45rem;
        }
        .jb-attempts {
          color: var(--muted);
          font-size: 0.85rem;
          font-weight: 700;
        }
        .jb-credit-safe {
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.5;
        }
        .jb-main {
          max-height: calc(100vh - 1rem);
          overflow: auto;
        }
        .jb-lesson-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
        }
        .jb-outcomes,
        .jb-prereq,
        .jb-vocab,
        .jb-notes,
        .jb-block {
          margin: 1rem 0;
          padding: 0.85rem;
          border: 1px solid var(--line);
          border-radius: 0.85rem;
          background: color-mix(in srgb, var(--paper) 92%, #f2d77c);
        }
        .jb-block.is-hl {
          outline: 3px solid var(--g);
          background: rgba(242, 215, 124, 0.35);
        }
        .jb-block-title {
          margin: 0 0 0.4rem;
          color: var(--b);
        }
        .jb-diagram-board {
          font-family: ui-monospace, monospace;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 0.9rem;
          border-radius: 0.7rem;
          background: #fff;
          border: 2px dashed rgba(158, 23, 34, 0.35);
          text-align: center;
          overflow-x: auto;
        }
        .jb-shell.dark .jb-diagram-board {
          background: #1a0d10;
        }
        .jb-katex-fallback {
          display: block;
          margin-top: 0.5rem;
          padding: 0.55rem 0.7rem;
          background: rgba(158, 23, 34, 0.08);
          border-radius: 0.5rem;
          direction: ltr;
          text-align: left;
        }
        .jb-options {
          margin-top: 0.55rem;
        }
        .jb-opt {
          min-width: 3.2rem;
          font-size: 1.15rem;
        }
        .jb-opt.ok,
        .jb-feedback.ok {
          background: #e7f7ea;
          color: #146c2e;
          border-color: #146c2e;
        }
        .jb-opt.bad,
        .jb-feedback.bad {
          background: #fdecee;
          color: #9e1722;
          border-color: #9e1722;
        }
        .jb-canvas {
          width: 100%;
          height: 180px;
          border: 2px solid var(--line);
          border-radius: 0.7rem;
          touch-action: none;
          background: #fffdf8;
          cursor: crosshair;
        }
        .jb-hint {
          margin: 0.35rem 0 0;
          color: var(--muted);
          font-size: 0.85rem;
        }
        .jb-prepared {
          color: var(--muted);
          font-weight: 700;
          font-size: 0.9rem;
        }
        .jb-pager {
          justify-content: space-between;
          margin-top: 1.25rem;
        }
        .jb-pager button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

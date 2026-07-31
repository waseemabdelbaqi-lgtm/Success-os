"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import "katex/dist/katex.min.css";
import katex from "katex";

type Mode = "page" | "lesson" | "activity" | "review";

type Bundle = {
  book: Record<string, unknown>;
  version: Record<string, unknown>;
  grade: Record<string, unknown>;
  subject: Record<string, unknown>;
  semester: Record<string, unknown>;
  units: Array<{
    id: string;
    title_ar: string;
    lessons: Array<{
      id: string;
      title_ar: string;
      blocks: Array<Record<string, unknown>>;
      outcomes: Array<Record<string, unknown>>;
      pages: Array<Record<string, unknown>>;
      activities: Array<Record<string, unknown>>;
    }>;
  }>;
  sources: Array<Record<string, unknown>>;
  rights: Array<Record<string, unknown>>;
  completenessClaim: string;
};

const STUDENT = "gate2-tester";

function renderLatex(latex: string): string {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch {
    return latex;
  }
}

export function BookEngineReader({ bookId }: { bookId: string }) {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [mode, setMode] = useState<Mode>("lesson");
  const [lessonId, setLessonId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<Array<Record<string, unknown>>>([]);
  const [fontScale, setFontScale] = useState(1.1);
  const [theme, setTheme] = useState<"light" | "dark" | "contrast">("light");
  const [dyslexia, setDyslexia] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [width, setWidth] = useState<"narrow" | "normal" | "wide">("normal");
  const [note, setNote] = useState("");
  const [annotations, setAnnotations] = useState<Record<string, unknown> | null>(null);
  const [hideAnno, setHideAnno] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [hintLevel, setHintLevel] = useState<Record<string, number>>({});
  const [mastery, setMastery] = useState<number | null>(null);
  const [penColor, setPenColor] = useState("#9e1722");
  const [penWidth, setPenWidth] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Array<{ color: string; width: number; points: Array<{ x: number; y: number }> }>>([]);
  const undoStack = useRef<typeof strokesRef.current>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/interactive-book-engine?view=book&id=${encodeURIComponent(bookId)}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) {
      setBundle(json.bundle);
      const first = json.bundle.units?.[0]?.lessons?.[0]?.id;
      if (first) setLessonId(first);
    }
  }, [bookId]);

  const loadAnno = useCallback(async () => {
    const res = await fetch(
      `/api/interactive-book-engine?view=annotations&bookId=${encodeURIComponent(bookId)}&studentKey=${STUDENT}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    if (json.ok) setAnnotations(json.annotations);
  }, [bookId]);

  useEffect(() => {
    load().then(loadAnno);
  }, [load, loadAnno]);

  const lesson = useMemo(() => {
    if (!bundle) return null;
    for (const u of bundle.units) {
      const l = u.lessons.find((x) => x.id === lessonId);
      if (l) return { unit: u, lesson: l };
    }
    return null;
  }, [bundle, lessonId]);

  const ageProfile = String(bundle?.grade?.age_profile || "grades_1_3");

  async function saveProgress(nextMode?: Mode, nextLesson?: string) {
    await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "progress",
        studentKey: STUDENT,
        bookId,
        lastLessonId: nextLesson || lessonId,
        mode: nextMode || mode,
        lastBlockId: lesson?.lesson.blocks?.[0]?.id,
      }),
    });
  }

  async function switchMode(m: Mode) {
    setMode(m);
    await saveProgress(m);
  }

  async function doSearch() {
    const res = await fetch(
      `/api/interactive-book-engine?view=search&bookId=${encodeURIComponent(bookId)}&q=${encodeURIComponent(query)}`,
    );
    const json = await res.json();
    if (json.ok) setSearchHits(json.results);
  }

  async function bookmark() {
    await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bookmark",
        studentKey: STUDENT,
        bookId,
        lessonId,
        label: lesson?.lesson.title_ar,
      }),
    });
    setMsg("تم حفظ الإشارة المرجعية");
    loadAnno();
  }

  async function highlight(blockId: string, color: string) {
    await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "highlight",
        studentKey: STUDENT,
        bookId,
        blockId,
        color,
      }),
    });
    loadAnno();
  }

  async function saveNote() {
    await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "note",
        studentKey: STUDENT,
        bookId,
        lessonId,
        body: note,
      }),
    });
    setMsg("تم حفظ الملاحظة");
    loadAnno();
  }

  async function persistStrokes() {
    await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "annotation",
        studentKey: STUDENT,
        bookId,
        lessonId,
        strokeJson: JSON.stringify(strokesRef.current),
        tool: "pen",
      }),
    });
    setMsg("تم حفظ الرسم/الكتابة اليدوية");
    loadAnno();
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (hideAnno) return;
    for (const s of strokesRef.current) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }

  useEffect(() => {
    redraw();
  }, [hideAnno]);

  async function grade(questionId: string, response: unknown) {
    const res = await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "grade",
        studentKey: STUDENT,
        bookId,
        questionId,
        response,
        hintLevel: hintLevel[questionId] || 0,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setFeedback((f) => ({ ...f, [questionId]: json.feedbackAr + (json.explanationAr ? ` — ${json.explanationAr}` : "") }));
      setHintLevel((h) => ({ ...h, [questionId]: json.nextHintLevel }));
      if (typeof json.masteryScore === "number") setMastery(json.masteryScore);
    }
  }

  if (!bundle || !lesson) {
    return (
      <main dir="rtl" style={{ padding: 24, fontFamily: "Tahoma, sans-serif" }}>
        جاري تحميل محرك الكتاب…
      </main>
    );
  }

  const pages = lesson.lesson.pages || [];
  const currentPage = pages[pageIndex];
  const pageBlocks = lesson.lesson.blocks.filter(
    (b) => !currentPage || b.page_id === currentPage.id || mode !== "page",
  );
  const highlightIds = new Set(
    ((annotations?.highlights as Array<{ block_id: string }>) || []).map((h) => h.block_id),
  );

  const shellStyle: CSSProperties = {
    minHeight: "100vh",
    background:
      theme === "dark"
        ? "#1a1012"
        : theme === "contrast"
          ? "#000"
          : "linear-gradient(165deg,#fff8f1,#f3e6db)",
    color: theme === "light" ? "#2a0c10" : "#fff8f1",
    fontFamily: dyslexia
      ? '"Comic Sans MS", "OpenDyslexic", Tahoma, sans-serif'
      : '"IBM Plex Sans Arabic", Tahoma, sans-serif',
    fontSize: `${fontScale}rem`,
    padding: ageProfile === "early_childhood" ? "0.5rem" : "1rem",
  };

  const contentWidth =
    width === "narrow" ? 640 : width === "wide" ? 1100 : ageProfile.startsWith("grades_11") ? 960 : 820;

  return (
    <div style={shellStyle} data-reduced-motion={reducedMotion ? "1" : "0"}>
      <div style={{ maxWidth: contentWidth, margin: "0 auto" }} dir="rtl">
        <header style={header}>
          <div>
            <p style={{ margin: 0, fontWeight: 900, color: "#9e1722" }}>
              Success OS Book Engine · Gate 2 · Engine test (NOT complete book)
            </p>
            <h1 style={{ margin: "0.2rem 0", color: theme === "light" ? "#4b0a11" : "#f2d77c" }}>
              {String(bundle.book.title_ar)}
            </h1>
            <p style={{ margin: 0, opacity: 0.85 }}>
              {String(bundle.grade.title_ar)} · {String(bundle.semester.title_ar)} ·{" "}
              {String(bundle.subject.title_ar)} · اكتمال معلن:{" "}
              <strong>{bundle.completenessClaim}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/interactive-books/cms">CMS</Link>
            <Link href="/jordan-books">مكتبة الأردن</Link>
          </div>
        </header>

        <div style={toolbar} role="toolbar" aria-label="أدوات القراءة">
          {(["page", "lesson", "activity", "review"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              style={{ ...chip, ...(mode === m ? chipOn : {}) }}
              onClick={() => switchMode(m)}
            >
              {m === "page" ? "وضع الصفحات" : m === "lesson" ? "وضع الدرس" : m === "activity" ? "وضع الأنشطة" : "وضع المراجعة"}
            </button>
          ))}
          <button type="button" style={chip} onClick={bookmark}>
            إشارة
          </button>
          <button type="button" style={chip} onClick={() => setHideAnno((v) => !v)}>
            {hideAnno ? "إظهار التعليقات" : "إخفاء التعليقات"}
          </button>
          <label>
            خط
            <input
              aria-label="حجم الخط"
              type="range"
              min={0.9}
              max={1.5}
              step={0.05}
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
            />
          </label>
          <select aria-label="المظهر" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
            <option value="light">فاتح</option>
            <option value="dark">داكن</option>
            <option value="contrast">تباين عالٍ</option>
          </select>
          <select aria-label="عرض القراءة" value={width} onChange={(e) => setWidth(e.target.value as typeof width)}>
            <option value="narrow">ضيق</option>
            <option value="normal">عادي</option>
            <option value="wide">واسع</option>
          </select>
          <label>
            <input type="checkbox" checked={dyslexia} onChange={(e) => setDyslexia(e.target.checked)} /> خط ميسّر
          </label>
          <label>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />{" "}
            تقليل الحركة
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}>
          <nav style={toc} aria-label="جدول المحتويات">
            <h2 style={{ fontSize: 16 }}>المحتويات</h2>
            {bundle.units.map((u) => (
              <div key={u.id}>
                <strong>{u.title_ar}</strong>
                <ul>
                  {u.lessons.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        style={linkBtn}
                        onClick={() => {
                          setLessonId(l.id);
                          saveProgress(mode, l.id);
                        }}
                      >
                        {l.title_ar}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <label htmlFor="be-search">بحث داخل الكتاب</label>
              <input
                id="be-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={input}
                placeholder="كلمة…"
              />
              <button type="button" style={chip} onClick={doSearch}>
                ابحث
              </button>
              <ul>
                {searchHits.map((h) => (
                  <li key={String(h.blockId)}>
                    <button
                      type="button"
                      style={linkBtn}
                      onClick={() => setLessonId(String(h.lessonId))}
                    >
                      {String(h.lessonTitle)}: {String(h.matchingText).slice(0, 60)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <main id="be-main" tabIndex={-1} style={panel}>
            {mode === "page" && (
              <div style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  style={chip}
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  السابق
                </button>
                <label>
                  صفحة
                  <input
                    type="number"
                    min={1}
                    max={pages.length || 1}
                    value={pageIndex + 1}
                    onChange={(e) => setPageIndex(Math.max(0, Number(e.target.value) - 1))}
                    style={{ width: 64, marginInlineStart: 6 }}
                  />
                  / {pages.length || 1}
                </label>
                <button
                  type="button"
                  style={chip}
                  disabled={pageIndex >= pages.length - 1}
                  onClick={() => setPageIndex((p) => Math.min(pages.length - 1, p + 1))}
                >
                  التالي
                </button>
                <span style={{ opacity: 0.8 }}>
                  مرجع رسمي: {String(currentPage?.official_page_label || "—")}
                </span>
              </div>
            )}

            {(mode === "lesson" || mode === "page") && (
              <article>
                <h2>{lesson.lesson.title_ar}</h2>
                <section aria-label="نواتج التعلم">
                  <h3>نواتج التعلم</h3>
                  <ol>
                    {lesson.lesson.outcomes.map((o) => (
                      <li key={String(o.id)}>{String(o.statement_ar)}</li>
                    ))}
                  </ol>
                </section>
                {pageBlocks.map((b) => {
                  const content = b.content as Record<string, unknown>;
                  const dir = String(b.direction || "rtl") as "rtl" | "ltr" | "isolate";
                  return (
                    <section
                      key={String(b.id)}
                      id={`block-${b.id}`}
                      dir={dir === "isolate" ? "ltr" : dir}
                      style={{
                        margin: "0.85rem 0",
                        padding: "0.65rem",
                        borderRadius: 12,
                        background: highlightIds.has(String(b.id))
                          ? "rgba(242,215,124,.45)"
                          : "transparent",
                        border: "1px solid rgba(158,23,34,.12)",
                      }}
                      aria-label={String(b.type)}
                    >
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <button type="button" style={mini} onClick={() => highlight(String(b.id), "yellow")}>
                          تمييز
                        </button>
                        <button type="button" style={mini} onClick={() => highlight(String(b.id), "green")}>
                          أخضر
                        </button>
                      </div>
                      {b.type === "heading" && <h3>{String(content.textAr || "")}</h3>}
                      {b.type === "paragraph" && <p>{String(content.bodyAr || "")}</p>}
                      {b.type === "definition" && (
                        <p>
                          <strong>تعريف:</strong> {String(content.bodyAr || "")}
                        </p>
                      )}
                      {b.type === "vocabulary_card" && (
                        <div>
                          <strong>{String(content.term)}</strong>: {String(content.definition)}
                          <div style={{ fontSize: "0.9em", opacity: 0.85 }}>
                            مثال: {String(content.example)} · ليس: {String(content.nonExample)}
                          </div>
                        </div>
                      )}
                      {b.type === "worked_example" && (
                        <div>
                          <p>
                            <strong>مثال محلول:</strong> {String(content.problemAr)}
                          </p>
                          <p>{String(content.stepsAr)}</p>
                          <p>
                            <strong>الجواب:</strong> {String(content.answerAr)}
                          </p>
                        </div>
                      )}
                      {b.type === "svg_diagram" && (
                        <pre aria-label={String(b.accessibility_text || content.descriptionAr)} style={visual}>
                          {String(content.visualAr)}
                        </pre>
                      )}
                      {b.type === "number_line" && (
                        <div aria-label={String(content.labelAr)} style={{ display: "flex", gap: 8 }}>
                          {Array.from(
                            { length: Number(content.max) - Number(content.min) + 1 },
                            (_, i) => Number(content.min) + i,
                          ).map((n) => (
                            <span
                              key={n}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                border: "2px solid #9e1722",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: n === Number(content.highlight) ? "#f2d77c" : "#fff",
                                color: "#2a0c10",
                                fontWeight: 900,
                              }}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                      {b.type === "formula" && (
                        <div
                          dir="ltr"
                          style={{ overflowX: "auto" }}
                          dangerouslySetInnerHTML={{ __html: renderLatex(String(content.latex || "")) }}
                        />
                      )}
                      {b.type === "step_solution" && (
                        <ol>
                          {(content.steps as string[]).map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ol>
                      )}
                      {b.type === "important_note" && (
                        <p role="note" style={{ fontWeight: 800 }}>
                          {String(content.bodyAr)}
                        </p>
                      )}
                      {b.type === "writing_area" && (
                        <textarea
                          aria-label={String(content.promptAr)}
                          placeholder={String(content.promptAr)}
                          style={{ width: "100%", minHeight: 70 }}
                        />
                      )}
                      {b.type === "drawing_area" && <p>{String(content.promptAr)}</p>}
                      {b.type === "reflection" && <p>{String(content.promptAr)}</p>}
                      {b.type === "citation" && (
                        <p style={{ fontSize: "0.9em" }}>
                          مصدر: {String(content.textAr)}{" "}
                          {content.url ? (
                            <a href={String(content.url)} target="_blank" rel="noreferrer">
                              رابط
                            </a>
                          ) : null}
                        </p>
                      )}
                    </section>
                  );
                })}
              </article>
            )}

            {(mode === "activity" || mode === "lesson") && (
              <section aria-label="أنشطة تفاعلية" style={{ marginTop: 16 }}>
                <h3>أنشطة</h3>
                {lesson.lesson.activities.map((a) => (
                  <div key={String(a.id)} style={actCard}>
                    <p>
                      <strong>{String(a.activity_type)}</strong> — {String(a.instructions_ar)}
                    </p>
                    {(a.questions as Array<Record<string, unknown>>).map((q) => (
                      <div key={String(q.id)} style={{ marginTop: 8 }}>
                        <p>{String(q.prompt_ar)}</p>
                        {q.kind === "single_choice" &&
                          ((q.options as Array<Record<string, unknown>>) || []).map((opt, i) => (
                            <button
                              key={String(opt.id)}
                              type="button"
                              style={chip}
                              onClick={() => grade(String(q.id), { index: i })}
                            >
                              {String(opt.label_ar)}
                            </button>
                          ))}
                        {q.kind === "math_input" && (
                          <MathInput
                            onSubmit={(text) => grade(String(q.id), { text })}
                          />
                        )}
                        {q.kind === "drag_drop" && (
                          <MatchInput
                            pairs={
                              ((q.config as { pairs?: Array<{ left: string; right: string }> })?.pairs ||
                                []) as Array<{ left: string; right: string }>
                            }
                            onSubmit={(pairs) => grade(String(q.id), { pairs })}
                          />
                        )}
                        {feedback[String(q.id)] && (
                          <p role="status" aria-live="polite" style={{ fontWeight: 800 }}>
                            {feedback[String(q.id)]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {mastery !== null && (
                  <p>
                    إتقان الدرس الحالي: {Math.round(mastery * 100)}% (من أداء الأنشطة وليس من مشاهدة الصفحات)
                  </p>
                )}
              </section>
            )}

            {mode === "review" && (
              <section>
                <h3>المراجعة</h3>
                <p>الإشارات: {((annotations?.bookmarks as unknown[]) || []).length}</p>
                <p>التمييز: {((annotations?.highlights as unknown[]) || []).length}</p>
                <p>الملاحظات: {((annotations?.notes as unknown[]) || []).length}</p>
                <p>الرسومات: {((annotations?.drawings as unknown[]) || []).length}</p>
                <p>الإتقان: {mastery !== null ? `${Math.round(mastery * 100)}%` : "—"}</p>
                <ul>
                  {((annotations?.notes as Array<{ body: string }>) || []).map((n, i) => (
                    <li key={i}>{n.body}</li>
                  ))}
                </ul>
              </section>
            )}

            <section style={{ marginTop: 16 }} aria-label="ملاحظات وكتابة يدوية">
              <h3>ملاحظات شخصية</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: "100%", minHeight: 70 }}
                placeholder="اكتب ملاحظتك (لا تُعدّل المحتوى المنشور)"
              />
              <button type="button" style={chip} onClick={saveNote}>
                حفظ الملاحظة
              </button>

              <h3 style={{ marginTop: 12 }}>كتابة/رسم يدوي</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="color"
                  aria-label="لون القلم"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                />
                <input
                  type="range"
                  aria-label="سماكة القلم"
                  min={1}
                  max={12}
                  value={penWidth}
                  onChange={(e) => setPenWidth(Number(e.target.value))}
                />
                <button
                  type="button"
                  style={chip}
                  onClick={() => {
                    undoStack.current.push([...strokesRef.current]);
                    strokesRef.current = [];
                    redraw();
                  }}
                >
                  مسح الصفحة
                </button>
                <button
                  type="button"
                  style={chip}
                  onClick={() => {
                    const last = undoStack.current.pop();
                    if (last) {
                      strokesRef.current = last;
                      redraw();
                    }
                  }}
                >
                  تراجع
                </button>
                <button type="button" style={chip} onClick={persistStrokes}>
                  حفظ الرسم
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                style={{
                  width: "100%",
                  maxWidth: 700,
                  height: 220,
                  border: "1px solid rgba(158,23,34,.3)",
                  borderRadius: 12,
                  background: "#fff",
                  touchAction: "none",
                }}
                onPointerDown={(e) => {
                  setDrawing(true);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                  const y = ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                  undoStack.current.push(strokesRef.current.map((s) => ({ ...s, points: [...s.points] })));
                  strokesRef.current.push({ color: penColor, width: penWidth, points: [{ x, y }] });
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!drawing) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                  const y = ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                  const stroke = strokesRef.current[strokesRef.current.length - 1];
                  stroke?.points.push({ x, y });
                  redraw();
                }}
                onPointerUp={() => setDrawing(false)}
              />
            </section>

            {msg && (
              <p role="status" aria-live="polite">
                {msg}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function MathInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        dir="ltr"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="مثال: 3 أو 1+1+1"
        style={input}
        aria-label="إدخال رياضي"
      />
      <button type="button" style={chip} onClick={() => onSubmit(text)}>
        إرسال
      </button>
    </div>
  );
}

function MatchInput({
  pairs,
  onSubmit,
}: {
  pairs: Array<{ left: string; right: string }>;
  onSubmit: (pairs: Record<string, string>) => void;
}) {
  const rights = pairs.map((p) => p.right);
  const [map, setMap] = useState<Record<string, string>>({});
  return (
    <div>
      {pairs.map((p) => (
        <div key={p.left} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <span>{p.left}</span>
          <select
            aria-label={`طابق ${p.left}`}
            value={map[p.left] || ""}
            onChange={(e) => setMap({ ...map, [p.left]: e.target.value })}
          >
            <option value="">—</option>
            {rights.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button type="button" style={chip} onClick={() => onSubmit(map)}>
        تحقق
      </button>
    </div>
  );
}

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 10,
};
const toolbar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 12,
  alignItems: "center",
};
const chip: CSSProperties = {
  border: "1px solid rgba(158,23,34,.3)",
  background: "#fff",
  color: "#9e1722",
  borderRadius: 10,
  padding: "0.4rem 0.7rem",
  fontWeight: 800,
  cursor: "pointer",
};
const chipOn: CSSProperties = { background: "#9e1722", color: "#fff" };
const toc: CSSProperties = {
  background: "rgba(255,253,248,.92)",
  color: "#2a0c10",
  borderRadius: 14,
  padding: 12,
  border: "1px solid rgba(158,23,34,.15)",
  alignSelf: "start",
};
const panel: CSSProperties = {
  background: "rgba(255,253,248,.95)",
  color: "#2a0c10",
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(158,23,34,.15)",
};
const input: CSSProperties = {
  width: "100%",
  margin: "6px 0",
  padding: "0.45rem 0.6rem",
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
};
const linkBtn: CSSProperties = {
  background: "none",
  border: 0,
  color: "#9e1722",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "right",
  padding: 0,
};
const visual: CSSProperties = {
  background: "rgba(158,23,34,.06)",
  padding: 12,
  borderRadius: 12,
  textAlign: "center",
  fontSize: "1.3em",
};
const actCard: CSSProperties = {
  border: "1px solid rgba(158,23,34,.18)",
  borderRadius: 12,
  padding: 10,
  marginBottom: 10,
};
const mini: CSSProperties = { ...chip, padding: "0.2rem 0.45rem", fontSize: 12 };

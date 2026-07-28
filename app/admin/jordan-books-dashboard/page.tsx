"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { CoverageReport } from "@/src/lib/jordan-books/registry";
import type { BookRecord, EditorialStatus } from "@/src/lib/jordan-books/schema/types";

const STATUSES: EditorialStatus[] = [
  "draft",
  "academic_review",
  "language_review",
  "technical_review",
  "approved",
  "published",
  "archived",
];

export default function JordanBooksDashboardPage(): ReactNode {
  const [coverage, setCoverage] = useState<CoverageReport | null>(null);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    setBusy(true);
    Promise.all([
      fetch("/api/jordan-books?view=coverage", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/jordan-books?view=books", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cov, booksRes]) => {
        if (cov.ok) setCoverage(cov.coverage);
        if (booksRes.ok) setBooks(booksRes.books);
      })
      .catch(() => setMsg("تعذّر تحميل لوحة التغطية"))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function setStatus(bookId: string, lessonId: string | undefined, editorialStatus: EditorialStatus) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/jordan-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_editorial_status",
          bookId,
          lessonId,
          editorialStatus,
          updatedBy: "curriculum-admin",
          note: "Manual human editorial action — no auto AI publish",
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "failed");
      setCoverage(json.coverage);
      setMsg(`تم تحديث الحالة إلى ${editorialStatus}`);
      reload();
    } catch {
      setMsg("فشل تحديث الحالة التحريرية");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" lang="ar" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Admin · Jordan Curriculum Books</p>
        <h1 style={h1}>لوحة تغطية المنهاج الأردني — كتب تفاعلية</h1>
        <p style={banner}>
          تطوير فيديو AI / HeyGen متوقف. الأرقام ديناميكية من قاعدة الجرد والمحتوى — لا أرقام مخترعة.
        </p>
        <div style={actions}>
          <button type="button" style={btn} onClick={reload} disabled={busy}>
            تحديث
          </button>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1/math/student-book/unit-1" style={link}>
            فتح Pilot الوحدة 1
          </Link>
          <Link href="/jordan-books" style={link}>
            مكتبة الكتب
          </Link>
        </div>
        {msg ? <p style={msgStyle}>{msg}</p> : null}

        {!coverage ? (
          <p>جارٍ التحميل…</p>
        ) : (
          <>
            <section style={grid}>
              <Stat label="الصفوف المتوقعة" value={coverage.expectedGrades} />
              <Stat label="الصفوف الموثّقة (قائمة مباحث)" value={coverage.verifiedGrades} />
              <Stat label="المباحث المتوقعة (سجل)" value={coverage.expectedSubjects} />
              <Stat label="المباحث الموثّقة" value={coverage.verifiedSubjects} />
              <Stat label="كتب رسمية متوقعة (جرد حالي)" value={coverage.expectedOfficialBooks} />
              <Stat label="كتب مكتشفة في الجرد" value={coverage.discoveredOfficialBooks} />
              <Stat label="قابلة للاستخدام قانونياً (رابط/أصلي)" value={coverage.legallyUsableBooks} />
              <Stat label="رابط رسمي فقط" value={coverage.linkedOnlyBooks} />
              <Stat label="كتب رقمية مهيكلة" value={coverage.structuredDigitalBooks} />
              <Stat label="وحدات مكتملة" value={coverage.completedUnits} />
              <Stat label="دروس مكتملة البنية" value={coverage.completedLessons} />
              <Stat label="دروس مراجعة" value={coverage.reviewedLessons} />
              <Stat label="دروس منشورة" value={coverage.publishedLessons} />
            </section>

            <section style={card}>
              <h2 style={h2}>نسبة الإكمال حسب الصف (ديناميكي)</h2>
              <ul>
                {coverage.completionByGrade.map((g) => (
                  <li key={g.grade}>
                    {g.gradeAr}: {g.percent}% · دروس مهيكلة: {g.structuredLessons}
                  </li>
                ))}
              </ul>
            </section>

            <section style={card}>
              <h2 style={h2}>نسبة الإكمال حسب المبحث (جرد بدأ)</h2>
              <ul>
                {coverage.completionBySubject.map((s) => (
                  <li key={s.subjectAr}>
                    {s.subjectAr}: {s.percent}% · دروس: {s.structuredLessons}
                  </li>
                ))}
              </ul>
            </section>

            <section style={card}>
              <h2 style={h2}>نواقص وتحذيرات</h2>
              <p>
                <strong>فصول ناقصة:</strong>{" "}
                {coverage.missingSemesters.length ? coverage.missingSemesters.join(" · ") : "لا يوجد في النطاق الحالي"}
              </p>
              <p>
                <strong>كتب ناقصة (طالب بلا هيكلة):</strong> {coverage.missingBooks.length}
              </p>
              <ul>
                {coverage.missingBooks.map((b) => (
                  <li key={b.id}>
                    {b.officialTitleAr} · {b.rightsStatus}
                  </li>
                ))}
              </ul>
              <p>
                <strong>RIGHTS REVIEW REQUIRED:</strong> {coverage.rightsReviewRequired.length}
              </p>
              <p>
                <strong>NEEDS VERIFICATION:</strong> {coverage.needsVerification.length}
              </p>
              <p>
                <strong>أخطاء/تكرار:</strong>{" "}
                {coverage.errorsAndDuplicates.length
                  ? coverage.errorsAndDuplicates.join(" · ")
                  : "لا يوجد"}
              </p>
              <p>
                <strong>آخر تحقق:</strong> {coverage.lastVerificationDate || "—"}
              </p>
            </section>

            <section style={card}>
              <h2 style={h2}>سير العمل التحريري (لا نشر تلقائي للذكاء الاصطناعي)</h2>
              {books.map((book) => (
                <div key={book.id} style={{ marginBottom: "1.2rem" }}>
                  <h3 style={{ color: "#4b0a11" }}>{book.officialTitleAr}</h3>
                  <p>
                    حالة الكتاب: <strong>{book.editorialStatus}</strong>
                  </p>
                  <div style={actions}>
                    {STATUSES.map((st) => (
                      <button
                        key={`book-${st}`}
                        type="button"
                        style={btn}
                        disabled={busy}
                        onClick={() => setStatus(book.id, undefined, st)}
                      >
                        كتاب → {st}
                      </button>
                    ))}
                  </div>
                  {book.units.flatMap((u) =>
                    u.lessons.map((lesson) => (
                      <div key={lesson.id} style={lessonRow}>
                        <div>
                          <strong>
                            {u.titleAr} · {lesson.titleAr}
                          </strong>
                          <div style={{ color: "#6b3a40" }}>الحالة: {lesson.editorialStatus}</div>
                        </div>
                        <select
                          defaultValue={lesson.editorialStatus}
                          disabled={busy}
                          onChange={(e) =>
                            setStatus(book.id, lesson.id, e.target.value as EditorialStatus)
                          }
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    )),
                  )}
                </div>
              ))}
            </section>

            <section style={card}>
              <h2 style={h2}>مصادر رسمية</h2>
              <ul>
                {coverage.officialSources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={stat}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  padding: "1.25rem",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const wrap: CSSProperties = { maxWidth: 1100, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11", fontSize: "clamp(1.4rem,3vw,2.1rem)" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const banner: CSSProperties = {
  background: "rgba(242,215,124,.4)",
  border: "1px solid rgba(158,23,34,.2)",
  borderRadius: 12,
  padding: "0.75rem 0.9rem",
  fontWeight: 800,
};
const actions: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, margin: "0.75rem 0" };
const btn: CSSProperties = {
  border: "1px solid rgba(158,23,34,.25)",
  background: "#fffdf8",
  borderRadius: 8,
  padding: "0.45rem 0.7rem",
  fontWeight: 800,
  cursor: "pointer",
};
const link: CSSProperties = { color: "#9e1722", fontWeight: 900, alignSelf: "center" };
const msgStyle: CSSProperties = { fontWeight: 800, color: "#146c2e" };
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
  gap: 10,
  margin: "1rem 0",
};
const stat: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 12,
  padding: "0.8rem",
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  marginBottom: "1rem",
};
const lessonRow: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  justifyContent: "space-between",
  alignItems: "center",
  borderTop: "1px solid rgba(158,23,34,.12)",
  padding: "0.65rem 0",
};

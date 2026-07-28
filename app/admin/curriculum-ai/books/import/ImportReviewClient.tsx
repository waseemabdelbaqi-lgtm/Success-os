"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

type ImportPayload = {
  bookId: string;
  acquisition: Record<string, unknown> | null;
  extraction: {
    book: Record<string, unknown>;
    parts: Array<{
      title: string;
      startPage: number;
      endPage: number;
      units: Array<{
        title: string;
        startPage: number;
        endPage: number;
        lessons: Array<{
          title: string;
          startPage: number;
          endPage: number;
          sections: unknown[];
        }>;
      }>;
    }>;
    specialSections: Array<{ type: string; title: string; startPage: number; endPage: number }>;
    extractionWarnings: string[];
    pagesNeedingReview: number[];
    pageCoverage?: Record<string, unknown>;
    structureComparison?: Record<string, unknown>;
    processing?: Record<string, unknown>;
  } | null;
  checkpoint: { lastCompletedPage: number } | null;
  review: Record<string, unknown> | null;
  pdfAvailable: boolean;
  pdfRelativePaths: string[];
};

const btn: CSSProperties = {
  padding: "0.45rem 0.75rem",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};

export function ImportReviewClient() {
  const [data, setData] = useState<ImportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageRecord, setPageRecord] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [metaDraft, setMetaDraft] = useState({ officialTitle: "", edition: "", academicYear: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/curriculum-ai/books/import", { cache: "no-store" });
    const json = (await res.json()) as ImportPayload;
    setData(json);
    const book = json.extraction?.book || {};
    setMetaDraft({
      officialTitle: String(book.officialTitle || ""),
      edition: String(book.edition || ""),
      academicYear: String(book.academicYear || ""),
    });
  }, []);

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/curriculum-ai/books/import?page=${page}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!cancelled) setPageRecord(json.page);
    })().catch(() => {
      if (!cancelled) setPageRecord(null);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = useMemo(() => {
    const coverage = data?.extraction?.pageCoverage as { totalPdfPages?: number } | undefined;
    return Number(coverage?.totalPdfPages || 0);
  }, [data]);

  async function postAction(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/curriculum-ai/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.message || json.error || `HTTP_${res.status}`);
      }
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <main dir="rtl" lang="ar" style={{ padding: "1.5rem" }}>
        <p>جاري التحميل…</p>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      </main>
    );
  }

  const extraction = data.extraction;
  const acquisition = data.acquisition;
  const warnings = extraction?.extractionWarnings || [];
  const reviewPages = extraction?.pagesNeedingReview || [];

  return (
    <main
      dir="rtl"
      lang="ar"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)",
        gap: "1rem",
        padding: "1rem",
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc,#e2e8f0)",
        color: "#0f172a",
        fontFamily: "Tahoma, 'Noto Naskh Arabic', sans-serif",
      }}
    >
      <section
        style={{
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>الكتاب الأصلي</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
          {data.pdfAvailable
            ? `PDF متوفر: ${data.pdfRelativePaths[0]}`
            : "PDF الرسمي غير متوفر محلياً بعد — اكتساب الملف محظور أو غير مكتمل."}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={btn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </button>
          <span style={{ fontSize: 13 }}>
            صفحة {page}
            {totalPages ? ` / ${totalPages}` : ""}
          </span>
          <button
            type="button"
            style={btn}
            disabled={totalPages > 0 ? page >= totalPages : true}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </button>
          <input
            type="number"
            min={1}
            value={page}
            onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 72, padding: 4 }}
          />
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "0.75rem",
            background: "#f8fafc",
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: 1.7,
            minHeight: 360,
          }}
        >
          {pageRecord ? (
            <>
              <div style={{ marginBottom: 8, color: "#334155" }}>
                PDF index: {String(pageRecord.pdfPageIndex)} · official:{" "}
                {String(pageRecord.officialPageNumber)} · source:{" "}
                {String(pageRecord.textSource)} · OCR:{" "}
                {String(pageRecord.ocrConfidence ?? "—")}
              </div>
              <div>{String(pageRecord.text || "(لا يوجد نص مستخرج)")}</div>
            </>
          ) : (
            <div style={{ color: "#64748b" }}>
              لا توجد صفحة مستخرجة للعرض. أكمل تنزيل PDF الرسمي ثم شغّل الاستخراج.
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          overflow: "auto",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.15rem" }}>مراجعة الاستيراد</h2>
        {error && <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>}

        <div>
          <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>البيانات الوصفية</h3>
          <label style={{ display: "block", fontSize: 12 }}>العنوان الرسمي</label>
          <input
            value={metaDraft.officialTitle}
            onChange={(e) => setMetaDraft((s) => ({ ...s, officialTitle: e.target.value }))}
            style={{ width: "100%", marginBottom: 6, padding: 6 }}
          />
          <label style={{ display: "block", fontSize: 12 }}>الطبعة</label>
          <input
            value={metaDraft.edition}
            onChange={(e) => setMetaDraft((s) => ({ ...s, edition: e.target.value }))}
            style={{ width: "100%", marginBottom: 6, padding: 6 }}
          />
          <label style={{ display: "block", fontSize: 12 }}>العام الدراسي</label>
          <input
            value={metaDraft.academicYear}
            onChange={(e) => setMetaDraft((s) => ({ ...s, academicYear: e.target.value }))}
            style={{ width: "100%", marginBottom: 6, padding: 6 }}
          />
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            <div>المصدر: {String(extraction?.book?.officialSourceUrl || acquisition?.officialSourceUrl || "")}</div>
            <div>الحقوق: {String(extraction?.book?.rightsStatus || acquisition?.rightsStatus || "")}</div>
            <div>التحقق: {String(extraction?.book?.verificationStatus || "")}</div>
            <div>SHA-256: {String(extraction?.book?.sha256 || "—")}</div>
            <div>
              الحجم / الصفحات: {String(extraction?.book?.fileSizeBytes || 0)} /{" "}
              {String(extraction?.book?.pageCount || 0)}
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>الفهرس المستخرج</h3>
          {(extraction?.parts || []).length === 0 && (
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>لا وحدات/دروس بعد — الاستخراج متوقف على اكتساب الملف.</p>
          )}
          {(extraction?.parts || []).map((part, pi) => (
            <div key={`${part.title}-${pi}`} style={{ marginBottom: 10 }}>
              <strong>{part.title}</strong> ({part.startPage}–{part.endPage})
              {(part.units || []).map((unit, ui) => (
                <div key={`${unit.title}-${ui}`} style={{ marginInlineStart: 12, marginTop: 6 }}>
                  <div>
                    وحدة: {unit.title} · {unit.startPage}–{unit.endPage}
                  </div>
                  {(unit.lessons || []).map((lesson, li) => (
                    <div key={`${lesson.title}-${li}`} style={{ marginInlineStart: 12, fontSize: 13 }}>
                      درس: {lesson.title} · {lesson.startPage}–{lesson.endPage}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem" }}>تحذيرات OCR / المراجعة</h3>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>
            {warnings.length === 0 && <li>لا تحذيرات مسجّلة</li>}
            {warnings.slice(0, 40).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p style={{ fontSize: 13 }}>
            صفحات تحتاج مراجعة: {reviewPages.length ? reviewPages.join(", ") : "—"}
          </p>
          <p style={{ fontSize: 13 }}>
            مقارنة الفهرس: {String(extraction?.structureComparison?.result || "—")}
          </p>
          <p style={{ fontSize: 13 }}>
            آخر نقطة توقف: {String(data.checkpoint?.lastCompletedPage ?? extraction?.processing?.lastCompletedPage ?? 0)}
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() =>
              postAction({
                action: "edit_metadata",
                patch: metaDraft,
              })
            }
          >
            تعديل البيانات الوصفية
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() => postAction({ action: "approve_metadata" })}
          >
            اعتماد البيانات الوصفية
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy}
            onClick={() => postAction({ action: "approve_structure" })}
          >
            اعتماد البنية
          </button>
          <button
            type="button"
            style={btn}
            disabled={busy || !data.pdfAvailable}
            onClick={() => postAction({ action: "reprocess_page", page })}
          >
            إعادة معالجة الصفحة المحددة
          </button>
          <button
            type="button"
            style={{ ...btn, background: "#7f1d1d", borderColor: "#991b1b" }}
            disabled={busy}
            onClick={() =>
              postAction({ action: "reject_book", reason: "rejected_from_admin_review" })
            }
          >
            رفض الكتاب
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          لا يوجد زر «إنشاء درس» في هذه المرحلة. توليد الشرح/الأمثلة/الأنشطة/الاختبارات مؤجّل إلى خطوة لاحقة.
        </p>
        {data.review && (
          <pre style={{ fontSize: 11, background: "#f1f5f9", padding: 8, borderRadius: 6, overflow: "auto" }}>
            {JSON.stringify(data.review, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}

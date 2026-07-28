"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type ImportState =
  | {
      imported: false;
      message: string;
      failReason?: string;
      officialUrl: string;
      catalogUrl?: string;
      officialTitle: string;
      needsManualUpload?: boolean;
    }
  | {
      imported: true;
      officialTitle: string;
      officialUrl: string;
      localFile: string;
      fileSize: number;
      pageCount: number;
      sha256: string;
      firstPageValid: boolean;
      lastPageValid: boolean;
      previews: string[];
      coverPreview: string | null;
    };

const btn: CSSProperties = {
  padding: "0.7rem 1.1rem",
  border: "1px solid #1e293b",
  background: "#0f172a",
  color: "#f8fafc",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
};

function formatBytes(n: number) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(2)} MB`;
  return `${n} B`;
}

export function ImportReviewClient() {
  const [data, setData] = useState<ImportState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/curriculum-ai/books/import", { cache: "no-store" });
    const json = (await res.json()) as ImportState;
    setData(json);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, [load]);

  async function redownload() {
    setBusy(true);
    setError(null);
    try {
      // Open official source for the user in a new tab.
      if (data && "officialUrl" in data && data.officialUrl) {
        window.open(data.officialUrl, "_blank", "noopener,noreferrer");
      }
      const res = await fetch("/api/admin/curriculum-ai/books/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redownload" }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.failReason || json.error || `HTTP_${res.status}`);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/curriculum-ai/books/import", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.failReason || json.message || json.error || `HTTP_${res.status}`);
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
      <main dir="rtl" lang="ar" style={{ padding: "2rem", fontFamily: "Tahoma, sans-serif" }}>
        <p>جاري التحميل…</p>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      </main>
    );
  }

  if (!data.imported) {
    return (
      <main
        dir="rtl"
        lang="ar"
        style={{
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "Tahoma, 'Noto Naskh Arabic', sans-serif",
          background: "linear-gradient(180deg,#f8fafc,#e2e8f0)",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: "1.5rem",
          }}
        >
          <h1 style={{ marginTop: 0 }}>لم يتم استيراد الكتاب بعد</h1>
          <p style={{ color: "#334155", lineHeight: 1.7 }}>
            الكتاب المطلوب: <strong>{data.officialTitle}</strong>
          </p>
          <p style={{ color: "#b91c1c", lineHeight: 1.7 }}>
            سبب الفشل: {data.failReason || "غير معروف"}
          </p>
          <p style={{ fontSize: 13, color: "#475569", wordBreak: "break-all" }}>
            الرابط الرسمي: {data.officialUrl}
          </p>
          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "1rem 0 1.25rem" }}>
            <button type="button" style={btn} disabled={busy} onClick={() => void redownload()}>
              إعادة التنزيل الرسمي
            </button>
            <button
              type="button"
              style={{ ...btn, background: "#14532d", borderColor: "#166534" }}
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              رفع الكتاب
            </button>
            <a
              href={data.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btn, textDecoration: "none", display: "inline-block" }}
            >
              فتح الرابط الرسمي
            </a>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void uploadFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `3px dashed ${dragOver ? "#0369a1" : "#64748b"}`,
              borderRadius: 14,
              minHeight: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "2rem",
              cursor: "pointer",
              background: dragOver ? "#e0f2fe" : "#f8fafc",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {busy
              ? "جاري التحقق من الملف…"
              : "اسحب ملف PDF الرسمي هنا أو اضغط للاختيار\n(يجب أن يكون أكبر من 20MB وكاملاً)"}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <p style={{ marginTop: "1rem", fontSize: 12, color: "#64748b" }}>
            لن يبدأ أي OCR أو ذكاء اصطناعي أو استخراج دروس قبل اجتياز فحوص الملف.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "Tahoma, 'Noto Naskh Arabic', sans-serif",
        background: "linear-gradient(180deg,#f8fafc,#e2e8f0)",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
          padding: "1.5rem",
        }}
      >
        <h1 style={{ marginTop: 0 }}>{data.officialTitle}</h1>
        <p style={{ margin: "0 0 0.4rem" }}>الحجم: {formatBytes(data.fileSize)}</p>
        <p style={{ margin: "0 0 0.4rem" }}>عدد الصفحات: {data.pageCount}</p>
        <p style={{ margin: "0 0 0.4rem", wordBreak: "break-all", fontSize: 13 }}>
          SHA-256: {data.sha256}
        </p>
        <p style={{ margin: "0 0 1rem", wordBreak: "break-all", fontSize: 13 }}>
          الملف المحلي: {data.localFile}
        </p>

        {data.coverPreview && (
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>الغلاف</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.coverPreview}
              alt="غلاف الكتاب"
              style={{
                maxWidth: "100%",
                width: 360,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
              }}
            />
          </div>
        )}

        <h2 style={{ fontSize: "1.05rem" }}>معاينة أول 3 صفحات</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {data.previews.map((src, i) => (
            <div key={src}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>صفحة {i + 1}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`معاينة الصفحة ${i + 1}`}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  background: "#fff",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

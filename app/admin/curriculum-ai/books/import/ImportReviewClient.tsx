"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

const OFFICIAL_URL =
  "https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Math/2025/G01/MA.01.ST.BOOK_WEB.pdf";

type StatusPayload = {
  officialTitle: string;
  officialUrl: string;
  maxFileSize: number;
  chunkSize: number;
  verified: boolean;
  localFile: string | null;
  previews: string[];
  coverPreview: string | null;
  extractionEnabled: boolean;
  status: {
    state: string;
    officialTitle: string;
    fileSize?: number;
    pageCount?: number;
    sha256?: string;
    failReason?: string;
    extractionEnabled: boolean;
    extractionStarted: boolean;
  };
};

function formatBytes(n: number) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} جيجابايت`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} ميجابايت`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} كيلوبايت`;
  return `${n} بايت`;
}

const shell: CSSProperties = {
  minHeight: "100vh",
  padding: "clamp(1.25rem, 3vw, 2.5rem)",
  fontFamily: "'Noto Kufi Arabic', Manrope, Tahoma, sans-serif",
  color: "#f4f8fb",
  background:
    "radial-gradient(circle at 18% 12%, rgba(34,211,182,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(117,165,255,.14), transparent 24%), linear-gradient(160deg, #051326 0%, #071a33 48%, #0a2747 100%)",
};

const card: CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  background: "rgba(8, 24, 44, 0.88)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 22,
  padding: "clamp(1.25rem, 2.5vw, 2rem)",
  boxShadow: "0 24px 60px rgba(0,0,0,.28)",
  backdropFilter: "blur(10px)",
};

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  minHeight: 64,
  padding: "1rem 1.25rem",
  border: "0",
  borderRadius: 16,
  cursor: "pointer",
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: "0.02em",
  color: "#06162b",
  background: "linear-gradient(135deg, #22d3b6 0%, #75a5ff 100%)",
};

const secondaryBtn: CSSProperties = {
  ...primaryBtn,
  minHeight: 52,
  fontSize: 16,
  color: "#e8f4ff",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
};

export function ImportReviewClient() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<string>("");
  const [extractArmedMsg, setExtractArmedMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/curriculum-ai/books/import", { cache: "no-store" });
    const json = (await res.json()) as StatusPayload;
    setData(json);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, [load]);

  async function uploadFileChunked(file: File) {
    setBusy(true);
    setError(null);
    setExtractArmedMsg(null);
    setProgress(0);
    setPhase("تهيئة الرفع…");

    try {
      if (file.size > (data?.maxFileSize || 300 * 1024 * 1024)) {
        throw new Error("حجم الملف أكبر من الحد المسموح (300 ميجابايت).");
      }
      if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
        throw new Error("يُقبل ملف PDF فقط.");
      }

      const resumeKey = `sos-curriculum-upload:${file.name}:${file.size}`;
      let sessionId = "";
      let chunkSize = data?.chunkSize || 5 * 1024 * 1024;
      let totalChunks = Math.ceil(file.size / chunkSize);

      const existingSession =
        typeof window !== "undefined" ? window.sessionStorage.getItem(resumeKey) : null;
      if (existingSession) {
        const probe = await fetch(
          `/api/admin/curriculum-ai/books/import?sessionId=${encodeURIComponent(existingSession)}`,
          { cache: "no-store" },
        );
        if (probe.ok) {
          const probeJson = await probe.json();
          sessionId = existingSession;
          chunkSize = Number(probeJson.chunkSize || chunkSize);
          totalChunks = Number(probeJson.totalChunks || totalChunks);
          setPhase("استكمال جلسة رفع سابقة…");
        } else {
          window.sessionStorage.removeItem(resumeKey);
        }
      }

      if (!sessionId) {
        const initRes = await fetch("/api/admin/curriculum-ai/books/import?action=init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
        });
        const initJson = await initRes.json();
        if (!initRes.ok || !initJson.ok) {
          throw new Error(initJson.error || "تعذر بدء جلسة الرفع");
        }
        sessionId = String(initJson.sessionId);
        chunkSize = Number(initJson.chunkSize);
        totalChunks = Number(initJson.totalChunks);
        window.sessionStorage.setItem(resumeKey, sessionId);
      }

      sessionRef.current = sessionId;

      // Resume support: ask server which chunks already exist
      const statusRes = await fetch(
        `/api/admin/curriculum-ai/books/import?sessionId=${encodeURIComponent(sessionId)}`,
        { cache: "no-store" },
      );
      const statusJson = await statusRes.json();
      const already: number[] = Array.isArray(statusJson.received) ? statusJson.received : [];
      const alreadySet = new Set(already);

      for (let i = 0; i < totalChunks; i++) {
        if (alreadySet.has(i)) {
          setProgress((alreadySet.size) / totalChunks);
          setPhase(`استكمال الرفع… الجزء ${i + 1}/${totalChunks} موجود مسبقاً`);
          continue;
        }

        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const blob = file.slice(start, end);

        let attempt = 0;
        let ok = false;
        while (attempt < 4 && !ok) {
          attempt += 1;
          setPhase(`رفع الجزء ${i + 1} من ${totalChunks}`);
          try {
            const chunkRes = await fetch(
              `/api/admin/curriculum-ai/books/import?action=chunk&sessionId=${encodeURIComponent(sessionId)}&index=${i}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/octet-stream",
                  "Content-Length": String(blob.size),
                },
                body: blob,
              },
            );
            const chunkJson = await chunkRes.json();
            if (!chunkRes.ok || !chunkJson.ok) {
              throw new Error(chunkJson.error || `فشل رفع الجزء ${i + 1}`);
            }
            ok = true;
            const receivedCount = Array.isArray(chunkJson.received)
              ? chunkJson.received.length
              : i + 1;
            setProgress(receivedCount / totalChunks);
          } catch (err) {
            if (attempt >= 4) throw err;
            setPhase(`انقطاع مؤقت — إعادة محاولة الجزء ${i + 1} (${attempt}/4)`);
            await new Promise((r) => setTimeout(r, 700 * attempt));
          }
        }
      }

      setPhase("تجميع الملف والتحقق منه…");
      const completeRes = await fetch(
        "/api/admin/curriculum-ai/books/import?action=complete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        },
      );
      const completeJson = await completeRes.json();
      if (!completeRes.ok || !completeJson.ok) {
        throw new Error(
          completeJson.failReason || completeJson.error || "فشل التحقق من الملف",
        );
      }
      setProgress(1);
      setPhase("تم التحقق بنجاح");
      setHint(null);
      window.sessionStorage.removeItem(resumeKey);
      await load();
    } catch (e) {
      setError(String((e as Error)?.message || e));
      setPhase("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startLocalBrowserImport() {
    setError(null);
    setExtractArmedMsg(null);
    window.open(data?.officialUrl || OFFICIAL_URL, "_blank", "noopener,noreferrer");
    setHint("بعد اكتمال التنزيل، اختر ملف الكتاب من التنزيلات.");
    // Open picker shortly after so the browser allows it from the click gesture chain.
    window.setTimeout(() => inputRef.current?.click(), 350);
  }

  async function armExtraction() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/curriculum-ai/books/import?action=arm-extraction",
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "تعذر تفعيل الاستخراج");
      setExtractArmedMsg(json.message || "الاستخراج جاهز — لم يبدأ تلقائياً.");
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <main dir="rtl" lang="ar" style={shell}>
        <div style={card}>
          <p style={{ margin: 0, color: "#9fb4c9" }}>جاري تجهيز صفحة الاستيراد…</p>
        </div>
      </main>
    );
  }

  const verified = data.verified && data.status.state === "VERIFIED";

  return (
    <main dir="rtl" lang="ar" style={shell}>
      <div style={card}>
        <div style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              color: "#78e7d2",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            SUCCESS OS · استيراد المنهج
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              lineHeight: 1.35,
              fontWeight: 800,
            }}
          >
            {data.officialTitle}
          </h1>
          <p style={{ margin: "0.75rem 0 0", color: "#9fb4c9", lineHeight: 1.8 }}>
            استيراد محلي عبر متصفحك. لا يعتمد على تنزيل الخادم من موقع المركز الوطني.
          </p>
        </div>

        {!verified && (
          <div style={{ display: "grid", gap: 14 }}>
            <button
              type="button"
              style={primaryBtn}
              disabled={busy}
              onClick={startLocalBrowserImport}
            >
              تنزيل الكتاب الرسمي واستيراده
            </button>

            {hint && (
              <div
                style={{
                  padding: "0.95rem 1rem",
                  borderRadius: 14,
                  background: "rgba(34,211,182,0.1)",
                  border: "1px solid rgba(34,211,182,0.28)",
                  color: "#d7fff6",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {hint}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFileChunked(file);
                e.target.value = "";
              }}
            />

            {(busy || progress > 0) && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    color: "#b8c9da",
                    fontSize: 13,
                  }}
                >
                  <span>{phase || "جاري الرفع…"}</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div
                  style={{
                    height: 14,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(2, Math.round(progress * 100))}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#22d3b6,#75a5ff)",
                      transition: "width .25s ease",
                    }}
                  />
                </div>
              </div>
            )}

            {data.status.state === "REJECTED" && data.status.failReason && (
              <p style={{ color: "#fda4a4", margin: 0 }}>{data.status.failReason}</p>
            )}
            {error && <p style={{ color: "#fda4a4", margin: 0 }}>{error}</p>}
          </div>
        )}

        {verified && (
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0.45rem 0.8rem",
                borderRadius: 999,
                background: "rgba(34,211,182,0.14)",
                color: "#9af5e2",
                fontWeight: 800,
                width: "fit-content",
                fontSize: 13,
              }}
            >
              الحالة: VERIFIED
            </div>

            <div style={{ color: "#d5e4f2", lineHeight: 1.9 }}>
              <div>اسم الكتاب: {data.status.officialTitle}</div>
              <div>الحجم: {formatBytes(Number(data.status.fileSize || 0))}</div>
              <div>عدد الصفحات: {data.status.pageCount}</div>
            </div>

            {data.coverPreview && (
              <div>
                <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.05rem" }}>الغلاف</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.coverPreview}
                  alt="غلاف الكتاب"
                  style={{
                    width: "min(100%, 340px)",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>
            )}

            <div>
              <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem" }}>
                معاينة أول ثلاث صفحات
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
                }}
              >
                {data.previews.map((src, i) => (
                  <div key={src}>
                    <div style={{ fontSize: 12, color: "#9fb4c9", marginBottom: 6 }}>
                      صفحة {i + 1}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`معاينة الصفحة ${i + 1}`}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "#fff",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              style={{
                ...primaryBtn,
                opacity: data.extractionEnabled ? 1 : 0.55,
                cursor: data.extractionEnabled ? "pointer" : "not-allowed",
              }}
              disabled={busy || !data.extractionEnabled}
              onClick={() => void armExtraction()}
            >
              ابدأ استخراج الكتاب
            </button>
            {extractArmedMsg && (
              <p style={{ margin: 0, color: "#9af5e2" }}>{extractArmedMsg}</p>
            )}
            {error && <p style={{ color: "#fda4a4", margin: 0 }}>{error}</p>}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

type Metrics = {
  jordanBooksDiscovered: number;
  downloadableBooks: number;
  blockedBooks: number;
  rightsRestrictedBooks: number;
  verifiedBooks: number;
  processedBooks: number;
  detectedUnits: number;
  detectedLessons: number;
  jobsQueued: number;
  jobsFailed: number;
  jobsCompleted: number;
  storageBytes: number;
  sampleLessons: number;
};

const shell: CSSProperties = {
  minHeight: "100vh",
  padding: "1.5rem",
  fontFamily: "'Noto Kufi Arabic', Manrope, Tahoma, sans-serif",
  color: "#e8f1fa",
  background:
    "radial-gradient(circle at 12% 10%, rgba(34,211,182,.14), transparent 26%), linear-gradient(160deg,#051326,#0a2747)",
};

const card: CSSProperties = {
  background: "rgba(8,24,44,.9)",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 18,
  padding: "1rem 1.1rem",
};

export default function CurriculumIngestionMonitorPage() {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/curriculum-ingestion", { cache: "no-store" });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 5000);
    return () => clearInterval(t);
  }, [load]);

  async function discover() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/curriculum-ingestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discover-jordan" }),
      });
      const json = await res.json();
      setMsg(json.message || "started");
      setTimeout(() => load(), 1500);
    } finally {
      setBusy(false);
    }
  }

  const m: Metrics | null = data?.metrics || null;

  return (
    <main dir="rtl" lang="ar" style={shell}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <header style={card}>
          <div style={{ color: "#78e7d2", fontWeight: 800, letterSpacing: ".12em", fontSize: 12 }}>
            SUCCESS OS · محرك استيعاب المناهج العالمي
          </div>
          <h1 style={{ margin: "8px 0", fontSize: "1.7rem" }}>مراقبة اكتشاف ومعالجة المناهج</h1>
          <p style={{ margin: 0, color: "#9fb4c9", lineHeight: 1.7 }}>
            المعالجة تتم عبر Worker مستقل وطوابير خلفية. Cloudflare Tunnel للمعاينة فقط.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void discover()}
            style={{
              marginTop: 14,
              width: "100%",
              minHeight: 56,
              border: 0,
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              color: "#06162b",
              background: "linear-gradient(135deg,#22d3b6,#75a5ff)",
            }}
          >
            ابدأ اكتشاف منهاج الأردن
          </button>
          {msg && <p style={{ color: "#9af5e2" }}>{msg}</p>}
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 10,
          }}
        >
          {[
            ["كتب الأردن المكتشفة", m?.jordanBooksDiscovered],
            ["قابلة للتنزيل", m?.downloadableBooks],
            ["محجوبة", m?.blockedBooks],
            ["مقيّدة الحقوق", m?.rightsRestrictedBooks],
            ["موثّقة", m?.verifiedBooks],
            ["معالَجة", m?.processedBooks],
            ["وحدات", m?.detectedUnits],
            ["دروس", m?.detectedLessons],
            ["مهام قيد التنفيذ", m?.jobsQueued],
            ["مهام فشلت", m?.jobsFailed],
            ["حجم التخزين (بايت)", m?.storageBytes],
          ].map(([label, value]) => (
            <div key={String(label)} style={card}>
              <div style={{ color: "#8ca6bd", fontSize: 12 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
                {value == null ? "—" : Number(value).toLocaleString("en-US")}
              </div>
            </div>
          ))}
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>كتب الأردن (عينة حقيقية من قاعدة البيانات)</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#8ca6bd", textAlign: "right" }}>
                  <th style={th}>العنوان</th>
                  <th style={th}>الصف</th>
                  <th style={th}>المادة</th>
                  <th style={th}>الحقوق</th>
                  <th style={th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(data?.jordanBooks || []).slice(0, 40).map((b: any) => (
                  <tr key={b.id}>
                    <td style={td}>{b.title}</td>
                    <td style={td}>{b.grade}</td>
                    <td style={td}>{b.subject}</td>
                    <td style={td}>{b.rights}</td>
                    <td style={td}>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>المهام الأخيرة</h2>
          <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.8 }}>
            {(data?.jobs || []).slice(0, 15).map((j: any) => (
              <li key={j.id}>
                {j.type} · {j.status}
                {j.error ? ` · ${j.error}` : ""}
              </li>
            ))}
            {!data?.jobs?.length && <li>لا مهام بعد</li>}
          </ul>
        </section>

        {data?.sampleLesson && (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>نموذج درس للمراجعة</h2>
            <p style={{ margin: 0 }}>
              {data.sampleLesson.title} · {data.sampleLesson.status}
            </p>
            <p style={{ color: "#9fb4c9" }}>
              <a href="/student/curriculum-sample" style={{ color: "#78e7d2" }}>
                معاينة الطالب
              </a>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

const th: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,.08)" };
const td: CSSProperties = { padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,.05)" };

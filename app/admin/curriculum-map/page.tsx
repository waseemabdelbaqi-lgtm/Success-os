"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

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

export default function CurriculumMapReviewPage() {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/curriculum-map", { cache: "no-store" });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function review(itemId: string, decision: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/curriculum-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review-item", itemId, decision }),
      });
      const json = await res.json();
      setMsg(json.ok ? `تم: ${itemId} → ${decision}` : json.reason || json.error);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function acceptGaps(value: boolean) {
    setBusy(true);
    try {
      await fetch("/api/admin/curriculum-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-reviews",
          reviews: { __acceptGaps: value },
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/curriculum-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-curriculum-map", approvedBy: "admin" }),
      });
      const json = await res.json();
      setMsg(json.ok ? "تم اعتماد خريطة المنهج" : `رفض الاعتماد: ${json.reason}`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const pack = data?.pack;
  const reviews = pack?.reviews || {};

  return (
    <main dir="rtl" lang="ar" style={shell}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <header style={card}>
          <div style={{ color: "#78e7d2", fontWeight: 800, fontSize: 12 }}>
            SUCCESS OS · مراجعة Evidence Pack / خريطة المنهج
          </div>
          <h1 style={{ margin: "8px 0", fontSize: "1.6rem" }}>
            اعتماد خريطة الأردن — صف 1 — رياضيات — فصل 1
          </h1>
          <p style={{ margin: 0, color: "#9fb4c9", lineHeight: 1.7 }}>
            الوضع: {pack?.mode || "—"} · حالة الخريطة:{" "}
            <strong>{pack?.status || data?.error || "—"}</strong>
          </p>
          <p style={{ color: "#fbbf24", marginBottom: 0 }}>
            ممنوع توليد درس أردني قبل اعتماد الخريطة. OpenStax ليس منهاجاً أردنياً.
          </p>
          {msg && <p style={{ color: "#9af5e2" }}>{msg}</p>}
        </header>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>المصادر الرسمية</h2>
          <ul style={{ lineHeight: 1.9, paddingInlineStart: 18 }}>
            {(pack?.officialSources || []).map((s: any) => (
              <li key={s.id}>
                <strong>{s.name}</strong> · {s.confidence} · {s.accessResult}{" "}
                <a href={s.url} target="_blank" rel="noreferrer" style={{ color: "#78e7d2" }}>
                  فتح الرابط
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>الادعاءات الموثّقة</h2>
          <ul style={{ lineHeight: 1.9, paddingInlineStart: 18 }}>
            {(pack?.claims || []).map((c: any) => (
              <li key={c.id}>
                [{c.confidence}] {c.claim}
                <div style={{ color: "#8ca6bd", fontSize: 13 }}>
                  {c.note} ·{" "}
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ color: "#78e7d2" }}>
                    المصدر
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>خريطة مقترحة للمراجعة (ليست TOC رسمي NCCD)</h2>
          {(pack?.proposedMapForReview || []).map((u: any) => (
            <div key={u.id} style={{ marginBottom: 16, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <strong>{reviews[`${u.id}__title`] || u.title}</strong>
                <span style={{ color: "#8ca6bd" }}>{u.confidence}</span>
                <span style={{ color: "#fbbf24" }}>{reviews[u.id] || u.status}</span>
                <button type="button" disabled={busy} style={btn} onClick={() => void review(u.id, "accepted")}>
                  قبول الوحدة
                </button>
                <button type="button" disabled={busy} style={btnGhost} onClick={() => void review(u.id, "rejected")}>
                  رفض
                </button>
              </div>
              <p style={{ color: "#9fb4c9", fontSize: 13 }}>{u.note}</p>
              <div style={{ marginInlineStart: 12 }}>
                {(u.outcomes || []).map((o: any) => (
                  <div key={o.id} style={{ marginBottom: 8 }}>
                    نتاج: {o.text} · {reviews[o.id] || o.status}
                    <button type="button" disabled={busy} style={btn} onClick={() => void review(o.id, "accepted")}>
                      قبول
                    </button>
                    <button type="button" disabled={busy} style={btnGhost} onClick={() => void review(o.id, "rejected")}>
                      رفض
                    </button>
                  </div>
                ))}
                {(u.lessons || []).map((l: any) => (
                  <div key={l.id} style={{ marginBottom: 8 }}>
                    درس: {l.title} · {reviews[l.id] || l.status}
                    <button type="button" disabled={busy} style={btn} onClick={() => void review(l.id, "accepted")}>
                      قبول
                    </button>
                    <button type="button" disabled={busy} style={btnGhost} onClick={() => void review(l.id, "rejected")}>
                      رفض
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>الثغرات وسجل المراجع</h2>
          <ul style={{ lineHeight: 1.8 }}>
            {(pack?.gaps || []).map((g: string) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <input
              type="checkbox"
              checked={Boolean(reviews.__acceptGaps)}
              onChange={(e) => void acceptGaps(e.target.checked)}
            />
            أقرّ بالثغرات وأسمح باعتماد خريطة Success OS الأصلية (LEGAL ORIGINAL-CONTENT MODE)
          </label>
          <button type="button" disabled={busy} onClick={() => void approve()} style={{ ...btn, marginTop: 16, width: "100%", minHeight: 52 }}>
            Approve Curriculum Map
          </button>
        </section>
      </div>
    </main>
  );
}

const btn: CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "6px 10px",
  marginInlineStart: 6,
  background: "linear-gradient(135deg,#22d3b6,#75a5ff)",
  color: "#06162b",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhost: CSSProperties = {
  ...btn,
  background: "transparent",
  color: "#e8f1fa",
  border: "1px solid rgba(255,255,255,.2)",
};

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { CompletenessMatrixReport } from "@/src/lib/jordan-books/matrix/types";

export default function JordanCurriculumMatrixPage(): ReactNode {
  const [matrix, setMatrix] = useState<CompletenessMatrixReport | null>(null);
  const [queueSummary, setQueueSummary] = useState<Record<string, number> | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");

  const reload = useCallback(() => {
    setBusy(true);
    Promise.all([
      fetch("/api/jordan-books?view=matrix", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/jordan-books?view=queue", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([m, q]) => {
        if (m.ok) setMatrix(m.matrix);
        if (q.ok) setQueueSummary(q.summary);
      })
      .catch(() => setMsg("تعذّر التحميل"))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function runQueue(limit = 40) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/jordan-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_queue", limit }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error("fail");
      setMatrix(json.matrix);
      setMsg(
        `تمت معالجة ${json.result.processed} عنصر/عناصر. stubs=STRUCTURED وليست COMPLETE. done=${json.result.storeSummary.done} pending=${json.result.storeSummary.pending}`,
      );
      reload();
    } catch {
      setMsg("فشل تشغيل الطابور");
    } finally {
      setBusy(false);
    }
  }

  async function rebuildAndRun(limit = 120) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/jordan-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rebuild_queue", limit }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error("fail");
      setMatrix(json.matrix);
      setMsg(
        `أُعيد بناء المخزون والطابور. processed=${json.result?.processed ?? 0}. honestCompleteClaim=false.`,
      );
      reload();
    } catch {
      setMsg("فشل إعادة البناء");
    } finally {
      setBusy(false);
    }
  }

  const cells =
    matrix?.cells.filter((c) => {
      if (!filter) return true;
      const blob = `${c.gradeAr} ${c.subjectAr} ${c.bookType} ${c.matrixStatus} ${c.pathwayAr}`;
      return blob.includes(filter);
    }) || [];

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Admin · Completeness Matrix · Production Queue</p>
        <h1 style={h1}>مصفوفة اكتمال المنهاج الأردني — كل الصفوف والمباحث</h1>
        <p style={banner}>
          لا يُعرض COMPLETE إلا بعد المراجعات. الفيديو متوقف. الأرقام ديناميكية من المخزون والطابور. المسارات
          المهنية بلا قائمة مباحث رسمية = NOT_DISCOVERED دون اختراع مباحث.
        </p>
        <div style={actions}>
          <button type="button" style={btn} disabled={busy} onClick={reload}>
            تحديث
          </button>
          <button type="button" style={btn} disabled={busy} onClick={() => runQueue(40)}>
            تشغيل طابور الإنتاج (40)
          </button>
          <button type="button" style={btn} disabled={busy} onClick={() => runQueue(100)}>
            تشغيل طابور (100)
          </button>
          <button type="button" style={btnSecondary} disabled={busy} onClick={() => rebuildAndRun(150)}>
            إعادة بناء المخزون + طابور (150)
          </button>
          <Link href="/admin/jordan-books-dashboard" style={link}>
            لوحة التغطية
          </Link>
          <Link href="/jordan-books/jordan/national/grade-1/semester-1" style={link}>
            مكتية الصف 1 فصل 1
          </Link>
        </div>
        {msg ? <p style={{ fontWeight: 800 }}>{msg}</p> : null}

        {matrix ? (
          <>
            <section style={grid}>
              <Stat label="إجمالي الخلايا" value={matrix.totalCells} />
              <Stat label="COMPLETE (حقيقي)" value={matrix.byStatus.COMPLETE || 0} />
              <Stat label="CONTENT_COMPLETE" value={matrix.byStatus.CONTENT_COMPLETE || 0} />
              <Stat label="STRUCTURED" value={matrix.byStatus.STRUCTURED || 0} />
              <Stat label="QUEUED" value={matrix.byStatus.QUEUED || 0} />
              <Stat label="NOT_DISCOVERED" value={matrix.byStatus.NOT_DISCOVERED || 0} />
              <Stat label="طابور pending" value={queueSummary?.pending || 0} />
              <Stat label="طابور done" value={queueSummary?.done || 0} />
            </section>

            <section style={card}>
              <h2 style={h2}>حسب الصف / المسار</h2>
              <ul>
                {matrix.byGrade.map((g) => (
                  <li key={`${g.gradeAr}-${g.pathway}`}>
                    <strong>
                      {g.gradeAr} · {g.pathway}
                    </strong>
                    : مباحث {g.subjects} · خلايا {g.cells} · structured% {g.percentStructured} ·
                    contentComplete {g.contentComplete} · COMPLETE {g.complete} · blocked/ND {g.blocked}
                  </li>
                ))}
              </ul>
            </section>

            <section style={card}>
              <h2 style={h2}>خلايا المصفوفة</h2>
              <input
                style={input}
                placeholder="تصفية: صف / مبحث / حالة…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div style={{ maxHeight: 520, overflow: "auto" }}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th>الصف</th>
                      <th>المسار</th>
                      <th>الفصل</th>
                      <th>المبحث</th>
                      <th>نوع الكتاب</th>
                      <th>الحالة</th>
                      <th>دروس</th>
                      <th>حاجز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cells.slice(0, 400).map((c) => (
                      <tr key={c.id}>
                        <td>{c.gradeAr}</td>
                        <td>{c.pathwayAr}</td>
                        <td>{c.semesterAr}</td>
                        <td>{c.subjectAr}</td>
                        <td>{c.bookType}</td>
                        <td>
                          <span style={statusStyle(c.matrixStatus)}>{c.matrixStatus}</span>
                        </td>
                        <td>{c.lessonsDone ?? "—"}</td>
                        <td style={{ fontSize: 12 }}>{c.blocker || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: "#6b3a40" }}>عرض أول 400 بعد التصفية · الإجمالي {cells.length}</p>
            </section>
          </>
        ) : (
          <p>جارٍ التحميل…</p>
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

function statusStyle(status: string): CSSProperties {
  const hot = ["COMPLETE", "PUBLISHED", "CONTENT_COMPLETE"].includes(status);
  const bad = ["NOT_DISCOVERED", "BLOCKED"].includes(status);
  return {
    fontWeight: 900,
    color: hot ? "#146c2e" : bad ? "#9e1722" : "#9a711a",
  };
}

const page: CSSProperties = {
  minHeight: "100vh",
  padding: "1.25rem",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const wrap: CSSProperties = { maxWidth: 1200, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const banner: CSSProperties = {
  background: "rgba(242,215,124,.4)",
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
const btnSecondary: CSSProperties = {
  ...btn,
  background: "#9e1722",
  color: "#fff",
  borderColor: "#9e1722",
};
const link: CSSProperties = { color: "#9e1722", fontWeight: 900, alignSelf: "center" };
const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
  gap: 10,
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
  marginTop: "1rem",
};
const input: CSSProperties = {
  width: "100%",
  marginBottom: 10,
  padding: "0.55rem 0.7rem",
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
};
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };

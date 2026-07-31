"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export default function BookEngineCmsPage(): ReactNode {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [validation, setValidation] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");

  async function reload() {
    const s = await fetch("/api/interactive-book-engine?view=status").then((r) => r.json());
    setStatus(s);
    const v = await fetch("/api/interactive-book-engine?view=validate").then((r) => r.json());
    setValidation(v);
  }

  useEffect(() => {
    reload();
  }, []);

  async function publish() {
    const res = await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", reviewer: "gate2-admin" }),
    });
    const json = await res.json();
    setMsg(json.ok ? "Published engine-test version (book still NOT complete)" : `Blocked: ${json.report?.critical} critical`);
    reload();
  }

  async function newVersion() {
    const res = await fetch("/api/interactive-book-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "new_version", createdBy: "gate2-admin" }),
    });
    const json = await res.json();
    setMsg(json.ok ? `New draft version ${json.versionId}` : "Failed");
  }

  return (
    <main dir="rtl" style={page}>
      <div style={wrap}>
        <p style={eyebrow}>Admin · Book Engine CMS · Gate 2</p>
        <h1 style={h1}>إدارة محرك الكتب التفاعلية</h1>
        <p style={banner}>
          لا توليد جماعي للكتب. اختبار المحرك فقط على درس رياضيات صف 1. لا تُعلَن الكتب مكتملة هنا.
        </p>

        <section style={card}>
          <h2 style={h2}>حالة المحرك</h2>
          <pre style={pre}>{JSON.stringify(status, null, 2)}</pre>
        </section>

        <section style={card}>
          <h2 style={h2}>التحقق قبل النشر</h2>
          <pre style={pre}>{JSON.stringify(validation, null, 2)}</pre>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={reload}>
              تحديث
            </button>
            <button type="button" style={btn} onClick={publish}>
              نشر نسخة اختبار المحرك
            </button>
            <button type="button" style={btnGhost} onClick={newVersion}>
              إنشاء مسودة نسخة جديدة
            </button>
            <Link href="/interactive-books/reader/book-jo-g1-s1-math" style={btn}>
              معاينة الطالب
            </Link>
          </div>
          {msg && <p>{msg}</p>}
        </section>

        <section style={card}>
          <h2 style={h2}>سير المراجعة</h2>
          <p>
            DRAFT → SOURCE REVIEW → RIGHTS REVIEW → SUBJECT REVIEW → LANGUAGE REVIEW → TECHNICAL REVIEW →
            CORRECTIONS REQUIRED → FINAL APPROVAL → PUBLISHED / ARCHIVED / REPLACED
          </p>
          <p>لا يتجاوز المحتوى المستورد/المولَّد بالذكاء الاصطناعي المراجعة.</p>
        </section>

        <Link href="/jordan-books">← مكتبة الأردن</Link>
      </div>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  padding: "1.25rem",
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  color: "#2a0c10",
};
const wrap: CSSProperties = { maxWidth: 1000, margin: "0 auto" };
const eyebrow: CSSProperties = { color: "#9e1722", fontWeight: 900 };
const h1: CSSProperties = { color: "#4b0a11" };
const h2: CSSProperties = { color: "#9e1722", marginTop: 0 };
const banner: CSSProperties = {
  background: "rgba(242,215,124,.4)",
  borderRadius: 12,
  padding: "0.75rem 0.9rem",
  fontWeight: 800,
};
const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.16)",
  borderRadius: 16,
  padding: "1rem",
  margin: "1rem 0",
};
const pre: CSSProperties = {
  background: "#1a1012",
  color: "#f2d77c",
  padding: 12,
  borderRadius: 10,
  overflow: "auto",
  maxHeight: 360,
  fontSize: 12,
};
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  textDecoration: "none",
  border: 0,
  borderRadius: 10,
  padding: "0.5rem 0.85rem",
  fontWeight: 800,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "#fff",
  color: "#9e1722",
  border: "1px solid rgba(158,23,34,.3)",
};

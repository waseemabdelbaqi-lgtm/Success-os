"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type AiClassRow = {
  slug: string;
  titleAr: string;
  gradeAr?: string;
  subject?: string;
  teacherName?: string;
  totalMinutes?: number;
  activities?: number;
  href?: string;
  status?: string;
};

type Snap = {
  stage?: { labelAr?: string };
  aiClasses?: AiClassRow[];
  lessonSlots?: Array<{
    id: string;
    gradeAr: string;
    subject: string;
    titleAr: string;
    status: string;
    href: string;
    lessonSlug?: string | null;
  }>;
};

export default function JordanElementaryStagePage(): ReactNode {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [grade, setGrade] = useState("الصف الأول");

  const reload = useCallback(() => {
    fetch("/api/curriculum-os?view=jordan-elementary", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSnap(json.elementary);
      })
      .catch(() => setMsg("تعذّر التحميل"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function buildAll() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "elementary-ai-classes-build" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "FAILED");
      setSnap(json.elementary);
      setMsg(`جاهز: ${json.built?.length || 0} حصص AI`);
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  const classes = (snap?.aiClasses || []).filter((c) =>
    grade ? c.gradeAr === grade : true,
  );
  const grades = ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"];

  return (
    <div className="el" dir="rtl">
      <style>{`
        .el{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;--m:#6b3a40;min-height:100vh;padding:1.25rem;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:var(--d);background:linear-gradient(165deg,#fff9f2,#f0e0d6)}
        .el-wrap{max-width:820px;margin:0 auto}
        .el h1{font-size:clamp(1.8rem,4vw,2.6rem);color:var(--b);margin:.2rem 0}
        .el .lead{color:var(--m);line-height:1.7;max-width:36rem}
        .el .row{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}
        .el button,.el a.btn{background:var(--b);color:#fff;border:0;text-decoration:none;padding:.65rem 1rem;border-radius:.65rem;font:inherit;font-weight:800;cursor:pointer}
        .el a.btn.gold{background:var(--g);color:var(--d)}
        .el a.btn.ghost{background:transparent;color:var(--b);border:1px solid rgba(158,23,34,.35)}
        .el select{padding:.55rem .7rem;border-radius:.55rem;border:1px solid rgba(75,10,17,.25);font:inherit;font-weight:700;color:var(--d);background:#fff}
        .el .msg{font-weight:800;color:var(--b)}
        .el .card{background:rgba(255,255,255,.82);border:1px solid rgba(75,10,17,.1);border-radius:1rem;padding:1rem;margin:.65rem 0}
        .el .card h2{margin:.1rem 0 .35rem;font-size:1.15rem}
        .el .card p{margin:.2rem 0;color:var(--m);font-size:.9rem}
        .el .steps{display:grid;gap:.45rem;margin:1rem 0}
        .el .steps span{background:rgba(75,10,17,.07);padding:.55rem .75rem;border-radius:.55rem;font-weight:700}
      `}</style>

      <div className="el-wrap">
        <p style={{ fontWeight: 800, color: "var(--d)", margin: 0 }}>SUCCESS OS</p>
        <h1>{snap?.stage?.labelAr || "المرحلة الابتدائية"}</h1>
        <p className="lead">
          اختر الصف → افتح الحصة → شغّل فيديو الشرح وحل التفاعليات. أسماء المعلّمين وهمية داخل
          المنصة.
        </p>

        <div className="steps">
          <span>1) اختَر الصف</span>
          <span>2) افتح حصة AI</span>
          <span>3) فيديو الشرح + تفاعليات + اختبار</span>
        </div>

        <div className="row">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="الصف">
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={buildAll}>
            {busy ? "جاري التجهيز…" : "جهّز كل حصص AI"}
          </button>
          <Link className="btn ghost" href="/digital-library/middle-east/jordan">
            المكتبة
          </Link>
        </div>

        {msg ? <p className="msg">{msg}</p> : null}

        {(classes.length ? classes : snap?.aiClasses || []).map((c) => (
          <article key={c.slug} className="card">
            <h2>{c.titleAr}</h2>
            <p>
              {c.gradeAr} · {c.subject} · {c.teacherName} · {c.totalMinutes || 35} د ·{" "}
              {c.activities || 0} تفاعليات
            </p>
            <div className="row">
              <Link className="btn gold" href={c.href || "#"}>
                افتح الحصة
              </Link>
            </div>
          </article>
        ))}

        {!classes.length && !(snap?.aiClasses || []).length ? (
          <article className="card">
            <h2>لا حصص بعد</h2>
            <p>اضغط «جهّز كل حصص AI» للبدء.</p>
          </article>
        ) : null}

        {(snap?.lessonSlots || [])
          .filter((s) => s.gradeAr === grade && s.status !== "live")
          .map((s) => (
            <article key={s.id} className="card">
              <h2>{s.titleAr}</h2>
              <p>
                {s.gradeAr} · {s.subject} · قريبًا
              </p>
            </article>
          ))}
      </div>
    </div>
  );
}

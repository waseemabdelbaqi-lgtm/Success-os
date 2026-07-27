"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { withAiAssistantTitle } from "@/src/lib/digital-library/ai-assistant-teacher";

type AiClassRow = {
  slug: string;
  titleAr: string;
  gradeAr?: string;
  subject?: string;
  teacherName?: string;
  totalMinutes?: number;
  href?: string;
};

type Snap = {
  stage?: { labelAr?: string };
  aiClasses?: AiClassRow[];
};

const GRADES = [
  "الصف الأول",
  "الصف الثاني",
  "الصف الثالث",
  "الصف الرابع",
  "الصف الخامس",
  "الصف السادس",
];

export default function JordanElementaryStagePage(): ReactNode {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [grade, setGrade] = useState("الصف الأول");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/curriculum-os?view=jordan-elementary", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSnap(json.elementary);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function prepare() {
    setBusy(true);
    try {
      await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "elementary-ai-classes-build" }),
      });
      reload();
    } finally {
      setBusy(false);
    }
  }

  const classes = (snap?.aiClasses || []).filter((c) => c.gradeAr === grade);

  return (
    <div className="el" dir="rtl">
      <style>{`
        .el{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;--m:#6b3a40;min-height:100vh;padding:1.25rem;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:var(--d);background:linear-gradient(165deg,#fff9f2,#efdfd3)}
        .wrap{max-width:760px;margin:0 auto}
        h1{font-size:clamp(1.9rem,4vw,2.7rem);color:var(--b);margin:.15rem 0}
        .lead{color:var(--m);line-height:1.7}
        .row{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}
        select,button,a.btn{font:inherit;font-weight:800;border-radius:.65rem;padding:.65rem 1rem}
        select{border:1px solid rgba(75,10,17,.25);background:#fff;color:var(--d)}
        button,a.btn{background:var(--b);color:#fff;border:0;text-decoration:none;cursor:pointer}
        a.btn.gold{background:var(--g);color:var(--d)}
        .card{background:rgba(255,255,255,.85);border:1px solid rgba(75,10,17,.1);border-radius:1rem;padding:1rem;margin:.7rem 0}
        .card h2{margin:.1rem 0 .35rem;font-size:1.2rem}
        .card p{margin:0;color:var(--m)}
      `}</style>
      <div className="wrap">
        <h1>{snap?.stage?.labelAr || "المرحلة الابتدائية"}</h1>
        <p className="lead">
          اختَر الصف وافتح الحصة — معلّمات ستايل يتحرّكن مع الصوت (ستايل يوتيوب)، وبعدين تفاعليات.
        </p>
        <div className="row">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="الصف">
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <button type="button" disabled={busy} onClick={prepare}>
            {busy ? "…" : "حدّث الحصص"}
          </button>
        </div>

        {(classes.length ? classes : snap?.aiClasses || []).map((c) => (
          <article key={c.slug} className="card">
            <h2>{c.titleAr}</h2>
            <p>
              {c.gradeAr} · {c.subject} · {withAiAssistantTitle(c.teacherName || "")}
            </p>
            <div className="row">
              <Link className="btn gold" href={(c.href || "#").replace("#teacher-explain", "#ai-class")}>
                ▶ شاهد الحصة
              </Link>
            </div>
          </article>
        ))}

        {!classes.length && !(snap?.aiClasses || []).length ? (
          <article className="card">
            <h2>اضغط «حدّث الحصص»</h2>
            <p>بعدها تفتح الحصة وتشوف المعلّم على الشاشة.</p>
          </article>
        ) : null}
      </div>
    </div>
  );
}

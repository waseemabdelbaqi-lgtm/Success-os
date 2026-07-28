"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type GradeRow = {
  gradeAr: string;
  subjects: string[];
  source?: string;
  ok?: boolean;
};

type JordanSnap = {
  wave: string;
  doctrineAr: string[];
  sources: Array<{
    id: string;
    nameAr: string;
    url: string;
    role: string;
    usage: string;
  }>;
  harvest: {
    harvestedAt?: string | null;
    totals?: { grades?: number; subjectCells?: number };
    nccdProbe?: { ok?: boolean; error?: string; note?: string };
    grades?: GradeRow[];
  } | null;
  reformulation: {
    createdCount?: number;
    created?: Array<{ id: string; grade: string; subject: string; lessons: number; status: string }>;
    pipeline?: Record<string, string>;
  } | null;
  outlines: {
    count: number;
    published: number;
    draft: number;
    items: Array<{
      id: string;
      titleAr: string;
      subject: string;
      educationLevel: string;
      status: string;
      libraryPath: string;
    }>;
  };
  nextCountryHint?: string;
};

/**
 * Jordan Wave 1 control room — harvest structure → reformulate → lessons later.
 */
export default function JordanCurriculumWavePage(): ReactNode {
  const [snap, setSnap] = useState<JordanSnap | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [grade, setGrade] = useState("الصف الأول");
  const [limit, setLimit] = useState(12);

  const reload = useCallback(() => {
    fetch("/api/curriculum-os?view=jordan", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSnap(json.jordan);
      })
      .catch(() => setMsg("تعذّر تحميل موجة الأردن"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function run(action: string, body: Record<string, unknown> = {}) {
    setBusy(action);
    setMsg("");
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "FAILED");
      if (json.jordan) setSnap(json.jordan);
      else reload();
      if (action === "jordan-harvest") {
        setMsg(
          `تم السحب: ${json.harvest?.totals?.subjectCells || 0} خلية صف×مادة · NCCD ${json.harvest?.nccdProbe?.ok ? "متاح" : "غير متاح الآن (نستخدم المؤشر الهيكلي)"}`,
        );
      } else if (action === "jordan-reformulate") {
        setMsg(`إعادة صياغة: ${json.reformulation?.createdCount || 0} منهاج جاهز للدروس`);
      } else {
        setMsg(
          `موجة الأردن: سحب ${json.harvest?.totals?.subjectCells || 0} · صياغة ${json.reformulation?.createdCount || 0}`,
        );
      }
    } catch (err) {
      setMsg(String((err as Error)?.message || err));
    } finally {
      setBusy("");
    }
  }

  const grades = snap?.harvest?.grades || [];

  return (
    <div className="jo-wave" dir="rtl">
      <style>{`
        .jo-wave{
          --ink:#2a0c10;--muted:#6b3a40;--burgundy:#9e1722;--deep:#4b0a11;--gold:#f2d77c;
          min-height:100vh;color:var(--ink);
          background:
            radial-gradient(ellipse 70% 45% at 90% -10%, rgba(242,215,124,.25), transparent 50%),
            radial-gradient(ellipse 55% 40% at 0% 0%, rgba(158,23,34,.14), transparent 45%),
            linear-gradient(165deg,#fff9f2 0%,#f6ebe3 45%,#f0e0d6 100%);
          font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;
          padding:1.25rem 1.25rem 4rem;
        }
        .jo-wrap{max-width:1120px;margin:0 auto}
        .jo-kicker{color:var(--deep);font-weight:800;letter-spacing:.03em;font-size:.85rem}
        .jo-brand{font-size:clamp(2rem,5vw,3.1rem);font-weight:900;color:var(--burgundy);margin:.3rem 0}
        .jo-lead{max-width:44rem;color:var(--muted);line-height:1.75;margin:0}
        .jo-nav{display:flex;flex-wrap:wrap;gap:.55rem;margin:1rem 0 1.25rem}
        .jo-nav a,.jo-actions button{
          background:var(--burgundy);color:#fff;border:0;text-decoration:none;
          padding:.55rem .9rem;border-radius:.55rem;font:inherit;font-weight:800;cursor:pointer
        }
        .jo-nav a.ghost,.jo-actions button.ghost{
          background:transparent;color:var(--burgundy);border:1px solid rgba(158,23,34,.35)
        }
        .jo-actions{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin:1rem 0}
        .jo-actions select,.jo-actions input{border:1px solid rgba(75,10,17,.2);border-radius:.5rem;padding:.45rem .6rem;font:inherit}
        .jo-msg{font-weight:700;color:var(--deep);margin:.5rem 0 1rem}
        .jo-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.65rem;margin:1rem 0 1.25rem}
        .jo-kpi{background:rgba(75,10,17,.06);border-radius:.75rem;padding:.75rem;text-align:center}
        .jo-kpi b{display:block;font-size:1.35rem;color:var(--burgundy)}
        .jo-kpi span{font-size:.75rem;color:var(--muted)}
        .jo-grid{display:grid;gap:1rem;grid-template-columns:1.05fr .95fr}
        @media(max-width:900px){.jo-grid{grid-template-columns:1fr}}
        .jo-panel{background:rgba(255,255,255,.74);border:1px solid rgba(75,10,17,.1);border-radius:1rem;padding:1rem 1.1rem;backdrop-filter:blur(8px)}
        .jo-panel h2{margin:.1rem 0 .75rem;font-size:1.1rem;color:var(--deep)}
        .jo-sources{list-style:none;margin:0;padding:0;display:grid;gap:.55rem}
        .jo-sources a{color:var(--burgundy);font-weight:700;text-decoration:none}
        .jo-sources small{display:block;color:var(--muted);font-size:.75rem}
        .jo-grades{display:grid;gap:.55rem;max-height:420px;overflow:auto}
        .jo-grade{border:1px solid rgba(75,10,17,.1);border-radius:.7rem;padding:.65rem .75rem;background:rgba(255,255,255,.65)}
        .jo-grade strong{color:var(--burgundy)}
        .jo-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem}
        .jo-tags i{font-style:normal;font-size:.72rem;background:rgba(158,23,34,.08);color:var(--deep);padding:.15rem .4rem;border-radius:.35rem}
        .jo-list{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}
        .jo-list li{border:1px solid rgba(75,10,17,.1);border-radius:.65rem;padding:.6rem .7rem}
        .jo-pipe{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.75rem}
        .jo-pipe span{background:var(--deep);color:var(--gold);font-size:.75rem;font-weight:800;padding:.35rem .55rem;border-radius:.4rem}
        .jo-doctrine{margin:1.25rem 0 0}
        .jo-doctrine li{margin:.35rem 0;color:var(--muted)}
      `}</style>

      <div className="jo-wrap">
        <p className="jo-kicker">SUCCESS OS · Country Wave 1</p>
        <h1 className="jo-brand">الأردن</h1>
        <p className="jo-lead">
          نسحب هيكل المناهج (صف × مادة) من NCCD + منهاجي + جو أكاديمي، نعيد صياغتها أصلًا داخل
          SUCCESS OS، وبعدين نبني الدروس التفاعلية ثم الفيديو — دولة دولة.
        </p>

        <nav className="jo-nav" aria-label="روابط">
          <Link href="/curriculum/jordan/elementary">المرحلة الابتدائية 1–6</Link>
          <Link href="/curriculum" className="ghost">
            Curriculum OS
          </Link>
          <Link href="/digital-library/middle-east" className="ghost">
            المكتبة · الشرق الأوسط
          </Link>
          <Link href="/teachers" className="ghost">
            معلّمون حقيقيون
          </Link>
          <Link href="/roots" className="ghost">
            الجذور
          </Link>
        </nav>

        <div className="jo-actions">
          <button type="button" disabled={!!busy} onClick={() => run("jordan-harvest")}>
            {busy === "jordan-harvest" ? "جاري السحب…" : "1) اسحب المناهج"}
          </button>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {(grades.length ? grades : [{ gradeAr: "الصف الأول" }]).map((g) => (
              <option key={g.gradeAr} value={g.gradeAr}>
                {g.gradeAr}
              </option>
            ))}
            <option value="">كل الصفوف (حد أقصى)</option>
          </select>
          <input
            type="number"
            min={1}
            max={80}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 12)}
            style={{ width: 72 }}
            title="حد إعادة الصياغة"
          />
          <button
            type="button"
            className="ghost"
            disabled={!!busy}
            onClick={() =>
              run("jordan-reformulate", { grade: grade || undefined, limit, publish: false })
            }
          >
            {busy === "jordan-reformulate" ? "جاري الصياغة…" : "2) أعد الصياغة للدروس"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() =>
              run("jordan-wave1", { grade: grade || undefined, limit, publish: false })
            }
          >
            {busy === "jordan-wave1" ? "تشغيل الموجة…" : "تشغيل الموجة كاملة"}
          </button>
          <Link
            href="/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد"
            style={{
              background: "#f2d77c",
              color: "#4b0a11",
              fontWeight: 900,
              padding: "0.55rem 0.9rem",
              borderRadius: "0.55rem",
              textDecoration: "none",
            }}
          >
            3) افتح الدرس التفاعلي · الجمع بخط الأعداد
          </Link>
        </div>

        {msg ? <p className="jo-msg">{msg}</p> : null}

        <div className="jo-kpis">
          <div className="jo-kpi">
            <b>{snap?.harvest?.totals?.grades ?? "—"}</b>
            <span>صفوف</span>
          </div>
          <div className="jo-kpi">
            <b>{snap?.harvest?.totals?.subjectCells ?? "—"}</b>
            <span>خلايا مادة</span>
          </div>
          <div className="jo-kpi">
            <b>{snap?.outlines.count ?? 0}</b>
            <span>outlines أردن</span>
          </div>
          <div className="jo-kpi">
            <b>{snap?.reformulation?.createdCount ?? 0}</b>
            <span>آخر صياغة</span>
          </div>
        </div>

        <div className="jo-grid">
          <section className="jo-panel">
            <h2>مصادر الموجة</h2>
            <ul className="jo-sources">
              {(snap?.sources || []).map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.nameAr}
                  </a>
                  <small>
                    {s.role} · {s.usage}
                  </small>
                </li>
              ))}
            </ul>
            {snap?.harvest?.nccdProbe && !snap.harvest.nccdProbe.ok ? (
              <p style={{ marginTop: "0.85rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                NCCD غير متاح من بيئة السحب حالياً — نعتمد مؤشر منهاجي الهيكلي + كتالوج الصفوف
                الرسمي المحفوظ، ويمكنك لاحقاً رفع ملفات NCCD يدوياً.
              </p>
            ) : null}
            <p style={{ marginTop: "0.75rem", color: "var(--muted)", fontSize: "0.82rem" }}>
              Plugins: سحب عميق لمنهاجي (صف 1 رياضيات: وحدات حقيقية). Exa MCP وصل لحدّه المجاني —
              فعّل مفتاح Exa أو Apify لتسريع سحب NCCD لاحقاً.
            </p>
          </section>

          <section className="jo-panel">
            <h2>هيكل الصفوف × المواد</h2>
            <div className="jo-grades">
              {grades.map((g) => (
                <article key={g.gradeAr} className="jo-grade">
                  <strong>{g.gradeAr}</strong>
                  <small style={{ color: "var(--muted)" }}> · {g.subjects?.length || 0} مواد</small>
                  <div className="jo-tags">
                    {(g.subjects || []).slice(0, 14).map((s) => (
                      <i key={s}>{s}</i>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="jo-panel" style={{ marginTop: "1rem" }}>
          <h2>Outlines جاهزة لبناء الدروس</h2>
          <ul className="jo-list">
            {(snap?.outlines.items || []).map((o) => (
              <li key={o.id}>
                <strong style={{ color: "var(--burgundy)" }}>{o.titleAr}</strong>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {o.status} · {o.subject} · {o.educationLevel}
                </div>
                <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link href={`/curriculum`}>فتح في Curriculum OS</Link>
                  <Link href="/teachers">ربط معلّم</Link>
                </div>
              </li>
            ))}
          </ul>
          {snap?.reformulation?.pipeline ? (
            <div className="jo-pipe">
              <span>الآن: {snap.reformulation.pipeline.now}</span>
              <span>بعدين: {snap.reformulation.pipeline.next}</span>
              <span>ثم: {snap.reformulation.pipeline.then}</span>
              <span>لاحقاً: {snap.reformulation.pipeline.later}</span>
            </div>
          ) : null}
        </section>

        {snap?.doctrineAr ? (
          <section className="jo-panel jo-doctrine">
            <h2>عقيدة الموجة</h2>
            <ul>
              {snap.doctrineAr.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {snap.nextCountryHint ? (
              <p style={{ color: "var(--muted)" }}>{snap.nextCountryHint}</p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

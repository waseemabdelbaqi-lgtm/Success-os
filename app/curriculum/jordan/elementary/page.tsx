"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type GradeRow = {
  gradeAr: string;
  subjectCount: number;
  subjects: string[];
  outlines: number;
  lessonsLive: number;
  lessonsQueued: number;
};

type Slot = {
  id: string;
  gradeAr: string;
  subject: string;
  titleAr: string;
  status: string;
  href: string;
};

type Snap = {
  stage: { labelAr: string; gradesAr: string[]; pipeline: string[] };
  doctrineAr: string[];
  grades: GradeRow[];
  lessonSlots: Slot[];
  outlines: { count: number; published: number; items: Array<{ id: string; titleAr: string; subject: string; status: string }> };
  lastBuild: { builtAt?: string; totals?: Record<string, number> } | null;
  teacher?: {
    fullName?: string;
    href?: string;
    offerHref?: string;
    offerTitle?: string;
    durationMinutes?: number;
    lessonExplainHref?: string;
  };
  faculty?: Array<{
    id: string;
    fullName: string;
    fullNameAr?: string;
    roleAr?: string;
    elementarySubjects?: string[];
    profileUrl?: string;
    href?: string;
  }>;
  scienceOffer?: {
    id?: string;
    title?: string;
    href?: string;
    lessonExplainHref?: string;
  } | null;
};

export default function JordanElementaryStagePage(): ReactNode {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const reload = useCallback(() => {
    fetch("/api/curriculum-os?view=jordan-elementary", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSnap(json.elementary);
      })
      .catch(() => setMsg("تعذّر تحميل المرحلة الابتدائية"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function build() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "jordan-elementary-build",
          limitPerGrade: 12,
          publish: false,
          harvest: true,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "BUILD_FAILED");
      setSnap(json.elementary);
      setMsg(
        `بُنيت المرحلة: ${json.build?.totals?.outlinesCreated || 0} outlines · ${json.build?.totals?.lessonsLive || 0} دروس حية`,
      );
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="el-stage" dir="rtl">
      <style>{`
        .el-stage{
          --b:#9e1722;--d:#4b0a11;--g:#f2d77c;--m:#6b3a40;--i:#2a0c10;
          min-height:100vh;color:var(--i);
          background:
            radial-gradient(ellipse 70% 45% at 0% 0%, rgba(242,215,124,.28), transparent 50%),
            radial-gradient(ellipse 50% 40% at 100% 10%, rgba(158,23,34,.14), transparent 45%),
            linear-gradient(165deg,#fff9f2,#f4e6dc 55%,#efe0d4);
          font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;
          padding:1.25rem 1.25rem 4rem;
        }
        .el-wrap{max-width:1140px;margin:0 auto}
        .el-brand{font-size:clamp(2rem,5vw,3rem);font-weight:900;color:var(--b);margin:.25rem 0}
        .el-kicker{color:var(--d);font-weight:800}
        .el-lead{max-width:44rem;color:var(--m);line-height:1.75}
        .el-nav,.el-actions{display:flex;flex-wrap:wrap;gap:.55rem;margin:1rem 0}
        .el-nav a,.el-actions button{background:var(--b);color:#fff;border:0;text-decoration:none;padding:.55rem .9rem;border-radius:.55rem;font:inherit;font-weight:800;cursor:pointer}
        .el-nav a.ghost{background:transparent;color:var(--b);border:1px solid rgba(158,23,34,.35)}
        .el-actions a.gold{background:var(--g);color:var(--d);padding:.55rem .9rem;border-radius:.55rem;font-weight:900;text-decoration:none}
        .el-msg{font-weight:700;color:var(--d)}
        .el-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem;margin:1rem 0 1.25rem}
        .el-kpi{background:rgba(75,10,17,.07);border-radius:.75rem;padding:.7rem;text-align:center}
        .el-kpi b{display:block;font-size:1.35rem;color:var(--b)}
        .el-kpi span{font-size:.72rem;color:var(--m)}
        .el-grid{display:grid;gap:1rem;grid-template-columns:1.05fr .95fr}
        @media(max-width:900px){.el-grid{grid-template-columns:1fr}}
        .el-panel{background:rgba(255,255,255,.76);border:1px solid rgba(75,10,17,.1);border-radius:1rem;padding:1rem 1.1rem}
        .el-panel h2{margin:.1rem 0 .7rem;color:var(--d);font-size:1.1rem}
        .el-grade{border:1px solid rgba(75,10,17,.1);border-radius:.7rem;padding:.65rem .75rem;margin-bottom:.5rem;background:rgba(255,255,255,.65)}
        .el-grade strong{color:var(--b)}
        .el-tags{display:flex;flex-wrap:wrap;gap:.28rem;margin-top:.35rem}
        .el-tags i{font-style:normal;font-size:.7rem;background:rgba(158,23,34,.08);padding:.12rem .38rem;border-radius:.3rem}
        .el-slot{border:1px solid rgba(75,10,17,.1);border-radius:.65rem;padding:.6rem .7rem;margin-bottom:.45rem}
        .el-slot a{color:var(--b);font-weight:800;text-decoration:none}
        .el-badge{font-size:.7rem;font-weight:800;padding:.15rem .4rem;border-radius:.3rem;margin-inline-start:.35rem}
        .el-badge.live{background:#d9f5e3;color:#14532d}
        .el-badge.queued{background:#fff3cd;color:#7a5b00}
        .el-pipe{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.75rem}
        .el-pipe span{background:var(--d);color:var(--g);font-size:.72rem;font-weight:800;padding:.3rem .5rem;border-radius:.35rem}
        .el-faculty{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.65rem;margin-top:.75rem}
        .el-fac{
          border:1px solid rgba(75,10,17,.12);border-radius:.8rem;padding:.75rem .8rem;
          background:linear-gradient(165deg,rgba(255,255,255,.9),rgba(255,249,242,.85));
        }
        .el-fac strong{display:block;color:var(--b);font-size:.95rem}
        .el-fac em{display:block;font-style:normal;color:var(--m);font-size:.78rem;margin:.2rem 0 .45rem}
        .el-fac a{color:var(--d);font-weight:800;font-size:.78rem;text-decoration:none;margin-inline-end:.55rem}
      `}</style>

      <div className="el-wrap">
        <p className="el-kicker">SUCCESS OS · Jordan · Elementary · Success 4 Sure Faculty</p>
        <h1 className="el-brand">{snap?.stage.labelAr || "المرحلة الابتدائية"}</h1>
        <p className="el-lead">
          نبدأ من صفوف 1–6. شخصيات المعلّمين مأخوذة من معلّمي{" "}
          <a href="https://www.success4sureacademy.com/teachers/" style={{ color: "var(--b)", fontWeight: 800 }}>
            Success 4 Sure Academy
          </a>
          : رياضيات، علوم، إنجليزي، مهارات رقمية، ودراسات — ثم الدرس التفاعلي والشرح ≥30 دقيقة.
        </p>

        <nav className="el-nav">
          <Link href="/curriculum/jordan">موجة الأردن</Link>
          <Link href="/digital-library/middle-east/jordan" className="ghost">
            مكتبة الأردن
          </Link>
          <Link href="/teachers" className="ghost">
            معلّمون
          </Link>
          <Link href="/roots" className="ghost">
            الجذور
          </Link>
        </nav>

        <div className="el-actions">
          <button type="button" disabled={busy} onClick={build}>
            {busy ? "جاري بناء المرحلة…" : "ابدأ بناء المرحلة الابتدائية"}
          </button>
          <Link
            className="gold"
            href="/digital-library/middle-east/jordan/national/grade-1/الرياضيات/الجمع/الجمع-بخط-الأعداد"
          >
            درس حي · صف 1 رياضيات
          </Link>
          <Link
            className="gold"
            href="/digital-library/middle-east/jordan/national/grade-1/العلوم/الإنسان-والصحة/نحن-متشابهون-ومختلفون"
          >
            درس حي · صف 1 علوم
          </Link>
          <Link
            className="gold"
            href="/digital-library/middle-east/jordan/national/grade-2/الرياضيات/القيمة-المكانية/العشرات-والآحاد"
          >
            درس حي · صف 2 رياضيات
          </Link>
          {snap?.teacher?.lessonExplainHref ? (
            <Link className="gold" href={snap.teacher.lessonExplainHref}>
              شرح رياضيات 35د · أ. نسيم اللبدي
            </Link>
          ) : null}
          {snap?.scienceOffer?.lessonExplainHref ? (
            <Link className="gold" href={snap.scienceOffer.lessonExplainHref}>
              شرح علوم 35د · أ. وسيم اللبدي
            </Link>
          ) : null}
        </div>

        {snap?.faculty?.length ? (
          <section className="el-panel" style={{ marginBottom: "1rem" }}>
            <h2>هيئة معلّمي Success 4 Sure · المرحلة الابتدائية</h2>
            <p style={{ color: "var(--m)", marginTop: 0 }}>
              شخصيات حقيقية من موقع الأكاديمية — مربوطة بمواد الصفوف 1–6 على SUCCESS OS.
            </p>
            <div className="el-faculty">
              {snap.faculty.map((t) => (
                <article key={t.id} className="el-fac">
                  <strong>{t.fullNameAr || t.fullName}</strong>
                  <em>{t.roleAr || (t.elementarySubjects || []).join(" · ")}</em>
                  {t.href ? <Link href={t.href}>ملف Teachers OS</Link> : null}
                  {t.profileUrl ? (
                    <a href={t.profileUrl} target="_blank" rel="noreferrer">
                      صفحة S4S
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
            <div className="el-actions" style={{ marginTop: "0.85rem" }}>
              {snap.teacher?.offerHref ? (
                <Link href={snap.teacher.offerHref}>عرض رياضيات · نسيم</Link>
              ) : null}
              {snap.scienceOffer?.href ? (
                <Link href={snap.scienceOffer.href} className="ghost">
                  عرض علوم · وسيم
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        {msg ? <p className="el-msg">{msg}</p> : null}

        <div className="el-kpis">
          <div className="el-kpi">
            <b>{snap?.grades?.length ?? 6}</b>
            <span>صفوف ابتدائية</span>
          </div>
          <div className="el-kpi">
            <b>{snap?.grades?.reduce((n, g) => n + g.subjectCount, 0) ?? "—"}</b>
            <span>مواد مفهرسة</span>
          </div>
          <div className="el-kpi">
            <b>{snap?.outlines.count ?? 0}</b>
            <span>outlines</span>
          </div>
          <div className="el-kpi">
            <b>{snap?.lessonSlots?.filter((s) => s.status === "live").length ?? 0}</b>
            <span>دروس حية</span>
          </div>
          <div className="el-kpi">
            <b>{snap?.lessonSlots?.filter((s) => s.status === "queued").length ?? 0}</b>
            <span>في الطابور</span>
          </div>
        </div>

        <div className="el-grid">
          <section className="el-panel">
            <h2>الصفوف 1–6</h2>
            {(snap?.grades || []).map((g) => (
              <article key={g.gradeAr} className="el-grade">
                <strong>{g.gradeAr}</strong>
                <small style={{ color: "var(--m)" }}>
                  {" "}
                  · {g.subjectCount} مواد · {g.outlines} outlines · {g.lessonsLive} دروس حية
                </small>
                <div className="el-tags">
                  {(g.subjects || []).slice(0, 12).map((s) => (
                    <i key={s}>{s}</i>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="el-panel">
            <h2>دروس المرحلة (حية / طابور)</h2>
            {(snap?.lessonSlots || []).map((s) => (
              <div key={s.id} className="el-slot">
                <div>
                  <Link href={s.href}>{s.titleAr}</Link>
                  <span className={`el-badge ${s.status === "live" ? "live" : "queued"}`}>
                    {s.status === "live" ? "حي" : "طابور"}
                  </span>
                </div>
                <small style={{ color: "var(--m)" }}>
                  {s.gradeAr} · {s.subject}
                </small>
              </div>
            ))}
            {snap?.stage.pipeline ? (
              <div className="el-pipe">
                {snap.stage.pipeline.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <section className="el-panel" style={{ marginTop: "1rem" }}>
          <h2>Outlines الابتدائية</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".45rem" }}>
            {(snap?.outlines.items || []).slice(0, 24).map((o) => (
              <li
                key={o.id}
                style={{
                  border: "1px solid rgba(75,10,17,.1)",
                  borderRadius: ".6rem",
                  padding: ".55rem .65rem",
                }}
              >
                <strong style={{ color: "var(--b)" }}>{o.titleAr}</strong>
                <div style={{ fontSize: ".78rem", color: "var(--m)" }}>
                  {o.status} · {o.subject}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {snap?.doctrineAr ? (
          <section className="el-panel" style={{ marginTop: "1rem" }}>
            <h2>عقيدة المرحلة</h2>
            <ul>
              {snap.doctrineAr.map((line) => (
                <li key={line} style={{ color: "var(--m)", margin: ".35rem 0" }}>
                  {line}
                </li>
              ))}
            </ul>
            {snap.lastBuild?.builtAt ? (
              <p style={{ color: "var(--m)", fontSize: ".85rem" }}>
                آخر بناء: {new Date(snap.lastBuild.builtAt).toLocaleString("ar")}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

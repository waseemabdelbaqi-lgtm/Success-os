"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type Outline = {
  id: string;
  status: string;
  titleAr: string;
  titleEn: string;
  subject: string;
  chapter: string;
  region: string;
  country: string;
  curriculumType: string;
  fileName: string;
  libraryPath: string;
  uploadedBy: string;
  tags?: string[];
  outlineMarkdown?: string;
};

type Snapshot = {
  counts: {
    outlines: number;
    published: number;
    draft: number;
    teachersApproved: number;
    offersLive: number;
  };
  outlines: Outline[];
  doctrine: { titleAr: string; lines: string[] };
};

const emptyForm = {
  titleAr: "",
  titleEn: "",
  subject: "physics",
  chapter: "",
  region: "middle-east",
  country: "jordan",
  curriculumType: "national",
  educationLevel: "secondary",
  tags: "Jordan, curriculum",
  outlineMarkdown: "",
  fileName: "",
};

/**
 * Curriculum OS — partner uploads outlines that feed Library + Teachers.
 */
export default function CurriculumOsPage(): ReactNode {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Outline | null>(null);

  const reload = useCallback(() => {
    fetch("/api/curriculum-os?view=snapshot", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setSnapshot(json.snapshot);
      })
      .catch(() => setMsg("تعذّر تحميل Curriculum OS"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setForm((f) => ({
      ...f,
      fileName: file.name,
      outlineMarkdown: text.slice(0, 120000),
      titleAr: f.titleAr || file.name.replace(/\.[^.]+$/, ""),
      titleEn: f.titleEn || file.name.replace(/\.[^.]+$/, ""),
    }));
  }

  async function ingest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest",
          uploadedBy: "Waseem · Partner",
          ...form,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "INGEST_FAILED");
      setMsg(`تم استقبال المنهاج: ${json.outline.titleAr}`);
      setForm(emptyForm);
      reload();
    } catch (err) {
      setMsg(String((err as Error)?.message || err));
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", id, actor: "Waseem · Partner" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "PUBLISH_FAILED");
      setMsg(`نُشر: ${json.outline.titleAr}`);
      reload();
    } catch (err) {
      setMsg(String((err as Error)?.message || err));
    } finally {
      setBusy(false);
    }
  }

  const counts = snapshot?.counts;

  return (
    <div className="curriculum-os" dir="rtl">
      <style>{`
        .curriculum-os{
          --c-ink:#2a0c10;--c-muted:#6b3a40;--c-burgundy:#9e1722;--c-deep:#4b0a11;--c-gold:#f2d77c;
          min-height:100vh;color:var(--c-ink);
          background:
            radial-gradient(ellipse 80% 50% at 10% -10%, rgba(242,215,124,.22), transparent 50%),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(158,23,34,.12), transparent 45%),
            linear-gradient(165deg,#fff8f0 0%,#f7ebe4 40%,#f3e2d8 100%);
          font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;
          padding:1.25rem 1.25rem 4rem;
        }
        .curriculum-os a{color:var(--c-deep);font-weight:700}
        .c-hero{max-width:1100px;margin:0 auto 1.5rem}
        .c-brand{font-size:clamp(2rem,5vw,3.2rem);font-weight:900;letter-spacing:-.02em;color:var(--c-burgundy);margin:.35rem 0}
        .c-lead{max-width:42rem;color:var(--c-muted);line-height:1.7;margin:0}
        .c-kicker{color:var(--c-deep);font-weight:800;font-size:.85rem;letter-spacing:.04em}
        .c-nav{display:flex;flex-wrap:wrap;gap:.65rem;margin:1rem 0 0}
        .c-nav a{background:var(--c-burgundy);color:#fff;text-decoration:none;padding:.55rem .9rem;border-radius:.55rem}
        .c-nav a.ghost{background:transparent;color:var(--c-burgundy);border:1px solid rgba(158,23,34,.35)}
        .c-grid{max-width:1100px;margin:0 auto;display:grid;gap:1.25rem;grid-template-columns:1.1fr .9fr}
        @media(max-width:900px){.c-grid{grid-template-columns:1fr}}
        .c-panel{background:rgba(255,255,255,.72);border:1px solid rgba(75,10,17,.12);border-radius:1rem;padding:1.1rem 1.15rem;backdrop-filter:blur(8px)}
        .c-panel h2{margin:.2rem 0 .75rem;font-size:1.15rem;color:var(--c-deep)}
        .c-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.65rem;margin:1rem 0 1.5rem;max-width:1100px}
        .c-kpi{background:rgba(75,10,17,.06);border-radius:.75rem;padding:.75rem;text-align:center}
        .c-kpi b{display:block;font-size:1.4rem;color:var(--c-burgundy)}
        .c-kpi span{font-size:.75rem;color:var(--c-muted)}
        label{display:block;font-size:.78rem;font-weight:700;color:var(--c-muted);margin:.55rem 0 .2rem}
        input,textarea,select{width:100%;border:1px solid rgba(75,10,17,.2);border-radius:.55rem;padding:.55rem .65rem;font:inherit;background:#fff}
        textarea{min-height:160px;resize:vertical}
        button{margin-top:.85rem;background:var(--c-burgundy);color:#fff;border:0;border-radius:.55rem;padding:.65rem 1rem;font:inherit;font-weight:800;cursor:pointer}
        button:disabled{opacity:.55;cursor:wait}
        .c-msg{margin:.75rem 0;color:var(--c-deep);font-weight:700}
        .c-list{list-style:none;margin:0;padding:0;display:grid;gap:.65rem}
        .c-list li{border:1px solid rgba(75,10,17,.1);border-radius:.75rem;padding:.7rem .8rem;background:rgba(255,255,255,.65)}
        .c-list strong{display:block;color:var(--c-burgundy)}
        .c-list small{color:var(--c-muted)}
        .c-actions{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.45rem}
        .c-actions button,.c-actions a{font-size:.78rem;padding:.35rem .65rem;border-radius:.45rem;text-decoration:none}
        .c-actions button.ghost,.c-actions a.ghost{background:transparent;color:var(--c-burgundy);border:1px solid rgba(158,23,34,.3)}
        .c-doctrine{max-width:1100px;margin:1.5rem auto 0}
        .c-doctrine li{margin:.35rem 0;color:var(--c-muted)}
        .c-preview{white-space:pre-wrap;font-size:.82rem;line-height:1.55;max-height:280px;overflow:auto;background:rgba(75,10,17,.04);padding:.75rem;border-radius:.55rem}
      `}</style>

      <header className="c-hero">
        <p className="c-kicker">SUCCESS OS · Curriculum OS</p>
        <h1 className="c-brand">المناهج</h1>
        <p className="c-lead">
          ارفع ملفات المناهج هنا. نحولها إلى outlines، نربطها بالمكتبة الرقمية والدروس التفاعلية،
          والمعلّم يصير معلّماً حقيقياً عبر Teachers OS — مشروع واحد، جذر واحد.
        </p>
        <nav className="c-nav" aria-label="روابط المنظومة">
          <Link href="/curriculum/jordan">موجة الأردن 1</Link>
          <Link href="/digital-library" className="ghost">
            المكتبة الرقمية
          </Link>
          <Link href="/teachers" className="ghost">
            معلّمون حقيقيون
          </Link>
          <Link href="/roots" className="ghost">
            الجذور
          </Link>
          <Link href="/guide" className="ghost">
            دليل الشريك
          </Link>
        </nav>
      </header>

      {counts ? (
        <div className="c-kpis">
          <div className="c-kpi">
            <b>{counts.outlines}</b>
            <span>منـاهج</span>
          </div>
          <div className="c-kpi">
            <b>{counts.published}</b>
            <span>منشورة</span>
          </div>
          <div className="c-kpi">
            <b>{counts.draft}</b>
            <span>مسودات</span>
          </div>
          <div className="c-kpi">
            <b>{counts.teachersApproved}</b>
            <span>معلّمون معتمدون</span>
          </div>
          <div className="c-kpi">
            <b>{counts.offersLive}</b>
            <span>عروض حية</span>
          </div>
        </div>
      ) : null}

      {msg ? <p className="c-msg" style={{ maxWidth: 1100, margin: "0 auto 1rem" }}>{msg}</p> : null}

      <div className="c-grid">
        <form className="c-panel" onSubmit={ingest}>
          <h2>رفع ملف منهاج</h2>
          <label>ملف نصي / Markdown / JSON</label>
          <input
            type="file"
            accept=".md,.txt,.json,.markdown,text/plain,text/markdown,application/json"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <label>العنوان بالعربية</label>
          <input
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            required
          />
          <label>Title (EN)</label>
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
          />
          <label>المادة</label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <label>الفصل / الوحدة</label>
          <input
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            placeholder="quantum-physics"
          />
          <label>المنطقة</label>
          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          >
            <option value="middle-east">Middle East</option>
            <option value="international-systems">International Systems</option>
            <option value="north-africa">North Africa</option>
            <option value="europe">Europe</option>
            <option value="north-america">North America</option>
            <option value="east-asia">East Asia</option>
            <option value="rest-of-asia">Rest of Asia</option>
            <option value="oceania">Oceania</option>
          </select>
          <label>الدولة</label>
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <label>نوع المنهاج</label>
          <input
            value={form.curriculumType}
            onChange={(e) => setForm({ ...form, curriculumType: e.target.value })}
          />
          <label>وسوم (مفصولة بفاصلة)</label>
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <label>نص المنهاج / Outline</label>
          <textarea
            value={form.outlineMarkdown}
            onChange={(e) => setForm({ ...form, outlineMarkdown: e.target.value })}
            required
            placeholder="الصق محتوى المنهاج أو ارفع ملفاً…"
          />
          <button type="submit" disabled={busy}>
            {busy ? "جاري الاستقبال…" : "استقبل المنهاج في SUCCESS OS"}
          </button>
        </form>

        <section className="c-panel">
          <h2>المناهج في المنظومة</h2>
          <ul className="c-list">
            {(snapshot?.outlines || []).map((o) => (
              <li key={o.id}>
                <strong>{o.titleAr}</strong>
                <small>
                  {o.status} · {o.subject} · {o.country} · {o.fileName}
                </small>
                <div className="c-actions">
                  <button type="button" className="ghost" onClick={() => setSelected(o)}>
                    معاينة
                  </button>
                  {o.status !== "published" ? (
                    <button type="button" onClick={() => publish(o.id)} disabled={busy}>
                      نشر
                    </button>
                  ) : null}
                  <Link className="ghost" href={o.libraryPath}>
                    فتح في المكتبة
                  </Link>
                  <Link className="ghost" href="/teachers">
                    معلّمون
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          {selected ? (
            <div style={{ marginTop: "1rem" }}>
              <h2>{selected.titleAr}</h2>
              <pre className="c-preview">{selected.outlineMarkdown || "—"}</pre>
            </div>
          ) : null}
        </section>
      </div>

      {snapshot?.doctrine ? (
        <section className="c-panel c-doctrine">
          <h2>{snapshot.doctrine.titleAr}</h2>
          <ul>
            {snapshot.doctrine.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

type StudioStatus = {
  ready?: boolean;
  geminiReady?: boolean;
  activeProvider?: string | null;
  messageAr?: string;
  required?: {
    gemini?: string[];
    recommended?: string[];
    alternative?: string[];
    optionalVoiceUpgrade?: string[];
  };
  gemini?: { configured?: boolean; operational?: boolean };
  providers?: {
    avatar?: Array<{ id: string; label: string; operational?: boolean; configured?: boolean }>;
  };
};

type Job = {
  id?: string;
  provider?: string;
  status?: string;
  videoUrl?: string;
  failure?: string;
  estimatedMinutes?: number;
};

type Snapshot = {
  lesson?: { teacherName?: string; titleAr?: string; previewVideo?: string };
  script?: { words?: number; estimatedMinutes?: number; parts?: number; error?: string };
  job?: Job | null;
  studio?: StudioStatus;
};

export function ElementaryStudioPanel({ slug }: { slug: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/elementary-studio?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const data = await r.json();
    setSnap(data);
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function geminiRebuild() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/elementary-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "gemini-rebuild", slug, steps: ["all"] }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.message || data.error || "فشل Gemini");
      } else {
        setMsg("تم إعادة البناء عبر Gemini — حدّث الصفحة وشغّل الفيديو");
      }
      await load();
    } catch {
      setMsg("تعذر الاتصال بـ Gemini");
    } finally {
      setBusy(false);
    }
  }

  async function produce() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/elementary-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "produce", slug }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.message || data.error || "فشل الإنتاج");
      } else {
        setMsg(`بدأ الإنتاج عبر ${data.job?.provider || "studio"} — رقم المهمة ${data.job?.id || ""}`);
      }
      await load();
    } catch {
      setMsg("تعذر الاتصال بالاستوديو");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/elementary-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh", slug }),
      });
      const data = await r.json();
      if (!r.ok) setMsg(data.message || data.error || "فشل التحديث");
      else if (data.job?.status === "completed") setMsg("الفيديو الاستوديو جاهز");
      else setMsg(`الحالة: ${data.job?.status || "processing"}`);
      await load();
    } catch {
      setMsg("تعذر تحديث حالة المهمة");
    } finally {
      setBusy(false);
    }
  }

  const studio = snap?.studio;
  const job = snap?.job;
  const ready = Boolean(studio?.ready);
  const geminiOk = Boolean(studio?.geminiReady);

  return (
    <section className="es" dir="rtl">
      <style>{css}</style>
      <header>
        <h3>استوديو المعلّمة المساعدة</h3>
        <p>
          1) <b>Gemini</b> يعيد بناء السكربت والصور · 2) <b>HeyGen</b> معلّمة تتحرك وتتكلم. بدون المفاتيح الجودة بتظل ضعيفة.
        </p>
      </header>

      <div className="es-grid">
        <article>
          <h4>Gemini</h4>
          <p className={geminiOk ? "ok" : "bad"}>
            {geminiOk ? "مفتاح Gemini موجود — جاهز لإعادة البناء" : "ما في GEMINI_API_KEY — أضفه الآن"}
          </p>
          {!geminiOk ? (
            <div className="keys">
              <p>ضع في `.env.local` ثم أعد تشغيل السيرفر:</p>
              <code>GEMINI_API_KEY=...</code>
            </div>
          ) : null}
          <div className="btns">
            <button type="button" className="gem" disabled={busy || !geminiOk} onClick={geminiRebuild}>
              {busy ? "…" : "أعد البناء بـ Gemini"}
            </button>
          </div>
        </article>

        <article>
          <h4>HeyGen / Synthesia</h4>
          <p className={ready ? "ok" : "bad"}>{ready ? `جاهز: ${studio?.activeProvider}` : "غير مهيأ — لمعلّمة متحركة"}</p>
          <ul>
            {(studio?.providers?.avatar || []).slice(0, 3).map((p) => (
              <li key={p.id}>
                {p.label}: {p.operational ? "يعمل" : "بدون مفتاح"}
              </li>
            ))}
          </ul>
          {!ready ? (
            <div className="keys">
              <code>
                {(studio?.required?.recommended || ["HEYGEN_API_KEY", "HEYGEN_AVATAR_ID", "HEYGEN_VOICE_ID"]).join(
                  "\n",
                )}
              </code>
            </div>
          ) : null}
          <p className="teacher">{snap?.lesson?.teacherName}</p>
          <div className="btns">
            <button type="button" disabled={busy || !ready} onClick={produce}>
              {busy ? "…" : "أنتج بـ HeyGen"}
            </button>
            <button type="button" disabled={busy || !job?.id} onClick={refresh}>
              حدّث الحالة
            </button>
          </div>
          {job ? (
            <p className="job">
              مهمة {job.id} · {job.provider} · {job.status}
            </p>
          ) : null}
          {job?.videoUrl ? (
            <p>
              <a href={job.videoUrl} target="_blank" rel="noreferrer">
                افتح فيديو الاستوديو
              </a>
            </p>
          ) : null}
          {msg ? <p className="msg">{msg}</p> : null}
        </article>
      </div>
      <p className="foot">{studio?.messageAr}</p>
    </section>
  );
}

const css = `
.es{margin:1rem 0;padding:1rem;border-radius:1rem;background:linear-gradient(165deg,#fff9f2,#f3e4d7);border:1px solid rgba(75,10,17,.12);color:#241618;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.es header h3{margin:0 0 .35rem;color:#4b0a11}
.es header p{margin:0 0 .8rem;color:#6b3a40}
.es-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
@media(max-width:860px){.es-grid{grid-template-columns:1fr}}
.es article{background:rgba(255,255,255,.75);border-radius:.8rem;padding:.8rem;border:1px solid rgba(75,10,17,.08)}
.es h4{margin:0 0 .45rem;color:#9e1722}
.es .ok{color:#14532d;font-weight:800}
.es .bad{color:#9e1722;font-weight:800}
.es ul{margin:.3rem 0;padding-inline-start:1.1rem}
.es .keys code{display:block;white-space:pre-wrap;background:#1a0d10;color:#f2d77c;padding:.65rem;border-radius:.55rem;font-size:.78rem}
.es .alt{font-size:.8rem;color:#6b3a40}
.es .btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.55rem 0}
.es button{border:0;border-radius:.5rem;padding:.5rem .75rem;font:inherit;font-weight:800;cursor:pointer;background:#9e1722;color:#fff}
.es button.gem{background:#1a73e8}
.es button:disabled{opacity:.4;cursor:not-allowed}
.es .teacher{font-weight:800;color:#4b0a11}
.es .job,.es .msg,.es .foot{font-size:.85rem;color:#6b3a40}
.es a{color:#9e1722;font-weight:800}
`;

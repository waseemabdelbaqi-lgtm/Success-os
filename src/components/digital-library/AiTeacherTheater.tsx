"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Beat = {
  id: string;
  title: string;
  duration: number;
};

type Manifest = {
  teacher?: string;
  teacherName?: string;
  voice?: string;
  video?: string;
  poster?: string;
  duration?: number;
  beats?: Beat[];
};

type Props = {
  slug: string;
  title: string;
  teacherName?: string;
};

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** JoAcademy-style course lesson player: real MP4 + chapters + activities. */
export function AiTeacherTheater({ slug, title, teacherName = "أ. لاما النوري" }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showActs, setShowActs] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const beats = manifest?.beats || [];
  const videoSrc = manifest?.video;
  const poster = manifest?.poster || "/ai-lessons/g1-math/poster.jpg";
  const name = manifest?.teacher || manifest?.teacherName || teacherName;

  useEffect(() => {
    const path = slug.includes("science")
      ? "/ai-lessons/g1-science/manifest.json"
      : "/ai-lessons/g1-math/manifest.json";
    fetch(path, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setManifest(data))
      .catch(() => setManifest(null));
  }, [slug]);

  const chapterStarts = useMemo(() => {
    let acc = 0;
    return beats.map((b) => {
      const start = acc;
      acc += b.duration || 0;
      return start;
    });
  }, [beats]);

  const activeChapter = useMemo(() => {
    if (!beats.length) return 0;
    let i = 0;
    for (; i < chapterStarts.length - 1; i++) {
      if (current < chapterStarts[i + 1]) break;
    }
    return i;
  }, [beats.length, chapterStarts, current]);

  function seekChapter(i: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = chapterStarts[i] || 0;
    void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    setShowActs(false);
  }

  if (!videoSrc) {
    return (
      <section className="ja" id="ai-class" dir="rtl">
        <style>{css}</style>
        <div className="ja-empty">
          <h2>{title}</h2>
          <p>فيديو الحصة قيد التحضير للمعلمة {name}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ja" id="ai-class" dir="rtl">
      <style>{css}</style>
      <div className="ja-course">
        <div className="ja-main">
          <div className="ja-screen">
            <video
              ref={videoRef}
              className="ja-video"
              src={videoSrc}
              poster={poster}
              playsInline
              preload="metadata"
              controls
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
              onLoadedMetadata={() =>
                setDuration(videoRef.current?.duration || manifest?.duration || 0)
              }
              onEnded={() => {
                setPlaying(false);
                setShowActs(true);
              }}
            />
          </div>

          <div className="ja-info">
            <div>
              <p className="ja-kicker">درس مصوّر · منهج أردني · الصف الأول</p>
              <h2>{title}</h2>
              <p className="ja-teacher">
                المعلمة <strong>{name}</strong>
                {manifest?.voice ? <span> · صوت أردني ({manifest.voice})</span> : null}
              </p>
            </div>
            <div className="ja-actions">
              <button
                type="button"
                className="play"
                onClick={() => {
                  const v = videoRef.current;
                  if (!v) return;
                  if (v.paused) void v.play().then(() => setPlaying(true));
                  else {
                    v.pause();
                    setPlaying(false);
                  }
                }}
              >
                {playing ? "إيقاف" : "تشغيل الدرس"}
              </button>
              <button
                type="button"
                className="gold"
                onClick={() => {
                  videoRef.current?.pause();
                  setPlaying(false);
                  setShowActs(true);
                  document.getElementById("ai-acts")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                تفاعليات
              </button>
              <span>
                {fmt(current)} / {fmt(duration || manifest?.duration || 0)}
              </span>
            </div>
          </div>
        </div>

        <aside className="ja-side">
          <h3>محتوى الحصة</h3>
          <ol>
            {beats.map((b, i) => (
              <li key={b.id}>
                <button type="button" className={i === activeChapter ? "on" : ""} onClick={() => seekChapter(i)}>
                  <em>{String(i + 1).padStart(2, "0")}</em>
                  <span>
                    <b>{b.title}</b>
                    <small>{fmt(chapterStarts[i] || 0)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {showActs ? <Acts /> : null}
      <p className="ja-foot">
        ستايل دروس يوتيوب للصف الأول · معلمة أردنية الملامح · صوت نسائي أردني · محتوى أصلي وشخصيات وهميّة
      </p>
    </section>
  );
}

function Acts() {
  const items = [
    { q: "٣ + ٤ = ؟", a: "٧", c: ["٥", "٦", "٧", "٨"] },
    { q: "من ٥ قفزتين؟", a: "٧", c: ["٦", "٧", "٨"] },
    { q: "٦ + ٣ = ؟", a: "٩", c: ["٨", "٩", "١٠"] },
  ];
  const [ok, setOk] = useState<Record<number, boolean | null>>({});
  return (
    <div className="ja-acts" id="ai-acts">
      <h3>تفاعليات بعد المشاهدة</h3>
      {items.map((it, i) => (
        <article key={it.q}>
          <p>{it.q}</p>
          {it.c.map((x) => (
            <button key={x} type="button" onClick={() => setOk((o) => ({ ...o, [i]: x === it.a }))}>
              {x}
            </button>
          ))}
          {ok[i] === true ? <em className="g">برافو</em> : null}
          {ok[i] === false ? <em className="b">ارجع لمقطع الحل</em> : null}
        </article>
      ))}
    </div>
  );
}

const css = `
.ja{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;--ink:#241618;margin:1rem 0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:var(--ink)}
.ja-course{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(240px,.85fr);gap:1rem;align-items:start}
@media(max-width:960px){.ja-course{grid-template-columns:1fr}}
.ja-main{min-width:0}
.ja-screen{background:#0f0f0f;border-radius:.85rem;overflow:hidden;border:1px solid rgba(0,0,0,.25);box-shadow:0 16px 36px rgba(0,0,0,.22);aspect-ratio:16/9}
.ja-video{display:block;width:100%;height:100%;object-fit:contain;background:#0f0f0f}
.ja-info{margin-top:.85rem;display:flex;flex-wrap:wrap;gap:.8rem;justify-content:space-between;align-items:flex-end;padding:.15rem .1rem}
.ja-kicker{margin:0;color:var(--b);font-weight:800;font-size:.82rem}
.ja-kicker::before{content:"▶ ";color:#c00}
.ja-info h2{margin:.2rem 0;font-size:clamp(1.15rem,2.5vw,1.55rem);color:var(--d)}
.ja-teacher{margin:.15rem 0 0;color:#6b3a40;font-size:.92rem}
.ja-teacher strong{color:var(--b)}
.ja-actions{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center}
.ja-actions button{border:0;border-radius:.55rem;padding:.55rem .9rem;font:inherit;font-weight:800;cursor:pointer}
.ja-actions .play{background:var(--b);color:#fff}
.ja-actions .gold{background:var(--g);color:var(--d)}
.ja-actions span{font-weight:700;color:#6b3a40;font-variant-numeric:tabular-nums}
.ja-side{background:linear-gradient(180deg,#fff9f3,#f4e6da);border:1px solid rgba(75,10,17,.12);border-radius:1rem;padding:.85rem;max-height:min(72vh,640px);overflow:auto;box-shadow:0 10px 28px rgba(36,16,18,.08)}
.ja-side h3{margin:0 0 .55rem;color:var(--d);font-size:1rem}
.ja-side ol{list-style:none;margin:0;padding:0}
.ja-side button{width:100%;display:flex;gap:.65rem;align-items:flex-start;border:0;border-radius:.7rem;padding:.55rem .6rem;margin:.22rem 0;background:rgba(255,255,255,.72);color:inherit;font:inherit;text-align:right;cursor:pointer}
.ja-side button.on{background:rgba(158,23,34,.12);outline:1px solid rgba(158,23,34,.35)}
.ja-side em{font-style:normal;min-width:1.7rem;color:var(--b);font-weight:900}
.ja-side b{display:block;font-size:.9rem;line-height:1.35}
.ja-side small{display:block;margin-top:.15rem;color:#7a4a50;font-weight:700}
.ja-foot{margin:.7rem 0 0;color:#6b3a40;font-size:.78rem;font-weight:700}
.ja-acts{margin-top:.95rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);border-radius:1rem;padding:1rem;border:1px solid rgba(75,10,17,.1)}
.ja-acts article{margin:.55rem 0;padding:.65rem;border-radius:.7rem;background:rgba(255,255,255,.85)}
.ja-acts button{margin:.12rem;border:0;border-radius:.45rem;padding:.4rem .7rem;font:inherit;font-weight:800;background:rgba(158,23,34,.1);cursor:pointer;color:var(--d)}
.ja-acts .g{color:#14532d;font-weight:800}.ja-acts .b{color:#9e1722;font-weight:800}
.ja-empty{padding:2rem 1.25rem;border-radius:1rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);border:1px solid rgba(75,10,17,.1);text-align:center}
`;

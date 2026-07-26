"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Beat = {
  id: string;
  title: string;
  duration: number;
  audio?: string;
};

type Manifest = {
  teacher?: string;
  teacherName?: string;
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

/**
 * Clean HTML5 lesson player — real MP4 with illustrated teacher + board.
 */
export function AiTeacherTheater({ slug, title, teacherName = "أ. لاما النوري" }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showActs, setShowActs] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const beats = manifest?.beats || [];
  const videoSrc = manifest?.video;
  const poster = manifest?.poster || "/ai-lessons/g1-math/faces/idle.png";
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
      <section className="lp" id="ai-class" dir="rtl">
        <style>{css}</style>
        <div className="lp-empty">
          <h2>{title}</h2>
          <p>فيديو الحصة قيد التحضير للمعلمة {name}.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="lp" id="ai-class" dir="rtl">
      <style>{css}</style>
      <div className="lp-shell">
        <div className="lp-screen">
          <video
            ref={videoRef}
            className="lp-video"
            src={videoSrc}
            poster={poster}
            playsInline
            preload="metadata"
            controls
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || manifest?.duration || 0)}
            onEnded={() => {
              setPlaying(false);
              setShowActs(true);
            }}
          />
          <div className="lp-badge">
            <b>{name}</b>
            <span>حصة مرئية · الصف الأول</span>
          </div>
          {playing ? <div className="lp-live">مباشر</div> : null}
        </div>

        <div className="lp-meta">
          <div>
            <h2>{title}</h2>
            <p>شاهِد الحصة كاملة، ثم انتقل للتفاعليات.</p>
          </div>
          <div className="lp-actions">
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
              {playing ? "إيقاف" : "تشغيل الحصة"}
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

        {beats.length ? (
          <ol className="lp-chapters">
            {beats.map((b, i) => (
              <li key={b.id}>
                <button type="button" className={i === activeChapter ? "on" : ""} onClick={() => seekChapter(i)}>
                  <em>{fmt(chapterStarts[i] || 0)}</em>
                  <span>{b.title}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {showActs ? <Acts /> : null}
      <p className="lp-foot">معلمة مرسومة تتحرك مع الشرح · صوت متزامن · طاقم الابتدائي معلّمات وهميات</p>
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
    <div className="lp-acts" id="ai-acts">
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
.lp{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;margin:1rem 0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:var(--d)}
.lp-shell{background:linear-gradient(160deg,#2a0f14,#12080a 60%,#1a0d10);border-radius:1.15rem;overflow:hidden;border:1px solid rgba(242,215,124,.35);box-shadow:0 20px 50px rgba(0,0,0,.35)}
.lp-screen{position:relative;background:#000;aspect-ratio:16/9}
.lp-video{display:block;width:100%;height:100%;object-fit:contain;background:#0a0607}
.lp-badge{position:absolute;right:1rem;bottom:1rem;background:rgba(12,6,8,.72);border:1px solid rgba(242,215,124,.4);border-radius:.7rem;padding:.45rem .7rem;color:#fff;backdrop-filter:blur(6px);pointer-events:none}
.lp-badge b{display:block;color:var(--g);font-size:.92rem}
.lp-badge span{font-size:.72rem;opacity:.85}
.lp-live{position:absolute;top:.85rem;left:.85rem;background:var(--b);color:#fff;font-weight:900;font-size:.68rem;padding:.28rem .55rem;border-radius:.4rem;letter-spacing:.04em}
.lp-meta{display:flex;flex-wrap:wrap;gap:.8rem;justify-content:space-between;align-items:center;padding:.9rem 1rem;color:#fff;background:#140a0c}
.lp-meta h2{margin:0;font-size:clamp(1.05rem,2.4vw,1.35rem);color:var(--g)}
.lp-meta p{margin:.25rem 0 0;opacity:.85;font-size:.9rem}
.lp-actions{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center}
.lp-actions button{border:0;border-radius:.55rem;padding:.55rem .85rem;font:inherit;font-weight:800;cursor:pointer;background:rgba(255,255,255,.1);color:#fff}
.lp-actions .play{background:var(--g);color:var(--d)}
.lp-actions .gold{background:var(--b);color:var(--g)}
.lp-actions span{margin-inline-start:.35rem;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums}
.lp-chapters{list-style:none;margin:0;padding:.35rem .7rem .85rem;max-height:180px;overflow:auto;background:#140a0c;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.35rem}
.lp-chapters button{width:100%;display:flex;gap:.55rem;border:0;border-radius:.5rem;padding:.42rem .55rem;background:rgba(255,255,255,.05);color:#fff;font:inherit;text-align:right;cursor:pointer}
.lp-chapters button.on{background:rgba(158,23,34,.5);outline:1px solid rgba(242,215,124,.35)}
.lp-chapters em{font-style:normal;color:var(--g);font-weight:800;min-width:2.3rem}
.lp-chapters span{font-size:.84rem;opacity:.92}
.lp-foot{margin:.55rem 0 0;color:#6b3a40;font-size:.78rem;font-weight:700}
.lp-acts{margin-top:.85rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);border-radius:1rem;padding:1rem;border:1px solid rgba(75,10,17,.1)}
.lp-acts article{margin:.55rem 0;padding:.65rem;border-radius:.7rem;background:rgba(255,255,255,.8)}
.lp-acts button{margin:.12rem;border:0;border-radius:.45rem;padding:.4rem .7rem;font:inherit;font-weight:800;background:rgba(158,23,34,.1);cursor:pointer;color:var(--d)}
.lp-acts .g{color:#14532d;font-weight:800}.lp-acts .b{color:#9e1722;font-weight:800}
.lp-empty{padding:2rem 1.25rem;border-radius:1rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);border:1px solid rgba(75,10,17,.1);text-align:center}
.lp-empty h2{margin:0 0 .5rem;color:var(--b)}
`;

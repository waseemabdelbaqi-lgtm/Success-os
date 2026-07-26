"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Board = {
  kind: "title" | "numberline" | "equation" | "cheer" | "story";
  title?: string;
  from?: number;
  hops?: number;
  equation?: string;
  story?: string;
};

type Beat = {
  id: string;
  file: string;
  duration: number;
  caption: string;
  board: Board;
};

type Manifest = {
  slug: string;
  voice: string;
  teacherName: string;
  teacherImage: string;
  beats: Beat[];
};

type Props = {
  slug: string;
  title: string;
  teacherName?: string;
};

function NumberLineBoard({ from = 0, hops = 0 }: { from?: number; hops?: number }) {
  const end = from + hops;
  const marks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <div className="vp-nl" dir="ltr">
      <div className="vp-nl-rail">
        {marks.map((n) => (
          <span key={n} className={n === from || n === end ? "hot" : ""}>
            {n}
          </span>
        ))}
      </div>
      <div className="vp-nl-track">
        <i
          style={{
            left: hops
              ? `calc(${(from / 20) * 100}% + ${(hops / 20) * 100}%)`
              : `${(from / 20) * 100}%`,
          }}
        />
      </div>
      <p>
        نبدأ {from}
        {hops ? ` · نقفز ${hops} · نصل ${end}` : ""}
      </p>
    </div>
  );
}

function BoardPanel({ board }: { board: Board }) {
  return (
    <div className="vp-board" key={`${board.kind}-${board.title}-${board.equation}-${board.from}-${board.hops}`}>
      {(board.kind === "title" || board.kind === "cheer") && <h3>{board.title}</h3>}
      {board.kind === "story" && <p className="story">{board.story}</p>}
      {board.kind === "equation" && <p className="eq">{board.equation}</p>}
      {board.kind === "numberline" && <NumberLineBoard from={board.from} hops={board.hops} />}
    </div>
  );
}

/**
 * Broadcast-grade AI lesson player: real female neural voice + teacher on screen.
 */
export function AiTeacherTheater({ slug, title, teacherName = "أ. لاما النوري" }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [ready, setReady] = useState(false);
  const [showActs, setShowActs] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beats = manifest?.beats || [];
  const beat = beats[idx];

  const total = useMemo(() => beats.reduce((n, b) => n + (b.duration || 0), 0), [beats]);
  const elapsed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < idx; i++) s += beats[i]?.duration || 0;
    return s + t;
  }, [beats, idx, t]);

  useEffect(() => {
    const path = slug.includes("science")
      ? "/ai-lessons/g1-science/manifest.json"
      : "/ai-lessons/g1-math/manifest.json";
    fetch(path, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setManifest(j);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [slug]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !beat?.file) return;
    a.src = beat.file;
    a.load();
    setT(0);
    if (playing) {
      a.play().catch(() => setPlaying(false));
    }
  }, [beat?.file, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing]);

  function onEnded() {
    if (idx >= beats.length - 1) {
      setPlaying(false);
      setShowActs(true);
      return;
    }
    setIdx((i) => i + 1);
  }

  function seekBeat(i: number) {
    setIdx(i);
    setT(0);
    setShowActs(false);
    setPlaying(true);
  }

  function fmt(sec: number) {
    const s = Math.max(0, Math.floor(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;
  const img = manifest?.teacherImage || "/ai-lessons/g1-math/teacher.png";
  const name = manifest?.teacherName || teacherName;

  return (
    <section className="vp" id="ai-class" dir="rtl">
      <style>{css}</style>
      <div className="vp-frame">
        <div className="vp-video">
          <img
            className={`vp-teacher ${playing ? "talking" : ""}`}
            src={img}
            alt={name}
          />
          <div className="vp-grade">بث تعليمي · SUCCESS OS</div>
          <div className="vp-overlay-board">
            {beat?.board ? <BoardPanel board={beat.board} /> : <div className="vp-board"><h3>{title}</h3></div>}
          </div>
          <div className="vp-caption">
            <strong>{name}</strong>
            <p>{beat?.caption || (ready ? "اضغط تشغيل لسماع الشرح" : "جاري التحميل…")}</p>
          </div>
          {playing ? <div className="vp-live">● LIVE VOICE</div> : null}
        </div>

        <audio
          ref={audioRef}
          preload="auto"
          onTimeUpdate={() => setT(audioRef.current?.currentTime || 0)}
          onEnded={onEnded}
        />

        <div className="vp-bar">
          <button
            type="button"
            className="main"
            onClick={() => {
              if (!beats.length) return;
              if (!playing && idx >= beats.length - 1 && t > (beat?.duration || 1) - 0.3) {
                setIdx(0);
                setT(0);
              }
              setPlaying((p) => !p);
            }}
          >
            {playing ? "إيقاف" : "▶ تشغيل الحصة"}
          </button>
          <button type="button" onClick={() => seekBeat(Math.max(0, idx - 1))} disabled={!idx}>
            السابق
          </button>
          <button
            type="button"
            onClick={() => seekBeat(Math.min(beats.length - 1, idx + 1))}
            disabled={idx >= beats.length - 1}
          >
            التالي
          </button>
          <button
            type="button"
            className="gold"
            onClick={() => {
              setPlaying(false);
              setShowActs(true);
              document.getElementById("ai-acts")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            تفاعليات
          </button>
          <span className="clock">
            {fmt(elapsed)} / {fmt(total || 0)}
          </span>
        </div>

        <div
          className="vp-scrub"
          onClick={(e) => {
            if (!beats.length) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = 1 - (e.clientX - rect.left) / rect.width;
            let acc = 0;
            const target = ratio * total;
            for (let i = 0; i < beats.length; i++) {
              if (acc + beats[i].duration >= target) {
                setIdx(i);
                setPlaying(true);
                requestAnimationFrame(() => {
                  const a = audioRef.current;
                  if (a) a.currentTime = Math.max(0, target - acc);
                });
                return;
              }
              acc += beats[i].duration;
            }
          }}
        >
          <i style={{ width: `${pct}%` }} />
        </div>

        <ol className="vp-chapters">
          {beats.map((b, i) => (
            <li key={b.id}>
              <button type="button" className={i === idx ? "on" : ""} onClick={() => seekBeat(i)}>
                <em>{fmt(beats.slice(0, i).reduce((n, x) => n + x.duration, 0))}</em>
                <span>{b.caption.slice(0, 42)}{b.caption.length > 42 ? "…" : ""}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {showActs ? <QuickActs /> : null}
      <p className="vp-note">
        صوت المعلّمة: عصبي أردني نسائي (Sana) · الصورة مولّدة للمنصة · أسماء وهمية
      </p>
    </section>
  );
}

function QuickActs() {
  const items = [
    { q: "٣ + ٤ = ؟", a: "٧", choices: ["٥", "٦", "٧", "٨"] },
    { q: "ابدأ من ٥ واقفز ٢. وين؟", a: "٧", choices: ["٦", "٧", "٨"] },
    { q: "٦ + ٣ = ؟", a: "٩", choices: ["٨", "٩", "١٠"] },
  ];
  const [ok, setOk] = useState<Record<number, boolean | null>>({});
  return (
    <div className="vp-acts" id="ai-acts">
      <h3>تفاعليات بعد الحصة</h3>
      {items.map((it, i) => (
        <article key={it.q}>
          <p>{it.q}</p>
          <div>
            {it.choices.map((c) => (
              <button key={c} type="button" onClick={() => setOk((o) => ({ ...o, [i]: c === it.a }))}>
                {c}
              </button>
            ))}
          </div>
          {ok[i] === true ? <em className="good">برافو!</em> : null}
          {ok[i] === false ? <em className="bad">سمع المقطع مرة ثانية</em> : null}
        </article>
      ))}
    </div>
  );
}

const css = `
.vp{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;margin:1rem 0 1.25rem;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:#fff}
.vp-frame{background:#0b0708;border-radius:1.15rem;overflow:hidden;border:1px solid rgba(242,215,124,.28);box-shadow:0 24px 70px rgba(0,0,0,.45)}
.vp-video{position:relative;aspect-ratio:16/9;background:#12090b;overflow:hidden}
.vp-teacher{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% center;transform:scale(1.02);transition:filter .3s}
.vp-teacher.talking{filter:saturate(1.08) contrast(1.04);animation:pulseSoft 1.8s ease-in-out infinite}
.vp-grade{position:absolute;top:.7rem;right:.7rem;background:rgba(0,0,0,.55);border:1px solid rgba(242,215,124,.35);color:var(--g);font-weight:800;font-size:.72rem;padding:.28rem .55rem;border-radius:.45rem;backdrop-filter:blur(6px)}
.vp-live{position:absolute;top:.7rem;left:.7rem;background:#9e1722;color:#fff;font-weight:900;font-size:.7rem;padding:.28rem .55rem;border-radius:.45rem;letter-spacing:.04em}
.vp-overlay-board{position:absolute;top:12%;left:3%;width:min(42%,340px);max-height:58%;}
.vp-board{background:rgba(255,249,242,.94);color:var(--d);border-radius:.85rem;padding:.85rem;border:2px solid rgba(242,215,124,.75);box-shadow:0 12px 40px rgba(0,0,0,.35);min-height:140px;display:flex;align-items:center;justify-content:center;animation:pop .35s ease}
.vp-board h3,.vp-board .eq,.vp-board .story{margin:0;text-align:center;font-weight:900}
.vp-board h3{font-size:clamp(1.1rem,2.4vw,1.7rem)}
.vp-board .eq{font-size:clamp(1.7rem,4vw,2.6rem)}
.vp-board .story{font-size:clamp(1.05rem,2.4vw,1.45rem);line-height:1.5}
.vp-caption{position:absolute;left:3%;right:3%;bottom:3%;background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.78));border:1px solid rgba(255,255,255,.12);border-radius:.8rem;padding:.7rem .9rem;backdrop-filter:blur(8px)}
.vp-caption strong{display:block;color:var(--g);font-size:.78rem;margin-bottom:.2rem}
.vp-caption p{margin:0;font-size:clamp(.95rem,2.1vw,1.2rem);font-weight:700;line-height:1.55}
.vp-bar{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;padding:.75rem .9rem .45rem;background:#140a0c}
.vp-bar button{border:0;border-radius:.55rem;padding:.55rem .85rem;font:inherit;font-weight:800;cursor:pointer;background:rgba(255,255,255,.1);color:#fff}
.vp-bar button:disabled{opacity:.35;cursor:not-allowed}
.vp-bar button.main{background:var(--g);color:var(--d)}
.vp-bar button.gold{background:var(--b);color:var(--g);border:1px solid rgba(242,215,124,.35)}
.vp-bar .clock{margin-inline-start:auto;color:rgba(255,255,255,.7);font-weight:700;font-variant-numeric:tabular-nums}
.vp-scrub{margin:0 .9rem .7rem;height:8px;border-radius:99px;background:rgba(255,255,255,.12);cursor:pointer;overflow:hidden;direction:ltr}
.vp-scrub i{display:block;height:100%;background:linear-gradient(90deg,#f2d77c,#9e1722)}
.vp-chapters{list-style:none;margin:0;padding:0 .7rem .8rem;display:grid;gap:.3rem;max-height:180px;overflow:auto;background:#140a0c}
.vp-chapters button{width:100%;display:flex;gap:.65rem;text-align:right;border:0;border-radius:.5rem;padding:.45rem .6rem;background:rgba(255,255,255,.05);color:#fff;font:inherit;cursor:pointer}
.vp-chapters button.on{background:rgba(158,23,34,.55);outline:1px solid rgba(242,215,124,.4)}
.vp-chapters em{font-style:normal;color:var(--g);font-weight:800;min-width:2.4rem}
.vp-chapters span{font-size:.86rem;opacity:.92}
.vp-note{margin:.55rem 0 0;color:#6b3a40;font-size:.78rem;font-weight:700}
.vp-acts{margin-top:.9rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);color:var(--d);border-radius:1rem;padding:1rem;border:1px solid rgba(75,10,17,.1)}
.vp-acts h3{margin:.1rem 0 .7rem}
.vp-acts article{margin-bottom:.65rem;padding:.7rem;border-radius:.7rem;background:rgba(255,255,255,.8)}
.vp-acts p{margin:.1rem 0 .4rem;font-weight:800}
.vp-acts button{margin:.12rem;border:0;border-radius:.45rem;padding:.4rem .7rem;font:inherit;font-weight:800;background:rgba(158,23,34,.1);color:var(--d);cursor:pointer}
.vp-acts .good{color:#14532d;font-weight:800}.vp-acts .bad{color:#9e1722;font-weight:800}
.vp-nl{width:100%}.vp-nl-rail{display:flex;justify-content:space-between;font-size:.58rem;font-weight:800;margin-bottom:.35rem}
.vp-nl-rail .hot{color:var(--b);transform:scale(1.2)}
.vp-nl-track{position:relative;height:12px;border-radius:99px;background:linear-gradient(90deg,#d8c2ad,#c9b09a)}
.vp-nl-track i{position:absolute;top:-9px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffd98a,#9e1722);transition:left .9s ease;box-shadow:0 4px 10px rgba(75,10,17,.3)}
.vp-nl p{margin:.4rem 0 0;text-align:center;font-weight:800;color:var(--b);font-size:.85rem}
@media(max-width:700px){
  .vp-overlay-board{position:absolute;top:auto;bottom:28%;left:4%;right:4%;width:auto;max-height:34%}
  .vp-board{min-height:110px;padding:.65rem}
  .vp-caption{padding:.55rem .7rem}
}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes pulseSoft{0%,100%{filter:saturate(1.05)}50%{filter:saturate(1.18) brightness(1.03)}}
`;

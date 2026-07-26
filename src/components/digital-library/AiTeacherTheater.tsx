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
  teacherName: string;
  faces: { idle: string; talk: string };
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
    <div className="yt-nl" dir="ltr">
      <div className="yt-nl-rail">
        {marks.map((n) => (
          <span key={n} className={n === from || n === end ? "hot" : ""}>
            {n}
          </span>
        ))}
      </div>
      <div className="yt-nl-track">
        <i
          style={{
            left: hops
              ? `calc(${(from / 20) * 100}% + ${(hops / 20) * 100}%)`
              : `${(from / 20) * 100}%`,
          }}
        />
      </div>
      <p>
        {from}
        {hops ? ` → +${hops} → ${end}` : ""}
      </p>
    </div>
  );
}

/**
 * YouTube-style talking-head lesson:
 * stylish female teacher faces + amplitude lip-sync + board.
 */
export function AiTeacherTheater({ slug, title, teacherName = "أ. لاما النوري" }: Props) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [level, setLevel] = useState(0);
  const [showActs, setShowActs] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const beats = manifest?.beats || [];
  const beat = beats[idx];

  const total = useMemo(() => beats.reduce((n, b) => n + b.duration, 0), [beats]);
  const elapsed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < idx; i++) s += beats[i].duration;
    return s + t;
  }, [beats, idx, t]);

  useEffect(() => {
    const path = slug.includes("science")
      ? "/ai-lessons/g1-science/manifest.json"
      : "/ai-lessons/g1-math/manifest.json";
    fetch(path, { cache: "no-store" })
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => {});
  }, [slug]);

  function ensureAudioGraph() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      const src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      srcRef.current = src;
    }
  }

  function startMeter() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      // Map to 0–1 mouth open amount
      setLevel(Math.min(1, rms * 4.2));
      rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevel(0);
  }

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !beat?.file) return;
    a.src = beat.file;
    a.load();
    setT(0);
    if (playing) {
      ensureAudioGraph();
      ctxRef.current?.resume();
      a.play()
        .then(() => startMeter())
        .catch(() => setPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat?.file, idx]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      ensureAudioGraph();
      ctxRef.current?.resume();
      a.play()
        .then(() => startMeter())
        .catch(() => setPlaying(false));
    } else {
      a.pause();
      stopMeter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => () => stopMeter(), []);

  function onEnded() {
    if (idx >= beats.length - 1) {
      setPlaying(false);
      stopMeter();
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
  const idle = manifest?.faces?.idle || "/ai-lessons/g1-math/faces/idle.png";
  const talk = manifest?.faces?.talk || "/ai-lessons/g1-math/faces/talk.png";
  const name = manifest?.teacherName || teacherName;
  const talkOpacity = playing ? Math.min(1, 0.15 + level * 1.35) : 0;
  const headNudge = playing ? level * 1.8 : 0;

  return (
    <section className="yt" id="ai-class" dir="rtl">
      <style>{css}</style>
      <div className="yt-shell">
        <div className="yt-stage">
          <div className="yt-cam">
            <div
              className={`yt-head ${playing ? "live" : ""}`}
              style={{ transform: `translateY(${headNudge * -1}px) rotate(${headNudge * 0.35}deg)` }}
            >
              <img src={idle} alt={name} className="face idle" />
              <img
                src={talk}
                alt=""
                className="face talk"
                style={{ opacity: talkOpacity }}
              />
              <div className="yt-glow" style={{ opacity: 0.25 + level * 0.55 }} />
            </div>
            <div className="yt-nameplate">
              <b>{name}</b>
              <span>معلّمة ستايل · حصة مرئية</span>
            </div>
            {playing ? <div className="yt-rec">● REC</div> : null}
          </div>

          <div className="yt-board-wrap">
            <div className="yt-board" key={beat?.id || "x"}>
              {!beat?.board || beat.board.kind === "title" || beat.board.kind === "cheer" ? (
                <h3>{beat?.board?.title || title}</h3>
              ) : null}
              {beat?.board?.kind === "story" ? <p className="story">{beat.board.story}</p> : null}
              {beat?.board?.kind === "equation" ? <p className="eq">{beat.board.equation}</p> : null}
              {beat?.board?.kind === "numberline" ? (
                <NumberLineBoard from={beat.board.from} hops={beat.board.hops} />
              ) : null}
            </div>
            <p className="yt-caption">{beat?.caption || "اضغط تشغيل — المعلّمة بتحكي وتتحرك"}</p>
          </div>
        </div>

        <audio
          ref={audioRef}
          preload="auto"
          crossOrigin="anonymous"
          onTimeUpdate={() => setT(audioRef.current?.currentTime || 0)}
          onEnded={onEnded}
        />

        <div className="yt-controls">
          <button
            type="button"
            className="play"
            onClick={() => {
              if (!beats.length) return;
              if (!playing && idx >= beats.length - 1) {
                setIdx(0);
                setT(0);
              }
              setPlaying((p) => !p);
            }}
          >
            {playing ? "❚❚ إيقاف" : "▶ تشغيل كفيديو يوتيوب"}
          </button>
          <button type="button" disabled={!idx} onClick={() => seekBeat(Math.max(0, idx - 1))}>
            السابق
          </button>
          <button
            type="button"
            disabled={idx >= beats.length - 1}
            onClick={() => seekBeat(Math.min(beats.length - 1, idx + 1))}
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
          <span>
            {fmt(elapsed)} / {fmt(total)}
          </span>
        </div>

        <div
          className="yt-scrub"
          onClick={(e) => {
            if (!beats.length) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = 1 - (e.clientX - rect.left) / rect.width;
            const target = ratio * total;
            let acc = 0;
            for (let i = 0; i < beats.length; i++) {
              if (acc + beats[i].duration >= target) {
                setIdx(i);
                setPlaying(true);
                requestAnimationFrame(() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.max(0, target - acc);
                });
                return;
              }
              acc += beats[i].duration;
            }
          }}
        >
          <i style={{ width: `${pct}%` }} />
        </div>

        <ol className="yt-chapters">
          {beats.map((b, i) => (
            <li key={b.id}>
              <button type="button" className={i === idx ? "on" : ""} onClick={() => seekBeat(i)}>
                <em>{fmt(beats.slice(0, i).reduce((n, x) => n + x.duration, 0))}</em>
                <span>{b.caption}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {showActs ? <Acts /> : null}
      <p className="yt-foot">
        ستايل قنوات الشرح على يوتيوب · معلّمة تتحرك مع الصوت · كل طاقم الابتدائي معلّمات وهميات ستايل
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
    <div className="yt-acts" id="ai-acts">
      <h3>تفاعليات</h3>
      {items.map((it, i) => (
        <article key={it.q}>
          <p>{it.q}</p>
          {it.c.map((x) => (
            <button key={x} type="button" onClick={() => setOk((o) => ({ ...o, [i]: x === it.a }))}>
              {x}
            </button>
          ))}
          {ok[i] === true ? <em className="g">برافو</em> : null}
          {ok[i] === false ? <em className="b">ارجع للمقطع</em> : null}
        </article>
      ))}
    </div>
  );
}

const css = `
.yt{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;margin:1rem 0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.yt-shell{background:#0e0a0b;border-radius:1.2rem;overflow:hidden;border:1px solid rgba(242,215,124,.3);box-shadow:0 22px 60px rgba(0,0,0,.4)}
.yt-stage{display:grid;grid-template-columns:1.05fr 1fr;min-height:360px;background:linear-gradient(145deg,#1a0d10,#3a1218 55%,#12080a)}
@media(max-width:860px){.yt-stage{grid-template-columns:1fr}}
.yt-cam{position:relative;display:flex;align-items:flex-end;justify-content:center;padding:1rem 1rem 1.2rem;min-height:340px}
.yt-head{position:relative;width:min(100%,340px);aspect-ratio:1;border-radius:1.1rem;overflow:hidden;border:3px solid rgba(242,215,124,.55);box-shadow:0 16px 40px rgba(0,0,0,.45);transition:transform .05s linear}
.yt-head.live{box-shadow:0 0 0 2px rgba(158,23,34,.5),0 16px 40px rgba(0,0,0,.45)}
.yt-head .face{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top}
.yt-head .face.talk{transition:opacity .04s linear}
.yt-glow{position:absolute;inset:auto 18% 8% 18%;height:18%;border-radius:50%;background:radial-gradient(circle,rgba(242,215,124,.45),transparent 70%);filter:blur(8px);pointer-events:none}
.yt-nameplate{position:absolute;left:1rem;right:1rem;bottom:.55rem;background:rgba(0,0,0,.62);border:1px solid rgba(242,215,124,.35);border-radius:.65rem;padding:.45rem .65rem;color:#fff;backdrop-filter:blur(6px)}
.yt-nameplate b{display:block;color:var(--g);font-size:.95rem}
.yt-nameplate span{font-size:.72rem;opacity:.85}
.yt-rec{position:absolute;top:.8rem;left:.8rem;background:#9e1722;color:#fff;font-weight:900;font-size:.68rem;padding:.25rem .5rem;border-radius:.4rem}
.yt-board-wrap{display:flex;flex-direction:column;justify-content:center;gap:.75rem;padding:1.1rem;color:#fff}
.yt-board{background:linear-gradient(160deg,#fff8ef,#f0e0cf);color:var(--d);border-radius:1rem;min-height:210px;padding:1rem;display:flex;align-items:center;justify-content:center;border:2px solid rgba(242,215,124,.65);box-shadow:inset 0 0 0 1px rgba(75,10,17,.06);animation:pop .35s ease}
.yt-board h3,.yt-board .eq,.yt-board .story{margin:0;text-align:center;font-weight:900}
.yt-board h3{font-size:clamp(1.3rem,3vw,2rem)}
.yt-board .eq{font-size:clamp(2rem,5vw,3rem)}
.yt-board .story{font-size:clamp(1.15rem,2.8vw,1.7rem);line-height:1.5}
.yt-caption{margin:0;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);border-radius:.75rem;padding:.7rem .85rem;font-weight:700;line-height:1.55;font-size:clamp(.95rem,2.1vw,1.15rem)}
.yt-controls{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;padding:.75rem .9rem .4rem;background:#140a0c;color:#fff}
.yt-controls button{border:0;border-radius:.55rem;padding:.55rem .85rem;font:inherit;font-weight:800;cursor:pointer;background:rgba(255,255,255,.1);color:#fff}
.yt-controls button:disabled{opacity:.35}
.yt-controls .play{background:var(--g);color:var(--d)}
.yt-controls .gold{background:var(--b);color:var(--g)}
.yt-controls span{margin-inline-start:auto;font-weight:700;opacity:.8;font-variant-numeric:tabular-nums}
.yt-scrub{margin:0 .9rem .65rem;height:8px;border-radius:99px;background:rgba(255,255,255,.12);cursor:pointer;overflow:hidden;direction:ltr}
.yt-scrub i{display:block;height:100%;background:linear-gradient(90deg,#f2d77c,#9e1722)}
.yt-chapters{list-style:none;margin:0;padding:0 .7rem .8rem;max-height:170px;overflow:auto;background:#140a0c}
.yt-chapters button{width:100%;display:flex;gap:.6rem;border:0;border-radius:.5rem;padding:.42rem .55rem;margin:.2rem 0;background:rgba(255,255,255,.05);color:#fff;font:inherit;text-align:right;cursor:pointer}
.yt-chapters button.on{background:rgba(158,23,34,.5);outline:1px solid rgba(242,215,124,.35)}
.yt-chapters em{font-style:normal;color:var(--g);font-weight:800;min-width:2.3rem}
.yt-chapters span{font-size:.84rem;opacity:.92}
.yt-foot{margin:.55rem 0 0;color:#6b3a40;font-size:.78rem;font-weight:700}
.yt-acts{margin-top:.85rem;background:linear-gradient(165deg,#fff9f2,#f1e2d5);border-radius:1rem;padding:1rem;border:1px solid rgba(75,10,17,.1);color:var(--d)}
.yt-acts article{margin:.55rem 0;padding:.65rem;border-radius:.7rem;background:rgba(255,255,255,.8)}
.yt-acts button{margin:.12rem;border:0;border-radius:.45rem;padding:.4rem .7rem;font:inherit;font-weight:800;background:rgba(158,23,34,.1);cursor:pointer;color:var(--d)}
.yt-acts .g{color:#14532d;font-weight:800}.yt-acts .b{color:#9e1722;font-weight:800}
.yt-nl{width:100%}.yt-nl-rail{display:flex;justify-content:space-between;font-size:.58rem;font-weight:800}
.yt-nl-rail .hot{color:var(--b);transform:scale(1.2)}
.yt-nl-track{position:relative;height:12px;margin:.35rem 0;border-radius:99px;background:linear-gradient(90deg,#d8c2ad,#c9b09a)}
.yt-nl-track i{position:absolute;top:-9px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffd98a,#9e1722);transition:left .85s ease}
.yt-nl p{margin:.35rem 0 0;text-align:center;font-weight:800;color:var(--b)}
@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`;

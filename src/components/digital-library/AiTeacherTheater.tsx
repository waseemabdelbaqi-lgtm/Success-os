"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Beat = {
  id: string;
  seconds: number;
  caption: string;
  board: {
    kind: "title" | "numberline" | "equation" | "cheer" | "story";
    title?: string;
    from?: number;
    hops?: number;
    equation?: string;
    story?: string;
  };
  mood: "smile" | "talk" | "point" | "cheer";
};

type Props = {
  slug: string;
  title: string;
  teacherName?: string;
};

const MATH_BEATS: Beat[] = [
  {
    id: "b1",
    seconds: 6,
    caption: "يا قمري… أنا معلّمتك لاما. اليوم نجمع بلعب!",
    board: { kind: "title", title: "الجمع بخط الأعداد" },
    mood: "smile",
  },
  {
    id: "b2",
    seconds: 7,
    caption: "معي 3 حلوات… وصاحبي أعطاني 2. كم صار؟",
    board: { kind: "story", story: "٣ حلوات + ٢ حلوات = ؟" },
    mood: "talk",
  },
  {
    id: "b3",
    seconds: 8,
    caption: "الجمع يعني نحط مع بعض… ونقفز لليمين على الخط.",
    board: { kind: "numberline", from: 0, hops: 0 },
    mood: "point",
  },
  {
    id: "b4",
    seconds: 9,
    caption: "نبدأ على الرقم 3… هذا بيتنا الأول.",
    board: { kind: "numberline", from: 3, hops: 0 },
    mood: "point",
  },
  {
    id: "b5",
    seconds: 10,
    caption: "أربع قفزات… قفزة… قفزة… قفزة… قفزة!",
    board: { kind: "numberline", from: 3, hops: 4 },
    mood: "talk",
  },
  {
    id: "b6",
    seconds: 8,
    caption: "وقفنا على 7. إذن 3 + 4 = 7. برافو!",
    board: { kind: "equation", equation: "٣ + ٤ = ٧" },
    mood: "cheer",
  },
  {
    id: "b7",
    seconds: 8,
    caption: "جرّب معي: ابدأ من 5 واقفز مرتين… وين نوصل؟",
    board: { kind: "numberline", from: 5, hops: 2 },
    mood: "point",
  },
  {
    id: "b8",
    seconds: 7,
    caption: "وصلنا 7! 5 + 2 = 7. أنت بطل الصف.",
    board: { kind: "equation", equation: "٥ + ٢ = ٧" },
    mood: "cheer",
  },
  {
    id: "b9",
    seconds: 8,
    caption: "قصة: 6 تفاحات… وأمها أعطتها 3. اقفز!",
    board: { kind: "numberline", from: 6, hops: 3 },
    mood: "talk",
  },
  {
    id: "b10",
    seconds: 7,
    caption: "صارت 9 تفاحات. يلا نلعب كمان!",
    board: { kind: "equation", equation: "٦ + ٣ = ٩" },
    mood: "cheer",
  },
  {
    id: "b11",
    seconds: 8,
    caption: "قاعدة ذهبية: ابدأ → اقفز → اقرأ الناتج.",
    board: { kind: "title", title: "ابدأ → اقفز → اقرأ" },
    mood: "smile",
  },
  {
    id: "b12",
    seconds: 6,
    caption: "أحبك يا قمري… أشوفك بالتفاعليات!",
    board: { kind: "cheer", title: "أنت نجم الصف ⭐" },
    mood: "cheer",
  },
];

const SCIENCE_BEATS: Beat[] = [
  {
    id: "s1",
    seconds: 6,
    caption: "يا حبيبي… أنا معلّمتك رنيم.",
    board: { kind: "title", title: "نتشابه ونختلف" },
    mood: "smile",
  },
  {
    id: "s2",
    seconds: 8,
    caption: "كلنا بشر… نتنفس ونحتاج مي وأكل.",
    board: { kind: "story", story: "نتشابه: هوا · مي · أكل · لعب" },
    mood: "talk",
  },
  {
    id: "s3",
    seconds: 8,
    caption: "ونختلف بالطول والشعر والهوايات… وهذا حلو!",
    board: { kind: "story", story: "نختلف باحترام 💛" },
    mood: "cheer",
  },
  {
    id: "s4",
    seconds: 7,
    caption: "وعد الصف: ما بنجرح حدّا. بنحتفل ببعض.",
    board: { kind: "cheer", title: "وعد الحب والاحترام" },
    mood: "smile",
  },
];

function beatsFor(slug: string): Beat[] {
  if (slug.includes("science")) return SCIENCE_BEATS;
  return MATH_BEATS;
}

function NumberLineBoard({
  from = 0,
  hops = 0,
  animate,
}: {
  from?: number;
  hops?: number;
  animate: boolean;
}) {
  const end = from + hops;
  const marks = Array.from({ length: 21 }, (_, i) => i);
  return (
    <div className="att-nl" aria-hidden>
      <div className="att-nl-rail">
        {marks.map((n) => (
          <span key={n} className={n === from || n === end ? "hot" : ""}>
            {n}
          </span>
        ))}
      </div>
      <div className="att-nl-track" dir="ltr">
        <i
          className={animate && hops ? "hop" : ""}
          style={{
            left: hops ? `calc(${(from / 20) * 100}% + ${(hops / 20) * 100}%)` : `${(from / 20) * 100}%`,
            ["--travel" as string]: `${(hops / 20) * 100}%`,
          }}
        />
      </div>
      <p className="att-nl-label">
        نبدأ {from}
        {hops ? ` · نقفز ${hops} · نصل ${end}` : ""}
      </p>
    </div>
  );
}

function TeacherAvatar({ mood }: { mood: Beat["mood"] }) {
  return (
    <div className={`att-teacher ${mood}`} aria-hidden>
      <div className="att-hair" />
      <div className="att-face">
        <span className="eye l" />
        <span className="eye r" />
        <span className="mouth" />
      </div>
      <div className="att-body">
        <div className="att-arm left" />
        <div className="att-torso" />
        <div className="att-arm right" />
      </div>
      <div className="att-badge">AI</div>
    </div>
  );
}

/**
 * Cinematic AI teacher lesson player — screen + teacher + board.
 * No browser TTS. Feels like watching a class video.
 */
export function AiTeacherTheater({
  slug,
  title,
  teacherName = "أ. لاما النوري",
}: Props) {
  const beats = useMemo(() => beatsFor(slug), [slug]);
  const totalSec = useMemo(() => beats.reduce((n, b) => n + b.seconds, 0), [beats]);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [elapsedInBeat, setElapsedInBeat] = useState(0);
  const [showActs, setShowActs] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const beat = beats[idx] || beats[0];

  const globalElapsed = useMemo(() => {
    let t = 0;
    for (let i = 0; i < idx; i++) t += beats[i].seconds;
    return t + elapsedInBeat;
  }, [beats, idx, elapsedInBeat]);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      setElapsedInBeat((e) => {
        const next = e + dt;
        const limit = beats[idx]?.seconds || 1;
        if (next >= limit) {
          if (idx >= beats.length - 1) {
            setPlaying(false);
            setShowActs(true);
            return limit;
          }
          setIdx((i) => i + 1);
          return 0;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, idx, beats]);

  function seek(i: number) {
    setIdx(Math.max(0, Math.min(beats.length - 1, i)));
    setElapsedInBeat(0);
    setShowActs(false);
  }

  function onScrub(pct: number) {
    const target = pct * totalSec;
    let acc = 0;
    for (let i = 0; i < beats.length; i++) {
      if (acc + beats[i].seconds >= target) {
        setIdx(i);
        setElapsedInBeat(Math.max(0, target - acc));
        setShowActs(false);
        return;
      }
      acc += beats[i].seconds;
    }
  }

  const pct = totalSec ? Math.min(100, (globalElapsed / totalSec) * 100) : 0;

  return (
    <section className="att" id="ai-class" dir="rtl">
      <style>{css}</style>
      <div className="att-screen">
        <div className="att-top">
          <span>SUCCESS OS · بث مباشر AI</span>
          <b>
            {teacherName} · {title}
          </b>
        </div>

        <div className="att-stage">
          <div className="att-left">
            <TeacherAvatar mood={beat.mood} />
            <p className="att-name">{teacherName}</p>
          </div>
          <div className="att-board" key={beat.id}>
            {beat.board.kind === "title" || beat.board.kind === "cheer" ? (
              <h3 className="pop">{beat.board.title}</h3>
            ) : null}
            {beat.board.kind === "story" ? <p className="story pop">{beat.board.story}</p> : null}
            {beat.board.kind === "equation" ? (
              <p className="eq pop">{beat.board.equation}</p>
            ) : null}
            {beat.board.kind === "numberline" ? (
              <NumberLineBoard
                from={beat.board.from}
                hops={beat.board.hops}
                animate={playing || elapsedInBeat > 0}
              />
            ) : null}
          </div>
        </div>

        <div className="att-caption">
          <p key={beat.id}>{beat.caption}</p>
        </div>

        <div className="att-controls">
          <button
            type="button"
            className="play"
            onClick={() => {
              if (idx >= beats.length - 1 && elapsedInBeat >= (beat?.seconds || 0) - 0.05) {
                seek(0);
              }
              setPlaying((p) => !p);
            }}
          >
            {playing ? "❚❚ إيقاف" : "▶ مشاهدة الحصة"}
          </button>
          <button type="button" onClick={() => seek(Math.max(0, idx - 1))}>
            السابق
          </button>
          <button type="button" onClick={() => seek(Math.min(beats.length - 1, idx + 1))}>
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
            التفاعليات
          </button>
          <span className="att-clock">
            {fmt(globalElapsed)} / {fmt(totalSec)}
          </span>
        </div>

        <div
          className="att-scrub"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          tabIndex={0}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            // RTL: right is start
            const ratio = 1 - x / rect.width;
            onScrub(Math.min(1, Math.max(0, ratio)));
          }}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      {showActs ? <QuickActs slug={slug} /> : null}
    </section>
  );
}

function QuickActs({ slug }: { slug: string }) {
  const math = !slug.includes("science");
  const items = math
    ? [
        { q: "3 + 4 = ؟", a: "7", choices: ["5", "6", "7", "8"] },
        { q: "ابدأ من 5 واقفز 2. وين؟", a: "7", choices: ["6", "7", "8"] },
        { q: "6 + 3 = ؟", a: "9", choices: ["8", "9", "10"] },
      ]
    : [
        { q: "نتنفس مع بعض. هذا؟", a: "متشابه", choices: ["متشابه", "مختلف"] },
        { q: "هوايات مختلفة. هذا؟", a: "مختلف", choices: ["عيب", "مختلف"] },
      ];
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [ok, setOk] = useState<Record<number, boolean | null>>({});

  return (
    <div className="att-acts" id="ai-acts">
      <h3>تفاعليات سريعة</h3>
      {items.map((it, i) => (
        <article key={it.q}>
          <p>{it.q}</p>
          <div>
            {it.choices.map((c) => (
              <button
                key={c}
                type="button"
                className={picked[i] === c ? "on" : ""}
                onClick={() => {
                  setPicked((p) => ({ ...p, [i]: c }));
                  setOk((o) => ({ ...o, [i]: c === it.a }));
                }}
              >
                {c}
              </button>
            ))}
          </div>
          {ok[i] === true ? <em className="good">برافو!</em> : null}
          {ok[i] === false ? <em className="bad">جرّب كمان</em> : null}
        </article>
      ))}
      <p className="att-next">
        كمان: <a href="#visualizer">المجسّم 3D</a> · <a href="#quiz">اختبار</a>
      </p>
    </div>
  );
}

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const css = `
.att{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;--ink:#1a0a0c;margin:1rem 0 1.5rem;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.att-screen{border-radius:1.1rem;overflow:hidden;background:#14080a;box-shadow:0 18px 50px rgba(75,10,17,.35);border:1px solid rgba(242,215,124,.25)}
.att-top{display:flex;justify-content:space-between;gap:.75rem;flex-wrap:wrap;padding:.65rem 1rem;background:linear-gradient(90deg,#4b0a11,#9e1722);color:#fff;font-size:.82rem}
.att-top b{color:var(--g)}
.att-stage{display:grid;grid-template-columns:200px 1fr;gap:1rem;padding:1.1rem 1.1rem .5rem;min-height:320px;background:
  radial-gradient(ellipse 60% 50% at 20% 20%, rgba(242,215,124,.16), transparent 55%),
  linear-gradient(165deg,#2a1014 0%, #4b0a11 45%, #1a080b 100%);
}
@media(max-width:760px){.att-stage{grid-template-columns:1fr;min-height:420px}}
.att-left{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:.4rem}
.att-name{color:var(--g);font-weight:800;margin:0;font-size:.9rem}
.att-teacher{position:relative;width:150px;height:210px}
.att-hair{position:absolute;top:8px;left:22px;right:22px;height:70px;background:#2b1520;border-radius:40px 40px 18px 18px;box-shadow:inset 0 -10px 0 #3d1d2c}
.att-face{position:absolute;top:38px;left:34px;width:82px;height:90px;background:linear-gradient(180deg,#f3c7a8,#e8b08f);border-radius:42% 42% 48% 48%;box-shadow:0 8px 0 rgba(0,0,0,.12)}
.att-face .eye{position:absolute;top:34px;width:10px;height:12px;background:#2a1014;border-radius:50%}
.att-face .eye.l{left:20px}.att-face .eye.r{right:20px}
.att-face .mouth{position:absolute;left:28px;bottom:22px;width:26px;height:10px;border:3px solid #9e1722;border-top:0;border-radius:0 0 16px 16px}
.att-teacher.talk .mouth{animation:talk .35s ease-in-out infinite alternate}
.att-teacher.cheer .mouth{height:14px;width:28px;border-radius:0 0 20px 20px;bottom:18px}
.att-teacher.point .att-arm.right{transform:rotate(-35deg) translateY(-8px)}
.att-body{position:absolute;bottom:0;left:20px;right:20px;height:100px}
.att-torso{position:absolute;left:22px;right:22px;top:0;bottom:10px;background:linear-gradient(180deg,#9e1722,#6d1018);border-radius:24px 24px 18px 18px}
.att-arm{position:absolute;top:8px;width:18px;height:70px;background:#e8b08f;border-radius:12px;transition:transform .35s ease}
.att-arm.left{left:4px;transform:rotate(12deg)}.att-arm.right{right:4px;transform:rotate(-12deg)}
.att-teacher.talk .att-arm.right{animation:wave 1.1s ease-in-out infinite}
.att-badge{position:absolute;top:0;left:0;background:var(--g);color:var(--d);font-weight:900;font-size:.65rem;padding:.15rem .35rem;border-radius:.35rem}
.att-board{background:linear-gradient(160deg,#f8f1e6,#efe0cf);border-radius:1rem;padding:1rem;display:flex;align-items:center;justify-content:center;min-height:240px;border:3px solid rgba(242,215,124,.55);box-shadow:inset 0 0 0 1px rgba(75,10,17,.08)}
.att-board h3,.att-board .eq,.att-board .story{margin:0;text-align:center;color:var(--d);font-weight:900}
.att-board h3{font-size:clamp(1.4rem,3vw,2.1rem)}
.att-board .eq{font-size:clamp(2rem,5vw,3.2rem);letter-spacing:.04em}
.att-board .story{font-size:clamp(1.2rem,3vw,1.8rem);line-height:1.5}
.pop{animation:pop .45s ease}
.att-nl{width:100%}
.att-nl-rail{display:flex;justify-content:space-between;gap:0;font-size:.62rem;font-weight:800;color:var(--d);margin-bottom:.45rem}
.att-nl-rail .hot{color:var(--b);transform:scale(1.25)}
.att-nl-track{position:relative;height:14px;border-radius:99px;background:linear-gradient(90deg,#d8c2ad,#c9b09a);margin:.35rem 0}
.att-nl-track i{position:absolute;top:-10px;width:28px;height:28px;margin-left:-14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffd98a,#9e1722);box-shadow:0 4px 10px rgba(75,10,17,.35);transition:left 1s ease}
.att-nl-track i.hop{animation:hopx 1.05s ease; left: calc(var(--start, 0%) + var(--travel, 0%)) !important}
.att-nl-label{margin:.4rem 0 0;text-align:center;font-weight:800;color:var(--b)}
.att-caption{margin:.2rem 1rem .8rem;background:rgba(0,0,0,.55);color:#fff;border-radius:.75rem;padding:.75rem 1rem;min-height:3.2rem;display:flex;align-items:center;border:1px solid rgba(242,215,124,.2)}
.att-caption p{margin:0;font-size:clamp(1rem,2.4vw,1.25rem);font-weight:700;line-height:1.55;animation:fade .35s ease}
.att-controls{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;padding:0 1rem .75rem}
.att-controls button{border:0;border-radius:.6rem;padding:.55rem .85rem;font:inherit;font-weight:800;cursor:pointer;background:rgba(255,255,255,.12);color:#fff}
.att-controls button.play{background:var(--g);color:var(--d)}
.att-controls button.gold{background:#9e1722;color:var(--g);border:1px solid rgba(242,215,124,.4)}
.att-clock{margin-inline-start:auto;color:rgba(255,255,255,.75);font-weight:700;font-variant-numeric:tabular-nums}
.att-scrub{margin:0 1rem 1rem;height:10px;border-radius:99px;background:rgba(255,255,255,.15);cursor:pointer;overflow:hidden;direction:ltr}
.att-scrub i{display:block;height:100%;background:linear-gradient(90deg,#f2d77c,#9e1722);border-radius:99px}
.att-acts{margin-top:1rem;background:linear-gradient(165deg,#fff9f2,#f3e4d8);border-radius:1rem;padding:1rem;border:1px solid rgba(75,10,17,.1)}
.att-acts h3{margin:.1rem 0 .7rem;color:var(--d)}
.att-acts article{margin-bottom:.7rem;padding:.7rem;border-radius:.75rem;background:rgba(255,255,255,.75)}
.att-acts p{margin:.1rem 0 .45rem;font-weight:800;color:var(--d)}
.att-acts button{margin:.15rem;border:0;border-radius:.5rem;padding:.45rem .75rem;font:inherit;font-weight:800;background:rgba(158,23,34,.1);color:var(--d);cursor:pointer}
.att-acts button.on{background:var(--b);color:#fff}
.att-acts .good{color:#14532d;font-weight:800}.att-acts .bad{color:#9e1722;font-weight:800}
.att-next{color:#6b3a40;font-weight:700}
.att-next a{color:var(--b);font-weight:900}
@keyframes talk{from{transform:scaleY(.7)}to{transform:scaleY(1.15)}}
@keyframes wave{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(-28deg) translateY(-6px)}}
@keyframes hopx{0%{transform:translateY(0)}40%{transform:translateY(-14px)}100%{transform:translateY(0)}}
@keyframes pop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

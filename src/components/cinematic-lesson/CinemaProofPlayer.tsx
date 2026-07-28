"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CINEMA_PROOF, shotAt } from "@/src/lib/interactive-lesson/cinema/proof-timeline";

const CinemaCanvas = dynamic(
  () => import("@/src/components/cinematic-lesson/CinemaCanvas").then((m) => m.CinemaCanvas),
  { ssr: false, loading: () => <div className="cine-loading">جاري تجهيز الصف ثلاثي الأبعاد…</div> },
);

type Phase = "ready" | "playing" | "awaiting" | "hint" | "reexplain" | "correct" | "done";

const STORAGE_KEY = "success-os:cinema-proof:g1-math";

export function CinemaProofPlayer() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [timeSec, setTimeSec] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [muted, setMuted] = useState(false);
  const [seekTo, setSeekTo] = useState(0);

  useEffect(() => {
    const t = Number(new URLSearchParams(window.location.search).get("t") || 0);
    if (Number.isFinite(t) && t > 0) setSeekTo(t);
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambRef = useRef<HTMLAudioElement | null>(null);
  const fxRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const audioGraphReady = useRef(false);

  const shot = useMemo(() => shotAt(timeSec), [timeSec]);

  const persist = useCallback((partial: Record<string, unknown>) => {
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const t = Number(new URLSearchParams(window.location.search).get("t") || 0);
    if (Number.isFinite(t) && t > 0) setSeekTo(t);
    // Dev/E2E seeks should start fresh
    if (t > 0) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.phase === "done" || p.phase === "awaiting" || p.phase === "correct") {
          setPhase(p.phase);
          setAttempts(p.attempts || 0);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const stopClock = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  const playFx = useCallback(
    async (src: string) => {
      if (muted) return;
      if (!fxRef.current) fxRef.current = new Audio();
      const a = fxRef.current;
      a.src = src;
      try {
        await a.play();
      } catch {
        /* gesture */
      }
    },
    [muted],
  );

  const start = useCallback(async () => {
    setPhase("playing");
    setFeedback("");
    setTimeSec(0);
    persist({ phase: "playing", startedAt: new Date().toISOString() });

    const jump = Number(new URLSearchParams(window.location.search).get("t") || seekTo || 0);

    if (!audioRef.current) audioRef.current = new Audio(CINEMA_PROOF.audioAr);
    if (!ambRef.current) ambRef.current = new Audio(CINEMA_PROOF.ambience);
    const main = audioRef.current;
    const amb = ambRef.current;
    main.muted = muted;
    amb.loop = true;
    amb.volume = muted ? 0 : 0.18;
    amb.currentTime = 0;

    await new Promise<void>((resolve) => {
      if (main.readyState >= 1) resolve();
      else main.addEventListener("loadedmetadata", () => resolve(), { once: true });
      main.load();
    });

    main.currentTime = jump > 0 ? Math.min(jump, CINEMA_PROOF.durationSec - 0.5) : 0;
    setTimeSec(main.currentTime);

    if (!audioGraphReady.current) {
      try {
        const ctx = new AudioContext();
        const src = ctx.createMediaElementSource(main);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        audioGraphReady.current = true;
      } catch {
        analyserRef.current = null;
      }
    }

    try {
      await main.play();
      await amb.play();
    } catch {
      /* wait */
    }

    // Headless / blocked audio may not advance currentTime — still reach the pause.
    if (jump >= CINEMA_PROOF.durationSec - 4) {
      window.setTimeout(() => {
        stopClock();
        main.pause();
        amb.pause();
        setTimeSec(CINEMA_PROOF.durationSec);
        setPhase("awaiting");
        setMouthOpen(0);
        persist({ phase: "awaiting", timeSec: CINEMA_PROOF.durationSec });
      }, 1600);
    }

    const tick = () => {
      const t = main.currentTime || 0;
      setTimeSec(t);
      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current as unknown as Uint8Array<ArrayBuffer>);
        const arr = dataRef.current;
        let sum = 0;
        for (let i = 0; i < arr.length; i += 1) sum += arr[i] || 0;
        const avg = sum / arr.length / 255;
        setMouthOpen(Math.min(1, avg * 2.4));
      } else {
        setMouthOpen(0.35 + Math.sin(t * 10) * 0.25);
      }

      if (main.ended || t >= CINEMA_PROOF.durationSec - 0.05) {
        stopClock();
        amb.pause();
        setPhase("awaiting");
        setMouthOpen(0);
        persist({ phase: "awaiting", timeSec: t });
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [muted, persist, seekTo, stopClock]);

  useEffect(() => () => stopClock(), [stopClock]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
    if (ambRef.current) ambRef.current.volume = muted ? 0 : 0.18;
  }, [muted]);

  const submit = useCallback(
    async (index: number) => {
      if (phase !== "awaiting" && phase !== "hint") return;
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      const ok = index === CINEMA_PROOF.question.correctIndex;
      if (ok) {
        setFeedback(CINEMA_PROOF.question.correctFeedbackAr);
        setPhase("correct");
        persist({ phase: "correct", attempts: nextAttempts, answer: index });
        await playFx(CINEMA_PROOF.feedbackAudio.correct);
        return;
      }
      if (nextAttempts === 1) {
        setFeedback(CINEMA_PROOF.question.firstHintAr);
        setPhase("hint");
        persist({ phase: "hint", attempts: nextAttempts });
        await playFx(CINEMA_PROOF.feedbackAudio.hint);
        return;
      }
      setFeedback(CINEMA_PROOF.question.secondExplanationAr);
      setPhase("reexplain");
      persist({ phase: "reexplain", attempts: nextAttempts });
      await playFx(CINEMA_PROOF.feedbackAudio.reexplain);
      // brief board replay then return to awaiting
      window.setTimeout(() => {
        setPhase("awaiting");
        setFeedback("");
      }, 4500);
    },
    [attempts, phase, persist, playFx],
  );

  const finish = useCallback(() => {
    setPhase("done");
    persist({ phase: "done", mastery: 100, completedAt: new Date().toISOString() });
  }, [persist]);

  const waiting = phase === "awaiting" || phase === "hint" || phase === "reexplain";

  return (
    <section className="cine" dir="rtl">
      <style>{css}</style>
      <div className="cine-stage">
        <CinemaCanvas shot={shot} mouthOpen={mouthOpen} timeSec={timeSec} />
        <div className="cine-hud">
          <div className="cine-top">
            <p className="cine-brand">{CINEMA_PROOF.preparedBy}</p>
            <p className="cine-teacher">
              {CINEMA_PROOF.teacherName} · {CINEMA_PROOF.teacherTitle}
            </p>
          </div>
          {phase === "playing" || phase === "ready" ? (
            <p className="cine-caption" aria-live="polite">
              {shot.captionAr}
            </p>
          ) : null}
          {phase === "ready" ? (
            <div className="cine-center">
              <h1>بروف سينمائي ثلاثي الأبعاد</h1>
              <p>معلّمة ظاهرة · سبورة ذكية · توقف عند السؤال</p>
              <button type="button" className="primary" onClick={() => void start()}>
                ابدأ الحصة
              </button>
            </div>
          ) : null}
          {waiting || phase === "correct" ? (
            <div className="cine-quiz" role="group" aria-label={CINEMA_PROOF.question.ar}>
              <p className="cine-q">{CINEMA_PROOF.question.ar}</p>
              <div className="cine-choices">
                {CINEMA_PROOF.question.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={phase === "correct" || phase === "reexplain"}
                    onClick={() => void submit(i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {feedback ? <p className={`cine-fb ${phase === "correct" ? "ok" : ""}`}>{feedback}</p> : null}
              {phase === "correct" ? (
                <button type="button" className="primary" onClick={finish}>
                  متابعة
                </button>
              ) : null}
              {phase === "hint" ? (
                <button type="button" onClick={() => setPhase("awaiting")}>
                  حاول مجدداً
                </button>
              ) : null}
            </div>
          ) : null}
          {phase === "done" ? (
            <div className="cine-done">
              <h2>أحسنت</h2>
              <p>أتممت البروف السينمائي. الإتقان محفوظ.</p>
              <button type="button" onClick={() => { setPhase("ready"); setAttempts(0); setFeedback(""); }}>
                إعادة البروف
              </button>
            </div>
          ) : null}
          <div className="cine-controls">
            <button type="button" onClick={() => setMuted((m) => !m)}>
              {muted ? "صوت" : "كتم"}
            </button>
            {phase === "playing" ? (
              <span>
                {Math.floor(timeSec)}s / {Math.ceil(CINEMA_PROOF.durationSec)}s · {shot.id}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <p className="cine-note">
        Approach C · 3D teacher proof · Voice currently Microsoft neural Jordanian (`ar-JO-SanaNeural`). For acceptance-grade
        human voice, add <code>ELEVENLABS_API_KEY</code> (no browser speechSynthesis used).
      </p>
    </section>
  );
}

const css = `
.cine{min-height:100vh;background:#1a100c;color:#fff8f0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.cine-stage{position:relative;width:100%;height:min(92vh,920px);overflow:hidden;background:linear-gradient(180deg,#2a1a14,#120c0a)}
.cine-loading{display:grid;place-items:center;height:100%;font-weight:800}
.cine-hud{position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:1rem clamp(.75rem,2vw,1.5rem)}
.cine-hud *{pointer-events:auto}
.cine-top{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.cine-brand{margin:0;font-weight:900;color:#f2d77c;text-shadow:0 2px 10px rgba(0,0,0,.45)}
.cine-teacher{margin:0;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.45)}
.cine-caption{align-self:center;margin:0;padding:.55rem 1rem;border-radius:.8rem;background:rgba(0,0,0,.45);border:1px solid rgba(242,215,124,.35);font-weight:800;backdrop-filter:blur(8px)}
.cine-center{position:absolute;inset:0;display:grid;place-content:center;gap:.6rem;text-align:center;background:rgba(20,10,8,.35);backdrop-filter:blur(4px)}
.cine-center h1{margin:0;font-size:clamp(1.4rem,3vw,2rem);color:#f2d77c}
.cine-center p{margin:0;opacity:.9}
.cine-quiz{align-self:center;width:min(520px,100%);padding:1rem;border-radius:1rem;background:rgba(255,248,240,.94);color:#241618;box-shadow:0 20px 60px rgba(0,0,0,.35)}
.cine-q{margin:0 0 .6rem;font-weight:900;font-size:1.35rem;color:#4b0a11;text-align:center}
.cine-choices{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap}
.cine-choices button,.cine-controls button,.cine-quiz button,.cine-done button,.cine-center button{border:0;border-radius:.65rem;padding:.65rem 1rem;font:inherit;font-weight:900;cursor:pointer;background:rgba(158,23,34,.12);color:#4b0a11}
.cine-choices button:hover{background:rgba(158,23,34,.22)}
button.primary{background:#9e1722!important;color:#fff!important}
.cine-fb{margin:.65rem 0 0;font-weight:800;text-align:center;color:#7a3e00}
.cine-fb.ok{color:#14532d}
.cine-done{align-self:center;text-align:center;padding:1rem 1.25rem;border-radius:1rem;background:linear-gradient(160deg,#4b0a11,#9e1722)}
.cine-controls{display:flex;gap:.75rem;align-items:center;justify-content:flex-start}
.cine-controls button{background:rgba(255,255,255,.14);color:#fff}
.cine-note{margin:0;padding:.75rem 1rem;font-size:.82rem;opacity:.8;background:#120c0a}
@media(max-width:720px){.cine-stage{height:85vh}.cine-caption{font-size:.9rem}}
`;

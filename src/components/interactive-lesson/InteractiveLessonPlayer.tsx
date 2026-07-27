"use client";

import { useEffect, useRef, useState } from "react";
import type { InteractiveLessonDefinition } from "@/src/lib/interactive-lesson/types";
import { useLessonEngine } from "@/src/components/interactive-lesson/useLessonEngine";
import { NumberLineBoard } from "@/src/components/interactive-lesson/NumberLineBoard";
import { InteractionPanel } from "@/src/components/interactive-lesson/InteractionPanel";

type Props = {
  lesson: InteractiveLessonDefinition;
  storageKey: string;
};

export function InteractiveLessonPlayer({ lesson, storageKey }: Props) {
  const engine = useLessonEngine(lesson, storageKey);
  const stageRef = useRef<HTMLElement | null>(null);
  const [fs, setFs] = useState(false);
  const { scene, progress, locale, hydrated } = engine;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const waiting = progress.phase === "awaiting_interaction" || progress.phase === "hint";
  const showInteraction = waiting || progress.phase === "feedback_correct" || progress.phase === "feedback_incorrect";

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (!hydrated || !scene) {
    return (
      <div className="il" dir="rtl" aria-busy="true">
        <style>{css}</style>
        <p className="il-kicker">Prepared by Mr Waseem Allabadi</p>
        <h2>{lesson.title.ar}</h2>
        <p>{locale === "en" ? "Loading your class…" : "جاري تجهيز حصتك…"}</p>
      </div>
    );
  }

  const teacher = `${lesson.teacherName[locale]} · ${lesson.teacherTitle[locale]}`;
  const progressPct = Math.round(((progress.sceneIndex + 1) / lesson.scenes.length) * 100);

  return (
    <section className="il" id="ai-class" dir={dir} ref={stageRef as never}>
      <style>{css}</style>
      <header className="il-top">
        <div>
          <p className="il-kicker">{lesson.preparedBy}</p>
          <h2>{lesson.title[locale]}</h2>
          <p className="il-teacher">{teacher}</p>
        </div>
        <div className="il-meta">
          <label>
            {locale === "ar" ? "اللغة" : "Language"}
            <select
              value={locale}
              onChange={(e) => engine.setLocale(e.target.value as "ar" | "en")}
              aria-label="Language"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          <span>
            {progress.sceneIndex + 1}/{lesson.scenes.length}
          </span>
        </div>
      </header>

      <div className="il-progress" aria-hidden>
        <i style={{ width: `${progressPct}%` }} />
      </div>

      <div className="il-stage">
        <div className="il-teacher-chip" aria-hidden>
          <span>AI</span>
          <b>{lesson.teacherName[locale]}</b>
          <em>{lesson.teacherTitle[locale]}</em>
        </div>
        <NumberLineBoard
          board={
            progress.phase === "reexplain" && scene.easierBoard ? scene.easierBoard : scene.board
          }
          events={engine.activeEvents}
          locale={locale}
        />
        {engine.subtitlesOn ? (
          <p className="il-subs" aria-live="polite">
            {scene.captions[locale]}
          </p>
        ) : null}
      </div>

      <details className="il-transcript">
        <summary>{locale === "ar" ? "النص المتزامن" : "Synchronized transcript"}</summary>
        <p>{scene.narration[locale]}</p>
        <p className="sr-only">{scene.accessibilityText[locale]}</p>
      </details>

      {showInteraction ? (
        <InteractionPanel
          scene={scene}
          locale={locale}
          disabled={progress.phase === "feedback_correct"}
          onSubmit={engine.submitAnswer}
        />
      ) : null}

      {engine.feedbackText ? (
        <div
          className={`il-feedback ${progress.phase === "feedback_correct" ? "ok" : "hint"}`}
          role="status"
        >
          {engine.feedbackText}
          {progress.phase === "hint" ? (
            <button type="button" onClick={engine.dismissHint}>
              {locale === "ar" ? "حاول مجدداً" : "Try again"}
            </button>
          ) : null}
        </div>
      ) : null}

      {progress.phase === "completed" ? (
        <div className="il-result" role="status">
          <h3>{locale === "ar" ? "نتيجة الدرس" : "Lesson result"}</h3>
          <p>
            {locale === "ar" ? "درجة الإتقان" : "Mastery"}: <strong>{engine.masteryPercent}%</strong>
          </p>
          <p>
            {locale === "ar" ? "إجابات صحيحة" : "Correct"}: {progress.correctCount} ·{" "}
            {locale === "ar" ? "محاولات خاطئة" : "Misses"}: {progress.incorrectCount}
          </p>
          <p>{lesson.nextLessonHint[locale]}</p>
          <button type="button" onClick={engine.reset}>
            {locale === "ar" ? "أعد الدرس" : "Restart lesson"}
          </button>
        </div>
      ) : null}

      <div className="il-controls" role="toolbar" aria-label={locale === "ar" ? "تحكم الدرس" : "Lesson controls"}>
        {progress.phase === "ready" || progress.phase === "completed" ? (
          <button type="button" className="primary" onClick={engine.start}>
            {progress.sceneIndex > 0
              ? locale === "ar"
                ? "متابعة"
                : "Continue"
              : locale === "ar"
                ? "ابدأ الحصة"
                : "Start class"}
          </button>
        ) : (
          <button type="button" onClick={engine.pause}>
            {locale === "ar" ? "إيقاف" : "Pause"}
          </button>
        )}
        <button type="button" onClick={engine.replay}>
          {locale === "ar" ? "إعادة الشرح" : "Replay"}
        </button>
        <button type="button" onClick={engine.prevScene}>
          {locale === "ar" ? "السابق" : "Previous"}
        </button>
        <button
          type="button"
          onClick={engine.nextScene}
          disabled={scene.completionRule === "interaction" && progress.phase !== "feedback_correct"}
        >
          {locale === "ar" ? "التالي" : "Next"}
        </button>
        <button type="button" onClick={() => engine.setMuted(!engine.muted)}>
          {engine.muted ? (locale === "ar" ? "صوت" : "Unmute") : locale === "ar" ? "كتم" : "Mute"}
        </button>
        <button type="button" onClick={() => engine.setSlow(!engine.slow)}>
          {engine.slow ? (locale === "ar" ? "سرعة عادية" : "Normal") : locale === "ar" ? "بطيء" : "Slow"}
        </button>
        <button type="button" onClick={() => engine.setSubtitlesOn(!engine.subtitlesOn)}>
          {locale === "ar" ? "ترجمة" : "CC"}
        </button>
        <button
          type="button"
          onClick={() => {
            const el = stageRef.current;
            if (!el) return;
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el.requestFullscreen?.();
          }}
        >
          {fs ? (locale === "ar" ? "خروج" : "Exit") : locale === "ar" ? "ملء الشاشة" : "Fullscreen"}
        </button>
      </div>
    </section>
  );
}

const css = `
.il{--b:var(--sos-burgundy,#9e1722);--d:var(--sos-burgundy-deep,#4b0a11);--g:var(--sos-gold-soft,#f2d77c);--ink:#241618;margin:1rem 0;padding:1rem;border-radius:1.1rem;background:linear-gradient(165deg,#fff9f4,#f3e6db 55%,#efe0d4);border:1px solid rgba(158,23,34,.14);color:var(--ink);font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif}
.il-top{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-end}
.il-kicker{margin:0;color:var(--b);font-weight:800;font-size:.8rem}
.il-top h2{margin:.2rem 0;color:var(--d);font-size:clamp(1.15rem,2.5vw,1.55rem)}
.il-teacher{margin:0;color:#6b3a40;font-weight:700}
.il-meta{display:flex;gap:.6rem;align-items:center}
.il-meta select{margin-inline-start:.35rem;border-radius:.45rem;border:1px solid rgba(75,10,17,.2);padding:.25rem .4rem}
.il-progress{height:8px;margin:.75rem 0;border-radius:99px;background:rgba(75,10,17,.1);overflow:hidden}
.il-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--g),var(--b))}
.il-stage{position:relative;min-height:280px;border-radius:1rem;background:linear-gradient(160deg,#1a0d10,#3a1418 50%,#12080a);padding:1rem;color:#fff;overflow:hidden}
.il-teacher-chip{position:absolute;inset-inline-start:1rem;top:1rem;display:grid;gap:.1rem;background:rgba(0,0,0,.45);border:1px solid rgba(242,215,124,.4);border-radius:.7rem;padding:.45rem .6rem;backdrop-filter:blur(6px)}
.il-teacher-chip span{width:1.4rem;height:1.4rem;border-radius:50%;display:grid;place-items:center;background:var(--b);font-size:.65rem;font-weight:900}
.il-teacher-chip b{color:var(--g);font-size:.85rem}
.il-teacher-chip em{font-style:normal;font-size:.7rem;opacity:.85}
.il-board{min-height:220px;margin-top:3.2rem;display:grid;place-items:center;gap:.8rem}
.il-eq{font-size:clamp(1.5rem,4vw,2.4rem);font-weight:900;color:var(--g);text-align:center}
.il-objects{display:flex;gap:.45rem;flex-wrap:wrap;justify-content:center;font-size:1.5rem;color:#ffd98a}
.il-line{position:relative;width:min(100%,560px);padding:1.4rem .4rem 2rem}
.il-rail{height:8px;border-radius:99px;background:linear-gradient(90deg,#f2d77c,#9e1722)}
.il-marks{display:flex;justify-content:space-between;margin-top:.35rem}
.il-mark{display:grid;justify-items:center;gap:.2rem;font-size:.75rem;font-weight:800}
.il-mark i{width:10px;height:10px;border-radius:50%;background:#fff}
.il-mark.hot i{background:var(--g);transform:scale(1.35)}
.il-token{position:absolute;top:.55rem;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#9e1722);border:2px solid var(--g)}
.il-arc{position:absolute;top:0;height:28px;border:3px solid #ffb070;border-bottom:none;border-radius:40px 40px 0 0;pointer-events:none}
.il-cele{font-size:3rem;color:var(--g)}
.il-subs{margin:.7rem 0 0;padding:.55rem .7rem;border-radius:.65rem;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);font-weight:700}
.il-transcript{margin:.7rem 0;background:rgba(255,255,255,.65);border-radius:.7rem;padding:.45rem .7rem}
.il-interact{margin:.7rem 0;padding:.85rem;border-radius:.9rem;background:rgba(255,255,255,.82);border:1px solid rgba(158,23,34,.12)}
.il-q{margin:0 0 .55rem;font-weight:900;color:var(--d)}
.il-choices{display:flex;flex-wrap:wrap;gap:.45rem}
.il-choices button,.il-interact button,.il-controls button,.il-feedback button,.il-result button{border:0;border-radius:.55rem;padding:.55rem .85rem;font:inherit;font-weight:800;cursor:pointer;background:rgba(158,23,34,.12);color:var(--d)}
.il-choices button:hover{background:rgba(158,23,34,.22)}
.il-interact input{border:1px solid rgba(75,10,17,.25);border-radius:.5rem;padding:.5rem .65rem;font:inherit;margin-inline-end:.4rem;width:7rem}
.il-arrange{list-style:none;margin:0 0 .6rem;padding:0;display:grid;gap:.35rem}
.il-arrange li{display:flex;justify-content:space-between;gap:.5rem;align-items:center;background:#fff;border-radius:.5rem;padding:.45rem .55rem}
.il-arrange-btns{display:flex;gap:.25rem}
.il-hint-line{margin:0 0 .5rem;font-size:.9rem;opacity:.85}
.il-drag-list{list-style:none;margin:0 0 .6rem;padding:0;display:grid;gap:.35rem}
.il-drag-list li{display:flex;gap:.55rem;align-items:center;background:#fff;border-radius:.5rem;padding:.55rem .65rem;cursor:grab;border:1px dashed rgba(158,23,34,.25)}
.il-drag-handle{opacity:.45;letter-spacing:-2px;font-weight:900}
.il-match{display:grid;gap:.45rem;margin-bottom:.55rem}
.il-match-row{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;align-items:center}
.il-match-left{background:#fff;border-radius:.5rem;padding:.45rem .55rem;font-weight:800}
.il-match select{border:1px solid rgba(75,10,17,.25);border-radius:.5rem;padding:.45rem;font:inherit}
.il-draw-prompt{margin:0 0 .45rem;font-size:.9rem}
.il-draw-pad{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.35rem;margin-bottom:.55rem}
.il-draw-pad button{aspect-ratio:1;font-size:1.2rem}
.il-draw-pad button.picked{background:var(--b);color:#fff}
.il-feedback{margin:.55rem 0;padding:.7rem .85rem;border-radius:.75rem;font-weight:800}
.il-feedback.ok{background:#e8f7ee;color:#14532d}
.il-feedback.hint{background:#fff4e8;color:#7a3e00}
.il-result{margin:.7rem 0;padding:1rem;border-radius:.9rem;background:linear-gradient(160deg,#4b0a11,#9e1722);color:#fff}
.il-result strong{color:var(--g)}
.il-controls{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.75rem}
.il-controls .primary{background:var(--b);color:#fff}
.il-controls button:disabled{opacity:.35;cursor:not-allowed}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media(max-width:720px){.il{padding:.75rem}.il-stage{min-height:240px}.il-teacher-chip{position:static;margin-bottom:.5rem}}
`;

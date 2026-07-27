"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { withAiAssistantTitle } from "@/src/lib/digital-library/ai-assistant-teacher";

type Shot = {
  id: string;
  startMin: number;
  endMin: number;
  minutes: number;
  titleAr: string;
  spokenAr: string;
  studentMoves?: string[];
  boardCue?: string;
  visualDirection?: string;
  onScreenText?: string;
};

type Activity = {
  id: string;
  type: string;
  titleAr: string;
  promptAr: string;
  choices?: string[];
  correctIndex?: number;
  answer?: number | string;
  sampleAnswer?: string;
  feedbackCorrect: string;
  feedbackWrong: string;
};

type Pack = {
  lesson: {
    titleAr: string;
    teacherName: string;
    gradeAr: string;
    subject: string;
  };
  video: {
    totalMinutes: number;
    status: string;
    shots: Shot[];
    productionNoteAr?: string;
  };
  activities: Activity[];
};

type Props = {
  slug: string;
  initialPack?: Pack | null;
};

/**
 * Elementary AI class: playable explanation shots + interactive activities.
 */
export function AiClassStudio({ slug, initialPack = null }: Props) {
  const [pack, setPack] = useState<Pack | null>(initialPack);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [shotIdx, setShotIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<"video" | "play">("video");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (pack) return;
    fetch(`/api/curriculum-os?view=elementary-ai-class&slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.aiClass) setPack(j.aiClass);
      })
      .catch(() => {});
  }, [slug, pack]);

  const shots = pack?.video?.shots || [];
  const active = shots[shotIdx] || null;
  const progress = useMemo(() => {
    if (!shots.length) return 0;
    return Math.round(((shotIdx + 1) / shots.length) * 100);
  }, [shotIdx, shots.length]);

  function stopSpeech() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }

  function speakShot(index: number) {
    if (!shots[index] || typeof window === "undefined" || !window.speechSynthesis) {
      setMsg("التشغيل الصوتي غير متاح هنا — اقرأ السكربت على الشاشة.");
      return;
    }
    stopSpeech();
    const u = new SpeechSynthesisUtterance(shots[index].spokenAr);
    u.lang = "ar-SA";
    u.rate = 0.95;
    u.onend = () => {
      if (index + 1 < shots.length) {
        setShotIdx(index + 1);
        speakShot(index + 1);
      } else {
        setPlaying(false);
        setMsg("انتهى فيديو الشرح — انتقل للتفاعليات.");
        setTab("play");
      }
    };
    utterRef.current = u;
    setPlaying(true);
    window.speechSynthesis.speak(u);
  }

  async function rebuild() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/curriculum-os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "elementary-ai-class", slug }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "BUILD_FAILED");
      setPack(json.aiClass);
      setShotIdx(0);
      setMsg("تم تجهيز حصة AI: سكربت فيديو + تفاعليات");
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function checkActivity(a: Activity) {
    const raw = (answers[a.id] || "").trim();
    let ok = false;
    if (a.type === "mcq" && a.choices && typeof a.correctIndex === "number") {
      ok = raw === a.choices[a.correctIndex];
    } else if (a.type === "tap-count") {
      ok = Number(raw) === Number(a.answer);
    } else {
      const sample = String(a.sampleAnswer || a.answer || "").trim();
      ok = raw.includes(sample) || sample.includes(raw);
    }
    setResults((r) => ({ ...r, [a.id]: ok }));
  }

  useEffect(() => () => stopSpeech(), []);

  if (!pack) {
    return (
      <section className="ai-class" id="ai-class" dir="rtl">
        <p className="ai-kicker">حصة الذكاء الاصطناعي</p>
        <h2>جهّز الحصة</h2>
        <button type="button" disabled={busy} onClick={rebuild}>
          {busy ? "جاري التجهيز…" : "أنشئ حصة AI الآن"}
        </button>
        {msg ? <p className="ai-msg">{msg}</p> : null}
        <style>{css}</style>
      </section>
    );
  }

  return (
    <section className="ai-class" id="ai-class" dir="rtl">
      <style>{css}</style>
      <header className="ai-head">
        <p className="ai-kicker">حصة AI · معلّمة مساعدة · فيديو شرح + تفاعليات</p>
        <h2>
          {pack.lesson.titleAr}
          <small>
            {pack.lesson.gradeAr} · {pack.lesson.subject} ·{" "}
            {withAiAssistantTitle(pack.lesson.teacherName)}
          </small>
        </h2>
        <p className="ai-meta">
          {pack.video.totalMinutes} دقيقة · {shots.length} مشاهد · {pack.activities.length} تفاعليات
        </p>
        <div className="ai-actions">
          <button type="button" className={tab === "video" ? "on" : ""} onClick={() => setTab("video")}>
            فيديو الشرح
          </button>
          <button type="button" className={tab === "play" ? "on" : ""} onClick={() => setTab("play")}>
            التفاعليات
          </button>
          <button type="button" disabled={busy} onClick={rebuild}>
            {busy ? "…" : "أعد التجهيز"}
          </button>
        </div>
        {msg ? <p className="ai-msg">{msg}</p> : null}
      </header>

      {tab === "video" ? (
        <div className="ai-video">
          <div className="ai-stage">
            <p className="ai-visual">{active?.visualDirection || "مشهد الصف"}</p>
            <strong>{active?.onScreenText || active?.titleAr}</strong>
            <div className="ai-bar">
              <i style={{ width: `${progress}%` }} />
            </div>
            <p className="ai-time">
              {active ? `${active.startMin}–${active.endMin} د` : ""} · مشهد {shotIdx + 1}/{shots.length}
            </p>
          </div>
          <div className="ai-script">
            <h3>{active?.titleAr}</h3>
            <p>{active?.spokenAr}</p>
            {active?.studentMoves?.length ? (
              <ul>
                {active.studentMoves.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="ai-controls">
            <button
              type="button"
              onClick={() => {
                setShotIdx(0);
                speakShot(0);
              }}
            >
              ▶ شغّل الشرح كامل
            </button>
            <button
              type="button"
              onClick={() => {
                if (playing) stopSpeech();
                else speakShot(shotIdx);
              }}
            >
              {playing ? "⏸ أوقف" : "▶ هذا المشهد"}
            </button>
            <button
              type="button"
              disabled={shotIdx <= 0}
              onClick={() => {
                stopSpeech();
                setShotIdx((i) => Math.max(0, i - 1));
              }}
            >
              السابق
            </button>
            <button
              type="button"
              disabled={shotIdx >= shots.length - 1}
              onClick={() => {
                stopSpeech();
                setShotIdx((i) => Math.min(shots.length - 1, i + 1));
              }}
            >
              التالي
            </button>
          </div>
          <ol className="ai-shots">
            {shots.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={i === shotIdx ? "on" : ""}
                  onClick={() => {
                    stopSpeech();
                    setShotIdx(i);
                  }}
                >
                  <b>
                    {s.startMin}–{s.endMin}د
                  </b>
                  <span>{s.titleAr}</span>
                </button>
              </li>
            ))}
          </ol>
          {pack.video.productionNoteAr ? (
            <p className="ai-note">{pack.video.productionNoteAr}</p>
          ) : null}
        </div>
      ) : (
        <div className="ai-play">
          {pack.activities.map((a) => (
            <article key={a.id} className="ai-act">
              <h3>{a.titleAr}</h3>
              <p>{a.promptAr}</p>
              {a.choices?.length ? (
                <div className="ai-choices">
                  {a.choices.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={answers[a.id] === c ? "on" : ""}
                      onClick={() => setAnswers((x) => ({ ...x, [a.id]: c }))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  value={answers[a.id] || ""}
                  onChange={(e) => setAnswers((x) => ({ ...x, [a.id]: e.target.value }))}
                  placeholder="اكتب إجابتك"
                />
              )}
              <button type="button" onClick={() => checkActivity(a)}>
                تحقّق
              </button>
              {results[a.id] === true ? (
                <p className="ok">{a.feedbackCorrect}</p>
              ) : null}
              {results[a.id] === false ? (
                <p className="bad">{a.feedbackWrong}</p>
              ) : null}
            </article>
          ))}
          <p className="ai-note">
            بعد التفاعليات: <a href="#quiz">الاختبار</a> · <a href="#visualizer">المجسّم 3D</a>
          </p>
        </div>
      )}
    </section>
  );
}

const css = `
.ai-class{--b:#9e1722;--d:#4b0a11;--g:#f2d77c;--m:#6b3a40;margin:1.25rem 0;padding:1.1rem 1.15rem;border-radius:1rem;background:linear-gradient(165deg,#fff9f2,#f7ebe3);border:1px solid rgba(75,10,17,.12);font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:var(--d)}
.ai-kicker{margin:0;font-weight:800;color:var(--b);font-size:.85rem}
.ai-head h2{margin:.2rem 0;font-size:1.35rem}
.ai-head h2 small{display:block;font-size:.85rem;font-weight:600;color:var(--m);margin-top:.25rem}
.ai-meta{color:var(--m);margin:.2rem 0 .7rem}
.ai-actions,.ai-controls{display:flex;flex-wrap:wrap;gap:.45rem;margin:.5rem 0}
.ai-actions button,.ai-controls button,.ai-class>button,.ai-act button,.ai-choices button{background:var(--b);color:#fff;border:0;border-radius:.55rem;padding:.5rem .8rem;font:inherit;font-weight:800;cursor:pointer}
.ai-actions button.on,.ai-choices button.on,.ai-shots button.on{background:var(--d);outline:2px solid var(--g)}
.ai-msg{font-weight:700;color:var(--b)}
.ai-stage{background:linear-gradient(145deg,#4b0a11,#9e1722);color:#fff;border-radius:.9rem;padding:1.1rem;min-height:160px}
.ai-visual{opacity:.85;font-size:.85rem;margin:0 0 .5rem}
.ai-stage strong{font-size:1.25rem}
.ai-bar{height:8px;background:rgba(255,255,255,.2);border-radius:99px;margin:.8rem 0 .4rem;overflow:hidden}
.ai-bar i{display:block;height:100%;background:var(--g)}
.ai-time{margin:0;font-size:.8rem;opacity:.9}
.ai-script{background:rgba(255,255,255,.7);border-radius:.75rem;padding:.85rem;margin:.75rem 0}
.ai-script h3{margin:.1rem 0 .4rem}
.ai-shots{list-style:none;margin:0;padding:0;display:grid;gap:.35rem}
.ai-shots button{width:100%;display:flex;justify-content:space-between;gap:.5rem;background:rgba(75,10,17,.08);color:var(--d)}
.ai-note{font-size:.8rem;color:var(--m)}
.ai-act{border:1px solid rgba(75,10,17,.1);border-radius:.75rem;padding:.8rem;margin-bottom:.55rem;background:rgba(255,255,255,.75)}
.ai-act input{width:100%;padding:.5rem;border-radius:.45rem;border:1px solid rgba(75,10,17,.2);margin:.4rem 0;font:inherit}
.ai-choices{display:flex;flex-wrap:wrap;gap:.35rem;margin:.4rem 0}
.ai-act .ok{color:#14532d;font-weight:700}
.ai-act .bad{color:#9e1722;font-weight:700}
`;

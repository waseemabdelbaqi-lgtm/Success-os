"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AliveTeacherStage } from "@/components/ai-teachers/alive-teacher-stage";
import {
  INTERACTIVE_COMMANDS,
  buildG1CountLesson,
  type LessonBeat,
} from "@/lib/ai-teachers/g1-count-lesson";

type TeacherId = "sara" | "ali";

const TEACHERS: Record<
  TeacherId,
  { nameAr: string; gender: "female" | "male"; voiceHint: string }
> = {
  sara: { nameAr: "المعلمة سارة", gender: "female", voiceHint: "ar-JO · أنثى" },
  ali: { nameAr: "المعلم علي", gender: "male", voiceHint: "ar-JO · ذكر" },
};

function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.filter((v) => /ar(-|_|$)|Arabic/i.test(`${v.lang} ${v.name}`));
  return ar.find((v) => /female|sana|noura|salma/i.test(v.name)) || ar[0] || null;
}

function BoardPanel({ beat, progress }: { beat: LessonBeat; progress: number }) {
  const cues = beat.board.cues.filter((c) => progress >= c.at);
  const kinds = new Set(cues.map((c) => c.type));
  return (
    <div
      style={{
        height: "100%",
        borderRadius: 28,
        background: "linear-gradient(160deg,#ffb45a,#ff8a3d)",
        padding: 10,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 22,
          background: "#128c90",
          padding: "18px 20px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {kinds.has("title") && (
          <div
            style={{
              background: "#fff",
              color: "#1e2a3a",
              borderRadius: 16,
              padding: "10px 14px",
              textAlign: "center",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 8,
            }}
          >
            {beat.board.title}
          </div>
        )}
        {kinds.has("subtitle") && (
          <div style={{ textAlign: "center", color: "#ffe56a", fontWeight: 700, marginBottom: 16 }}>
            {beat.board.subtitle}
          </div>
        )}

        {cues.map((c, i) => {
          if (c.type === "big_number") {
            const colors = ["#ffe056", "#ff8ab8", "#7ed0ff"];
            return (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", marginTop: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: colors[c.n - 1],
                      color: "#1e2a3a",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 64,
                      fontWeight: 900,
                      border: "6px solid #fff",
                    }}
                  >
                    {c.n}
                  </div>
                  <div style={{ marginTop: 10, background: "#fff", color: "#1e2a3a", borderRadius: 12, padding: "6px 14px", fontWeight: 800 }}>
                    {c.word}
                  </div>
                </div>
              </div>
            );
          }
          if (c.type === "apples") {
            const fruit = ["#ff5a5a", "#ff9a3d", "#5ab0ff"];
            return (
              <div key={i} style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 18, alignItems: "center" }}>
                {Array.from({ length: c.n }).map((_, j) => (
                  <span
                    key={j}
                    style={{
                      width: 48,
                      height: 54,
                      borderRadius: "45% 45% 50% 50%",
                      background: fruit[j % 3],
                      border: "3px solid #fff",
                      display: "inline-block",
                      position: "relative",
                    }}
                  />
                ))}
                <span style={{ background: "#ffe056", color: "#1e2a3a", borderRadius: 12, padding: "4px 10px", fontWeight: 900, fontSize: 22 }}>
                  × {c.n}
                </span>
              </div>
            );
          }
          if (c.type === "equation") {
            return (
              <div key={i} style={{ marginTop: 24, textAlign: "center" }}>
                <span style={{ background: "#ffe056", color: "#1e2a3a", borderRadius: 14, padding: "10px 22px", fontWeight: 900, fontSize: 28 }}>
                  {c.text}
                </span>
              </div>
            );
          }
          if (c.type === "practice_row") {
            const colors = ["#ffe056", "#ff8ab8", "#7ed0ff"];
            const words = { 1: "واحد", 2: "اثنان", 3: "ثلاثة" } as const;
            return (
              <div
                key={i}
                style={{
                  marginTop: 12,
                  background: "#fff",
                  color: "#1e2a3a",
                  borderRadius: 16,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: colors[c.n - 1],
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {c.n}
                </span>
                <span>=</span>
                <span style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: c.n }).map((_, j) => (
                    <span
                      key={j}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: colors[c.n - 1],
                        border: "2px solid #1e2a3a",
                      }}
                    />
                  ))}
                </span>
                <span style={{ marginInlineStart: "auto" }}>{words[c.n as 1 | 2 | 3]}</span>
              </div>
            );
          }
          if (c.type === "stars") {
            return (
              <div key={i} style={{ textAlign: "center", fontSize: 48, marginTop: 28 }}>
                {"★".repeat(c.n)}
              </div>
            );
          }
          if (c.type === "summary") {
            return (
              <div key={i} style={{ marginTop: 18, display: "grid", gap: 10 }}>
                {["1 = واحد", "2 = اثنان", "3 = ثلاثة"].map((line, j) => (
                  <div
                    key={line}
                    style={{
                      background: ["#ffe056", "#ff8ab8", "#7ed0ff"][j],
                      color: "#1e2a3a",
                      borderRadius: 14,
                      padding: "10px 14px",
                      textAlign: "center",
                      fontWeight: 900,
                      fontSize: 22,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            );
          }
          if (c.type === "banner") {
            return (
              <div key={i} style={{ marginTop: 28, textAlign: "center" }}>
                <span style={{ background: "#ff5a6a", borderRadius: 18, padding: "12px 28px", fontWeight: 900, fontSize: 24 }}>
                  {c.text}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function InteractiveClassroom({ initialTeacher = "sara" as TeacherId }) {
  const [teacherId, setTeacherId] = useState<TeacherId>(initialTeacher);
  const teacher = TEACHERS[teacherId];
  const beats = useMemo(
    () => buildG1CountLesson(teacher.nameAr, teacher.gender),
    [teacher.nameAr, teacher.gender],
  );

  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0.15);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("اختر معلماً ثم اضغط ابدأ الدرس");
  const [status, setStatus] = useState("جاهز");
  const mouthTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);
  const recogRef = useRef<{ start: () => void; abort: () => void } | null>(null);

  const beat: LessonBeat = beats[beatIndex] ?? beats[0]!;

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setMouthEnergy(0);
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    if (progressTimer.current) window.clearInterval(progressTimer.current);
  }, []);

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      stopSpeech();
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setCaption(text);
        setStatus("المتصفح لا يدعم النطق — اعرض النص فقط");
        setProgress(1);
        onDone?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-JO";
      const voice = pickArabicVoice();
      if (voice) u.voice = voice;
      u.rate = teacher.gender === "female" ? 0.95 : 0.92;
      u.pitch = teacher.gender === "female" ? 1.05 : 0.95;

      setCaption(text);
      setSpeaking(true);
      setListening(false);
      setStatus("يتحدث…");
      setProgress(0.12);

      // animate mouth + board reveal while speaking
      const started = performance.now();
      const approxMs = Math.max(2500, text.length * 70);
      mouthTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - started;
        const p = Math.min(1, elapsed / approxMs);
        setProgress(0.12 + p * 0.85);
        // fake syllable energy
        setMouthEnergy(0.25 + 0.75 * Math.abs(Math.sin(elapsed / 90)));
      }, 40);

      u.onend = () => {
        if (mouthTimer.current) window.clearInterval(mouthTimer.current);
        setSpeaking(false);
        setMouthEnergy(0);
        setProgress(1);
        setStatus("بانتظار تفاعلك");
        onDone?.();
      };
      u.onerror = () => {
        stopSpeech();
        setStatus("تعذّر النطق");
        onDone?.();
      };
      window.speechSynthesis.speak(u);
    },
    [stopSpeech, teacher.gender],
  );

  const runBeat = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      setBeatIndex(index);
      speak(b.say);
    },
    [beats, speak],
  );

  const handleCommand = useCallback(
    (id: string) => {
      if (id === "start") {
        runBeat(0);
        return;
      }
      if (id === "next") {
        runBeat(Math.min(beats.length - 1, beatIndex + 1));
        return;
      }
      if (id === "repeat") {
        runBeat(beatIndex);
        return;
      }
      if (id === "pause") {
        stopSpeech();
        setListening(true);
        setStatus("متوقف — اضغط التالي أو كلّمني");
        return;
      }
      if (id === "simpler") {
        const current = beats[beatIndex] ?? beats[0];
        if (!current) return;
        speak(`ببساطة أكثر: ${current.board.title}. ${current.board.subtitle}. هيا نعيدها معاً خطوة خطوة.`);
        return;
      }
      if (id === "example") {
        speak("مثال سريع: تفاحة واحدة هي واحد. تفاحتان هما اثنان. ثلاث تفاحات هي ثلاثة.");
        return;
      }
    },
    [beat, beatIndex, beats.length, runBeat, speak, stopSpeech],
  );

  const startListening = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setStatus("الميكروفون غير مدعوم في هذا المتصفح — استخدم الأزرار");
      return;
    }
    stopSpeech();
    setListening(true);
    setStatus("يستمع… قل: ابدأ، التالي، أعد، أبسط، مثال، توقف");
    const recog = new SR();
    recog.lang = "ar-JO";
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recog.onresult = (ev: any) => {
      const said = Array.from(ev.results as ArrayLike<{ 0?: { transcript?: string } }>)
        .map((r) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      setCaption(`سمعت: ${said}`);
      const hit = INTERACTIVE_COMMANDS.find((c) => c.match.some((m) => said.includes(m)));
      if (hit) handleCommand(hit.id);
      else speak("ما سمعت أمراً واضحاً. قل: ابدأ، أو التالي، أو أعد، أو أبسط.");
      setListening(false);
    };
    recog.onerror = () => {
      setListening(false);
      setStatus("ما قدر أسمع — جرّب زر الأوامر");
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    recog.start();
  }, [handleCommand, speak, stopSpeech]);

  useEffect(() => {
    const warm = () => pickArabicVoice();
    warm();
    window.speechSynthesis?.addEventListener("voiceschanged", warm);
    return () => {
      stopSpeech();
      window.speechSynthesis?.removeEventListener("voiceschanged", warm);
      recogRef.current?.abort();
    };
  }, [stopSpeech]);

  useEffect(() => {
    // reset lesson when teacher changes
    stopSpeech();
    setBeatIndex(0);
    setProgress(0.15);
    setCaption(`مرحبا! أنا ${teacher.nameAr}. اضغط ابدأ الدرس أو كلّمني.`);
    setStatus("جاهز");
  }, [teacherId, teacher.nameAr, stopSpeech]);

  const btnStyle: CSSProperties = {
    border: "none",
    borderRadius: 16,
    padding: "12px 14px",
    fontWeight: 800,
    cursor: "pointer",
    background: "#fff",
    color: "#1e2a3a",
    fontSize: 15,
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 15%, #fff3a8 0%, transparent 32%), linear-gradient(165deg,#6ec8ff,#9be7c2 55%,#67d392)",
        padding: "18px 16px 40px",
        fontFamily: "Cairo, sans-serif",
        color: "#1e2a3a",
      }}
    >
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 14px",
          background: "rgba(255,255,255,0.92)",
          borderRadius: 24,
          padding: "14px 18px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, color: "#0f766e", letterSpacing: "0.04em" }}>SUCCESS OS · AI TEACHER LIVE</div>
          <h1 style={{ margin: "4px 0 0", fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)" }}>صف تفاعلي حي — سارة وعلي فقط</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["sara", "ali"] as TeacherId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTeacherId(id)}
              style={{
                ...btnStyle,
                background: teacherId === id ? "#ff5a6a" : "#fff",
                color: teacherId === id ? "#fff" : "#1e2a3a",
                minWidth: 120,
              }}
            >
              {TEACHERS[id].nameAr}
            </button>
          ))}
        </div>
      </header>

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: 14,
        }}
      >
        <section style={{ minHeight: 560 }}>
          <AliveTeacherStage
            teacherId={teacherId}
            speaking={speaking}
            listening={listening}
            mouthEnergy={mouthEnergy}
            mode={beat.mode}
            nameAr={teacher.nameAr}
          />
        </section>

        <section style={{ minHeight: 560, display: "grid", gridTemplateRows: "1fr auto", gap: 12 }}>
          <BoardPanel beat={beat} progress={progress} />

          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{caption}</div>
            <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 12 }}>
              {status} · خطوة {beatIndex + 1}/{beats.length} · {teacher.voiceHint}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8 }}>
              {INTERACTIVE_COMMANDS.map((c) => (
                <button key={c.id} type="button" style={btnStyle} onClick={() => handleCommand(c.id)}>
                  {c.ar}
                </button>
              ))}
              <button
                type="button"
                style={{ ...btnStyle, background: "#1e2a3a", color: "#fff" }}
                onClick={startListening}
              >
                🎤 كلّم المعلم
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

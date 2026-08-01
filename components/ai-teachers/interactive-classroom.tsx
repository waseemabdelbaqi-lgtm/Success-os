"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AliveTeacherStage } from "@/components/ai-teachers/alive-teacher-stage";
import {
  INTERACTIVE_COMMANDS,
  buildG1CountLesson,
  type BoardCue,
  type LessonBeat,
} from "@/lib/ai-teachers/g1-count-lesson";
import {
  checkFeedback,
  coachLine,
  type TeacherPersona,
} from "@/lib/ai-teachers/master-coach";

type TeacherId = "sara" | "ali";

const TEACHERS: Record<TeacherId, TeacherPersona & { voiceHint: string }> = {
  sara: {
    id: "sara",
    nameAr: "المعلمة سارة",
    gender: "female",
    style: "warm",
    voiceHint: "ar-JO · دافئة ومشجّعة",
  },
  ali: {
    id: "ali",
    nameAr: "المعلم علي",
    gender: "male",
    style: "crisp",
    voiceHint: "ar-JO · واضح وواثق",
  },
};

function pickArabicVoice(preferFemale: boolean): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.filter((v) => /ar(-|_|$)|Arabic/i.test(`${v.lang} ${v.name}`));
  if (preferFemale) {
    return (
      ar.find((v) => /female|sana|noura|salma|hoda|laila/i.test(v.name)) ||
      ar[0] ||
      null
    );
  }
  return (
    ar.find((v) => /male|taim|farid|hamid|naayf|omar/i.test(v.name)) ||
    ar.find((v) => !/female|sana|noura|salma/i.test(v.name)) ||
    ar[0] ||
    null
  );
}

function activePointer(cues: BoardCue[], progress: number): BoardCue | null {
  const ptr = cues.filter((c) => c.type === "pointer" && progress >= c.at);
  return ptr.length ? ptr[ptr.length - 1]! : null;
}

function BoardPanel({
  beat,
  progress,
  celebrating,
}: {
  beat: LessonBeat;
  progress: number;
  celebrating: boolean;
}) {
  const cues = beat.board.cues.filter((c) => progress >= c.at && c.type !== "pointer");
  const kinds = new Set(cues.map((c) => c.type));
  const pointer = activePointer(beat.board.cues, progress);
  const pulse = celebrating ? "0 0 0 4px rgba(255,216,74,0.35)" : undefined;

  const ring = (target: "number" | "apples" | "equation" | "practice"): CSSProperties =>
    pointer && pointer.type === "pointer" && pointer.target === target
      ? {
          outline: "3px solid #ffe056",
          outlineOffset: 6,
          boxShadow: "0 0 24px rgba(255,224,86,0.55)",
          transition: "outline 0.2s, box-shadow 0.2s",
        }
      : { transition: "outline 0.2s, box-shadow 0.2s" };

  return (
    <div
      style={{
        height: "100%",
        borderRadius: 28,
        background: "linear-gradient(160deg,#ffb45a,#ff8a3d)",
        padding: 10,
        boxShadow: pulse,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 22,
          background: "linear-gradient(165deg,#0f9a96,#128c90 55%,#0d7377)",
          padding: "18px 20px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12), transparent 40%)",
            pointerEvents: "none",
          }}
        />

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
              position: "relative",
            }}
          >
            {beat.board.title}
          </div>
        )}
        {kinds.has("subtitle") && (
          <div
            style={{
              textAlign: "center",
              color: "#ffe56a",
              fontWeight: 700,
              marginBottom: 16,
              position: "relative",
            }}
          >
            {beat.board.subtitle}
          </div>
        )}

        {cues.map((c, i) => {
          if (c.type === "big_number") {
            const colors = ["#ffe056", "#ff8ab8", "#7ed0ff"];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 20,
                  ...ring("number"),
                  borderRadius: 24,
                }}
              >
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
                      animation: "soPop 0.45s ease",
                    }}
                  >
                    {c.n}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      background: "#fff",
                      color: "#1e2a3a",
                      borderRadius: 12,
                      padding: "6px 14px",
                      fontWeight: 800,
                    }}
                  >
                    {c.word}
                  </div>
                </div>
              </div>
            );
          }
          if (c.type === "apples") {
            const fruit = ["#ff5a5a", "#ff9a3d", "#5ab0ff"];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  marginTop: 18,
                  alignItems: "center",
                  ...ring("apples"),
                  borderRadius: 20,
                  padding: 8,
                }}
              >
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
                      transform: `translateY(${Math.sin(j + progress * 8) * 2}px)`,
                    }}
                  />
                ))}
                <span
                  style={{
                    background: "#ffe056",
                    color: "#1e2a3a",
                    borderRadius: 12,
                    padding: "4px 10px",
                    fontWeight: 900,
                    fontSize: 22,
                  }}
                >
                  × {c.n}
                </span>
              </div>
            );
          }
          if (c.type === "equation") {
            return (
              <div key={i} style={{ marginTop: 24, textAlign: "center", ...ring("equation"), borderRadius: 16, display: "inline-block", width: "100%" }}>
                <span
                  style={{
                    background: "#ffe056",
                    color: "#1e2a3a",
                    borderRadius: 14,
                    padding: "10px 22px",
                    fontWeight: 900,
                    fontSize: 28,
                    display: "inline-block",
                  }}
                >
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
                  ...ring("practice"),
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
              <div key={i} style={{ textAlign: "center", fontSize: 48, marginTop: 28, letterSpacing: 8 }}>
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
                <span
                  style={{
                    background: "#ff5a6a",
                    borderRadius: 18,
                    padding: "12px 28px",
                    fontWeight: 900,
                    fontSize: 24,
                    display: "inline-block",
                  }}
                >
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
  const beats = useMemo(() => buildG1CountLesson(teacher), [teacher]);

  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0.15);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("اختر معلماً ثم اضغط ابدأ الدرس");
  const [status, setStatus] = useState("جاهز للإتقان");
  const [mastery, setMastery] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [awaitingCheck, setAwaitingCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [highlightWord, setHighlightWord] = useState("");

  const mouthTimer = useRef<number | null>(null);
  const recogRef = useRef<{ start: () => void; abort: () => void } | null>(null);
  const autoTimer = useRef<number | null>(null);
  const celebrateTimer = useRef<number | null>(null);

  const beat: LessonBeat = beats[beatIndex] ?? beats[0]!;

  const clearTimers = useCallback(() => {
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setMouthEnergy(0);
    setHighlightWord("");
    clearTimers();
  }, [clearTimers]);

  const flashCelebrate = useCallback(() => {
    setCelebrating(true);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => setCelebrating(false), 2200);
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
      const voice = pickArabicVoice(teacher.gender === "female");
      if (voice) u.voice = voice;
      u.rate = teacher.gender === "female" ? 0.96 : 0.93;
      u.pitch = teacher.gender === "female" ? 1.06 : 0.94;

      setCaption(text);
      setSpeaking(true);
      setListening(false);
      setAwaitingCheck(false);
      setCheckResult("idle");
      setStatus("يشرح الآن…");
      setProgress(0.1);

      const words = text.split(/\s+/).filter(Boolean);
      const started = performance.now();
      const approxMs = Math.max(2800, text.length * 68);
      mouthTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - started;
        const p = Math.min(1, elapsed / approxMs);
        setProgress(0.1 + p * 0.88);
        // syllable-like energy with slight randomness
        const wave = Math.abs(Math.sin(elapsed / 85)) * 0.85 + Math.abs(Math.sin(elapsed / 37)) * 0.15;
        setMouthEnergy(0.2 + 0.8 * wave);
        const wi = Math.min(words.length - 1, Math.floor(p * words.length));
        if (words[wi]) setHighlightWord(words[wi]!);
      }, 36);

      u.onend = () => {
        if (mouthTimer.current) window.clearInterval(mouthTimer.current);
        setSpeaking(false);
        setMouthEnergy(0);
        setHighlightWord("");
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

  const afterBeatSpeech = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      if (b.check) {
        setAwaitingCheck(true);
        setStatus("اختبر فهمك — اختر الجواب");
        setCaption(b.check.prompt);
        return;
      }
      if (b.mode === "celebrate") {
        flashCelebrate();
        setMastery((m) => Math.min(5, m + 1));
      }
      if (autoPlay && index < beats.length - 1) {
        autoTimer.current = window.setTimeout(() => {
          runBeatRef.current(index + 1);
        }, 900);
      }
    },
    [autoPlay, beats, flashCelebrate],
  );

  const runBeatRef = useRef<(index: number) => void>(() => {});

  const runBeat = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      setBeatIndex(index);
      setAwaitingCheck(false);
      setCheckResult("idle");
      speak(b.say, () => afterBeatSpeech(index));
    },
    [afterBeatSpeech, beats, speak],
  );

  runBeatRef.current = runBeat;

  const handleCommand = useCallback(
    (id: string) => {
      if (id === "start") {
        setMastery(0);
        runBeat(0);
        return;
      }
      if (id === "next") {
        if (awaitingCheck) {
          speak("جاوب على السؤال أولاً ثم ننتقل.");
          return;
        }
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
        setAutoPlay(false);
        setStatus("متوقف — اضغط التالي أو كلّمني");
        return;
      }
      if (id === "simpler") {
        speak(
          coachLine(teacher, "simpler", {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
        return;
      }
      if (id === "example") {
        speak(
          coachLine(teacher, "example", {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
        return;
      }
      if (id === "challenge") {
        speak(
          coachLine(teacher, "challenge", {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
        return;
      }
    },
    [
      awaitingCheck,
      beat.board.subtitle,
      beat.board.title,
      beatIndex,
      beats.length,
      mastery,
      runBeat,
      speak,
      stopSpeech,
      teacher,
    ],
  );

  const answerCheck = useCallback(
    (choiceId: string) => {
      const check = beat.check;
      if (!check || !awaitingCheck) return;
      const choice = check.choices.find((c) => c.id === choiceId);
      if (!choice) return;
      const correctChoice = check.choices.find((c) => c.correct) ?? choice;
      setCheckResult(choice.correct ? "correct" : "wrong");
      setAwaitingCheck(false);
      if (choice.correct) {
        setMastery((m) => Math.min(5, m + 1));
        flashCelebrate();
        speak(checkFeedback(teacher, true, correctChoice.label), () => {
          if (autoPlay && beatIndex < beats.length - 1) {
            autoTimer.current = window.setTimeout(() => runBeat(beatIndex + 1), 700);
          } else {
            setStatus("ممتاز — اضغط التالي");
          }
        });
      } else {
        speak(checkFeedback(teacher, false, correctChoice.label), () => {
          setAwaitingCheck(true);
          setCaption(check.prompt);
          setStatus("حاول مرة أخرى");
        });
      }
    },
    [
      awaitingCheck,
      autoPlay,
      beat.check,
      beatIndex,
      beats.length,
      flashCelebrate,
      runBeat,
      speak,
      teacher,
    ],
  );

  const startListening = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setStatus("الميكروفون غير مدعوم — استخدم الأزرار");
      return;
    }
    stopSpeech();
    setListening(true);
    setStatus("يستمع… قل: ابدأ، التالي، أعد، أبسط، مثال، تحدٍّ، توقف");
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
      else speak("ما سمعت أمراً واضحاً. قل: ابدأ، أو التالي، أو أعد، أو أبسط، أو مثال.");
      setListening(false);
    };
    recog.onerror = () => {
      setListening(false);
      setStatus("ما قدر أسمع — جرّب الأزرار");
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    recog.start();
  }, [handleCommand, speak, stopSpeech]);

  useEffect(() => {
    const warm = () => pickArabicVoice(teacher.gender === "female");
    warm();
    window.speechSynthesis?.addEventListener("voiceschanged", warm);
    return () => {
      stopSpeech();
      window.speechSynthesis?.removeEventListener("voiceschanged", warm);
      recogRef.current?.abort();
    };
  }, [stopSpeech, teacher.gender]);

  useEffect(() => {
    stopSpeech();
    setBeatIndex(0);
    setProgress(0.15);
    setMastery(0);
    setAwaitingCheck(false);
    setCheckResult("idle");
    setCelebrating(false);
    setCaption(`مرحبا! أنا ${teacher.nameAr}. أشرح أوضح من أي كتاب — اضغط ابدأ الدرس أو كلّمني.`);
    setStatus("جاهز للإتقان");
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

  const masteryPct = Math.round((mastery / 5) * 100);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 10%, #fff1a0 0%, transparent 28%), radial-gradient(circle at 90% 0%, #7ad7ff 0%, transparent 30%), linear-gradient(165deg,#5ebfff,#8fe0b8 52%,#5fce8a)",
        padding: "18px 16px 40px",
        fontFamily: "Cairo, Segoe UI, Tahoma, sans-serif",
        color: "#1e2a3a",
      }}
    >
      <style>{`
        @keyframes soPop { from { transform: scale(0.7); opacity: 0.2; } to { transform: scale(1); opacity: 1; } }
        @media (max-width: 900px) {
          .so-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 14px",
          background: "rgba(255,255,255,0.94)",
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
          <div style={{ fontWeight: 800, color: "#0f766e", letterSpacing: "0.04em" }}>
            SUCCESS OS · MASTER AI TEACHER
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
            سارة وعلي — أوضح من المعلم الحقيقي
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            style={{
              ...btnStyle,
              background: autoPlay ? "#0f766e" : "#e8f5f1",
              color: autoPlay ? "#fff" : "#0f766e",
            }}
          >
            {autoPlay ? "تشغيل تلقائي: تشغيل" : "تشغيل تلقائي: إيقاف"}
          </button>
        </div>
      </header>

      <div
        className="so-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: 14,
        }}
      >
        <section style={{ minHeight: 560, display: "grid", gap: 10 }}>
          <AliveTeacherStage
            teacherId={teacherId}
            speaking={speaking}
            listening={listening}
            celebrating={celebrating}
            mouthEnergy={mouthEnergy}
            mode={beat.mode}
            nameAr={teacher.nameAr}
            gender={teacher.gender}
            highlightWord={highlightWord}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.94)",
              borderRadius: 18,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>نجوم الإتقان</div>
              <div style={{ opacity: 0.7, fontSize: 13 }}>
                {mastery}/5 · {masteryPct}% — أسرع تغذية راجعة من أي حصة عادية
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 10,
                  borderRadius: 999,
                  background: "#dceee8",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${masteryPct}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#ffd84a,#ff8a3d)",
                    transition: "width 0.35s ease",
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 28, letterSpacing: 2, color: "#e6a800" }}>
              {"★".repeat(mastery)}
              <span style={{ opacity: 0.25 }}>{"★".repeat(Math.max(0, 5 - mastery))}</span>
            </div>
          </div>
        </section>

        <section style={{ minHeight: 560, display: "grid", gridTemplateRows: "1fr auto", gap: 12 }}>
          <BoardPanel beat={beat} progress={progress} celebrating={celebrating} />

          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 20, padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6, lineHeight: 1.55 }}>{caption}</div>
            <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 12 }}>
              {status} · خطوة {beatIndex + 1}/{beats.length} · {teacher.voiceHint}
              {checkResult === "correct" ? " · إجابة صحيحة" : checkResult === "wrong" ? " · حاول مجدداً" : ""}
            </div>

            {awaitingCheck && beat.check && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {beat.check.choices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => answerCheck(c.id)}
                    style={{
                      ...btnStyle,
                      background: "#fff8e1",
                      border: "2px solid #ffd84a",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
                gap: 8,
              }}
            >
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
                كلّم المعلم
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

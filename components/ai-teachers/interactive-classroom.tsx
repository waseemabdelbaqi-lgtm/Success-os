"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AliveTeacherStage,
  type TeacherPose,
} from "@/components/ai-teachers/alive-teacher-stage";
import { LivingBoard } from "@/components/ai-teachers/living-board";
import {
  INTERACTIVE_COMMANDS,
  buildG1CountLesson,
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
    voiceHint: "صوت عصبي Sana · أردني",
  },
  ali: {
    id: "ali",
    nameAr: "المعلم علي",
    gender: "male",
    style: "crisp",
    voiceHint: "صوت عصبي Taim · أردني",
  },
};

const BEAT_AUDIO: Record<string, string> = {
  welcome: "welcome",
  one: "one",
  two: "two",
  three: "three",
  practice: "practice",
  bye: "bye",
};

function poseForBeat(beat: LessonBeat, speaking: boolean, progress: number): TeacherPose {
  if (beat.mode === "celebrate") return "gesture";
  if (beat.mode === "gesture") {
    if (progress > 0.55 && progress < 0.85) return "write";
    return speaking ? "point" : "gesture";
  }
  if (speaking) return "talk";
  return "idle";
}

function pickArabicVoice(preferFemale: boolean): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.filter((v) => /ar(-|_|$)|Arabic/i.test(`${v.lang} ${v.name}`));
  if (preferFemale) {
    return ar.find((v) => /female|sana|noura|salma|hoda/i.test(v.name)) || ar[0] || null;
  }
  return (
    ar.find((v) => /male|taim|farid|hamid|naayf/i.test(v.name)) ||
    ar.find((v) => !/female|sana|noura|salma/i.test(v.name)) ||
    ar[0] ||
    null
  );
}

export function InteractiveClassroom({ initialTeacher = "sara" as TeacherId }) {
  const [teacherId, setTeacherId] = useState<TeacherId>(initialTeacher);
  const teacher = TEACHERS[teacherId];
  const beats = useMemo(() => buildG1CountLesson(teacher), [teacher]);

  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0.08);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("اضغط ابدأ — صوت عصبي حقيقي");
  const [mastery, setMastery] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [awaitingCheck, setAwaitingCheck] = useState(false);
  const [started, setStarted] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafMouthRef = useRef<number | null>(null);
  const mouthTimer = useRef<number | null>(null);
  const autoTimer = useRef<number | null>(null);
  const celebrateTimer = useRef<number | null>(null);
  const recogRef = useRef<{ start: () => void; abort: () => void } | null>(null);
  const runBeatRef = useRef<(index: number) => void>(() => {});

  const beat = beats[beatIndex] ?? beats[0]!;
  const pose = poseForBeat(beat, speaking, progress);
  const writing = pose === "write" || (speaking && progress > 0.4 && progress < 0.9);

  const clearTimers = useCallback(() => {
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    if (rafMouthRef.current) cancelAnimationFrame(rafMouthRef.current);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
    setMouthEnergy(0);
    clearTimers();
  }, [clearTimers]);

  const flashCelebrate = useCallback(() => {
    setCelebrating(true);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    celebrateTimer.current = window.setTimeout(() => setCelebrating(false), 2400);
  }, []);

  const ensureAnalyser = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audio);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      }
    } catch {
      // analyser optional
    }
  }, []);

  const trackMouthFromAnalyser = useCallback((audio: HTMLAudioElement, approxMs: number) => {
    const startedAt = performance.now();
    const data = new Uint8Array(analyserRef.current?.frequencyBinCount || 0);

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const p = Math.min(1, elapsed / Math.max(1, approxMs));
      setProgress(0.08 + p * 0.9);

      if (analyserRef.current && data.length) {
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i]! - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setMouthEnergy(Math.min(1, 0.15 + rms * 4.2));
      } else {
        setMouthEnergy(0.22 + 0.78 * Math.abs(Math.sin(elapsed / 80)));
      }

      if (!audio.paused && !audio.ended) {
        rafMouthRef.current = requestAnimationFrame(tick);
      }
    };
    rafMouthRef.current = requestAnimationFrame(tick);
  }, []);

  const speakFallback = useCallback(
    (text: string, onDone?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setCaption(text);
        setProgress(1);
        onDone?.();
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ar-JO";
      const voice = pickArabicVoice(teacher.gender === "female");
      if (voice) u.voice = voice;
      u.rate = teacher.gender === "female" ? 0.96 : 0.93;
      u.pitch = teacher.gender === "female" ? 1.05 : 0.94;
      setCaption(text);
      setSpeaking(true);
      setStatus("يشرح…");
      const startedAt = performance.now();
      const approxMs = Math.max(2800, text.length * 68);
      mouthTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        const p = Math.min(1, elapsed / approxMs);
        setProgress(0.08 + p * 0.9);
        setMouthEnergy(0.2 + 0.8 * Math.abs(Math.sin(elapsed / 85)));
      }, 40);
      u.onend = () => {
        clearTimers();
        setSpeaking(false);
        setMouthEnergy(0);
        setProgress(1);
        onDone?.();
      };
      u.onerror = () => {
        stopSpeech();
        onDone?.();
      };
      window.speechSynthesis.speak(u);
    },
    [clearTimers, stopSpeech, teacher.gender],
  );

  const speakAudioOrFallback = useCallback(
    (audioKey: string | null, text: string, onDone?: () => void) => {
      stopSpeech();
      setCaption(text);
      setListening(false);
      setAwaitingCheck(false);

      if (!audioKey) {
        speakFallback(text, onDone);
        return;
      }

      const src = `/media/ai-teachers/${teacherId}/audio/${audioKey}.mp3`;
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.src = src;
      audio.preload = "auto";

      const startPlayback = () => {
        ensureAnalyser(audio);
        setSpeaking(true);
        setStatus("صوت عصبي حي…");
        setProgress(0.08);
        const approxMs = Math.max(2500, (audio.duration || text.length * 0.07) * 1000);
        trackMouthFromAnalyser(audio, approxMs);
        void audio.play().catch(() => {
          speakFallback(text, onDone);
        });
      };

      audio.onended = () => {
        clearTimers();
        setSpeaking(false);
        setMouthEnergy(0);
        setProgress(1);
        setStatus("بانتظارك");
        onDone?.();
      };
      audio.onerror = () => {
        speakFallback(text, onDone);
      };

      if (audio.readyState >= 2) startPlayback();
      else {
        audio.onloadeddata = startPlayback;
        audio.load();
      }
    },
    [
      clearTimers,
      ensureAnalyser,
      speakFallback,
      stopSpeech,
      teacherId,
      trackMouthFromAnalyser,
    ],
  );

  const afterBeatSpeech = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      if (b.check) {
        setAwaitingCheck(true);
        setStatus("اختبر فهمك");
        setCaption(b.check.prompt);
        setDockOpen(true);
        return;
      }
      if (b.mode === "celebrate") {
        flashCelebrate();
        setMastery((m) => Math.min(5, m + 1));
      }
      if (autoPlay && index < beats.length - 1) {
        autoTimer.current = window.setTimeout(() => runBeatRef.current(index + 1), 850);
      }
    },
    [autoPlay, beats, flashCelebrate],
  );

  const runBeat = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      setStarted(true);
      setBeatIndex(index);
      setAwaitingCheck(false);
      const key = BEAT_AUDIO[b.id] ?? null;
      speakAudioOrFallback(key, b.say, () => afterBeatSpeech(index));
    },
    [afterBeatSpeech, beats, speakAudioOrFallback],
  );
  runBeatRef.current = runBeat;

  const handleCommand = useCallback(
    (id: string) => {
      if (id === "start") {
        setMastery(0);
        setStarted(true);
        runBeat(0);
        return;
      }
      if (id === "next") {
        if (awaitingCheck) {
          speakAudioOrFallback(null, "جاوب على السؤال أولاً ثم ننتقل.");
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
        setStatus("متوقف");
        return;
      }
      if (id === "simpler") {
        speakAudioOrFallback(
          "simpler",
          coachLine(teacher, "simpler", {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
        return;
      }
      if (id === "example") {
        speakAudioOrFallback(
          "example",
          coachLine(teacher, "example", {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
        return;
      }
      if (id === "challenge") {
        speakAudioOrFallback(
          "challenge",
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
      speakAudioOrFallback,
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
      setAwaitingCheck(false);
      if (choice.correct) {
        setMastery((m) => Math.min(5, m + 1));
        flashCelebrate();
        speakAudioOrFallback("correct", checkFeedback(teacher, true, correctChoice.label), () => {
          if (autoPlay && beatIndex < beats.length - 1) {
            autoTimer.current = window.setTimeout(() => runBeat(beatIndex + 1), 650);
          } else setStatus("ممتاز — التالي");
        });
      } else {
        speakAudioOrFallback("wrong", checkFeedback(teacher, false, correctChoice.label), () => {
          setAwaitingCheck(true);
          setCaption(check.prompt);
          setStatus("حاول مجدداً");
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
      speakAudioOrFallback,
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
      setDockOpen(true);
      return;
    }
    stopSpeech();
    setListening(true);
    setStatus("يستمع…");
    const recog = new SR();
    recog.lang = "ar-JO";
    recog.interimResults = false;
    recog.onresult = (ev: any) => {
      const said = Array.from(ev.results as ArrayLike<{ 0?: { transcript?: string } }>)
        .map((r) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      setCaption(`سمعت: ${said}`);
      const hit = INTERACTIVE_COMMANDS.find((c) => c.match.some((m) => said.includes(m)));
      if (hit) handleCommand(hit.id);
      else speakAudioOrFallback(null, "ما سمعت أمراً واضحاً. قل: ابدأ أو التالي أو أبسط.");
      setListening(false);
    };
    recog.onerror = () => {
      setListening(false);
      setStatus("ما قدر أسمع");
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    recog.start();
  }, [handleCommand, speakAudioOrFallback, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
      recogRef.current?.abort();
      void audioCtxRef.current?.close();
    };
  }, [stopSpeech]);

  useEffect(() => {
    stopSpeech();
    setBeatIndex(0);
    setProgress(0.08);
    setMastery(0);
    setAwaitingCheck(false);
    setCelebrating(false);
    setStarted(false);
    setCaption("");
    setStatus("اضغط ابدأ — صوت عصبي حقيقي");
    // warm intro audio metadata
    const a = new Audio(`/media/ai-teachers/${teacherId}/audio/intro.mp3`);
    a.preload = "auto";
  }, [teacherId, stopSpeech]);

  return (
    <div
      dir="rtl"
      className="cinema-class"
      style={{
        minHeight: "100vh",
        background: "#070b12",
        color: "#f4f1e6",
        fontFamily: "var(--font-teacher-ar), 'Noto Kufi Arabic', 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        .cinema-class {
          --font-teacher-ar: 'Noto Kufi Arabic', sans-serif;
        }
        .cinema-grid {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(320px, 42vw) 1fr;
        }
        @media (max-width: 900px) {
          .cinema-grid { grid-template-columns: 1fr; min-height: auto; }
          .cinema-teacher { min-height: 62vh !important; }
          .cinema-board { min-height: 52vh !important; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .cinema-cta {
          animation: riseIn 0.7s ease both;
        }
      `}</style>

      {/* top brand bar — thin, not a card stack */}
      <div
        style={{
          position: "fixed",
          top: 0,
          insetInline: 0,
          zIndex: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: 12, color: "#ffd84a" }}>
            SUCCESS OS
          </div>
          <div style={{ fontWeight: 800, fontSize: "clamp(1.1rem, 2.4vw, 1.45rem)", marginTop: 2 }}>
            {teacher.nameAr}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          {(["sara", "ali"] as TeacherId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTeacherId(id)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 16px",
                fontWeight: 800,
                cursor: "pointer",
                background: teacherId === id ? "#ff5a6a" : "rgba(255,255,255,0.12)",
                color: "#fff",
                backdropFilter: "blur(8px)",
              }}
            >
              {TEACHERS[id].nameAr.replace("المعلمة ", "").replace("المعلم ", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="cinema-grid">
        <section
          className="cinema-teacher"
          style={{
            position: "relative",
            minHeight: "100vh",
            background: "#0b1220",
          }}
        >
          <AliveTeacherStage
            teacherId={teacherId}
            speaking={speaking}
            listening={listening}
            celebrating={celebrating}
            mouthEnergy={mouthEnergy}
            pose={pose}
            nameAr={teacher.nameAr}
            gender={teacher.gender}
          />
        </section>

        <section
          className="cinema-board"
          style={{
            position: "relative",
            minHeight: "100vh",
            display: "grid",
            gridTemplateRows: "1fr auto",
          }}
        >
          <LivingBoard
            beat={beat}
            progress={started ? progress : 0.2}
            writing={writing}
            celebrating={celebrating}
          />

          {/* film-style caption + primary CTA */}
          <div
            style={{
              position: "absolute",
              insetInline: 0,
              bottom: 0,
              padding: "20px 18px 22px",
              background: "linear-gradient(transparent, rgba(5,8,14,0.92) 35%)",
              zIndex: 5,
            }}
          >
            {!started ? (
              <div className="cinema-cta" style={{ maxWidth: 640 }}>
                <h1
                  style={{
                    margin: "0 0 8px",
                    fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}
                >
                  أوضح من المعلم الحقيقي
                </h1>
                <p style={{ margin: "0 0 18px", opacity: 0.85, fontSize: "1.05rem", maxWidth: 520 }}>
                  صوت عصبي أردني، وجه يتحرك، وسبورة تُكتب مع الشرح — مع فحص فهم فوري.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleCommand("start")}
                    style={{
                      border: "none",
                      borderRadius: 16,
                      padding: "16px 28px",
                      fontWeight: 900,
                      fontSize: 18,
                      cursor: "pointer",
                      background: "linear-gradient(120deg,#ffd84a,#ff8a3d)",
                      color: "#1a1408",
                    }}
                  >
                    ابدأ الدرس الآن
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDockOpen(true);
                      startListening();
                    }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: 16,
                      padding: "16px 22px",
                      fontWeight: 800,
                      fontSize: 16,
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                    }}
                  >
                    كلّم {teacher.gender === "female" ? "سارة" : "علي"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
                    fontWeight: 700,
                    lineHeight: 1.55,
                    marginBottom: 8,
                    maxWidth: 720,
                    textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                  }}
                >
                  {caption}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: "#ffd84a", fontWeight: 700, fontSize: 13 }}>
                    {status} · {beatIndex + 1}/{beats.length} · إتقان {mastery}/5 · {teacher.voiceHint}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDockOpen((v) => !v)}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontWeight: 800,
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.14)",
                      color: "#fff",
                    }}
                  >
                    {dockOpen ? "إخفاء الأوامر" : "الأوامر"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoPlay((v) => !v)}
                    style={{
                      border: "none",
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontWeight: 800,
                      cursor: "pointer",
                      background: autoPlay ? "#0f766e" : "rgba(255,255,255,0.14)",
                      color: "#fff",
                    }}
                  >
                    {autoPlay ? "تلقائي" : "يدوي"}
                  </button>
                </div>

                {awaitingCheck && beat.check && (
                  <div
                    style={{
                      marginTop: 14,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                      gap: 8,
                      maxWidth: 720,
                    }}
                  >
                    {beat.check.choices.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => answerCheck(c.id)}
                        style={{
                          border: "2px solid #ffd84a",
                          borderRadius: 14,
                          padding: "14px 12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: "rgba(255,248,220,0.95)",
                          color: "#1a1408",
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {dockOpen && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
                      gap: 8,
                      maxWidth: 820,
                    }}
                  >
                    {INTERACTIVE_COMMANDS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCommand(c.id)}
                        style={{
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 10px",
                          fontWeight: 800,
                          cursor: "pointer",
                          background: "rgba(255,255,255,0.12)",
                          color: "#fff",
                        }}
                      >
                        {c.ar}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={startListening}
                      style={{
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 10px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: "#ff5a6a",
                        color: "#fff",
                      }}
                    >
                      ميكروفون
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

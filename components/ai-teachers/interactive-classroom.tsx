"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AliveTeacherStage,
  type ClassroomPose,
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
import {
  getTeacherDisplayName,
  getTeacherPersonalityLock,
  requireTeacherConfig,
  resolveTeacherVoice,
} from "@/src/ai-teacher/config";

type TeacherId = "sara" | "ali";

function teacherFromConfig(id: TeacherId): TeacherPersona & { voiceHint: string } {
  const cfg = requireTeacherConfig(id);
  const lock = getTeacherPersonalityLock(id);
  const names = getTeacherDisplayName(id);
  const voice = resolveTeacherVoice(id);
  return {
    id,
    nameAr: names.ar,
    gender: cfg.gender,
    style: lock.tone === "warm" ? "warm" : "crisp",
    voiceHint: voice.voiceId,
  };
}

const TEACHERS: Record<TeacherId, TeacherPersona & { voiceHint: string }> = {
  sara: teacherFromConfig("sara"),
  ali: teacherFromConfig("ali"),
};

const BEAT_AUDIO: Record<string, string> = {
  welcome: "welcome",
  one: "one",
  two: "two",
  three: "three",
  practice: "practice",
  bye: "bye",
};

function resolvePose(beat: LessonBeat, speaking: boolean, progress: number): ClassroomPose {
  if (!speaking) {
    if (beat.pose === "write" && progress > 0.85) return "stand";
    return beat.pose;
  }
  // while speaking: start standing, then shift into beat pose like a real teacher
  if (progress < 0.22) return "stand";
  if (beat.pose === "write" && progress > 0.35 && progress < 0.8) return "write";
  if (beat.pose === "point" && progress > 0.3) return "point";
  return beat.pose;
}

export function InteractiveClassroom({ initialTeacher = "sara" as TeacherId }) {
  const [teacherId, setTeacherId] = useState<TeacherId>(initialTeacher);
  const teacher = TEACHERS[teacherId];
  const beats = useMemo(() => buildG1CountLesson(teacher), [teacher]);

  const [beatIndex, setBeatIndex] = useState(0);
  const [progress, setProgress] = useState(0.1);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [mouthEnergy, setMouthEnergy] = useState(0);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState("حصة جاهزة — اضغط ابدأ");
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
  const pose = resolvePose(beat, speaking, progress);
  const writing = pose === "write";

  const clearTimers = useCallback(() => {
    if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    if (autoTimer.current) window.clearTimeout(autoTimer.current);
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
    if (rafMouthRef.current) cancelAnimationFrame(rafMouthRef.current);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
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
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
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
      /* optional */
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
        setMouthEnergy(Math.min(1, 0.12 + Math.sqrt(sum / data.length) * 4.5));
      } else {
        setMouthEnergy(0.2 + 0.75 * Math.abs(Math.sin(elapsed / 85)));
      }
      if (!audio.paused && !audio.ended) rafMouthRef.current = requestAnimationFrame(tick);
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
      u.rate = teacher.gender === "female" ? 0.94 : 0.91;
      setCaption(text);
      setSpeaking(true);
      const startedAt = performance.now();
      const approxMs = Math.max(3000, text.length * 72);
      mouthTimer.current = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        setProgress(0.08 + Math.min(1, elapsed / approxMs) * 0.9);
        setMouthEnergy(0.2 + 0.75 * Math.abs(Math.sin(elapsed / 90)));
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
        setStatus("يشرح كالصف الحقيقي…");
        setProgress(0.08);
        const approxMs = Math.max(2600, (audio.duration || text.length * 0.08) * 1000);
        trackMouthFromAnalyser(audio, approxMs);
        void audio.play().catch(() => speakFallback(text, onDone));
      };
      audio.onended = () => {
        clearTimers();
        setSpeaking(false);
        setMouthEnergy(0);
        setProgress(1);
        setStatus("دور الطالب");
        onDone?.();
      };
      audio.onerror = () => speakFallback(text, onDone);
      if (audio.readyState >= 2) startPlayback();
      else {
        audio.onloadeddata = startPlayback;
        audio.load();
      }
    },
    [clearTimers, ensureAnalyser, speakFallback, stopSpeech, teacherId, trackMouthFromAnalyser],
  );

  const afterBeatSpeech = useCallback(
    (index: number) => {
      const b = beats[index];
      if (!b) return;
      if (b.check) {
        setAwaitingCheck(true);
        setStatus("جاوب مثل الصف");
        setCaption(b.check.prompt);
        setDockOpen(true);
        return;
      }
      if (b.mode === "celebrate") {
        flashCelebrate();
        setMastery((m) => Math.min(5, m + 1));
      }
      if (autoPlay && index < beats.length - 1) {
        autoTimer.current = window.setTimeout(() => runBeatRef.current(index + 1), 900);
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
      speakAudioOrFallback(BEAT_AUDIO[b.id] ?? null, b.say, () => afterBeatSpeech(index));
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
          speakAudioOrFallback(null, "جاوب على السؤال أولاً يا بطل، بعدين نكمّل.");
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
        setStatus("الحصة متوقفة");
        return;
      }
      if (id === "simpler" || id === "example" || id === "challenge") {
        speakAudioOrFallback(
          id,
          coachLine(teacher, id, {
            beatTitle: beat.board.title,
            beatSubtitle: beat.board.subtitle,
            mastery,
          }),
        );
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
            autoTimer.current = window.setTimeout(() => runBeat(beatIndex + 1), 700);
          } else setStatus("ممتاز — التالي");
        });
      } else {
        speakAudioOrFallback("wrong", checkFeedback(teacher, false, correctChoice.label), () => {
          setAwaitingCheck(true);
          setCaption(check.prompt);
          setStatus("حاول مرة ثانية");
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
    setStatus("المعلم يستمع…");
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
      else speakAudioOrFallback(null, "ما سمعت بوضوح. قل: ابدأ الحصة، أو التالي، أو أبسط.");
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
    setProgress(0.1);
    setMastery(0);
    setAwaitingCheck(false);
    setCelebrating(false);
    setStarted(false);
    setCaption("");
    setStatus("حصة جاهزة — اضغط ابدأ");
    sourceRef.current = null;
    analyserRef.current = null;
    audioRef.current = null;
  }, [teacherId, stopSpeech]);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #2a2118 0%, #1a140f 40%, #0f0c09 100%)",
        color: "#f4f1e6",
        fontFamily: "var(--font-teacher-ar), 'Noto Kufi Arabic', 'Segoe UI', sans-serif",
        ["--font-teacher-ar" as string]: "'Noto Kufi Arabic', sans-serif",
      }}
    >
      <style>{`
        .real-class {
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
        }
        .real-stage {
          display: grid;
          grid-template-columns: minmax(300px, 38vw) 1fr;
          min-height: calc(100vh - 120px);
          gap: 0;
          border-top: 10px solid #6b4423;
          border-bottom: 14px solid #5a381c;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.35);
        }
        @media (max-width: 900px) {
          .real-stage { grid-template-columns: 1fr; min-height: auto; }
          .real-teacher { min-height: 58vh !important; }
          .real-board { min-height: 50vh !important; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "linear-gradient(90deg, #3d2918, #2a1d12)",
          borderBottom: "1px solid rgba(255,220,150,0.15)",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, letterSpacing: "0.08em", fontSize: 11, color: "#ffd84a" }}>
            SUCCESS OS · REAL CLASS
          </div>
          <h1 style={{ margin: "2px 0 0", fontSize: "clamp(1.15rem, 2.4vw, 1.55rem)", fontWeight: 900 }}>
            {teacher.nameAr} — حصة شبه الحقيقية وأوضح
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                background: teacherId === id ? "#c45c26" : "rgba(255,255,255,0.1)",
                color: "#fff",
              }}
            >
              {TEACHERS[id].nameAr.replace("المعلمة ", "").replace("المعلم ", "")}
            </button>
          ))}
        </div>
      </header>

      <div className="real-class">
        <div className="real-stage">
          <section className="real-teacher" style={{ minHeight: "100%", background: "#c4ad8c" }}>
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

          <section className="real-board" style={{ minHeight: "100%", position: "relative" }}>
            <LivingBoard
              beat={beat}
              progress={started ? progress : 0.25}
              writing={writing}
              celebrating={celebrating}
            />
          </section>
        </div>

        <footer
          style={{
            padding: "14px 16px 18px",
            background: "linear-gradient(180deg, #24180f, #140e0a)",
          }}
        >
          {!started ? (
            <div style={{ maxWidth: 760, animation: "riseIn 0.65s ease both" }}>
              <p style={{ margin: "0 0 14px", fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)", opacity: 0.92 }}>
                المعلم واقف جنب السبورة، يشرح بصوت صفّي، ويكتب ويشير مثلبالحصة الحقيقية — مع تصحيح فوري أسرع.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleCommand("start")}
                  style={{
                    border: "none",
                    borderRadius: 14,
                    padding: "15px 26px",
                    fontWeight: 900,
                    fontSize: 17,
                    cursor: "pointer",
                    background: "linear-gradient(120deg,#e6b35a,#c45c26)",
                    color: "#1a1208",
                  }}
                >
                  ابدأ الحصة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDockOpen(true);
                    startListening();
                  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 14,
                    padding: "15px 20px",
                    fontWeight: 800,
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                  }}
                >
                  ارفع إيدك / كلّم المعلم
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "clamp(1.05rem, 2.2vw, 1.3rem)",
                  fontWeight: 700,
                  lineHeight: 1.55,
                  marginBottom: 8,
                  maxWidth: 820,
                }}
              >
                {caption}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#ffd84a", fontWeight: 700, fontSize: 13 }}>
                  {status} · {beatIndex + 1}/{beats.length} · إتقان {mastery}/5 · {teacher.voiceHint}
                </span>
                <button
                  type="button"
                  onClick={() => setDockOpen((v) => !v)}
                  style={chipStyle}
                >
                  {dockOpen ? "إخفاء" : "أوامر الصف"}
                </button>
                <button type="button" onClick={() => setAutoPlay((v) => !v)} style={{
                  ...chipStyle,
                  background: autoPlay ? "#2a9d8f" : "rgba(255,255,255,0.12)",
                }}>
                  {autoPlay ? "تلقائي" : "يدوي"}
                </button>
              </div>

              {awaitingCheck && beat.check && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                    gap: 8,
                    maxWidth: 720,
                    marginBottom: 10,
                  }}
                >
                  {beat.check.choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => answerCheck(c.id)}
                      style={{
                        border: "2px solid #e6b35a",
                        borderRadius: 12,
                        padding: "13px 10px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: "#fff6df",
                        color: "#1a1208",
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
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
                    gap: 8,
                    maxWidth: 860,
                  }}
                >
                  {INTERACTIVE_COMMANDS.map((c) => (
                    <button key={c.id} type="button" onClick={() => handleCommand(c.id)} style={chipStyle}>
                      {c.ar}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={startListening}
                    style={{ ...chipStyle, background: "#c45c26" }}
                  >
                    ميكروفون
                  </button>
                </div>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

const chipStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "9px 14px",
  fontWeight: 800,
  cursor: "pointer",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontSize: 14,
};

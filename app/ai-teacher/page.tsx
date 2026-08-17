"use client";

import { useEffect, useRef, useState } from "react";
import { DigitalHumanBridge, type DigitalHumanStatus, type DebugEvent } from "./digital-human-bridge";
import { buildNumbersDemoScript, PRAISE_AR, PRAISE_EN, RETRY_AR, RETRY_EN, type DemoStep } from "./numbers-demo-script";
import { DigitalStudio } from "./digital-studio";

type TeacherId = "sara" | "ali";
type Screen = "gate" | "classroom";

const TEACHERS: { id: TeacherId; name: string; nameAr: string }[] = [
  { id: "sara", name: "Sara", nameAr: "سارة" },
  { id: "ali", name: "Ali", nameAr: "علي" },
];

interface TeacherConfigStatus {
  ready: boolean;
  missingVariables: string[];
}
interface ConfigStatus {
  sara: TeacherConfigStatus;
  ali: TeacherConfigStatus;
  blocked: boolean; // reflects Sara's readiness — the current milestone
  missingVariables: string[]; // Sara's missing vars
}

type DebugState = "WAITING" | "CONNECTING" | "CONNECTED" | "ACTIVE" | "PLAYING" | "LISTENING" | "WRITING" | "READY" | "ERROR";

export default function AITeacherPage() {
  const [screen, setScreen] = useState<Screen>("gate");
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [teacherId, setTeacherId] = useState<TeacherId | null>(null);
  const [script, setScript] = useState<DemoStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [board, setBoard] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [busy, setBusy] = useState(false);

  const [sessionState, setSessionState] = useState<DebugState>("WAITING");
  const [videoState, setVideoState] = useState<DebugState>("WAITING");
  const [voiceState, setVoiceState] = useState<DebugState>("WAITING");
  const [lipsyncState, setLipsyncState] = useState<DebugState>("WAITING");
  const [micState, setMicState] = useState<DebugState>("WAITING");
  const [boardState, setBoardState] = useState<DebugState>("READY");
  const [debugLog, setDebugLog] = useState<DebugEvent[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bridgeRef = useRef<DigitalHumanBridge | null>(null);
  const scriptRef = useRef<DemoStep[]>([]);
  const stepIndexRef = useRef(0);

  async function checkConfig() {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/ai-teacher/config-status");
      const data = await res.json();
      setConfig(data);
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setConfigLoading(true);
      try {
        const res = await fetch("/api/ai-teacher/config-status");
        const data = await res.json();
        if (!cancelled) setConfig(data);
      } catch {
        if (!cancelled) setConfig(null);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => () => { bridgeRef.current?.disconnect(); }, []);

  function handleDebugEvent(event: DebugEvent) {
    setDebugLog((log) => [...log.slice(-24), event]);
    if (event.stage === "error") {
      if (event.errorStage?.startsWith("session")) { setSessionState("ERROR"); setVideoState("ERROR"); }
      return;
    }
    switch (event.stage) {
      case "session_token_requested": setSessionState("CONNECTING"); break;
      case "session_start": setSessionState("CONNECTING"); break;
      case "session_started": setSessionState("CONNECTED"); break;
      case "stream_attach": setVideoState("PLAYING"); break;
      case "repeat_called": setVoiceState("PLAYING"); break;
      case "avatar_speak_started": setLipsyncState("ACTIVE"); break;
      case "avatar_speak_ended": setLipsyncState("WAITING"); setVoiceState("READY" as DebugState); break;
      case "mic_listening_started": setMicState("LISTENING"); break;
      case "mic_listening_stopped": setMicState("READY" as DebugState); break;
      case "session_stop": setSessionState("WAITING"); break;
      case "session_stopped": setSessionState("WAITING"); setVideoState("WAITING"); break;
    }
  }

  function handleTranscript(text: string) {
    setTranscript(text);
    const current = scriptRef.current[stepIndexRef.current];
    if (!current?.question) return;
    // Simple keyword match against the expected answer for this one demo
    // question — this is intentionally simple pattern matching for a fixed
    // 5-year-old's-numbers demo, not a general speech-understanding system.
    const normalized = text.trim();
    const correctChoice = current.question.choices[current.question.correctIndex] ?? "";
    const saidCorrect = (correctChoice && normalized.includes(correctChoice)) || normalized.includes("ثلاثة") || normalized.toLowerCase().includes("three");
    respondToAnswer(saidCorrect);
  }

  function speakStep(currentScript: DemoStep[], index: number, bridge: DigitalHumanBridge) {
    const s = currentScript[index];
    if (!s) return;
    setBoardState("WRITING");
    setCaption(`${s.spokenTextAr}\n${s.spokenTextEn}`);
    if (s.boardAction?.type === "WRITE_NUMBER") {
      const value = s.boardAction.value;
      setBoard((b) => [...b, value]);
    }
    setBoardState("READY");
    bridge.speak(s.spokenTextAr);
  }

  async function startDemo(id: TeacherId) {
    setTeacherId(id);
    setBusy(true);
    setDebugLog([]);
    setTranscript("");
    setSessionState("CONNECTING"); setVideoState("WAITING"); setVoiceState("WAITING"); setLipsyncState("WAITING"); setMicState("WAITING");
    const teacher = TEACHERS.find((t) => t.id === id)!;
    const demoScript = buildNumbersDemoScript(teacher.nameAr, teacher.name);
    setScript(demoScript);
    scriptRef.current = demoScript;
    setStepIndex(0);
    stepIndexRef.current = 0;
    setBoard([]);
    setFeedback(null);
    setScreen("classroom");

    const bridge = new DigitalHumanBridge(id, handleDebugEvent, handleTranscript);
    bridgeRef.current = bridge;

    if (!videoRef.current) {
      setSessionState("ERROR");
      setBusy(false);
      return;
    }
    const status: DigitalHumanStatus = await bridge.connect(videoRef.current, "ar");
    if (status !== "connected") {
      setBusy(false);
      return; // debug panel already shows the exact failure via handleDebugEvent
    }

    speakStep(demoScript, 0, bridge);
    setBusy(false);
  }

  function next() {
    if (!bridgeRef.current) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex >= script.length) return;
    setFeedback(null);
    setTranscript("");
    setStepIndex(nextIndex);
    stepIndexRef.current = nextIndex;
    speakStep(script, nextIndex, bridgeRef.current);
  }

  function explainAgain() {
    if (!bridgeRef.current) return;
    speakStep(script, stepIndex, bridgeRef.current);
  }

  function toggleListening() {
    if (!bridgeRef.current) return;
    if (micState === "LISTENING") {
      bridgeRef.current.stopListening();
    } else {
      bridgeRef.current.startListening();
    }
  }

  function respondToAnswer(correct: boolean) {
    if (!bridgeRef.current) return;
    setFeedback(correct ? "correct" : "incorrect");
    setCaption(correct ? `${PRAISE_AR}\n${PRAISE_EN}` : `${RETRY_AR}\n${RETRY_EN}`);
    bridgeRef.current.speak(correct ? PRAISE_AR : RETRY_AR);
  }

  const currentStep = script[stepIndex];

  const stateColor = (s: DebugState) => (s === "ERROR" ? "text-red-400" : s === "CONNECTED" || s === "PLAYING" || s === "ACTIVE" || s === "LISTENING" ? "text-emerald-400" : s === "CONNECTING" || s === "WRITING" ? "text-amber-400" : "text-slate-500");

  if (screen === "gate") {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold">Choose Your Teacher</h1>

          {configLoading && <p className="text-slate-500">Checking connection…</p>}

          {!configLoading && config?.blocked && (
            <div className="bg-slate-900 border border-amber-800 rounded-2xl p-6 text-left space-y-3">
              <p className="text-amber-400 font-semibold text-center">Real Human Teacher not connected yet.</p>
              <p className="text-sm text-slate-400">Missing configuration:</p>
              <ul className="text-sm font-mono text-amber-300 space-y-1">
                {config.missingVariables.map((v) => <li key={v}>• {v}</li>)}
              </ul>
              <button onClick={checkConfig} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold mt-2">CHECK AGAIN</button>
            </div>
          )}

          {!configLoading && config && !config.blocked && (
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={busy}
                onClick={() => startDemo("sara")}
                className="rounded-2xl border-2 border-slate-700 bg-slate-900 hover:border-cyan-400 p-6 text-lg font-bold transition disabled:opacity-50"
              >
                START SARA DEMO
              </button>
              <button
                disabled
                title="Ali is not yet configured for this milestone"
                className="rounded-2xl border-2 border-slate-800 bg-slate-900/50 p-6 text-lg font-bold text-slate-600 cursor-not-allowed"
              >
                START ALI DEMO
              </button>
              <a href="/ai-teacher/live-lesson" className="col-span-2 rounded-2xl border-2 border-cyan-700 bg-cyan-950 p-4 text-center font-bold text-cyan-200 hover:border-cyan-400">START A VERIFIED LIVE LESSON →</a>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-slate-950">{teacherId === "sara" ? "S" : "A"}</div>
          <div>
            <p className="font-semibold">{teacherId === "sara" ? "Sara" : "Ali"}</p>
            <p className="text-xs text-slate-500">Numbers 1–5 · LiveAvatar native voice</p>
          </div>
        </div>
        <button onClick={() => setScreen("gate")} className="text-xs text-slate-500 hover:text-slate-300">← Back</button>
      </header>

      <div className="flex-1 grid md:grid-cols-[1fr_320px] gap-4 p-6">
        <div className="space-y-4">
          <section className="bg-slate-900 rounded-2xl p-4">
            <DigitalStudio teacherName={teacherId === "sara" ? "Sara" : "Ali"} subjectLabel="Numbers 1–5" statusLabel={videoState}>
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              {videoState !== "PLAYING" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-2xl text-slate-950 mb-3">{teacherId === "sara" ? "S" : "A"}</div>
                  <p className="text-sm text-slate-400">{sessionState === "ERROR" ? "Could not connect to LiveAvatar — see debug log." : "Connecting…"}</p>
                </div>
              )}
            </DigitalStudio>
          </section>

          <section className="bg-slate-900 rounded-2xl p-6">
            <p className="text-xs text-cyan-400 font-semibold mb-3">SMART BOARD</p>
            <div className="flex gap-3 flex-wrap min-h-[64px]">
              {board.length === 0 && <p className="text-slate-500 text-sm">Nothing written yet.</p>}
              {board.map((n, i) => (
                <span key={i} className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-3xl font-bold text-cyan-300">{n}</span>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-2xl p-6">
            <p className="text-xs text-cyan-400 font-semibold mb-2">{teacherId === "sara" ? "SARA SAYS" : "ALI SAYS"}</p>
            <p className="text-lg leading-relaxed whitespace-pre-line" dir="auto">{caption || "…"}</p>
          </section>

          {currentStep?.question && (
            <section className="bg-slate-900 rounded-2xl p-6">
              <p className="text-xs text-cyan-400 font-semibold mb-3">YOUR TURN — SPEAK YOUR ANSWER</p>
              <p className="mb-3">{currentStep.question.prompt}</p>
              <button
                onClick={toggleListening}
                className={`w-full py-4 rounded-xl text-lg font-bold ${micState === "LISTENING" ? "bg-red-600 hover:bg-red-500" : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"}`}
              >
                {micState === "LISTENING" ? "🎤 Listening… tap to stop" : "🎤 Tap to answer"}
              </button>
              {transcript && <p className="text-sm text-slate-400 mt-3">Heard: “{transcript}”</p>}
              <div className="flex gap-2 flex-wrap mt-4">
                {currentStep.question.choices.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => respondToAnswer(i === currentStep.question!.correctIndex)}
                    className={`w-12 h-12 rounded-lg text-lg font-bold border ${feedback === "correct" ? "border-emerald-400" : feedback === "incorrect" ? "border-red-400" : "border-slate-700 hover:border-slate-500"}`}
                    title="Fallback: tap instead of speaking"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {/* Runtime status overlay */}
          <div className="bg-slate-900 rounded-2xl p-4 text-xs space-y-1 font-mono">
            <p className="text-slate-500 font-semibold mb-1">RUNTIME STATUS</p>
            <p>SESSION: <span className={stateColor(sessionState)}>{sessionState}</span></p>
            <p>VIDEO: <span className={stateColor(videoState)}>{videoState}</span></p>
            <p>VOICE: <span className={stateColor(voiceState)}>{voiceState}</span></p>
            <p>LIPSYNC: <span className={stateColor(lipsyncState)}>{lipsyncState}</span></p>
            <p>MIC: <span className={stateColor(micState)}>{micState}</span></p>
            <p>BOARD: <span className={stateColor(boardState)}>{boardState}</span></p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 space-y-2">
            <button onClick={explainAgain} className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm">Explain Again</button>
            {stepIndex < script.length - 1 && (
              <button onClick={next} className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm">Next →</button>
            )}
          </div>

          {/* Debug log */}
          <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
            <p className="text-slate-500 font-semibold mb-1">SESSION DEBUG LOG</p>
            {debugLog.length === 0 && <p className="text-slate-600">No events yet.</p>}
            {debugLog.map((e, i) => (
              <p key={i} className={e.stage === "error" ? "text-red-400" : "text-slate-400"}>
                {e.stage === "error" ? `ERROR @ ${e.errorStage}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}: ${e.detail}` : `${e.stage}${e.detail ? ` — ${e.detail}` : ""}`}
              </p>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}

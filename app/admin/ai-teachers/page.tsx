"use client";

import { useEffect, useState } from "react";

type Tab = "overview" | "sara" | "ali" | "sessions" | "quality" | "recovery" | "subject-tools" | "tests" | "engine-status";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "sara", label: "Sara" },
  { id: "ali", label: "Ali" },
  { id: "sessions", label: "Live Sessions" },
  { id: "quality", label: "Quality Gates" },
  { id: "recovery", label: "Recovery" },
  { id: "subject-tools", label: "Subject Tools" },
  { id: "tests", label: "Tests" },
  { id: "engine-status", label: "Engine Status" },
];

interface StatusResponse {
  runtime: string;
  teachers: { teacherId: string; identityLocked: boolean; liveAvatarMapped: boolean; liveAvatarVoiceAgentMapped: boolean; elevenLabsMapped: boolean; ready: boolean; missingVariables: string[]; qualityGates: string; acceptanceStatus: string }[];
  sessions: { activeCount: number };
  providers: { liveAvatar: { state: string; detail: string }; elevenLabs: { state: string; detail: string } };
  quality: string;
  recovery: string;
  tests: { physicsEngineTests: { passed: number; total: number; verifiedAt: string }; aiTeacherEngineTests: { passed: number; total: number; verifiedAt: string }; note: string };
  subjectTools: Record<string, boolean>;
}

interface HealthResponse {
  status: string;
  [key: string]: string;
}

interface SessionRow {
  sessionId: string;
  teacherId: string;
  subject: string;
  lesson: string;
  stage: string;
}

interface ConfigStatus {
  liveAvatarApiKey: "SET" | "MISSING";
  liveAvatarSaraAvatarId: "SET" | "MISSING";
  liveAvatarAliAvatarId: "SET" | "MISSING";
  elevenLabsApiKey: "SET" | "MISSING";
  elevenLabsSaraVoiceId: "SET" | "MISSING";
  elevenLabsAliVoiceId: "SET" | "MISSING";
  blocked: boolean;
  missingVariables: string[];
}

export default function AdminAITeachersPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [statusRes, healthRes, sessionsRes, configRes] = await Promise.all([
          fetch("/api/ai-teachers/status"),
          fetch("/api/ai-teachers/health"),
          fetch("/api/ai-teachers/sessions"),
          fetch("/api/ai-teacher/config-status"),
        ]);
        if (!statusRes.ok || !healthRes.ok || !sessionsRes.ok || !configRes.ok) throw new Error("One or more status endpoints failed.");
        const [statusJson, healthJson, sessionsJson, configJson] = await Promise.all([statusRes.json(), healthRes.json(), sessionsRes.json(), configRes.json()]);
        if (cancelled) return;
        setStatus(statusJson);
        setHealth(healthJson);
        setSessions(sessionsJson.sessions ?? []);
        setConfig(configJson);
        setLoadError(null);
      } catch {
        if (!cancelled) setLoadError("Could not load live status from /api/ai-teachers/* or /api/ai-teacher/config-status.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Teachers Admin</h1>
            <p className="text-slate-500 text-sm">Sara and Ali — the only two teachers in this system.</p>
          </div>
          <div className="flex gap-3">
            <a href="/ai-teacher" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400">Open Student AI Teacher ↗</a>
            <a href="/api/ai-teachers/health" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-slate-800 text-sm hover:bg-slate-700">Open Health Status ↗</a>
          </div>
        </header>

        {loadError && <div className="p-4 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">{loadError}</div>}

        <nav className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full text-sm ${tab === t.id ? "bg-cyan-500 text-slate-950 font-semibold" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}>
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && status && (
          <div className="grid md:grid-cols-2 gap-4">
            {config && (
              <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 space-y-3">
                <h2 className="text-lg font-bold">Human Teacher Connection</h2>
                {config.blocked && <p className="text-amber-400 font-semibold text-sm">HUMAN TEACHER DEMO BLOCKED — missing: {config.missingVariables.join(", ")}</p>}
                {!config.blocked && <p className="text-emerald-400 font-semibold text-sm">All 6 credentials are configured.</p>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {([
                    ["LiveAvatar API", config.liveAvatarApiKey],
                    ["Sara Avatar", config.liveAvatarSaraAvatarId],
                    ["Ali Avatar", config.liveAvatarAliAvatarId],
                    ["ElevenLabs API", config.elevenLabsApiKey],
                    ["Sara Voice", config.elevenLabsSaraVoiceId],
                    ["Ali Voice", config.elevenLabsAliVoiceId],
                  ] as [string, "SET" | "MISSING"][]).map(([label, s]) => (
                    <div key={label} className="bg-slate-950 rounded-xl p-3 flex justify-between">
                      <span>{label}</span>
                      <span className={s === "SET" ? "text-emerald-400" : "text-red-400"}>{s === "SET" ? "CONNECTED" : "MISSING"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {status.teachers.map((t) => (
              <div key={t.teacherId} className="bg-slate-900 rounded-2xl p-6 space-y-2">
                <h2 className="text-xl font-bold capitalize">{t.teacherId}</h2>
                <p className="text-sm text-slate-400">Runtime status: <span className="text-emerald-400">{status.runtime}</span></p>
                <p className="text-sm text-slate-400">Identity: <span className="text-emerald-400">{t.identityLocked ? "locked (sara/ali only)" : "unlocked"}</span></p>
                <p className="text-sm text-slate-400">LiveAvatar avatar: <span className={t.liveAvatarMapped ? "text-emerald-400" : "text-red-400"}>{t.liveAvatarMapped ? "CONFIGURED" : "MISSING"}</span></p>
                <p className="text-sm text-slate-400">LiveAvatar voice agent: <span className={t.liveAvatarVoiceAgentMapped ? "text-emerald-400" : "text-red-400"}>{t.liveAvatarVoiceAgentMapped ? "CONFIGURED" : "MISSING"}</span></p>
                <p className="text-sm text-slate-400">ElevenLabs (optional): <span className={t.elevenLabsMapped ? "text-emerald-400" : "text-slate-500"}>{t.elevenLabsMapped ? "configured" : "not set — not required"}</span></p>
                <p className="text-sm text-slate-400 font-semibold">Demo ready: <span className={t.ready ? "text-emerald-400" : "text-red-400"}>{t.ready ? "YES" : "NO"}</span></p>
                <p className="text-sm text-slate-400">Active sessions (all teachers): <span className="text-slate-200">{status.sessions.activeCount}</span></p>
                <p className="text-sm text-slate-400">Quality gate: <span className="text-amber-400">{t.qualityGates}</span></p>
                <p className="text-sm text-slate-400">Acceptance: <span className="text-amber-400">{t.acceptanceStatus}</span></p>
              </div>
            ))}
            <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 flex gap-6 flex-wrap">
              <div>
                <p className="text-xs text-slate-500">LIVEAVATAR</p>
                <p className={status.providers.liveAvatar.state === "CONNECTED" ? "text-emerald-400 font-semibold" : status.providers.liveAvatar.state === "ERROR" ? "text-red-400 font-semibold" : "text-slate-400 font-semibold"}>{status.providers.liveAvatar.state}</p>
                <p className="text-xs text-slate-600 max-w-xs">{status.providers.liveAvatar.detail}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ELEVENLABS</p>
                <p className={status.providers.elevenLabs.state === "CONNECTED" ? "text-emerald-400 font-semibold" : status.providers.elevenLabs.state === "ERROR" ? "text-red-400 font-semibold" : "text-slate-400 font-semibold"}>{status.providers.elevenLabs.state}</p>
                <p className="text-xs text-slate-600 max-w-xs">{status.providers.elevenLabs.detail}</p>
              </div>
            </div>
          </div>
        )}

        {(tab === "sara" || tab === "ali") && status && (
          <div className="bg-slate-900 rounded-2xl p-6 space-y-2 text-sm">
            <h2 className="text-xl font-bold capitalize mb-2">{tab}</h2>
            <p className="text-slate-400">Identity version: <span className="text-slate-200">1 (hardcoded identity lock, no versioning system exists)</span></p>
            <p className="text-slate-400">LiveAvatar avatar ID: <span className={status.teachers.find((t) => t.teacherId === tab)?.liveAvatarMapped ? "text-emerald-400" : "text-amber-400"}>{status.teachers.find((t) => t.teacherId === tab)?.liveAvatarMapped ? `LIVEAVATAR_${tab.toUpperCase()}_AVATAR_ID is set` : `LIVEAVATAR_${tab.toUpperCase()}_AVATAR_ID is NOT set`}</span></p>
            <p className="text-slate-400">LiveAvatar voice agent ID: <span className={status.teachers.find((t) => t.teacherId === tab)?.liveAvatarVoiceAgentMapped ? "text-emerald-400" : "text-amber-400"}>{status.teachers.find((t) => t.teacherId === tab)?.liveAvatarVoiceAgentMapped ? `LIVEAVATAR_${tab.toUpperCase()}_VOICE_AGENT_ID is set` : `LIVEAVATAR_${tab.toUpperCase()}_VOICE_AGENT_ID is NOT set`}</span></p>
            <p className="text-slate-400">ElevenLabs voice ID (optional, unused this milestone): <span className={status.teachers.find((t) => t.teacherId === tab)?.elevenLabsMapped ? "text-emerald-400" : "text-slate-500"}>{status.teachers.find((t) => t.teacherId === tab)?.elevenLabsMapped ? `ELEVENLABS_${tab.toUpperCase()}_VOICE_ID is set` : `ELEVENLABS_${tab.toUpperCase()}_VOICE_ID is NOT set`}</span></p>
            <p className="text-slate-400">Render provider: <span className="text-slate-200">LiveAvatar (session.repeatAudio driving lipsync from ElevenLabs audio; session.repeat as built-in-voice fallback)</span></p>
            <p className="text-slate-400">Voice provider: <span className="text-slate-200">ElevenLabs (eleven_flash_v2_5, streaming endpoint)</span></p>
            <p className="text-slate-400">Studio: <span className="text-amber-400">not implemented — video composited as a plain full-bleed stream, no 3D environment</span></p>
            <p className="text-slate-400">Supported languages: <span className="text-slate-200">Arabic + English (Numbers 1–5 demo script only)</span></p>
            <p className="text-slate-400">Session history: <span className="text-slate-200">see Live Sessions tab (in-memory only, not persisted)</span></p>
            <p className="text-slate-400">Quality metrics: <span className="text-amber-400">NOT_EVALUATED — no independent scoring exists</span></p>
            <p className="text-slate-400">Recovery plan: <span className="text-amber-400">not_implemented — no recovery-engine exists</span></p>
          </div>
        )}

        {tab === "sessions" && (
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-2">Session ID</th>
                  <th className="text-left px-4 py-2">Teacher</th>
                  <th className="text-left px-4 py-2">Subject</th>
                  <th className="text-left px-4 py-2">Lesson</th>
                  <th className="text-left px-4 py-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No active sessions.</td></tr>
                )}
                {sessions.map((s) => (
                  <tr key={s.sessionId} className="border-t border-slate-800">
                    <td className="px-4 py-2 font-mono text-xs">{s.sessionId}</td>
                    <td className="px-4 py-2 capitalize">{s.teacherId}</td>
                    <td className="px-4 py-2">{s.subject}</td>
                    <td className="px-4 py-2">{s.lesson}</td>
                    <td className="px-4 py-2">{s.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-600 p-3">No authentication exists in this project — this endpoint is unprotected. No student-identifying data is tracked anywhere in the runtime.</p>
          </div>
        )}

        {tab === "quality" && (
          <div className="bg-slate-900 rounded-2xl p-6 space-y-3 text-sm">
            <p className="text-amber-400 font-semibold">No independent photorealism / lipsync / animation / teaching / showcase scoring pipeline exists in this project.</p>
            <p className="text-slate-400">LiveAvatar and ElevenLabs are now wired in (see Overview), but nobody has scored the resulting video/voice quality against a 95-point bar — that requires a human (or a real evaluation pipeline) actually watching/listening to a live session, which cannot happen from this codebase alone. Each gate is honestly reported as NOT_EVALUATED rather than a fabricated number:</p>
            <ul className="grid grid-cols-2 gap-2 mt-2">
              {["Photorealism", "LipSync", "Animation", "Teaching", "Showcase"].map((g) => (
                <li key={g} className="bg-slate-950 rounded-xl p-3 flex justify-between"><span>{g}</span><span className="text-amber-400">NOT_EVALUATED</span></li>
              ))}
            </ul>
          </div>
        )}

        {tab === "recovery" && (
          <div className="bg-slate-900 rounded-2xl p-6 text-sm text-slate-400">
            <p className="text-amber-400 font-semibold mb-2">No recovery-engine.ts exists in this project.</p>
            <p>There is no recovery task, score, evidence, or acceptance-decision system to display. This tab intentionally shows nothing fabricated.</p>
          </div>
        )}

        {tab === "subject-tools" && status && (
          <div className="bg-slate-900 rounded-2xl p-6">
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(status.subjectTools).map(([subject, registered]) => (
                <li key={subject} className="bg-slate-950 rounded-xl p-3 flex justify-between capitalize">
                  <span>{subject}</span>
                  <span className={registered ? "text-emerald-400" : "text-slate-500"}>{registered ? "registered" : "not registered"}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-600 mt-4">The Subject Tool Router supports plugging in additional adapters (math, chemistry, biology, language, history, …) without changing Sara or Ali. Only physics is implemented today.</p>
          </div>
        )}

        {tab === "tests" && status && (
          <div className="bg-slate-900 rounded-2xl p-6 space-y-3 text-sm">
            <p className="text-slate-400">{status.tests.note}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 rounded-xl p-4">
                <p className="text-slate-500 text-xs">PHYSICS ENGINE TESTS</p>
                <p className="text-2xl font-bold text-emerald-400">{status.tests.physicsEngineTests.passed}/{status.tests.physicsEngineTests.total}</p>
              </div>
              <div className="bg-slate-950 rounded-xl p-4">
                <p className="text-slate-500 text-xs">AI TEACHER ENGINE TESTS</p>
                <p className="text-2xl font-bold text-emerald-400">{status.tests.aiTeacherEngineTests.passed}/{status.tests.aiTeacherEngineTests.total}</p>
              </div>
            </div>
            <p className="text-xs text-amber-400">human-teacher-quality gate / final-acceptance gate: NOT IMPLEMENTED — no such scripts or systems exist.</p>
          </div>
        )}

        {tab === "engine-status" && health && (
          <div className="bg-slate-900 rounded-2xl p-6">
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(health).filter(([k]) => k !== "status").map(([k, v]) => (
                <li key={k} className="bg-slate-950 rounded-xl p-3 flex justify-between">
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                  <span className={v === "online" || v === "configured" ? "text-emerald-400" : v === "degraded" ? "text-amber-400" : "text-slate-500"}>{v.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

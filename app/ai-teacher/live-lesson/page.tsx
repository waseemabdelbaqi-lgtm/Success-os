"use client";

import { useState } from "react";

type TeacherId = "sara" | "ali";
type Turn = {
  stage: string;
  spokenText: string;
  boardActions: { type: string; content: string }[];
  question: { prompt: string; choices?: string[] } | null;
  waitForStudent: boolean;
};

export default function LiveLessonPage() {
  const [teacherId, setTeacherId] = useState<TeacherId>("sara");
  const [lesson, setLesson] = useState("Projectile motion");
  const [sessionId, setSessionId] = useState<string>();
  const [turn, setTurn] = useState<Turn>();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(studentInput?: { text: string; intent?: string }) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai-teacher/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sessionId ? { sessionId, studentInput } : { teacherId, subject: "physics", lesson }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start the lesson.");
      setSessionId(data.sessionId);
      setTurn(data.turn);
      setAnswer("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the lesson.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6" dir="auto">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Live AI Lesson</h1><p className="text-sm text-slate-400">Verified subject engine only — no invented content.</p></div>
          <a href="/ai-teacher" className="text-sm text-cyan-400">Back</a>
        </header>

        {!sessionId && (
          <section className="grid gap-4 rounded-2xl bg-slate-900 p-6 md:grid-cols-3">
            <label className="space-y-2 text-sm">Teacher<select value={teacherId} onChange={(event) => setTeacherId(event.target.value as TeacherId)} className="w-full rounded-xl bg-slate-800 p-3"><option value="sara">Sara — سارة</option><option value="ali">Ali — علي</option></select></label>
            <label className="space-y-2 text-sm">Subject<select disabled className="w-full rounded-xl bg-slate-800 p-3 text-slate-300"><option>Physics — الفيزياء</option></select></label>
            <label className="space-y-2 text-sm">Lesson<input value={lesson} onChange={(event) => setLesson(event.target.value)} className="w-full rounded-xl bg-slate-800 p-3" /></label>
            <button disabled={busy || !lesson.trim()} onClick={() => send()} className="rounded-xl bg-cyan-500 p-3 font-bold text-slate-950 disabled:opacity-50 md:col-span-3">Start verified lesson</button>
          </section>
        )}

        {error && <div className="rounded-xl border border-red-800 bg-red-950 p-4 text-sm text-red-300">{error}</div>}

        {turn && (
          <div className="grid gap-5 md:grid-cols-[1fr_320px]">
            <section className="space-y-4 rounded-2xl bg-slate-900 p-6">
              <p className="text-xs font-semibold text-cyan-400">{teacherId.toUpperCase()} · {turn.stage}</p>
              <p className="text-lg leading-8">{turn.spokenText}</p>
              {turn.question && <div className="rounded-xl bg-slate-800 p-4"><p className="font-semibold">{turn.question.prompt}</p>{turn.question.choices?.map((choice) => <button key={choice} onClick={() => send({ text: choice })} className="m-1 rounded-lg border border-slate-600 px-3 py-2">{choice}</button>)}</div>}
              {turn.waitForStudent && <div className="flex gap-2"><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && answer.trim()) send({ text: answer }); }} placeholder="اكتب أو استخدم الميكروفون في الاستوديو" className="flex-1 rounded-xl bg-slate-800 p-3"/><button disabled={busy || !answer.trim()} onClick={() => send({ text: answer })} className="rounded-xl bg-cyan-500 px-5 font-bold text-slate-950">Send</button></div>}
              {!turn.waitForStudent && <button disabled={busy} onClick={() => send({ text: "continue", intent: "continue" })} className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950">Continue</button>}
            </section>
            <aside className="rounded-2xl bg-slate-900 p-5"><p className="mb-3 text-xs font-semibold text-cyan-400">SMART BOARD</p>{turn.boardActions.length ? turn.boardActions.map((action, index) => <div key={index} className="mb-2 rounded-xl bg-slate-800 p-3"><span className="text-xs uppercase text-slate-500">{action.type}</span><p className="mt-1 font-mono">{action.content}</p></div>) : <p className="text-sm text-slate-500">Waiting for the teaching engine.</p>}</aside>
          </div>
        )}
      </div>
    </main>
  );
}


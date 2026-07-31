"use client";

import { useEffect, useMemo, useState , type CSSProperties } from "react";
import type { InteractiveLesson, ReviewGameSession } from "@/src/lib/sos-lesson-engine/schema/types";
import { getQuestionById } from "@/src/lib/sos-lesson-engine/questions";
import { ActivityRenderer } from "@/src/components/sos-lesson-engine/ActivityRenderer";

type Props = {
  lesson: InteractiveLesson;
  studentKey?: string;
  displayName?: string;
};

export function ReviewGamePlayer({ lesson, studentKey = "player-1", displayName = "لاعب" }: Props) {
  const [game, setGame] = useState<ReviewGameSession | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");

  const questions = useMemo(
    () =>
      lesson.reviewGameQuestionIds
        .map((id) => getQuestionById(lesson, id))
        .filter(Boolean) as NonNullable<ReturnType<typeof getQuestionById>>[],
    [lesson],
  );

  async function createGame() {
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_review_game",
        lessonId: lesson.id,
        timerEnabled: false,
        speedPointsEnabled: false,
        leaderboardEnabled: true,
        accessibilityUntimed: true,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setGame(json.game);
      await join(json.game.joinCode);
    }
  }

  async function join(code?: string) {
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "join_review_game",
        joinCode: (code || joinCode).toUpperCase(),
        participantId: studentKey,
        displayName,
      }),
    });
    const json = await res.json();
    if (json.ok) setGame(json.game);
    else setMsg(json.error || "تعذّر الانضمام");
  }

  async function start() {
    if (!game) return;
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_review_game", gameId: game.id, patch: { status: "running" } }),
    });
    const json = await res.json();
    if (json.ok) setGame(json.game);
  }

  async function answer(correct: boolean, questionId: string) {
    if (!game) return;
    const res = await fetch("/api/sos-lesson-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review_game_answer",
        gameId: game.id,
        participantId: studentKey,
        questionId,
        correct,
        ms: 0,
      }),
    });
    const json = await res.json();
    if (json.ok) setGame(json.game);
  }

  useEffect(() => {
    if (!game || game.status !== "running") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/sos-lesson-engine?view=review_game&id=${game.id}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setGame(json.game);
    }, 2500);
    return () => clearInterval(t);
  }, [game?.id, game?.status]);

  const q = questions[game?.questionIndex || 0];
  const me = game?.participants.find((p) => p.id === studentKey);

  return (
    <div style={wrap} dir="rtl">
      <h1 style={h1}>لعبة مراجعة Success OS</h1>
      <p style={note}>
        منافسة آمنة من بنك أسئلة الدرس المعتمد فقط. المؤقت ونقاط السرعة معطّلان افتراضياً — لا عقاب على من يحتاج
        وقتاً أطول.
      </p>

      {!game && (
        <div style={row}>
          <button type="button" style={btn} onClick={createGame}>
            ابدأ جلسة مراجعة
          </button>
          <input
            style={input}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="رمز الانضمام"
          />
          <button type="button" style={btnGhost} onClick={() => join()}>
            انضم
          </button>
        </div>
      )}

      {game && (
        <div>
          <p>
            الرمز: <strong>{game.joinCode}</strong> · الحالة: {game.status} · سؤال{" "}
            {(game.questionIndex || 0) + 1}/{questions.length}
          </p>
          {me && (
            <p>
              نقاطك: {me.score} · سلسلة: {me.streak} · صحيح: {me.correct}
            </p>
          )}
          {game.status === "lobby" && (
            <button type="button" style={btn} onClick={start}>
              تشغيل المراجعة
            </button>
          )}
          {game.status === "running" && q && (
            <ActivityRenderer
              key={q.id + game.questionIndex}
              question={q}
              onResult={(r) => answer(r.correct, q.id)}
            />
          )}
          {game.status === "running" && (
            <button
              type="button"
              style={btnGhost}
              onClick={async () => {
                const next = (game.questionIndex || 0) + 1;
                const patch =
                  next >= questions.length
                    ? { status: "ended" as const }
                    : { questionIndex: next };
                const res = await fetch("/api/sos-lesson-engine", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "update_review_game", gameId: game.id, patch }),
                });
                const json = await res.json();
                if (json.ok) setGame(json.game);
              }}
            >
              السؤال التالي
            </button>
          )}
          {game.leaderboardEnabled && (
            <div style={board}>
              <h3>لوحة النتائج</h3>
              <ol>
                {[...game.participants]
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <li key={p.id}>
                      {p.displayName}: {p.score}
                    </li>
                  ))}
              </ol>
            </div>
          )}
        </div>
      )}
      {msg && <p>{msg}</p>}
    </div>
  );
}

const wrap: CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "1rem",
  fontFamily: '"IBM Plex Sans Arabic",Tahoma,sans-serif',
  background: "linear-gradient(165deg,#fff8f1,#f3e6db)",
  minHeight: "100vh",
  color: "#2a0c10",
};
const h1: CSSProperties = { color: "#4b0a11" };
const note: CSSProperties = { color: "#6b3a40", fontWeight: 700 };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.55rem 0.9rem",
  fontWeight: 800,
  cursor: "pointer",
};
const btnGhost: CSSProperties = {
  ...btn,
  background: "#fff",
  color: "#9e1722",
  border: "1px solid rgba(158,23,34,.3)",
};
const input: CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
  padding: "0.5rem 0.7rem",
};
const board: CSSProperties = {
  marginTop: 12,
  background: "#fffdf8",
  borderRadius: 12,
  padding: 12,
  border: "1px solid rgba(158,23,34,.15)",
};

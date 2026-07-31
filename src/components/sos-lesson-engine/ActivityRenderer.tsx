"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { InteractiveQuestion } from "@/src/lib/sos-lesson-engine/schema/types";
import { evaluateAnswer } from "@/src/lib/sos-lesson-engine/evaluate";

type Props = {
  question: InteractiveQuestion;
  onResult?: (result: { correct: boolean; answer: string; hintLevel: 0 | 1 | 2 }) => void;
  disabled?: boolean;
};

export function ActivityRenderer({ question, onResult, disabled }: Props) {
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [order, setOrder] = useState<string[]>(question.orderItems || []);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [drops, setDrops] = useState<Record<string, string>>({});
  const [lineValue, setLineValue] = useState(
    question.numberLine ? Math.floor((question.numberLine.min + question.numberLine.max) / 2) : 0,
  );

  const rights = useMemo(() => question.pairs?.map((p) => p.right) || [], [question.pairs]);

  function submit(raw: string) {
    if (disabled) return;
    const result = evaluateAnswer(question, raw, hintLevel);
    setFeedback(result.feedbackAr);
    setCorrect(result.correct);
    setHintLevel(result.hintLevelUsed);
    onResult?.({ correct: result.correct, answer: raw, hintLevel: result.hintLevelUsed });
  }

  return (
    <div style={card} dir="rtl">
      <p style={prompt}>{question.promptAr}</p>
      <p style={meta}>
        صعوبة: {question.difficulty} · نقاط: {question.points}
        {question.skill ? ` · مهارة: ${question.skill}` : ""}
      </p>

      {(question.kind === "mcq" || question.kind === "true_false" || question.kind === "poll") && (
        <div style={opts}>
          {(question.options || []).map((opt, i) => (
            <button
              key={opt + i}
              type="button"
              style={{ ...optBtn, ...(selected === i ? optOn : {}) }}
              disabled={disabled}
              onClick={() => {
                setSelected(i);
                submit(String(i));
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {(question.kind === "fill_blank" || question.kind === "write") && (
        <div style={row}>
          <input
            style={input}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب إجابتك"
          />
          <button type="button" style={btn} disabled={disabled} onClick={() => submit(text)}>
            تحقق
          </button>
        </div>
      )}

      {question.kind === "number_line" && question.numberLine && (
        <div>
          <div style={lineWrap}>
            {Array.from(
              { length: question.numberLine.max - question.numberLine.min + 1 },
              (_, i) => question.numberLine!.min + i,
            ).map((n) => (
              <button
                key={n}
                type="button"
                style={{ ...tick, ...(lineValue === n ? tickOn : {}) }}
                disabled={disabled}
                onClick={() => setLineValue(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button type="button" style={btn} disabled={disabled} onClick={() => submit(String(lineValue))}>
            تأكيد الموضع: {lineValue}
          </button>
        </div>
      )}

      {question.kind === "ordering" && (
        <div>
          <div style={opts}>
            {order.map((item, i) => (
              <button
                key={item + i}
                type="button"
                style={optBtn}
                disabled={disabled}
                onClick={() => {
                  if (i === 0) return;
                  const next = [...order];
                  const tmp = next[i]!;
                  next[i] = next[i - 1]!;
                  next[i - 1] = tmp;
                  setOrder(next);
                }}
              >
                {item} ↑
              </button>
            ))}
          </div>
          <button type="button" style={btn} disabled={disabled} onClick={() => submit(order.join("|"))}>
            تحقق من الترتيب
          </button>
        </div>
      )}

      {question.kind === "matching" && question.pairs && (
        <div>
          {question.pairs.map((p) => (
            <div key={p.left} style={row}>
              <span style={{ minWidth: 80 }}>{p.left}</span>
              <select
                style={input}
                disabled={disabled}
                value={matches[p.left] || ""}
                onChange={(e) => setMatches({ ...matches, [p.left]: e.target.value })}
              >
                <option value="">—</option>
                {rights.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="button"
            style={btn}
            disabled={disabled}
            onClick={() =>
              submit(
                Object.entries(matches)
                  .map(([l, r]) => `${l}=${r}`)
                  .join(";"),
              )
            }
          >
            تحقق من المطابقة
          </button>
        </div>
      )}

      {question.kind === "drag_drop" && (
        <div>
          <p style={{ fontSize: 14 }}>اختر عدداً لكل صندوق:</p>
          {(question.dropZones || []).map((z) => (
            <div key={z.id} style={row}>
              <span style={{ minWidth: 90, fontSize: 22 }}>{z.labelAr}</span>
              <select
                style={input}
                disabled={disabled}
                value={drops[z.id] || ""}
                onChange={(e) => setDrops({ ...drops, [z.id]: e.target.value })}
              >
                <option value="">—</option>
                {(question.dragItems || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="button"
            style={btn}
            disabled={disabled}
            onClick={() => {
              const payload = (question.dragItems || [])
                .map((d) => {
                  const zone = Object.entries(drops).find(([, v]) => v === d)?.[0];
                  return zone ? `${d}→${zone}` : "";
                })
                .filter(Boolean)
                .join(";");
              submit(payload);
            }}
          >
            تحقق
          </button>
        </div>
      )}

      {feedback && (
        <div style={{ ...fb, background: correct ? "rgba(20,108,46,.12)" : "rgba(158,23,34,.1)" }}>
          {correct ? "✓ صحيح — " : "✗ "}
          {feedback}
        </div>
      )}
      {!correct && hintLevel > 0 && !disabled && (
        <p style={{ fontSize: 13, color: "#6b3a40" }}>تلميح مستوى {hintLevel} مفعّل — يمكنك إعادة المحاولة.</p>
      )}
    </div>
  );
}

const card: CSSProperties = {
  background: "#fffdf8",
  border: "1px solid rgba(158,23,34,.18)",
  borderRadius: 14,
  padding: "0.9rem",
  margin: "0.6rem 0",
};
const prompt: CSSProperties = { fontWeight: 800, margin: "0 0 0.4rem", color: "#4b0a11" };
const meta: CSSProperties = { fontSize: 12, color: "#6b3a40", marginBottom: 8 };
const opts: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8 };
const optBtn: CSSProperties = {
  border: "1px solid rgba(158,23,34,.25)",
  background: "#fff",
  borderRadius: 10,
  padding: "0.55rem 0.8rem",
  fontWeight: 700,
  cursor: "pointer",
};
const optOn: CSSProperties = { background: "#9e1722", color: "#fff" };
const btn: CSSProperties = {
  background: "#9e1722",
  color: "#fff",
  border: 0,
  borderRadius: 10,
  padding: "0.55rem 0.9rem",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 8,
};
const row: CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 };
const input: CSSProperties = {
  flex: 1,
  padding: "0.5rem 0.7rem",
  borderRadius: 8,
  border: "1px solid rgba(158,23,34,.25)",
};
const fb: CSSProperties = { marginTop: 10, padding: "0.6rem", borderRadius: 10, fontWeight: 700 };
const lineWrap: CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 };
const tick: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  border: "2px solid #9e1722",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};
const tickOn: CSSProperties = { background: "#f2d77c" };

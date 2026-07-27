"use client";

import confetti from "canvas-confetti";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type QuizItem = {
  id: string;
  type: "mcq" | "open";
  prompt: string;
  choices?: string[];
  correctIndex?: number;
  sampleAnswer?: string;
  hint: string;
  explanation: string;
};

export function GamifiedQuiz({ items }: { items: QuizItem[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong" | "reviewed">("idle");
  const [hintOn, setHintOn] = useState(false);
  const [score, setScore] = useState(0);

  const item = items[index];
  const progress = useMemo(() => ((index + (feedback !== "idle" ? 1 : 0)) / items.length) * 100, [
    feedback,
    index,
    items.length,
  ]);

  if (!item) return null;

  function celebrate() {
    confetti({
      particleCount: 80,
      spread: 64,
      origin: { y: 0.7 },
      colors: ["#1f8a5b", "#c9a227", "#2f6fed"],
    });
  }

  function checkMcq() {
    if (selected == null || item.correctIndex == null) return;
    if (selected === item.correctIndex) {
      setFeedback("correct");
      setScore((s) => s + 1);
      celebrate();
    } else {
      setFeedback("wrong");
      setHintOn(true);
    }
  }

  function checkOpen() {
    const words = essay.trim().split(/\s+/).filter(Boolean).length;
    if (words < 18) {
      setFeedback("wrong");
      setHintOn(true);
      return;
    }
    setFeedback("reviewed");
    setScore((s) => s + 1);
    celebrate();
  }

  function next() {
    setSelected(null);
    setEssay("");
    setHintOn(false);
    setFeedback("idle");
    setIndex((i) => Math.min(items.length - 1, i + 1));
  }

  return (
    <section id="quiz" className="dl-panel scroll-mt-24" aria-labelledby="quiz-heading">
      <header className="dl-panel-head">
        <p className="dl-kicker">Module F</p>
        <h2 id="quiz-heading">Gamified real-time assessment</h2>
        <p className="dl-lead">
          Immediate validation with success confetti and targeted hints. Score {score}/{items.length}.
        </p>
      </header>

      <div className="dl-progress" aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>

      <article className={`dl-quiz-card ${feedback}`}>
        <p className="dl-q-meta">
          Question {index + 1} of {items.length} · {item.type === "mcq" ? "MCQ" : "Open response"}
        </p>
        <div className="dl-md">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {item.prompt}
          </ReactMarkdown>
        </div>

        {item.type === "mcq" && item.choices ? (
          <div className="dl-choices" role="radiogroup" aria-label="Answer choices">
            {item.choices.map((choice, i) => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={selected === i}
                className={selected === i ? "selected" : ""}
                disabled={feedback === "correct"}
                onClick={() => setSelected(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            className="dl-essay"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Write a concise scientific argument…"
            disabled={feedback === "reviewed"}
          />
        )}

        <div className="dl-quiz-actions">
          {feedback === "idle" ? (
            <button
              type="button"
              className="primary"
              onClick={item.type === "mcq" ? checkMcq : checkOpen}
            >
              Check answer
            </button>
          ) : (
            <button type="button" className="primary" onClick={next} disabled={index >= items.length - 1}>
              {index >= items.length - 1 ? "Complete" : "Next question"}
            </button>
          )}
          <button type="button" onClick={() => setHintOn((h) => !h)}>
            {hintOn ? "Hide hint" : "Show hint"}
          </button>
        </div>

        {hintOn ? <p className="dl-hint-pop">{item.hint}</p> : null}

        {feedback === "correct" || feedback === "reviewed" ? (
          <div className="dl-feedback ok" role="status">
            {feedback === "correct" ? "Correct — well reasoned." : "Solid length — compare with the sample."}
            <div className="dl-md">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {item.explanation + (item.sampleAnswer ? `\n\n**Sample:** ${item.sampleAnswer}` : "")}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}

        {feedback === "wrong" ? (
          <div className="dl-feedback bad" role="status">
            Not quite — use the hint, then try again or reveal the explanation.
            <button type="button" onClick={() => setFeedback("reviewed")}>
              Show explanation
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}

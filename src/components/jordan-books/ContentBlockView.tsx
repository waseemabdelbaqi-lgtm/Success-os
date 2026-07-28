"use client";

import { useMemo, useState } from "react";
import type { ContentBlock } from "@/src/lib/jordan-books/schema/types";
import { HandwritingPad } from "@/src/components/jordan-books/HandwritingPad";

type Props = {
  block: ContentBlock;
  highlighted?: boolean;
  handwritingUrl?: string;
  onHighlight: (blockId: string, text: string) => void;
  onClearHighlight: (blockId: string) => void;
  onSaveHandwriting: (blockId: string, dataUrl: string) => void;
  fontScale: number;
};

export function ContentBlockView({
  block,
  highlighted,
  handwritingUrl,
  onHighlight,
  onClearHighlight,
  onSaveHandwriting,
  fontScale,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  const style = useMemo(() => ({ fontSize: `${fontScale}rem` }), [fontScale]);

  function checkMcq(index: number) {
    setSelected(index);
    const correct = block.question?.correctIndex === index;
    setOk(correct);
    setFeedback(
      correct
        ? `أحسنت! ${block.question?.explanationAr || ""}`
        : `حاول مرة أخرى. ${block.question?.explanationAr || ""}`,
    );
  }

  function checkType() {
    const expected = (block.question?.correctAnswer || "").trim();
    const got = typed.trim();
    const correct = expected !== "" && got === expected;
    setOk(correct);
    setFeedback(
      correct
        ? `صحيح! ${block.question?.explanationAr || ""}`
        : `الإجابة الصحيحة: ${expected}. ${block.question?.explanationAr || ""}`,
    );
  }

  const title = block.titleAr ? <h3 className="jb-block-title">{block.titleAr}</h3> : null;

  if (block.type === "heading") {
    return (
      <section className="jb-block jb-heading" style={style} id={block.id}>
        <h2>{block.bodyAr}</h2>
      </section>
    );
  }

  if (block.type === "question" && block.question) {
    return (
      <section className={`jb-block jb-question ${highlighted ? "is-hl" : ""}`} style={style} id={block.id}>
        {title}
        <p className="jb-prompt">{block.question.promptAr}</p>
        {block.interactiveKind === "mcq" && block.question.options ? (
          <div className="jb-options" role="group" aria-label={block.question.promptAr}>
            {block.question.options.map((opt, i) => (
              <button
                key={`${block.id}-opt-${i}`}
                type="button"
                className={`jb-opt ${selected === i ? (ok ? "ok" : "bad") : ""}`}
                onClick={() => checkMcq(i)}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}
        {block.interactiveKind === "type" ? (
          <div className="jb-type">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="إجابتك"
              inputMode="numeric"
            />
            <button type="button" onClick={checkType}>
              تحقق
            </button>
          </div>
        ) : null}
        {feedback ? <p className={`jb-feedback ${ok ? "ok" : "bad"}`}>{feedback}</p> : null}
        <button
          type="button"
          className="jb-mini"
          onClick={() => (highlighted ? onClearHighlight(block.id) : onHighlight(block.id, block.bodyAr))}
        >
          {highlighted ? "إزالة تمييز" : "تمييز"}
        </button>
      </section>
    );
  }

  if (block.type === "writing_space") {
    return (
      <section className="jb-block jb-write" style={style} id={block.id}>
        {title}
        <p>{block.bodyAr}</p>
        <HandwritingPad
          blockId={block.id}
          initialDataUrl={handwritingUrl}
          onSave={(url) => onSaveHandwriting(block.id, url)}
          labelAr="مساحة الكتابة بالقلم"
        />
      </section>
    );
  }

  if (block.type === "formula") {
    return (
      <section className={`jb-block jb-formula ${highlighted ? "is-hl" : ""}`} style={style} id={block.id}>
        {title}
        <p>{block.bodyAr}</p>
        {block.formula ? <code className="jb-katex-fallback">{block.formula}</code> : null}
      </section>
    );
  }

  if (block.type === "diagram" || block.type === "table") {
    return (
      <section className={`jb-block jb-diagram ${highlighted ? "is-hl" : ""}`} style={style} id={block.id}>
        {title}
        <div className="jb-diagram-board" aria-label={block.titleAr || "مخطط"}>
          {block.bodyAr}
        </div>
        {block.items?.length ? (
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={`jb-block jb-${block.type} ${highlighted ? "is-hl" : ""}`}
      style={style}
      id={block.id}
    >
      {title}
      <p>{block.bodyAr}</p>
      {block.items?.length ? (
        <ul>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <div className="jb-block-actions">
        <button
          type="button"
          className="jb-mini"
          onClick={() => (highlighted ? onClearHighlight(block.id) : onHighlight(block.id, block.bodyAr))}
        >
          {highlighted ? "إزالة تمييز" : "تمييز"}
        </button>
      </div>
    </section>
  );
}

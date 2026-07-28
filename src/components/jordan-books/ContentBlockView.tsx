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
  onMastery?: (blockId: string, correct: boolean) => void;
  fontScale: number;
};

function easternToWestern(s: string) {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function answersMatch(got: string, expected: string, accepted: string[] = []) {
  const clean = (s: string) =>
    easternToWestern(s)
      .replace(/[،,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const g = clean(got);
  const candidates = [expected, ...accepted].map(clean);
  if (candidates.includes(g)) return true;
  const compact = (s: string) => s.replace(/\s+/g, "").replace(/\+/g, "+");
  if (candidates.map(compact).includes(compact(g))) return true;
  const gn = Number(g);
  const en = Number(clean(expected));
  if (!Number.isNaN(gn) && !Number.isNaN(en) && gn === en) return true;
  return false;
}

export function ContentBlockView({
  block,
  highlighted,
  handwritingUrl,
  onHighlight,
  onClearHighlight,
  onSaveHandwriting,
  onMastery,
  fontScale,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);

  const style = useMemo(() => ({ fontSize: `${fontScale}rem` }), [fontScale]);

  function fail(message: string) {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setOk(false);
    if (nextAttempts === 1 && block.question?.hint1Ar) {
      setHintLevel(1);
      setFeedback(`${message} تلميح: ${block.question.hint1Ar}`);
    } else if (nextAttempts >= 2 && block.question?.hint2Ar) {
      setHintLevel(2);
      setFeedback(`${message} تلميح أقوى: ${block.question.hint2Ar}`);
    } else if (nextAttempts >= 3) {
      setFeedback(`${message} الشرح: ${block.question?.explanationAr || ""}`);
    } else {
      setFeedback(message);
    }
    onMastery?.(block.id, false);
  }

  function succeed(message: string) {
    setOk(true);
    setFeedback(message);
    onMastery?.(block.id, true);
  }

  function checkMcq(index: number) {
    if (ok === true) return;
    setSelected(index);
    const correct = block.question?.correctIndex === index;
    if (correct) {
      succeed(`أحسنت! ${block.question?.explanationAr || ""}`);
    } else {
      const wrong = block.question?.commonWrong?.find((w) => w.answer === block.question?.options?.[index]);
      fail(wrong ? `حاول مرة أخرى. ${wrong.whyAr}` : "حاول مرة أخرى.");
    }
  }

  function checkType() {
    if (ok === true) return;
    const expected = (block.question?.correctAnswer || "").trim();
    const accepted = block.question?.acceptedAnswers || [];
    const got = typed.trim();
    if (answersMatch(got, expected, accepted)) {
      succeed(`صحيح! ${block.question?.explanationAr || ""}`);
    } else {
      fail(attempts >= 2 ? `ليس بعد.` : "حاول مرة أخرى.");
    }
  }

  function showHint() {
    if (hintLevel < 1 && block.question?.hint1Ar) {
      setHintLevel(1);
      setFeedback(`تلميح: ${block.question.hint1Ar}`);
    } else if (block.question?.hint2Ar) {
      setHintLevel(2);
      setFeedback(`تلميح أقوى: ${block.question.hint2Ar}`);
    }
  }

  function retry() {
    setSelected(null);
    setTyped("");
    setFeedback(null);
    setOk(null);
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
        {block.question.difficulty ? (
          <span className="jb-diff">{block.question.difficulty}</span>
        ) : null}
        <p className="jb-prompt">{block.question.promptAr}</p>
        {block.interactiveKind === "mcq" && block.question.options ? (
          <div className="jb-options" role="group" aria-label={block.question.promptAr}>
            {block.question.options.map((opt, i) => (
              <button
                key={`${block.id}-opt-${i}`}
                type="button"
                className={`jb-opt ${selected === i ? (ok ? "ok" : ok === false ? "bad" : "") : ""}`}
                onClick={() => checkMcq(i)}
                disabled={ok === true}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}
        {block.interactiveKind === "type" || block.interactiveKind === "true_false" ? (
          <div className="jb-type">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="إجابتك"
              disabled={ok === true}
            />
            <button type="button" onClick={checkType} disabled={ok === true}>
              تحقق
            </button>
          </div>
        ) : null}
        <div className="jb-q-tools">
          <button type="button" className="jb-mini" onClick={showHint}>
            تلميح
          </button>
          {ok === false ? (
            <button type="button" className="jb-mini" onClick={retry}>
              إعادة المحاولة
            </button>
          ) : null}
          <span className="jb-attempts">محاولات: {attempts}</span>
        </div>
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
          labelAr="مساحة الكتابة والرسم بالقلم"
        />
      </section>
    );
  }

  if (block.type === "formula") {
    return (
      <section className={`jb-block jb-formula ${highlighted ? "is-hl" : ""}`} style={style} id={block.id} dir="ltr">
        {title}
        <p dir="rtl">{block.bodyAr}</p>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import type { LessonLocale, SceneDefinition } from "@/src/lib/interactive-lesson/types";

type Props = {
  scene: SceneDefinition;
  locale: LessonLocale;
  disabled?: boolean;
  onSubmit: (answer: unknown) => void;
};

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i] as number;
    const b = arr[j] as number;
    arr[i] = b;
    arr[j] = a;
  }
  // Avoid already-correct order for arrange/drag puzzles
  const identity = arr.every((v, i) => v === i);
  if (identity && length > 1) {
    const first = arr[0] as number;
    const last = arr[length - 1] as number;
    arr[0] = last;
    arr[length - 1] = first;
  }
  return arr;
}

export function InteractionPanel({ scene, locale, disabled, onSubmit }: Props) {
  const [typed, setTyped] = useState("");
  const [drawDigit, setDrawDigit] = useState("");
  const options = scene.answerOptions || [];
  const question = scene.question?.[locale] || "";

  const [arrangeOrder, setArrangeOrder] = useState<number[]>(() =>
    shuffleIndices(options.length || 0),
  );
  const [dragOrder, setDragOrder] = useState<number[]>(() => shuffleIndices(options.length || 0));
  const [matchPairs, setMatchPairs] = useState<number[]>(() =>
    Array.from({ length: options.length }, () => -1),
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Reset local interaction state when the scene changes
  useEffect(() => {
    setTyped("");
    setDrawDigit("");
    setArrangeOrder(shuffleIndices(options.length || 0));
    setDragOrder(shuffleIndices(options.length || 0));
    setMatchPairs(Array.from({ length: options.length }, () => -1));
    setDraggingIndex(null);
  }, [scene.sceneId, options.length]);

  const matchTargets = useMemo(
    () => scene.matchTargets || options,
    [options, scene.matchTargets],
  );

  if (scene.interactionType === "none") return null;

  if (scene.interactionType === "mcq" || scene.interactionType === "tap") {
    return (
      <div className="il-interact" role="group" aria-label={question}>
        <p className="il-q">{question}</p>
        <div className="il-choices">
          {options.map((opt, i) => (
            <button
              key={`${opt.ar}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => onSubmit(i)}
            >
              {opt[locale]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (scene.interactionType === "type") {
    return (
      <div className="il-interact">
        <p className="il-q">{question}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(typed);
          }}
        >
          <input
            inputMode="numeric"
            value={typed}
            disabled={disabled}
            onChange={(e) => setTyped(e.target.value)}
            aria-label={question}
            placeholder={locale === "ar" ? "اكتب الرقم" : "Type number"}
          />
          <button type="submit" disabled={disabled || !typed.trim()}>
            {locale === "ar" ? "تأكيد" : "Check"}
          </button>
        </form>
      </div>
    );
  }

  if (scene.interactionType === "draw") {
    const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    return (
      <div className="il-interact">
        <p className="il-q">{question}</p>
        <p className="il-draw-prompt">
          {locale === "ar" ? "اختر الرقم كما لو كنت تكتبه على السبورة" : "Pick the digit as if writing on the board"}
        </p>
        <div className="il-draw-pad" aria-label={question}>
          {digits.map((d) => (
            <button
              key={d}
              type="button"
              className={drawDigit === d ? "picked" : ""}
              disabled={disabled}
              onClick={() => setDrawDigit(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={disabled || !drawDigit}
          onClick={() => onSubmit(drawDigit)}
        >
          {locale === "ar" ? "تأكيد الرقم" : "Confirm digit"}
        </button>
      </div>
    );
  }

  if (scene.interactionType === "arrange") {
    const move = (from: number, dir: -1 | 1) => {
      const to = from + dir;
      if (to < 0 || to >= arrangeOrder.length) return;
      const next = [...arrangeOrder];
      const a = next[from] as number;
      const b = next[to] as number;
      next[from] = b;
      next[to] = a;
      setArrangeOrder(next);
    };
    return (
      <div className="il-interact">
        <p className="il-q">{question}</p>
        <ol className="il-arrange">
          {arrangeOrder.map((optIndex, row) => (
            <li key={`${optIndex}-${row}`}>
              <span>{options[optIndex]?.[locale]}</span>
              <span className="il-arrange-btns">
                <button type="button" disabled={disabled} onClick={() => move(row, -1)} aria-label="up">
                  ↑
                </button>
                <button type="button" disabled={disabled} onClick={() => move(row, 1)} aria-label="down">
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
        <button type="button" disabled={disabled} onClick={() => onSubmit(arrangeOrder)}>
          {locale === "ar" ? "تأكيد الترتيب" : "Confirm order"}
        </button>
      </div>
    );
  }

  if (scene.interactionType === "drag") {
    const onDragStart = (index: number) => setDraggingIndex(index);
    const onDrop = (targetIndex: number) => {
      if (draggingIndex === null || draggingIndex === targetIndex) return;
      const next = [...dragOrder];
      const moved = next.splice(draggingIndex, 1)[0];
      if (moved === undefined) return;
      next.splice(targetIndex, 0, moved);
      setDragOrder(next);
      setDraggingIndex(null);
    };
    return (
      <div className="il-interact">
        <p className="il-q">{question}</p>
        <p className="il-hint-line">
          {locale === "ar" ? "اسحب البطاقات لترتيبها" : "Drag the cards into order"}
        </p>
        <ul className="il-drag-list">
          {dragOrder.map((optIndex, row) => (
            <li
              key={`${optIndex}-${row}`}
              draggable={!disabled}
              onDragStart={() => onDragStart(row)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(row)}
            >
              <span className="il-drag-handle" aria-hidden>
                ⋮⋮
              </span>
              <span>{options[optIndex]?.[locale]}</span>
            </li>
          ))}
        </ul>
        <button type="button" disabled={disabled} onClick={() => onSubmit(dragOrder)}>
          {locale === "ar" ? "تأكيد السحب" : "Confirm drag order"}
        </button>
      </div>
    );
  }

  if (scene.interactionType === "match") {
    const setPair = (leftIndex: number, rightIndex: number) => {
      const next = [...matchPairs];
      for (let i = 0; i < next.length; i += 1) {
        if (next[i] === rightIndex) next[i] = -1;
      }
      next[leftIndex] = rightIndex;
      setMatchPairs(next);
    };
    const ready = matchPairs.length === options.length && matchPairs.every((v) => v >= 0);

    return (
      <div className="il-interact">
        <p className="il-q">{question}</p>
        <div className="il-match">
          {options.map((left, leftIndex) => (
            <div key={`${left.ar}-${leftIndex}`} className="il-match-row">
              <span className="il-match-left">{left[locale]}</span>
              <select
                disabled={disabled}
                value={matchPairs[leftIndex] ?? -1}
                onChange={(e) => setPair(leftIndex, Number(e.target.value))}
                aria-label={`${left[locale]} match`}
              >
                <option value={-1}>{locale === "ar" ? "اختر…" : "Choose…"}</option>
                {matchTargets.map((t, rightIndex) => (
                  <option key={`${t.ar}-${rightIndex}`} value={rightIndex}>
                    {t[locale]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button type="button" disabled={disabled || !ready} onClick={() => onSubmit(matchPairs)}>
          {locale === "ar" ? "تأكيد المطابقة" : "Confirm matches"}
        </button>
      </div>
    );
  }

  return null;
}

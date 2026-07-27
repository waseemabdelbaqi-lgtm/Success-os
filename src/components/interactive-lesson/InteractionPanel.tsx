"use client";

import { useMemo, useState } from "react";
import type { LessonLocale, SceneDefinition } from "@/src/lib/interactive-lesson/types";

type Props = {
  scene: SceneDefinition;
  locale: LessonLocale;
  disabled?: boolean;
  onSubmit: (answer: unknown) => void;
};

export function InteractionPanel({ scene, locale, disabled, onSubmit }: Props) {
  const [typed, setTyped] = useState("");
  const [arrangeOrder, setArrangeOrder] = useState<number[]>(() =>
    (scene.answerOptions || []).map((_, i) => i),
  );

  const options = scene.answerOptions || [];
  const question = scene.question?.[locale] || "";

  const shuffledTap = useMemo(() => options, [options]);

  if (scene.interactionType === "none") return null;

  if (scene.interactionType === "mcq" || scene.interactionType === "tap") {
    return (
      <div className="il-interact" role="group" aria-label={question}>
        <p className="il-q">{question}</p>
        <div className="il-choices">
          {shuffledTap.map((opt, i) => (
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

  if (scene.interactionType === "arrange") {
    const move = (from: number, dir: -1 | 1) => {
      const to = from + dir;
      if (to < 0 || to >= arrangeOrder.length) return;
      const next = [...arrangeOrder];
      const tmp = next[from];
      next[from] = next[to];
      next[to] = tmp;
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

  return null;
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { BoardMode, VisualEvent } from "@/src/lib/interactive-lesson/types";

type Props = {
  board: BoardMode;
  events: VisualEvent[];
  equationFallback?: string;
  locale: "ar" | "en";
};

export function NumberLineBoard({ board, events, equationFallback, locale }: Props) {
  const showLine = board === "numberline" || board === "jumps" || events.some((e) => e.action === "show_line");
  const highlights = events.filter((e) => e.action === "highlight").map((e) => Number(e.value));
  const start = [...events].reverse().find((e) => e.action === "place_start");
  const jumps = events.filter((e) => e.action === "jump");
  const equation = [...events].reverse().find((e) => e.action === "show_equation")?.value ?? equationFallback;
  const objects = [...events].reverse().find((e) => e.action === "show_objects");
  const celebrate = events.some((e) => e.action === "celebrate") || board === "celebrate";
  const marks = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="il-board" aria-live="polite">
      <AnimatePresence mode="wait">
        {equation ? (
          <motion.div
            key={String(equation)}
            className="il-eq"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {String(equation)}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {objects ? (
        <div className="il-objects" aria-label={locale === "ar" ? "أشياء للعد" : "Counting objects"}>
          {Array.from({ length: Number(objects.count || 0) }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              ●
            </motion.span>
          ))}
        </div>
      ) : null}

      {showLine ? (
        <div className="il-line" dir="ltr">
          <div className="il-rail" />
          <div className="il-marks">
            {marks.map((n) => {
              const hot = highlights.includes(n) || Number(start?.value) === n || jumps.some((j) => j.to === n);
              return (
                <div key={n} className={`il-mark ${hot ? "hot" : ""}`}>
                  <i />
                  <span>{n}</span>
                </div>
              );
            })}
          </div>
          {start ? (
            <motion.div
              className="il-token"
              initial={false}
              animate={{ left: `calc(${(Number(start.value) / 10) * 100}% - 14px)` }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
            />
          ) : null}
          {jumps.map((j, idx) => {
            const from = Number(j.from);
            const to = Number(j.to);
            const left = (Math.min(from, to) / 10) * 100;
            const width = (Math.abs(to - from) / 10) * 100;
            return (
              <motion.div
                key={`${from}-${to}-${idx}`}
                className="il-arc"
                style={{ left: `${left}%`, width: `${width}%` }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              />
            );
          })}
        </div>
      ) : null}

      {celebrate ? (
        <motion.div className="il-cele" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
          ★
        </motion.div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type Example = {
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  prompt: string;
  steps: string[];
  finalAnswer: string;
};

export function SolvedExamples({ examples }: { examples: Example[] }) {
  const [openStep, setOpenStep] = useState<Record<string, number>>({});

  return (
    <section id="examples" className="dl-panel scroll-mt-24" aria-labelledby="ex-heading">
      <header className="dl-panel-head">
        <p className="dl-kicker">Module E</p>
        <h2 id="ex-heading">Step-by-step solved examples</h2>
        <p className="dl-lead">Progressive difficulty — reveal each step only when you are ready.</p>
      </header>

      <div className="dl-examples">
        {examples.map((ex) => {
          const key = ex.title;
          const revealed = openStep[key] ?? 0;
          return (
            <details key={key} className="dl-example" open>
              <summary>
                <span className={`dl-diff ${ex.difficulty.toLowerCase()}`}>{ex.difficulty}</span>
                <span>{ex.title}</span>
              </summary>
              <div className="dl-example-body">
                <div className="dl-md">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {ex.prompt}
                  </ReactMarkdown>
                </div>
                <ol className="dl-steps">
                  {ex.steps.map((step, idx) => (
                    <li key={step} className={idx < revealed ? "shown" : "hidden-step"}>
                      {idx < revealed ? (
                        <div className="dl-md">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {step}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="dl-reveal"
                          onClick={() => setOpenStep((s) => ({ ...s, [key]: idx + 1 }))}
                        >
                          Reveal step {idx + 1}
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
                {revealed >= ex.steps.length ? (
                  <div className="dl-final">
                    <strong>Final answer</strong>
                    <div className="dl-md">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {ex.finalAnswer}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="dl-reveal wide"
                    onClick={() => setOpenStep((s) => ({ ...s, [key]: revealed + 1 }))}
                  >
                    Reveal next step
                  </button>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

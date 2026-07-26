"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Props = {
  markdown: string;
  objectives: string[];
};

export function DeepKnowledgeBase({ markdown, objectives }: Props) {
  return (
    <section
      id="knowledge"
      className="dl-panel scroll-mt-24"
      aria-labelledby="knowledge-heading"
    >
      <header className="dl-panel-head">
        <p className="dl-kicker">Module A</p>
        <h2 id="knowledge-heading">Immersive knowledge base</h2>
        <p className="dl-lead">
          Exhaustive academic treatment — theorems, derivations, and exam-ready structure.
        </p>
      </header>

      <ul className="dl-objectives">
        {objectives.map((obj) => (
          <li key={obj}>{obj}</li>
        ))}
      </ul>

      <article className="dl-prose">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {markdown}
        </ReactMarkdown>
      </article>
    </section>
  );
}

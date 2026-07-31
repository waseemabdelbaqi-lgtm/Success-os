"use client";

import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

type Level = { score: number; band: string };

type Dna = {
  studentName: string;
  interactionCount: number;
  knowledgeLevel: Level;
  understandingLevel: Level;
  confidenceLevel: Level;
  attentionLevel: Level;
  memoryStrength: Level;
  weakSkillIds: string[];
  strongSkillIds: string[];
  preferredTeacherStyle: string;
  learningVelocity: string;
  usedExplanationFingerprints: string[];
  lastInsight: { en: string } | null;
};

type Result = {
  dna: Dna;
  strategy: {
    mode: string;
    teachingStyle: string;
    isNovelExplanation: boolean;
    teacherMoves: string[];
    languageComplexity: string;
  };
  predictions: {
    nextLessonId: string | null;
    reviewLessonIds: string[];
    skillsNotYetMastered: string[];
    conceptsLikelyToConfuse: { en: string }[];
  };
  insight: { text: { en: string }; kind: string } | null;
  understanding: {
    whyConfused: { en: string } | null;
    isGuessing: boolean;
    trulyUnderstands: boolean;
    missingPrerequisiteSkillId: string | null;
  };
};

const panel: CSSProperties = {
  borderTop: "1px solid #cbd5e1",
  padding: "0.85rem 0",
  marginTop: "0.5rem",
};

function Score({ label, level }: { label: string; level: Level }) {
  return (
    <li>
      <strong>{label}</strong>: {level.score} ({level.band})
    </li>
  );
}

export function EducationIntelligenceCoreDashboard() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch("/api/education-intelligence-core?action=demo");
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        if (!res.ok || data.ok === false) {
          throw new Error(payload?.error?.message || "Failed to load EIC demo");
        }
        setResult(data.result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0f766e",
          }}
        >
          Success OS · Educational Intelligence
        </p>
        <h1 style={{ margin: "0.35rem 0 0", fontSize: "1.65rem", color: "#0f172a" }}>
          Education Intelligence Core
        </h1>
        <p style={{ color: "#64748b", margin: "0.45rem 0 0", fontSize: 14, lineHeight: 1.5 }}>
          Thinks like an experienced teacher. Updates Learning DNA after every interaction.
          Adapts explanations. Never repeats the same explanation fingerprint. Predicts what
          comes next — without inventing curriculum facts.
        </p>
        {error ? (
          <p style={{ color: "#b91c1c", fontSize: 13, margin: "0.5rem 0 0" }}>{error}</p>
        ) : null}
      </header>

      <button
        type="button"
        disabled={pending}
        onClick={() => load()}
        style={{
          background: "#0f766e",
          color: "#fff",
          border: 0,
          borderRadius: 6,
          padding: "0.45rem 0.85rem",
          cursor: "pointer",
          marginBottom: 14,
        }}
      >
        {pending ? "Running…" : "Run EIC Demo"}
      </button>

      {result?.insight ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Teacher insight</h2>
          <pre
            style={{
              margin: 0,
              padding: "0.75rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {result.insight.text.en}
          </pre>
          <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "#64748b" }}>
            Kind: {result.insight.kind}
          </p>
        </section>
      ) : null}

      {result ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Learning DNA</h2>
          <p style={{ margin: "0 0 0.5rem", fontSize: 13, color: "#64748b" }}>
            {result.dna.studentName || "Student"} · interactions{" "}
            {result.dna.interactionCount} · velocity {result.dna.learningVelocity} · style{" "}
            {result.dna.preferredTeacherStyle}
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.2rem",
              fontSize: 13,
              lineHeight: 1.6,
              columns: 2,
            }}
          >
            <Score label="Knowledge" level={result.dna.knowledgeLevel} />
            <Score label="Understanding" level={result.dna.understandingLevel} />
            <Score label="Confidence" level={result.dna.confidenceLevel} />
            <Score label="Attention" level={result.dna.attentionLevel} />
            <Score label="Memory strength" level={result.dna.memoryStrength} />
          </ul>
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#64748b" }}>
            Weak: {result.dna.weakSkillIds.join(", ") || "—"} · Explanation fingerprints:{" "}
            {result.dna.usedExplanationFingerprints.length}
          </p>
        </section>
      ) : null}

      {result ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Adaptive strategy</h2>
          <p style={{ margin: 0, fontSize: 13 }}>
            Mode: <strong>{result.strategy.mode}</strong> · Style:{" "}
            <strong>{result.strategy.teachingStyle}</strong> · Novel explanation:{" "}
            {String(result.strategy.isNovelExplanation)} · Language:{" "}
            {result.strategy.languageComplexity}
          </p>
          <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "#64748b" }}>
            Moves: {result.strategy.teacherMoves.join(" · ")}
          </p>
        </section>
      ) : null}

      {result ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Predictions</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 13, lineHeight: 1.6 }}>
            <li>Next: {result.predictions.nextLessonId || "—"}</li>
            <li>Review: {result.predictions.reviewLessonIds.join(", ") || "—"}</li>
            <li>
              Not mastered: {result.predictions.skillsNotYetMastered.join(", ") || "—"}
            </li>
            {result.predictions.conceptsLikelyToConfuse.slice(0, 2).map((c) => (
              <li key={c.en}>{c.en}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

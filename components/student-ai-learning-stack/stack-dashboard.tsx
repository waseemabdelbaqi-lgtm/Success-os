"use client";

import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

type Layer = {
  id: string;
  name: { en: string };
  status: string;
  activatesInPr: string;
};

type Snapshot = {
  displayPath: string[];
  layers: Layer[];
  counts: Record<string, number>;
  rules: string[];
};

type Plan = {
  sessionId: string;
  ilePackageId: string | null;
  aiContentGenerated: boolean;
  invocations: { layerId: string; status: string; ok: boolean }[];
  recommendedLessonIds: string[];
};

const card: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "0.85rem 1rem",
  background: "#fff",
};

const statusColor: Record<string, string> = {
  operational: "#0f766e",
  foundation: "#0369a1",
  stub: "#b45309",
  reserved: "#64748b",
};

export function StudentAiLearningStackDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch("/api/student-ai-learning-stack?action=demo");
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed");
        setSnapshot(data.snapshot);
        setPlan(data.plan);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>
          Student AI Learning Stack
        </h1>
        <p style={{ color: "#64748b", margin: "0.4rem 0 0", fontSize: 14 }}>
          Student → AI Teacher → Conversation → Reasoning → Knowledge Graph → Digital Books →
          Videos → ILE → Quizzes → Assessments
        </p>
        <p style={{ fontSize: 12, color: "#0f766e", margin: "0.5rem 0 0" }}>
          Open Lesson greeting + “I don’t understand” → Animation → Drawing → Example → Question →
          Check. No AI lesson generation. ILE is the sole runtime.
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
        {pending ? "Running…" : "Run Stack Demo"}
      </button>

      {snapshot ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {Object.entries(snapshot.counts).map(([k, v]) => (
              <div key={k} style={card}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{k}</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          <section style={{ ...card, marginBottom: 12 }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: 15 }}>Stack path</h2>
            <ol style={{ margin: 0, paddingInlineStart: "1.2rem", fontSize: 13 }}>
              {snapshot.layers.map((layer) => (
                <li key={layer.id} style={{ marginBottom: 6 }}>
                  <strong>{layer.name.en}</strong>{" "}
                  <span style={{ color: statusColor[layer.status] || "#64748b", fontSize: 12 }}>
                    ({layer.status}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>
                    {" "}
                    · {layer.activatesInPr})
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {plan ? (
            <section style={card}>
              <h2 style={{ margin: "0 0 0.5rem", fontSize: 15 }}>Session plan</h2>
              <p style={{ fontSize: 12, color: "#475569", margin: "0 0 0.5rem" }}>
                Session <code>{plan.sessionId}</code> · ILE{" "}
                <code>{plan.ilePackageId}</code> · AI content generated:{" "}
                {String(plan.aiContentGenerated)}
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                Recommended: {plan.recommendedLessonIds.join(", ")}
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

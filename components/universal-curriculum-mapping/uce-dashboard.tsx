"use client";

import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

type Snapshot = {
  schema: string;
  mission: string;
  counts: {
    mappings: number;
    objectives: number;
    standards: number;
    searchDocuments: number;
    byRelation: Record<string, number>;
  };
  examplePathway: {
    title: string;
    steps: { label: string; globalId: string; kind: string }[];
  };
  skillGraph: { counts: { skills: number; lessonLinks: number; curricula: number } };
  notes: string[];
};

const card: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "0.85rem 1rem",
  background: "#fff",
};

export function UceDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [searchHits, setSearchHits] = useState<number>(0);
  const [q, setQ] = useState("cell");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch("/api/universal-curriculum-mapping?action=snapshot");
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed to load UCE");
        setSnapshot(data.snapshot);
        setNotice("Universal Curriculum Mapping Engine ready — relationships only.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSearch = () => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/universal-curriculum-mapping?action=search&q=${encodeURIComponent(q)}&limit=20`,
        );
        const data = await res.json();
        setSearchHits(data.counts?.total ?? 0);
        setNotice(`Search “${q}” → ${data.counts?.total ?? 0} hits`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      }
    });
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a" }}>
          Universal Curriculum Mapping Engine
        </h1>
        <p style={{ color: "#64748b", margin: "0.4rem 0 0", fontSize: 14 }}>
          Translation layer between curricula — understand relationships, never copy content. No
          AI lesson/video/quiz generation.
        </p>
        {snapshot ? (
          <p style={{ fontSize: 12, color: "#0f766e", margin: "0.5rem 0 0" }}>
            {snapshot.examplePathway.steps.map((s) => s.label).join(" → ")}
          </p>
        ) : null}
        {notice ? (
          <p style={{ color: "#0f766e", fontSize: 13, margin: "0.5rem 0 0" }}>{notice}</p>
        ) : null}
        {error ? (
          <p style={{ color: "#b91c1c", fontSize: 13, margin: "0.5rem 0 0" }}>{error}</p>
        ) : null}
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
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
          }}
        >
          {pending ? "Loading…" : "Run UCE Snapshot"}
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (multilingual)"
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "0.4rem 0.7rem",
            minWidth: 180,
          }}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => runSearch()}
          style={{
            background: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "0.45rem 0.85rem",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      {snapshot ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              ["Mappings", snapshot.counts.mappings],
              ["Objectives", snapshot.counts.objectives],
              ["Standards", snapshot.counts.standards],
              ["Search docs", snapshot.counts.searchDocuments],
              ["Skill links", snapshot.skillGraph.counts.lessonLinks],
              ["Curricula linked", snapshot.skillGraph.counts.curricula],
              ["Search hits", searchHits],
            ].map(([label, value]) => (
              <div key={String(label)} style={card}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: "#0f172a" }}>{value}</div>
              </div>
            ))}
          </div>

          <section style={{ ...card, marginBottom: 12 }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 15 }}>Example pathway</h2>
            <ol style={{ margin: 0, paddingInlineStart: "1.2rem", fontSize: 13, color: "#334155" }}>
              {snapshot.examplePathway.steps.map((step) => (
                <li key={step.globalId}>
                  {step.label}{" "}
                  <code style={{ fontSize: 11, color: "#0f766e" }}>{step.globalId}</code>
                </li>
              ))}
            </ol>
          </section>

          <section style={card}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: 15 }}>Relation counts</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
              {Object.entries(snapshot.counts.byRelation).map(([rel, n]) => (
                <span
                  key={rel}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 4,
                    padding: "0.2rem 0.5rem",
                    color: "#475569",
                  }}
                >
                  {rel}: {n}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0.75rem 0 0" }}>
              {snapshot.mission}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

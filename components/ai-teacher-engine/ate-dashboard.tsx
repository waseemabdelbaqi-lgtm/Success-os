"use client";

import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

type Layer = {
  id: string;
  name: { en: string };
  status: string;
  activatesInPr: string;
};

type Capability = {
  id: string;
  name: { en: string };
  status: string;
};

type Snapshot = {
  displayPath: string[];
  layers: Layer[];
  capabilities: Capability[];
  counts: Record<string, number>;
  rules: string[];
  outOfScope: string[];
  safety: Record<string, boolean>;
  voice: { implementationStatus: string; interruptible: boolean };
  whiteboard: { implementationStatus: string; canDrawDiagrams: boolean };
};

type Turn = {
  sessionId: string;
  intent: string;
  affect: string;
  ilePackageId: string | null;
  aiContentGenerated: boolean;
  avatarsBuilt: boolean;
  teacherReply: {
    text: { en: string };
    uncertain: boolean;
    inventsCurriculumFacts: boolean;
    citations: { kind: string; globalId: string | null }[];
  };
  recommendations: { kind: string; targetId: string | null; ready: boolean }[];
  memory: {
    studentName: string;
    weakSkillIds: string[];
    learningPace: string;
    conversationHistory: unknown[];
  };
  invocations: { layerId: string; status: string; ok: boolean }[];
};

const panel: CSSProperties = {
  borderTop: "1px solid #cbd5e1",
  padding: "0.85rem 0",
  marginTop: "0.5rem",
};

const statusColor: Record<string, string> = {
  operational: "#0f766e",
  foundation: "#0369a1",
  stub: "#b45309",
  reserved: "#64748b",
};

export function AiTeacherEngineDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch("/api/ai-teacher-engine?action=demo");
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        if (!res.ok || data.ok === false) {
          throw new Error(
            payload?.error?.message || data?.error || "Failed to load ATE demo",
          );
        }
        setSnapshot(data.snapshot);
        setTurn(data.turn);
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
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0f766e",
          }}
        >
          Success OS · PR #55
        </p>
        <h1 style={{ margin: "0.35rem 0 0", fontSize: "1.65rem", color: "#0f172a" }}>
          AI Teacher Engine
        </h1>
        <p style={{ color: "#64748b", margin: "0.45rem 0 0", fontSize: 14, lineHeight: 1.5 }}>
          Virtual teacher — not a chatbot. Durable memory, grounded turns, country-agnostic
          production path. Demo action may seed the Jordan reference fixture only.
        </p>
        <p style={{ fontSize: 12, color: "#334155", margin: "0.55rem 0 0", lineHeight: 1.45 }}>
          Student → AI Teacher → Conversation → Reasoning → Student Memory → Knowledge Graph →
          Curriculum Registry → ILE → Digital Books → Videos → Assessments
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
        {pending ? "Running…" : "Run ATE Demo"}
      </button>

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.05rem" }}>Architecture layers</h2>
          <p style={{ margin: "0 0 0.75rem", fontSize: 13, color: "#64748b" }}>
            {snapshot.counts.operational} operational · {snapshot.counts.foundation} foundation ·{" "}
            {snapshot.counts.reserved} reserved · {snapshot.counts.capabilities} capabilities
          </p>
          <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 14, lineHeight: 1.7 }}>
            {snapshot.layers.map((l) => (
              <li key={l.id}>
                <span style={{ fontWeight: 600 }}>{l.name.en}</span>{" "}
                <span style={{ color: statusColor[l.status] || "#64748b", fontSize: 12 }}>
                  ({l.status}
                  {l.activatesInPr ? ` · ${l.activatesInPr}` : ""})
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {turn ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.05rem" }}>Teaching turn</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
            Intent: <strong>{turn.intent}</strong> · Affect: <strong>{turn.affect}</strong> ·
            Session: {turn.sessionId}
          </p>
          <pre
            style={{
              marginTop: 10,
              padding: "0.75rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {turn.teacherReply.text.en}
          </pre>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0.5rem 0 0" }}>
            Citations: {turn.teacherReply.citations.length} · Invents facts:{" "}
            {String(turn.teacherReply.inventsCurriculumFacts)} · Uncertain:{" "}
            {String(turn.teacherReply.uncertain)} · ILE: {turn.ilePackageId}
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0.35rem 0 0" }}>
            Memory: {turn.memory.studentName || "(unnamed)"} · pace {turn.memory.learningPace} ·
            history {turn.memory.conversationHistory.length} · weak skills{" "}
            {turn.memory.weakSkillIds.join(", ") || "—"}
          </p>
          <p style={{ fontSize: 12, color: "#0f766e", margin: "0.5rem 0 0" }}>
            Avatars/animations/AI videos/live classroom: not built. AI content generated:{" "}
            {String(turn.aiContentGenerated)}. Durable store: library/ai-teacher-engine/
          </p>
        </section>
      ) : null}

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.05rem" }}>Ready architecture</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 14, lineHeight: 1.65 }}>
            <li>
              Voice: {snapshot.voice.implementationStatus}
              {snapshot.voice.interruptible ? " · interruptible" : ""}
            </li>
            <li>
              Whiteboard: {snapshot.whiteboard.implementationStatus}
              {snapshot.whiteboard.canDrawDiagrams ? " · diagrams/equations" : ""}
            </li>
            <li>
              Safety: never invent curriculum facts · ground in approved sources · state uncertainty
            </li>
            <li>Out of scope: {snapshot.outOfScope.join(", ")}</li>
          </ul>
        </section>
      ) : null}

      {snapshot?.capabilities ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.6rem", fontSize: "1.05rem" }}>Capabilities</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.2rem",
              fontSize: 13,
              lineHeight: 1.6,
              columns: 2,
              columnGap: "1.5rem",
            }}
          >
            {snapshot.capabilities.map((c) => (
              <li key={c.id} style={{ breakInside: "avoid" }}>
                {c.name.en}{" "}
                <span style={{ color: statusColor[c.status] || "#64748b", fontSize: 11 }}>
                  ({c.status})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

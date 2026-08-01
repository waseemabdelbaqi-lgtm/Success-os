"use client";

import { useCallback, useEffect, useState, useTransition, type CSSProperties } from "react";

type Profile = {
  id: string;
  displayName: { en: string };
  countryCode: string;
  accentLabel: { en: string };
  educationalStages: string[];
  personalityTone: { en: string };
  enabled: boolean;
};

type Provider = {
  port: string;
  providerId: string;
  label: { en: string };
  enabled: boolean;
  configured: boolean;
  implementationStatus: string;
  exampleVendors: string[];
};

type Snapshot = {
  profiles: Profile[];
  providers: Provider[];
  stages: { stage: string; name: { en: string }; tone: { en: string } }[];
  presence: {
    implementationStatus: string;
    shipsLiveAvatarVideo: boolean;
    shipsLiveTtsStt: boolean;
    capabilities: string[];
  };
  counts: Record<string, number>;
  outOfScopeNow: string[];
  rules: string[];
};

type Plan = {
  sessionId: string;
  teacherProfileId: string | null;
  liveProvidersEnabled: boolean;
  inventsCurriculumFacts: boolean;
  personality: {
    studentName: string;
    preferredLanguage: string;
    preferredTeachingSpeed: string;
    confidenceLevel: string;
  };
  notes: string[];
};

const panel: CSSProperties = {
  borderTop: "1px solid #cbd5e1",
  padding: "0.85rem 0",
  marginTop: "0.5rem",
};

export function AiDigitalHumanTeacherDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError("");
      try {
        const res = await fetch(
          "/api/ai-digital-human-teacher?action=demo&countryCode=JO&educationalStage=elementary",
        );
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        if (!res.ok) {
          throw new Error(payload?.error?.message || "Failed to load ADHT demo");
        }
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
          Success OS · World-class teacher presence
        </p>
        <h1 style={{ margin: "0.35rem 0 0", fontSize: "1.65rem", color: "#0f172a" }}>
          AI Digital Human Teacher
        </h1>
        <p style={{ color: "#64748b", margin: "0.45rem 0 0", fontSize: 14, lineHeight: 1.5 }}>
          Architecture for a realistic digital human teacher — localized, age-appropriate,
          provider-agnostic. Pedagogy stays in the AI Teacher Engine. No live avatar video or
          speech SDKs in this wave.
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
        {pending ? "Loading…" : "Run ADHT Demo"}
      </button>

      {plan ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Session plan</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
            Session <strong>{plan.sessionId}</strong> · Profile{" "}
            <strong>{plan.teacherProfileId || "unassigned"}</strong>
          </p>
          <p style={{ margin: "0.35rem 0 0", fontSize: 13, color: "#64748b" }}>
            {plan.personality.studentName || "Student"} · lang{" "}
            {plan.personality.preferredLanguage || "—"} · speed{" "}
            {plan.personality.preferredTeachingSpeed} · confidence{" "}
            {plan.personality.confidenceLevel}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#0f766e" }}>
            Live providers: {String(plan.liveProvidersEnabled)} · Invents facts:{" "}
            {String(plan.inventsCurriculumFacts)}
          </p>
        </section>
      ) : null}

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>
            Localized teacher profiles
          </h2>
          <p style={{ margin: "0 0 0.6rem", fontSize: 13, color: "#64748b" }}>
            {snapshot.counts.enabledProfiles} enabled · admin-configurable · not hardcoded as the
            only platform teachers
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 14, lineHeight: 1.65 }}>
            {snapshot.profiles.map((p) => (
              <li key={p.id}>
                <strong>{p.displayName.en}</strong> ({p.countryCode}) — {p.accentLabel.en} ·{" "}
                {p.personalityTone.en} · stages: {p.educationalStages.join(", ")}
                {!p.enabled ? " · disabled" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Age-appropriate stages</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 14, lineHeight: 1.65 }}>
            {snapshot.stages.map((s) => (
              <li key={s.stage}>
                <strong>{s.name.en}</strong> — {s.tone.en}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>
            Provider-agnostic AI stack
          </h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 13, lineHeight: 1.6 }}>
            {snapshot.providers.map((p) => (
              <li key={p.port}>
                <strong>{p.label.en}</strong> → {p.providerId} (
                {p.exampleVendors.join(" / ")}) · {p.implementationStatus}
                {p.configured ? " · configured" : " · not live"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot ? (
        <section style={panel}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>Presence contract</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
            Status: {snapshot.presence.implementationStatus} · Live avatar video:{" "}
            {String(snapshot.presence.shipsLiveAvatarVideo)} · Live TTS/STT:{" "}
            {String(snapshot.presence.shipsLiveTtsStt)}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#64748b" }}>
            Capabilities: {snapshot.presence.capabilities.join(" · ")}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#b45309" }}>
            Out of scope now: {snapshot.outOfScopeNow.join(" · ")}
          </p>
        </section>
      ) : null}
    </div>
  );
}

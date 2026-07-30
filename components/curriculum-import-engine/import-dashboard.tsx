"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

type Dashboard = {
  counts: {
    jobs: number;
    running: number;
    completed: number;
    rejected: number;
    packages: number;
    books: number;
    lessons: number;
    errors: number;
    warnings: number;
  };
  queue: JobRow[];
  running: JobRow[];
  completed: JobRow[];
  rejected: JobRow[];
  verificationSummary: Record<string, number>;
  rightsSummary: Record<string, number>;
  history: { at: string; stage: string; level: string; message: string }[];
};

type JobRow = {
  id: string;
  status: string;
  country: string;
  curriculum: string;
  connectorId: string;
  currentStage: string | null;
  packageCount: number;
  bookCount: number;
  lessonCount: number;
  errors: string[];
  warnings: string[];
  verificationStatus?: string;
  rightsStatus?: string;
  updatedAt: string;
};

/**
 * IMPORT_DASHBOARD — ops surface for Curriculum Import Engine.
 * Does not render lesson content; shows jobs / verification / package counts only.
 */
export function CurriculumImportDashboard(): ReactNode {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<string>("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/curriculum-import-engine?action=dashboard", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setDashboard(data.dashboard);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runJordan() {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/curriculum-import-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-jordan" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Import failed");
      setNotice(
        `Jordan import ${data.job.status}: ${data.job.packageCount} ILE packages · ${data.job.lessonCount} lessons`,
      );
      setDetail(JSON.stringify(data.job, null, 2));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function retry(jobId: string) {
    setBusy(true);
    try {
      await fetch("/api/curriculum-import-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", jobId }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function rollback(jobId: string) {
    setBusy(true);
    try {
      await fetch("/api/curriculum-import-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", jobId }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const c = dashboard?.counts;

  return (
    <div dir="ltr" style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem 1rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.45rem" }}>Curriculum Import Engine</h1>
        <p style={{ color: "#64748b", margin: "0.35rem 0 0", fontSize: 13 }}>
          Compiler only — transforms verified curriculum into ILE packages. Never renders lessons.
          Jordan Phase 1 · No AI rewrite · No videos · No quizzes.
        </p>
        {notice ? (
          <p style={{ color: "#0f766e", fontSize: 13, margin: "0.5rem 0 0" }}>{notice}</p>
        ) : null}
        {error ? (
          <p style={{ color: "#b91c1c", fontSize: 13, margin: "0.5rem 0 0" }}>{error}</p>
        ) : null}
      </header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" style={btn(true)} disabled={busy} onClick={() => void runJordan()}>
          {busy ? "Running…" : "Run Jordan Phase 1 Import"}
        </button>
        <button type="button" style={btn()} disabled={busy} onClick={() => void refresh()}>
          Refresh dashboard
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {c
          ? (
              [
                ["Jobs", c.jobs],
                ["Running", c.running],
                ["Completed", c.completed],
                ["Rejected", c.rejected],
                ["Packages", c.packages],
                ["Books", c.books],
                ["Lessons", c.lessons],
                ["Errors", c.errors],
                ["Warnings", c.warnings],
              ] as const
            ).map(([label, value]) => (
              <div key={label} style={card()}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
              </div>
            ))
          : null}
      </section>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        className="cie-grid"
      >
        <style>{`@media (max-width:900px){.cie-grid{grid-template-columns:1fr!important}}`}</style>

        <JobTable
          title="Import Queue"
          jobs={dashboard?.queue || []}
          onRetry={retry}
          onRollback={rollback}
        />
        <JobTable
          title="Running Jobs"
          jobs={dashboard?.running || []}
          onRetry={retry}
          onRollback={rollback}
        />
        <JobTable
          title="Completed Imports"
          jobs={dashboard?.completed || []}
          onRetry={retry}
          onRollback={rollback}
        />
        <JobTable
          title="Rejected Imports"
          jobs={dashboard?.rejected || []}
          onRetry={retry}
          onRollback={rollback}
        />
      </div>

      <section style={{ ...card(), marginTop: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Verification / Rights Status</h2>
        <pre style={{ fontSize: 12, margin: 0, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            {
              verification: dashboard?.verificationSummary,
              rights: dashboard?.rightsSummary,
            },
            null,
            2,
          )}
        </pre>
      </section>

      <section style={{ ...card(), marginTop: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Import History</h2>
        <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: "#475569" }}>
          {(dashboard?.history || []).slice(0, 20).map((e, i) => (
            <li key={`${e.at}-${i}`}>
              {e.at} · {e.stage} · {e.level} — {e.message}
            </li>
          ))}
        </ul>
      </section>

      {detail ? (
        <section style={{ ...card(), marginTop: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Last job detail (ILE package refs)</h2>
          <pre
            style={{
              fontSize: 11,
              maxHeight: 360,
              overflow: "auto",
              background: "#f8fafc",
              padding: 8,
              borderRadius: 8,
            }}
          >
            {detail}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function JobTable({
  title,
  jobs,
  onRetry,
  onRollback,
}: {
  title: string;
  jobs: JobRow[];
  onRetry: (id: string) => void;
  onRollback: (id: string) => void;
}): ReactNode {
  return (
    <section style={card()}>
      <h2 style={{ marginTop: 0, fontSize: 15 }}>
        {title} ({jobs.length})
      </h2>
      {!jobs.length ? (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>Empty</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {jobs.map((j) => (
            <div
              key={j.id}
              style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.5rem" }}
            >
              <div style={{ fontWeight: 600, fontSize: 12 }}>{j.id}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {j.status} · {j.connectorId} · stage {j.currentStage || "—"} · pkg{" "}
                {j.packageCount} · lessons {j.lessonCount}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                verify {j.verificationStatus || "—"} · rights {j.rightsStatus || "—"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button type="button" style={btn()} onClick={() => onRetry(j.id)}>
                  Retry
                </button>
                <button type="button" style={btn()} onClick={() => onRollback(j.id)}>
                  Rollback
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function btn(active = false): React.CSSProperties {
  return {
    border: "1px solid #cbd5e1",
    background: active ? "#0f766e" : "#fff",
    color: active ? "#fff" : "#0f172a",
    borderRadius: 8,
    padding: "0.4rem 0.65rem",
    cursor: "pointer",
    fontSize: 12,
  };
}

function card(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    padding: "0.75rem",
  };
}

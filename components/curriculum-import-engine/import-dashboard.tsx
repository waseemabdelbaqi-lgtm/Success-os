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
    countries: number;
    curricula: number;
    grades: number;
    subjects: number;
    units: number;
    imported: number;
    verified: number;
    pending: number;
    published: number;
    verifiedPackages: number;
    pendingPackages: number;
    rejectedPackages: number;
    rightsWarnings: number;
    globalSubjects: number;
  };
  queue: JobRow[];
  running: JobRow[];
  completed: JobRow[];
  rejected: JobRow[];
  verificationSummary: Record<string, number>;
  rightsSummary: Record<string, number>;
  history: { at: string; stage: string; level: string; message: string }[];
  hierarchyPathExample?: string[];
  validationErrors?: string[];
  rightsWarningsList?: string[];
  importProgress?: {
    totalLessons: number;
    verified: number;
    pending: number;
    rejected: number;
    published: number;
    percentVerified: number;
  };
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
 * Does not render lesson content; shows hierarchy + jobs + package counts only.
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

  async function runJordanReferenceDataset() {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/curriculum-import-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-jordan-reference-dataset" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error((data.errors || data.error || ["Dataset failed"]).toString());
      const r = data.result;
      setNotice(
        `Jordan reference dataset: ${r.validationReport?.published || 0} published · ${r.counts?.lessons || 0} lessons · ${r.counts?.verifiedPackages || 0} verified packages`,
      );
      setDetail(
        JSON.stringify(
          {
            samplePath: r.samplePath,
            sampleMetadata: r.sampleMetadata,
            samplePackage: r.samplePackage
              ? {
                  id: r.samplePackage.id,
                  schema: r.samplePackage.schema,
                  title: r.samplePackage.title,
                  status: r.samplePackage.status,
                  filters: r.samplePackage.filters,
                  importMeta: r.samplePackage.importMeta,
                  engineMeta: r.samplePackage.engineMeta,
                }
              : null,
            validationReport: r.validationReport,
            tree: r.tree,
          },
          null,
          2,
        ),
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runJordanG1Math() {
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/curriculum-import-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-jordan-g1-math" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error((data.errors || data.error || ["Import failed"]).toString());
      const r = data.result;
      setNotice(
        `Jordan G1 Math reference: ${r.published ? "PUBLISHED" : "compiled"} · ${r.packageId} · path ${r.hierarchyPath?.join(" → ")}`,
      );
      setDetail(JSON.stringify(r, null, 2));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function runJordanG5() {
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
        `Jordan G5 Science import ${data.job.status}: ${data.job.packageCount} ILE packages`,
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
  const progress = dashboard?.importProgress;

  return (
    <div
      dir="ltr"
      data-cie-dashboard="true"
      style={{ maxWidth: 1100, margin: "0 auto", padding: "1.25rem 1rem" }}
    >
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.45rem" }}>Curriculum Import Engine</h1>
        <p style={{ color: "#64748b", margin: "0.35rem 0 0", fontSize: 13 }}>
          Reference standard: Jordan → Grade → Subject → Book → Unit → Lesson → Verified ILE Package
          → Interactive Lesson Engine. Compiler only — never renders. No AI rewrite / videos /
          quizzes.
        </p>
        {dashboard?.hierarchyPathExample ? (
          <p style={{ fontSize: 12, color: "#0f766e", margin: "0.5rem 0 0" }}>
            {dashboard.hierarchyPathExample.join(" → ")}
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
          style={btn(true)}
          disabled={busy}
          onClick={() => void runJordanReferenceDataset()}
        >
          {busy ? "Running…" : "Run Jordan Reference Dataset"}
        </button>
        <button type="button" style={btn()} disabled={busy} onClick={() => void runJordanG1Math()}>
          Run Jordan G1 Math Reference
        </button>
        <button type="button" style={btn()} disabled={busy} onClick={() => void runJordanG5()}>
          Run Jordan G5 Science Import
        </button>
        <button type="button" style={btn()} disabled={busy} onClick={() => void refresh()}>
          Refresh dashboard
        </button>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {c
          ? (
              [
                ["Countries", c.countries],
                ["Curricula", c.curricula],
                ["Grades", c.grades],
                ["Global Subjects", c.globalSubjects],
                ["Subjects", c.subjects],
                ["Books", c.books],
                ["Units", c.units],
                ["Lessons", c.lessons],
                ["Verified Packages", c.verifiedPackages],
                ["Pending Packages", c.pendingPackages],
                ["Rejected Packages", c.rejectedPackages],
                ["Imported", c.imported],
                ["Verified", c.verified],
                ["Pending", c.pending],
                ["Rejected", c.rejected],
                ["Published", c.published],
                ["Errors", c.errors],
                ["Warnings", c.warnings],
                ["Rights Warnings", c.rightsWarnings],
              ] as const
            ).map(([label, value]) => (
              <div key={label} style={card()}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{value ?? 0}</div>
              </div>
            ))
          : null}
      </section>

      {progress ? (
        <section style={{ ...card(), marginBottom: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Import Progress</h2>
          <div
            style={{
              height: 10,
              background: "#e2e8f0",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${progress.percentVerified}%`,
                height: "100%",
                background: "#0f766e",
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
            {progress.verified}/{progress.totalLessons} lessons verified ({progress.percentVerified}
            %) · pending {progress.pending} · rejected {progress.rejected} · published{" "}
            {progress.published}
          </p>
        </section>
      ) : null}

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
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Validation Errors</h2>
        {(dashboard?.validationErrors || []).length ? (
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: "#b91c1c" }}>
            {(dashboard?.validationErrors || []).map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>None</p>
        )}
      </section>

      <section style={{ ...card(), marginTop: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Rights Warnings</h2>
        {(dashboard?.rightsWarningsList || []).length ? (
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: "#b45309" }}>
            {(dashboard?.rightsWarningsList || []).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>None</p>
        )}
      </section>

      <section style={{ ...card(), marginTop: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: 15 }}>Admin Flow</h2>
        <p style={{ fontSize: 12, color: "#475569", marginTop: 0 }}>
          Create Country → Attach Curriculum → Create Grades → Create Subjects → Import Books →
          Detect Units → Detect Lessons → Verify Structure → Generate ILE Packages → Approve →
          Publish
        </p>
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
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Last result (metadata / ILE package JSON)</h2>
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductionFactoryPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/curriculum-factory?view=status");
    setStatus(await r.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    try {
      const r = await fetch("/api/curriculum-factory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      setResult(await r.json());
      await load();
    } finally {
      setBusy(false);
    }
  }

  const queue = (status?.queue || {}) as Record<string, number>;

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Curriculum Production Factory</h1>
      <p>Gate 4 — persistent queue, workers, import/OCR interfaces, validation, review, publication.</p>
      <p>
        <Link href="/admin/production-monitor">Monitor</Link>
        {" · "}
        <Link href="/admin/review-workbench">Review workbench</Link>
        {" · "}
        <Link href="/admin/jordan-coverage">Jordan coverage</Link>
        {" · "}
        <Link href="/admin/country-readiness">Readiness</Link>
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "1rem 0" }}>
        <button disabled={busy} onClick={() => void run("bootstrap")}>
          Bootstrap Jordan + queue
        </button>
        <button disabled={busy} onClick={() => void run("drain_eligible")}>
          Drain eligible jobs
        </button>
        <button disabled={busy} onClick={() => void run("worker_batch", { limit: 10 })}>
          Worker batch (10)
        </button>
        <button disabled={busy} onClick={() => void run("publish_first_ready")}>
          Publish first review-ready (proof)
        </button>
        <button disabled={busy} onClick={() => void run("run_gate4")}>
          Run full Gate 4 pipeline
        </button>
      </div>

      <h2>Queue (live)</h2>
      <ul>
        {Object.entries(queue).map(([k, v]) => (
          <li key={k}>
            <b>{k}</b>: {v}
          </li>
        ))}
      </ul>

      <h2>Review backlog</h2>
      <pre style={{ background: "#f7f3ef", padding: 12 }}>{JSON.stringify(status?.reviewBacklog || {}, null, 2)}</pre>

      <p>
        Import formats: {Array.isArray(status?.importFormats) ? (status.importFormats as string[]).join(", ") : "—"}
      </p>
      <p style={{ fontSize: 14 }}>{String(status?.ocrMethod || "")}</p>

      {result && (
        <details open>
          <summary>Last action result</summary>
          <pre style={{ background: "#f7f3ef", padding: 12, maxHeight: 480, overflow: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}

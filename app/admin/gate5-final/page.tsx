"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Gate5FinalDashboard() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/gate5?view=status");
    setStatus(await r.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function runFinal() {
    setBusy(true);
    try {
      const r = await fetch("/api/gate5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_final_audit", publishLimit: 20 }),
      });
      const d = await r.json();
      setReport(d);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const totals = (status?.totals || {}) as Record<string, number>;
  const readiness = ((report as { report?: { readiness?: Record<string, unknown> } })?.report?.readiness ||
    {}) as Record<string, unknown>;

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Gate 5 — Final Jordan readiness</h1>
      <p>Features frozen. Figures from live database + executed tests only.</p>
      <p>
        <Link href="/admin/production-factory">Factory</Link>
        {" · "}
        <Link href="/admin/production-monitor">Monitor</Link>
        {" · "}
        <Link href="/admin/country-readiness">Country readiness</Link>
      </p>

      <button disabled={busy} onClick={() => void runFinal()}>
        {busy ? "Running final audit…" : "Run Gate 5 final audit"}
      </button>

      <h2>Live totals</h2>
      <ul>
        {Object.entries(totals).map(([k, v]) => (
          <li key={k}>
            <b>{k}</b>: {String(v)}
          </li>
        ))}
      </ul>

      <h2>Readiness (separate — not one percentage)</h2>
      <ul>
        <li>Jordan content complete: {String(readiness.jordanContentComplete ?? "—")}</li>
        <li>Jordan audited with blockers: {String(readiness.jordanAuditedWithBlockers ?? "—")}</li>
        <li>Jordan operationally complete: {String(readiness.jordanOperationallyComplete ?? "—")}</li>
        <li>Global engine ready: {String(readiness.globalEngineReady ?? "—")}</li>
        <li>
          <b>Next-country readiness: {String(readiness.verdict ?? readiness.readyForNextCountry ?? "run audit")}</b>
        </li>
      </ul>

      {report && (
        <details open>
          <summary>Full audit JSON</summary>
          <pre style={{ background: "#f7f3ef", padding: 12, maxHeight: 560, overflow: "auto" }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}

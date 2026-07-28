"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function JordanCoveragePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/global-curriculum?view=jordan-coverage");
    setData(await r.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function runPipeline() {
    setBusy(true);
    try {
      const r = await fetch("/api/global-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_pipeline" }),
      });
      setPipeline(await r.json());
      await load();
    } finally {
      setBusy(false);
    }
  }

  const byGrade = (data?.byGrade as Array<Record<string, unknown>>) || [];

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Jordan curriculum coverage</h1>
      <p>Totals are calculated from the database. Companion STRUCTURED ≠ official COMPLETE.</p>
      <p>
        <Link href="/admin/country-readiness">Readiness</Link>
        {" · "}
        <Link href="/admin/global-curriculum-matrix">Matrix</Link>
        {" · "}
        <Link href="/interactive-books">Interactive books</Link>
      </p>
      <button disabled={busy} onClick={() => void runPipeline()}>
        {busy ? "Running Gate 3 pipeline…" : "Run Gate 3 Jordan pipeline + audit"}
      </button>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            {["Grade", "Expected books", "Discovered", "Structured companions", "Edition unverified (official)", "COMPLETE"].map(
              (h) => (
                <th key={h} style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 6 }}>
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {byGrade.map((g) => (
            <tr key={String(g.grade_code)}>
              <td style={{ padding: 6 }}>{String(g.grade_code)}</td>
              <td style={{ padding: 6 }}>{String(g.expected_books)}</td>
              <td style={{ padding: 6 }}>{String(g.discovered)}</td>
              <td style={{ padding: 6 }}>{String(g.structured_companions)}</td>
              <td style={{ padding: 6 }}>{String(g.edition_unverified_official)}</td>
              <td style={{ padding: 6 }}>{String(g.complete_books)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data?.queue ? (
        <pre style={{ background: "#f7f3ef", padding: 12, overflow: "auto" }}>{JSON.stringify(data.queue, null, 2)}</pre>
      ) : null}
      {pipeline ? (
        <details open>
          <summary>Last pipeline / audit result</summary>
          <pre style={{ background: "#f7f3ef", padding: 12, overflow: "auto", maxHeight: 480 }}>
            {JSON.stringify(pipeline, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

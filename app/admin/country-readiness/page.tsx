"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CountryReadinessPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [audit, setAudit] = useState<Record<string, unknown> | null>(null);

  async function load() {
    const r = await fetch("/api/global-curriculum?view=readiness");
    setData(await r.json());
    const a = await fetch("/api/global-curriculum?view=audit");
    setAudit(await a.json());
  }

  useEffect(() => {
    void load();
  }, []);

  const report = (audit?.report || {}) as Record<string, unknown>;
  const ready = Boolean(report.nextCountryReady);

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Country readiness dashboard</h1>
      <p style={{ fontSize: 18, fontWeight: 700 }}>
        Next-country readiness: {ready ? "READY" : "NOT READY"}
      </p>
      <p>Verdict: {String(report.verdict || "—")}</p>
      <p>
        <Link href="/admin/jordan-coverage">Jordan coverage</Link>
        {" · "}
        <Link href="/admin/country-wizard">Wizard</Link>
      </p>
      <h2>Readiness checks</h2>
      <ul>
        {((data?.checks as Array<Record<string, unknown>>) || []).map((c) => (
          <li key={String(c.check_key)}>
            {Number(c.passed) === 1 ? "PASS" : "FAIL"} · {String(c.check_key)} — {String(c.evidence || "").slice(0, 160)}
          </li>
        ))}
      </ul>
      <h2>Countries</h2>
      <ul>
        {((data?.countries as Array<Record<string, unknown>>) || []).map((c) => (
          <li key={String(c.id)}>
            {String(c.iso_code)} · {String(c.name_en)} · {String(c.status)} · student_visible=
            {String(c.student_visible)}
          </li>
        ))}
      </ul>
      <details>
        <summary>Full audit JSON</summary>
        <pre style={{ background: "#f7f3ef", padding: 12, overflow: "auto" }}>{JSON.stringify(audit, null, 2)}</pre>
      </details>
    </main>
  );
}

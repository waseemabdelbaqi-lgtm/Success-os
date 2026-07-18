'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastProductionPage() {
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const response = await fetch('/api/middle-east-production', {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`REPORT_${response.status}`);
    setReport(await response.json());
  }

  useEffect(() => {
    load().catch((reason) => setError(reason.message));
  }, []);

  async function run() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairConnections: true }),
      });
      if (!response.ok) throw new Error(`RUN_${response.status}`);
      const payload = await response.json();
      setReport(payload.report);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const summary = report?.globalSummary;
  const certification = report?.certification;

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 1100 }}>
      <p className="os-kicker">PHASE 14 — PRODUCTION READINESS</p>
      <h1>شهادة إنتاج الشرق الأوسط</h1>
      <p>
        <a href="/middle-east-audit">← Audit</a>
        {' · '}
        <a href="/student/books">Live Library</a>
      </p>
      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}
      <button
        type="button"
        className="os-primary"
        disabled={busy}
        onClick={run}
        style={{ marginTop: 12 }}
      >
        {busy ? 'Running…' : 'Re-run Production Readiness'}
      </button>

      {summary ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>Certificate</h2>
          <p>
            <strong>{certification?.status}</strong>
            {summary.freezeVersion
              ? ` · Frozen v${summary.freezeVersion}`
              : ''}
          </p>
          <ul>
            <li>Completion: {summary.overallMiddleEastCompletionPercentage}%</li>
            <li>Quality: {summary.overallQualityPercentage}%</li>
            <li>
              Production Ready Countries: {summary.countriesProductionReady}/
              {summary.countriesAudited}
            </li>
            <li>
              Books: {summary.books} · Reading Ready:{' '}
              {summary.readingReadyBooks}
            </li>
          </ul>
        </section>
      ) : null}

      {report?.countries ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>Countries</h2>
          <div style={{ overflow: 'auto', maxHeight: 480 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {[
                    'Country',
                    'Books',
                    'Comp %',
                    'Qual %',
                    'Ready',
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                        padding: 6,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.countries.map((country) => (
                  <tr key={country.countryCode}>
                    <td style={{ padding: 6 }}>{country.country}</td>
                    <td style={{ padding: 6 }}>{country.books}</td>
                    <td style={{ padding: 6 }}>
                      {country.completionPercentage}
                    </td>
                    <td style={{ padding: 6 }}>
                      {country.qualityPercentage}
                    </td>
                    <td style={{ padding: 6 }}>
                      {country.productionReady}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

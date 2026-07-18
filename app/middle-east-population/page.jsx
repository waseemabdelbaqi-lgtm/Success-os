'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastPopulationDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const response = await fetch('/api/middle-east-population', {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`DASH_${response.status}`);
    setDashboard(await response.json());
  }

  useEffect(() => {
    load().catch((reason) => setError(reason.message));
  }, []);

  async function populateNext() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1 }),
      });
      if (!response.ok) throw new Error(`POP_${response.status}`);
      setResult(await response.json());
      await load();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const totals = dashboard?.totals;

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 1100 }}>
      <p className="os-kicker">PHASE 15.2 — CONTENT POPULATION</p>
      <h1>لوحة تعبئة كتب الشرق الأوسط</h1>
      <p>
        تعبئة الكتب الموجودة فقط · لا أغلفة فارغة · النشر بعد موافقة المشرف فقط ·
        أمريكا الشمالية موقوفة حتى اكتمال الشرق الأوسط
      </p>
      <p>
        <a href="/admin/middle-east-book-review">Admin Review</a>
        {' · '}
        <a href="/middle-east-completion">Completion</a>
        {' · '}
        <a href="/student/books">Library</a>
      </p>
      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}
      <button
        type="button"
        className="os-primary"
        disabled={busy}
        onClick={populateNext}
        style={{ marginTop: 12 }}
      >
        {busy ? 'Populating one book…' : 'Populate next book (complete fully)'}
      </button>

      {totals ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>Global</h2>
          <ul>
            <li>Books detected: {totals.booksDetected}</li>
            <li>Books populated: {totals.booksPopulated}</li>
            <li>Pending Admin: {totals.booksPendingAdmin}</li>
            <li>Approved: {totals.booksApproved}</li>
            <li>Still scaffold/thin: {totals.booksStillScaffoldOrThin}</li>
          </ul>
        </section>
      ) : null}

      {dashboard?.countries ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>By country</h2>
          <div style={{ overflow: 'auto', maxHeight: 480 }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
            >
              <thead>
                <tr>
                  {[
                    'Country',
                    'Detected',
                    'Populated',
                    'Approved',
                    'Lessons',
                    'Rejected',
                    'Comp %',
                    'Qual %',
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
                {dashboard.countries.map((country) => (
                  <tr key={country.countryCode}>
                    <td style={{ padding: 6 }}>{country.country}</td>
                    <td style={{ padding: 6 }}>{country.booksDetected}</td>
                    <td style={{ padding: 6 }}>{country.booksPopulated}</td>
                    <td style={{ padding: 6 }}>{country.booksApproved}</td>
                    <td style={{ padding: 6 }}>{country.lessonsCompleted}</td>
                    <td style={{ padding: 6 }}>{country.lessonsRejected}</td>
                    <td style={{ padding: 6 }}>
                      {country.completionPercentage}
                    </td>
                    <td style={{ padding: 6 }}>
                      {country.qualityPercentage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <pre
          style={{
            marginTop: 20,
            padding: 12,
            background: '#fffaf0',
            borderRadius: 12,
            overflow: 'auto',
            fontSize: 11,
          }}
        >
          {JSON.stringify(result.report, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}

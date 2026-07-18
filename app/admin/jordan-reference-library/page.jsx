'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanReferenceLibraryAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-reference-library', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    setLog(null);
    try {
      const res = await fetch('/api/jordan-reference-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'request failed');
      setLog(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const totals = data?.dashboard?.totals || {};
  const byCategory = data?.dashboard?.byCategory || [];
  const bySubject = data?.dashboard?.bySubject || [];
  const byGrade = data?.dashboard?.byGrade || [];
  const byPublisher = data?.dashboard?.byPublisher || [];

  return (
    <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-05 — Jordan Educational Reference Library</h1>
      <p>
        Single source of truth for Jordan National Curriculum references. No content generation in
        this phase. Sources must be verified here before use.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
          margin: '1rem 0',
        }}
      >
        {[
          ['Total', totals.totalReferences],
          ['Verified', totals.verifiedReferences],
          ['Pending', totals.pendingVerification],
          ['Broken', totals.brokenReferences],
          ['Updated', totals.updatedReferences],
          ['Deprecated', totals.deprecatedReferences],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('rebuild')}>
          Rebuild library
        </button>
        <button type="button" disabled={busy} onClick={() => run('link')}>
          Link JO books
        </button>
        <button type="button" disabled={busy} onClick={() => run('probe', { limit: 15 })}>
          Probe URLs
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Sources by category</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: '1rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Category</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {byCategory.map((row) => (
            <tr key={row.category}>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{row.category}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <div>
          <h3>By subject</h3>
          <ul style={{ fontSize: 13 }}>
            {bySubject.slice(0, 12).map((r) => (
              <li key={r.subject}>
                {r.subject}: {r.count}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>By grade</h3>
          <ul style={{ fontSize: 13 }}>
            {byGrade.slice(0, 12).map((r) => (
              <li key={r.grade}>
                {r.grade}: {r.count}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>By publisher</h3>
          <ul style={{ fontSize: 13 }}>
            {byPublisher.slice(0, 12).map((r) => (
              <li key={r.publisher}>
                {r.publisher}: {r.count}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {log ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last action</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f8fafc', padding: 12 }}>
            {JSON.stringify(log, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

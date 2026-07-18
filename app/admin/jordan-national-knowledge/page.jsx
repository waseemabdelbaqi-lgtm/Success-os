'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanNationalKnowledgeAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-national-knowledge', { cache: 'no-store' });
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/jordan-national-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'request failed');
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const v = data?.dashboard?.verification || data?.status?.verification || {};
  const gate = data?.gatePercent ?? 98;
  const allowed = data?.bookGenerationAllowed === true;

  return (
    <main style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-01 — Jordan National Curriculum Knowledge</h1>
      <p>
        المنهاج الوطني الأردني فقط — international curricula excluded. Book generation blocked until ≥{gate}% verified.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <section style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem' }}>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
          <strong>Verified completion:</strong> {v.verifiedCompletionPercent ?? '—'}%
          <br />
          <strong>Book generation:</strong>{' '}
          <span style={{ color: allowed ? '#047857' : '#b91c1c' }}>
            {allowed ? 'ALLOWED' : 'BLOCKED'}
          </span>
        </div>
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
          <strong>Totals</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {JSON.stringify(data?.dashboard?.totals || data?.status?.totals || {}, null, 2)}
          </pre>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" disabled={busy} onClick={() => run('rebuild')}>
            Rebuild knowledge DB
          </button>
          <button type="button" disabled={busy} onClick={() => run('harvest-nccd')}>
            Harvest NCCD catalogues
          </button>
          <button type="button" disabled={busy} onClick={() => load()}>
            Refresh
          </button>
        </div>
        <details>
          <summary>Excluded international curricula</summary>
          <ul>
            {(data?.excludedCurricula || []).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Priority 1 official sources</summary>
          <ul>
            {(data?.priority1Sources || []).map((s) => (
              <li key={s.id || s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </main>
  );
}

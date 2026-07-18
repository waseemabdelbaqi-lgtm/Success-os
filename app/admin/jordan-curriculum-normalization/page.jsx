'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanCurriculumNormalizationAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-curriculum-normalization', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action) {
    setBusy(true);
    setError('');
    setLog(null);
    try {
      const res = await fetch('/api/jordan-curriculum-normalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
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

  const dash = data?.dashboard || {};

  const cards = [
    ['Countries Added', dash.countriesAdded],
    ['Education Systems', dash.educationSystems],
    ['Subjects', dash.subjects],
    ['Books', dash.books],
    ['Units', dash.units],
    ['Lessons', dash.lessons],
    ['Concepts', dash.concepts],
    ['Skills', dash.skills],
    ['Learning Outcomes', dash.learningOutcomes],
    ['Normalization', dash.normalizationStatus],
    ['Validation', dash.validationStatus],
  ];

  return (
    <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-08 — Curriculum Normalization (UEM)</h1>
      <p>
        Success OS Universal Education Model v{data?.uemVersion || '—'}. Jordan is the first country.
        Future countries add data only — no schema redesign.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
          margin: '1rem 0',
        }}
      >
        {cards.map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('normalize')}>
          Normalize Jordan → UEM
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Migration readiness</h2>
      <pre style={{ fontSize: 12, background: '#f8fafc', padding: 12 }}>
        {JSON.stringify(dash.migrationReadiness || {}, null, 2)}
      </pre>

      <h2>Entity kinds</h2>
      <p style={{ fontSize: 13 }}>{(data?.entityKinds || []).join(' · ')}</p>

      {log ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last normalization</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 360, overflow: 'auto' }}>
            {JSON.stringify(log, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

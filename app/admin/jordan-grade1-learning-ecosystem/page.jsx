'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanGrade1LearningEcosystemAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-grade1-learning-ecosystem', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(options = {}) {
    setBusy(true);
    setError('');
    setLog(null);
    try {
      const res = await fetch('/api/jordan-grade1-learning-ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', options }),
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

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-01.2 — Grade 1 Complete Learning Ecosystem</h1>
      <p>
        Official catalog:{' '}
        <a href={data?.officialCatalogUrl} target="_blank" rel="noreferrer">
          NCCD TextBooksGrade/68
        </a>
        . Every lesson must reach 100% before the next. Grade 2 stays locked until Grade 1 is
        fully complete.
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
          ['Lessons complete', `${dash.completedLessons ?? 0}/${dash.totalLessons ?? 0}`],
          ['Completion %', dash.completionPercent],
          ['Grade 1 complete', dash.grade1Complete ? 'yes' : 'no'],
          ['Grade 2 unlocked', dash.grade2Unlocked ? 'yes' : 'LOCKED'],
          ['Checklist / lesson', dash.checklistSize],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run()}>
          Produce / Continue Grade 1 Ecosystem
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ subject: 'الرياضيات' })}
        >
          Math only
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Subjects (NCCD Grade 1)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Subject', 'JO-02 book', 'Done', '%', 'Status'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(dash.subjects || []).map((row) => (
            <tr key={row.subject}>
              <td style={{ padding: 6 }}>{row.subject}</td>
              <td style={{ padding: 6 }}>{row.jo02Produced ? 'yes' : 'knowledge'}</td>
              <td style={{ padding: 6 }}>
                {row.completed}/{row.total}
              </td>
              <td style={{ padding: 6 }}>{row.percent}%</td>
              <td style={{ padding: 6 }}>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {dash.blockedAt ? (
        <pre style={{ background: '#fff7ed', padding: 12, fontSize: 12, marginTop: 12 }}>
          Blocked: {JSON.stringify(dash.blockedAt, null, 2)}
        </pre>
      ) : null}

      {log ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last run</summary>
          <pre style={{ fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 360, overflow: 'auto' }}>
            {JSON.stringify(
              {
                completedLessons: log.completedLessons,
                grade1Complete: log.grade1Complete,
                grade2Unlocked: log.grade2Unlocked,
                blockedAt: log.blockedAt,
              },
              null,
              2,
            )}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

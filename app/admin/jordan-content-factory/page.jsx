'use client';

import { useCallback, useEffect, useState } from 'react';

const ADMIN_ACTIONS = [
  ['preview', 'Preview'],
  ['comment', 'Comment'],
  ['requestRevision', 'Request Revision'],
  ['approve', 'Approve'],
  ['reject', 'Reject'],
  ['publish', 'Publish (factory)'],
  ['republish', 'Republish'],
  ['archive', 'Archive'],
];

export default function JordanContentFactoryAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);
  const [selected, setSelected] = useState('');
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-content-factory', { cache: 'no-store' });
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
      const res = await fetch('/api/jordan-content-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.reason || 'request failed');
      setLog(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const dash = data?.dashboard || {};
  const queue = data?.queue || [];

  const cards = [
    ['Lessons Created', dash.lessonsCreated],
    ['Under Review', dash.lessonsUnderReview],
    ['Approved', dash.approvedLessons],
    ['Rejected', dash.rejectedLessons],
    ['Factory Published', dash.publishedLessons],
    ['Avg Review Time (h)', dash.averageReviewTime],
    ['Avg Quality Score', dash.averageQualityScore],
    ['Missing References', dash.missingReferences],
    ['Broken Links', dash.brokenLinks],
    ['Admin Queue', dash.adminQueue],
  ];

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-09 — Success OS Content Factory</h1>
      <p>
        Mandatory production pipeline for every lesson. No stage may be skipped. No direct
        publication — Admin must Approve, then Publish (factory only; student portal stays closed).
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
        {cards.map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('run')}>
          Enroll &amp; Run Pipeline
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Pipeline ({(data?.pipelineStages || []).length} stages)</h2>
      <p style={{ fontSize: 13 }}>{(data?.pipelineStages || []).join(' → ')}</p>

      <h2>Admin Review Queue</h2>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
          Selected recordId
          <input
            style={{ display: 'block', width: '100%', maxWidth: 720, marginTop: 4 }}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            placeholder="bookId::lessonId"
          />
        </label>
        <label style={{ display: 'block', fontSize: 13, marginTop: 8 }}>
          Comment
          <input
            style={{ display: 'block', width: '100%', maxWidth: 720, marginTop: 4 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: 8 }}>
          {ADMIN_ACTIONS.map(([action, label]) => (
            <button
              key={action}
              type="button"
              disabled={busy || !selected}
              onClick={() => run(action, { recordId: selected, comment, by: 'admin-ui' })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Grade', 'Subject', 'Title', 'Score', 'Stages', 'Select'].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.recordId}>
                <td style={{ padding: 6 }}>{item.grade}</td>
                <td style={{ padding: 6 }}>{item.subject}</td>
                <td style={{ padding: 6 }}>{item.title}</td>
                <td style={{ padding: 6 }}>{item.qualityScore ?? '—'}</td>
                <td style={{ padding: 6 }}>
                  {item.completedStages}/{item.totalStages}
                </td>
                <td style={{ padding: 6 }}>
                  <button type="button" onClick={() => setSelected(item.recordId)}>
                    Use
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last action</summary>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontSize: 11,
              background: '#f8fafc',
              padding: 12,
              maxHeight: 360,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(log, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

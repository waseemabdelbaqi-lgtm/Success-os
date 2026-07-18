'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanCurriculumUpdateAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-curriculum-update', { cache: 'no-store' });
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
      const res = await fetch('/api/jordan-curriculum-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'request failed');
      setLog(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const dash = data?.dashboard || {};
  const progress = dash.updateProgress || {};

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-06 — Jordan Curriculum Update Engine</h1>
      <p>
        Monitor official Jordanian curriculum. Update only affected content via drafts. Never
        overwrite approved live books. Publish only after verification + Admin approval.
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
          ['Pending drafts', progress.pendingDrafts],
          ['Approved', progress.approved],
          ['Rejected', progress.rejected],
          ['Unread alerts', progress.unreadNotifications],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('monitor')}>
          Run monitor cycle
        </button>
        <button type="button" disabled={busy} onClick={() => run('monitor', { detectOnly: true })}>
          Detect only
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run('notice', {
              title: 'MoE curriculum notice (test)',
              grade: 'الصف 5',
              subject: 'الرياضيات',
              changeType: 'changed-learning-outcomes',
            })
          }
        >
          Inject test notice (G5 Math)
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Latest curriculum updates</h2>
      <pre style={{ fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 180, overflow: 'auto' }}>
        {JSON.stringify(dash.latestCurriculumUpdates || [], null, 2)}
      </pre>

      <h2>Books requiring updates</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Book', 'Grade', 'Subject', 'Lessons', 'Severity'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(dash.booksRequiringUpdates || []).map((b) => (
            <tr key={b.bookId}>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.bookId}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.grade}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.subject}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.lessonsAffected}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                {(b.severities || []).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Lessons pending review (drafts)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
        <thead>
          <tr>
            {['Draft', 'Book', 'Status', 'Lessons', 'Actions'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(dash.lessonsPendingReview || []).map((d) => (
            <tr key={d.draftId}>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{d.draftId}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{d.bookId}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{d.status}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{d.lessons}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                <button type="button" disabled={busy} onClick={() => run('approve', { draftId: d.draftId })}>
                  Approve
                </button>{' '}
                <button type="button" disabled={busy} onClick={() => run('reject', { draftId: d.draftId, notes: 'Rejected' })}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Notifications</h2>
      <ul style={{ fontSize: 13 }}>
        {(dash.notifications || []).slice(0, 12).map((n) => (
          <li key={n.id}>
            [{n.type}] {n.message}
          </li>
        ))}
      </ul>

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

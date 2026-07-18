'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanBookProductionAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-book-production', { cache: 'no-store' });
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    setLog(null);
    try {
      const res = await fetch('/api/jordan-book-production', {
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

  const dash = data?.dashboard;
  const subjects = dash?.subjects || [];

  return (
    <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-02 — Jordan Book Production</h1>
      <p>
        المنهاج الوطني الأردني فقط · موضوع واحد في كل مرة · الجودة أهم من السرعة
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', margin: '1rem 0' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 12, color: '#666' }}>JO-01 gate</div>
          <strong>{dash?.jo01Gate?.verifiedCompletionPercent ?? '—'}%</strong>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Subject lock</div>
          <strong>{dash?.state?.subjectLock || '—'}</strong>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Queue books</div>
          <strong>{dash?.totals?.queueBooks ?? data?.queueSize ?? '—'}</strong>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Published</div>
          <strong>{dash?.totals?.publishedBooks ?? '—'}</strong>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('next')}>
          Produce next book
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run('produce-subject', { subject: 'الرياضيات' })}
        >
          Produce subject: الرياضيات
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <h2>Subjects</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {[
                'Subject',
                'Research',
                'Content',
                'Units',
                'Lessons',
                'Quality',
                'Missing',
                'Verification',
                'Publish',
              ].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.subject} style={{ background: s.locked ? '#f0fdf4' : undefined }}>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  {s.locked ? '🔒 ' : ''}
                  {s.subject}
                </td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.researchProgress}%</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.contentProgress}%</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.unitsCompleted}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  {s.lessonsCompleted}/{s.lessonsExpected}
                </td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.qualityScore}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  {(s.missingLessons || []).length}
                </td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.verificationStatus}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{s.publishStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Last action result</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: '#f8fafc', padding: 12 }}>
            {JSON.stringify(log, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

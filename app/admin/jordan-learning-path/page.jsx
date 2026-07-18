'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanLearningPathAdminPage() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [studentView, setStudentView] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-learning-path', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/jordan-learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'request failed');
      if (action === 'progress' || action === 'complete' || action === 'set-state') {
        setStudentView(json);
      }
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  const dash = data?.dashboard || {};
  const analytics = dash.analytics || {};
  const paths = dash.pathIndex?.paths || [];

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-07 — Jordan Learning Path Engine</h1>
      <p>
        Guided learning journeys for the Jordan National Curriculum. Students always know where they
        are, what they finished, what comes next, and how much remains.
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
          ['Students started', analytics.studentsStarted],
          ['Students completed', analytics.studentsCompleted],
          ['Avg completion (min)', analytics.averageCompletionTimeMinutes],
          ['Curriculum %', analytics.curriculumCompletionPercentage],
          ['Path books', analytics.pathBooks],
          ['Path lessons', analytics.pathLessons],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('build')}>
          Rebuild paths
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh analytics
        </button>
      </div>

      <h2>Learning paths</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Grade', 'Subject', 'Lessons', 'Minutes', 'Actions'].map((h) => (
              <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paths.map((p) => (
            <tr key={p.pathId}>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.grade}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.subject}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.lessons}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{p.minutes}</td>
              <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run('progress', { studentId: 'demo-student-jo', bookId: p.bookId })
                  }
                >
                  Student progress
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Most difficult lessons</h2>
      <ul style={{ fontSize: 13 }}>
        {(analytics.mostDifficultLessons || []).slice(0, 8).map((l) => (
          <li key={l.lessonId}>
            {l.lessonId} · incomplete {l.incomplete}/{l.started || 0}
          </li>
        ))}
      </ul>

      <h2>Most reviewed lessons</h2>
      <ul style={{ fontSize: 13 }}>
        {(analytics.mostReviewedLessons || []).slice(0, 8).map((l) => (
          <li key={l.lessonId}>
            {l.lessonId} · reviews {l.reviewed}
          </li>
        ))}
      </ul>

      {studentView ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Student progression</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 360, overflow: 'auto' }}>
            {JSON.stringify(studentView, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

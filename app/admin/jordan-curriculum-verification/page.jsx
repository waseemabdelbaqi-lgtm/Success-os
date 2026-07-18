'use client';

import { useCallback, useEffect, useState } from 'react';

export default function JordanCurriculumVerificationAdminPage() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/jordan-curriculum-verification', { cache: 'no-store' });
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  async function run(action, bookId, extra = {}) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/jordan-curriculum-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookId, ...extra }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || 'action failed');
      }
      setNotice(`${action} ✓ ${bookId || ''}`);
      setDetail(json);
      await load();
    } catch (e) {
      setError(e.message || 'action failed');
    } finally {
      setBusy(false);
    }
  }

  async function openCompare(bookId) {
    setSelected(bookId);
    const res = await fetch(
      `/api/jordan-curriculum-verification?view=compare&bookId=${encodeURIComponent(bookId)}`,
      { cache: 'no-store' },
    );
    setDetail(await res.json());
  }

  async function openPreview(bookId) {
    setSelected(bookId);
    const res = await fetch(
      `/api/jordan-curriculum-verification?view=preview&bookId=${encodeURIComponent(bookId)}`,
      { cache: 'no-store' },
    );
    setDetail(await res.json());
  }

  const books = data?.dashboard?.books || [];
  const totals = data?.dashboard?.totals || {};
  const gate = data?.publishGate ?? 98;

  return (
    <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui' }}>
      <h1>JO-03 — Curriculum Verification</h1>
      <p>
        No Jordan book publishes without curriculum match, content validation, book test, ≥{gate}%
        quality, and Admin approval.
      </p>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {notice ? <p style={{ color: '#047857' }}>{notice}</p> : null}

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
          margin: '1rem 0',
        }}
      >
        {[
          ['Reviewed', totals.booksReviewed],
          ['Awaiting Admin', totals.awaitingAdmin],
          ['Failed', totals.failed],
          [`≥${gate}%`, totals.atOrAbove98],
          ['Published', totals.published],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '0.75rem' }}>
            <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </section>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button type="button" disabled={busy} onClick={() => run('verify-all')}>
          Verify all Jordan books
        </button>
        <button type="button" disabled={busy} onClick={() => load()}>
          Refresh
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {[
                'Subject',
                'Grade',
                'Lessons ✓',
                'Missing',
                'Quality',
                'Verification',
                'Last Review',
                'Publish',
                'Actions',
              ].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.bookId} style={{ background: selected === b.bookId ? '#f0fdf4' : undefined }}>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.subject}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.grade}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.lessonsCompleted}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.lessonsMissing}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  <strong style={{ color: (b.qualityScore || 0) >= gate ? '#047857' : '#b91c1c' }}>
                    {b.qualityScore}%
                  </strong>
                </td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.verificationStatus}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  {b.lastReviewDate ? String(b.lastReviewDate).slice(0, 10) : '—'}
                </td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{b.publishStatus}</td>
                <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => run('verify', b.bookId)}>
                      Verify
                    </button>
                    <button type="button" disabled={busy} onClick={() => openPreview(b.bookId)}>
                      Preview
                    </button>
                    <button type="button" disabled={busy} onClick={() => openCompare(b.bookId)}>
                      Compare
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('approve', b.bookId)}>
                      Approve
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('reject', b.bookId, { notes: 'Admin reject' })}>
                      Reject
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('regenerate', b.bookId)}>
                      Regenerate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail ? (
        <details open style={{ marginTop: '1rem' }}>
          <summary>Detail / compare / preview</summary>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f8fafc', padding: 12, maxHeight: 420, overflow: 'auto' }}>
            {JSON.stringify(detail, null, 2)}
          </pre>
        </details>
      ) : null}
    </main>
  );
}

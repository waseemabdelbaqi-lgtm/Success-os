'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Admin review queue + commission audit + S4S production jobs.
 * Mounted on recorded-lessons / finance / payouts admin modules.
 */
export function MarketplaceAdminReviewPanel({ moduleId }) {
  const [queue, setQueue] = useState([]);
  const [audit, setAudit] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [actorId, setActorId] = useState('admin-demo');

  const load = useCallback(async () => {
    setError('');
    try {
      const [q, a, j] = await Promise.all([
        fetch('/api/marketplace/admin?view=review-queue', { cache: 'no-store' }).then((r) =>
          r.json(),
        ),
        fetch('/api/marketplace/admin?view=commission-audit', { cache: 'no-store' }).then((r) =>
          r.json(),
        ),
        fetch('/api/marketplace/admin?view=aios-jobs', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setQueue(q.items || []);
      setAudit(a.items || []);
      setJobs(j.items || []);
    } catch (e) {
      setError(e.message || 'load failed');
    }
  }, []);

  useEffect(() => {
    setActorId(localStorage.getItem('success-os-admin-id') || 'admin-demo');
    load();
  }, [load]);

  async function transition(courseId, toStatus) {
    const res = await fetch('/api/marketplace/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transition',
        courseId,
        toStatus,
        actorId,
        actorRole: 'master-admin',
        notes: `Admin ${toStatus}`,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'transition failed');
      return;
    }
    await load();
  }

  async function createS4sJob() {
    const res = await fetch('/api/marketplace/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-s4s-production-job',
        actorId,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'job create failed');
      return;
    }
    await load();
  }

  return (
    <section
      data-testid="marketplace-admin-review"
      style={{
        margin: '12px 0',
        padding: 14,
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fafafa',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>Marketplace Review & Finance</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>
        Module: {moduleId}. Manual publish only. Commission changes require audit reason.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ marginBottom: 16 }}>
        <strong>Course review queue</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
          {queue.length === 0 ? <li>No courses in review yet.</li> : null}
          {queue.map((c) => (
            <li key={c.id}>
              {c.title} — {c.publication_status}
              {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.publication_status) ? (
                <>
                  {' '}
                  <button type="button" onClick={() => transition(c.id, 'UNDER_REVIEW')}>
                    Review
                  </button>
                  <button type="button" onClick={() => transition(c.id, 'CHANGES_REQUESTED')}>
                    Request changes
                  </button>
                  <button type="button" onClick={() => transition(c.id, 'APPROVED')}>
                    Approve
                  </button>
                  <button
                    type="button"
                    data-testid="admin-publish"
                    onClick={() => transition(c.id, 'PUBLISHED')}
                  >
                    Publish manually
                  </button>
                  <button type="button" onClick={() => transition(c.id, 'SUSPENDED')}>
                    Suspend
                  </button>
                  <button type="button" onClick={() => transition(c.id, 'ARCHIVED')}>
                    Archive
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Commission audit history</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12 }}>
          {audit.length === 0 ? <li>No commission changes recorded.</li> : null}
          {audit.slice(0, 10).map((a) => (
            <li key={a.id}>
              {a.scope}: {a.previous_value?.percentage ?? '—'} → {a.new_value?.percentage} ·{' '}
              {a.reason} · {a.changed_by} · {String(a.created_at || '').slice(0, 19)}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <strong>S4S Intelligence production jobs</strong>{' '}
        <button type="button" data-testid="create-s4s-job" onClick={createS4sJob}>
          Create production request
        </button>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12 }}>
          {jobs.length === 0 ? <li>No AIOS course production jobs.</li> : null}
          {jobs.map((j) => (
            <li key={j.id}>
              {j.task_type} — {j.status} · education:{j.education_status} · media:{j.media_status} ·
              human:{j.human_approval_status} · auto_publish:{String(j.auto_publish)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

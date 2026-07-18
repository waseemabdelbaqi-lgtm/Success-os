'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastBookAdminReviewPage() {
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadReviews() {
    const response = await fetch('/api/middle-east-population?view=reviews', {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`REVIEWS_${response.status}`);
    const payload = await response.json();
    setReviews(payload.reviews || []);
  }

  useEffect(() => {
    loadReviews().catch((reason) => setError(reason.message));
  }, []);

  async function openBook(review) {
    setSelected(review);
    setNotice('');
    setError('');
    const response = await fetch(
      `/api/student-books?view=book&id=${encodeURIComponent(review.bookId)}`,
      { cache: 'no-store' },
    );
    if (!response.ok) {
      setError(`BOOK_${response.status}`);
      setBook(null);
      return;
    }
    setBook(await response.json());
  }

  async function approve() {
    if (!selected?.bookId) return;
    setBusy(true);
    try {
      const response = await fetch('/api/middle-east-population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', bookId: selected.bookId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `APPROVE_${response.status}`);
      }
      setNotice('Book approved for student publish.');
      await loadReviews();
      await openBook({ ...selected, publishStatus: 'ADMIN_APPROVED' });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (!selected?.bookId) return;
    setBusy(true);
    try {
      const response = await fetch('/api/middle-east-population', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'populateOne',
          bookId: selected.bookId,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `REGEN_${response.status}`);
      }
      setNotice(
        `Repopulated: ${payload.lessonsCompleted} lessons · rejected ${payload.lessonsRejected}`,
      );
      await loadReviews();
      await openBook(selected);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 1200 }}>
      <p className="os-kicker">PHASE 15.2 — ADMIN REVIEW MODE</p>
      <h1>مراجعة كتب الشرق الأوسط</h1>
      <p>
        معاينة · رفض/إعادة توليد · موافقة كتاب كامل · لا نشر بدون موافقة المشرف
      </p>
      <p>
        <a href="/middle-east-population">← Population Dashboard</a>
      </p>
      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}
      {notice ? <p style={{ color: '#0b634d' }}>{notice}</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px,320px) minmax(0,1fr)',
          gap: 16,
          marginTop: 16,
        }}
      >
        <aside className="os-card" style={{ padding: 12, maxHeight: 640, overflow: 'auto' }}>
          <h2 style={{ fontSize: 14 }}>Reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ fontSize: 12 }}>No populated books yet. Run population.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {reviews.map((review) => (
                <li key={review.bookId} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => openBook(review)}
                    style={{
                      width: '100%',
                      textAlign: 'right',
                      padding: 8,
                      borderRadius: 8,
                      border:
                        selected?.bookId === review.bookId
                          ? '2px solid #8b1e1e'
                          : '1px solid #ddd',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <b style={{ display: 'block', fontSize: 12 }}>
                      {review.identity?.subject}
                    </b>
                    <small>
                      {review.identity?.country} · {review.identity?.grade}
                    </small>
                    <br />
                    <small>{review.publishStatus}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="os-card" style={{ padding: 16 }}>
          {!selected ? (
            <p>Select a book review.</p>
          ) : (
            <>
              <h2>
                {selected.identity?.subject} — {selected.identity?.grade}
              </h2>
              <ul style={{ fontSize: 13 }}>
                <li>Book status: {selected.bookStatus || selected.publishStatus}</li>
                <li>Curriculum source: {selected.curriculumSource}</li>
                <li>Lessons completed: {selected.lessonsCompleted}</li>
                <li>Lessons rejected: {selected.lessonsRejected}</li>
                <li>Verification: {selected.verificationStatus}</li>
                <li>Quality score: {selected.qualityScore}</li>
                <li>Last update: {selected.lastUpdate}</li>
                <li>Publish status: {selected.publishStatus}</li>
                <li>
                  Sources used: {(selected.sourcesUsed || []).length}
                </li>
                <li>
                  Warnings:{' '}
                  {(selected.contentWarnings || []).length
                    ? selected.contentWarnings.length
                    : 'none'}
                </li>
              </ul>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="os-primary"
                  disabled={busy}
                  onClick={approve}
                >
                  Approve full book
                </button>
                <button type="button" disabled={busy} onClick={regenerate}>
                  Regenerate lessons
                </button>
                <a
                  href={`/student/books/${encodeURIComponent(selected.bookId)}/read`}
                >
                  Open reader preview
                </a>
              </div>

              {book ? (
                <div style={{ marginTop: 20, maxHeight: 420, overflow: 'auto' }}>
                  <h3>Lesson preview</h3>
                  {(book.units || []).map((unit) => (
                    <details key={unit.id} style={{ marginBottom: 10 }}>
                      <summary>
                        {unit.title} ({(unit.lessons || []).length})
                      </summary>
                      {(unit.lessons || []).map((lesson) => (
                        <article
                          key={lesson.id}
                          style={{
                            margin: '8px 0',
                            padding: 10,
                            border: '1px solid #eee',
                            borderRadius: 8,
                          }}
                        >
                          <b>{lesson.title}</b>
                          <div>
                            <small>
                              Review: {lesson.adminReview?.status || 'n/a'} ·
                              Match: {lesson.contentMatching?.verificationStatus}
                            </small>
                          </div>
                          <p style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {(lesson.summary || '').slice(0, 280)}
                          </p>
                        </article>
                      ))}
                    </details>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

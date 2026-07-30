'use client';

import { useCallback, useEffect, useState } from 'react';
import { defaultRecordedLessonFilters } from '@/app/data/recorded-lesson-filters.js';
import { RecordedLessonsFilters } from '@/components/admin/recorded-lessons-filters.jsx';
import { RecordedLessonsSubjectResults } from '@/components/admin/recorded-lessons-subject-results.jsx';
import { CourseCard } from '@/components/marketplace/course-card.jsx';

/**
 * Student Recorded Lessons Marketplace.
 * Replaces redirect-only experience. Keeps recorded-class-request as an extra option.
 */
export default function StudentRecordedLessonsMarketplacePage() {
  const [filters, setFilters] = useState(() => defaultRecordedLessonFilters());
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v != null && v !== '') params.set(k, String(v));
      });
      const res = await fetch(`/api/marketplace/recorded-courses?${params}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed to load catalogue');
      setCatalog(json);
    } catch (e) {
      setError(e.message || 'load failed');
      setCatalog({ items: [], total: 0, facets: null, grouped: null, filters });
    } finally {
      setBusy(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function enrol(course) {
    setCheckoutMsg('');
    setSelected(course);
    const studentId =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('success-os-student-id') ||
          sessionStorage.getItem('success-os-student-id'))) ||
      `student-demo-${Date.now()}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('success-os-student-id', studentId);
    }
    try {
      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId: course.id,
          // Deliberately send a manipulated client price — server must ignore it
          price: 0.01,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setCheckoutMsg(json.error || 'Checkout failed');
        return;
      }
      setCheckoutMsg(
        `Enrolled. Payment mode: ${json.paymentMode}. Live payments: ${json.livePayments ? 'yes' : 'no'}.`,
      );
      // Surface on student dashboard via local enrolment pointer (server remains authoritative)
      const dash = JSON.parse(localStorage.getItem('success-os-marketplace-enrolments') || '[]');
      localStorage.setItem(
        'success-os-marketplace-enrolments',
        JSON.stringify([
          {
            courseId: course.id,
            title: course.title,
            enrolledAt: json.enrolment?.enrolled_at,
            purchaseId: json.purchase?.id,
          },
          ...dash,
        ]),
      );
    } catch (e) {
      setCheckoutMsg(e.message || 'Checkout failed');
    }
  }

  return (
    <main className="os-page-content" data-testid="student-recorded-lessons-marketplace">
      <header style={{ marginBottom: 16 }}>
        <small>STUDENT PORTAL · RECORDED LESSONS</small>
        <h1 style={{ margin: '6px 0' }}>Recorded Lessons Marketplace</h1>
        <p style={{ margin: 0, maxWidth: 640 }}>
          Browse S4S Intelligence and teacher-recorded courses. Filter, preview, purchase or enrol,
          then access from your dashboard.
        </p>
        <p style={{ marginTop: 10 }}>
          <a href="/recorded-class-request">Need a custom recorded-class request instead?</a>
          {' · '}
          <a href="/subject-catalog">Subject catalog</a>
          {' · '}
          <a href="/student-portal">Student dashboard</a>
        </p>
      </header>

      <RecordedLessonsFilters
        filters={filters}
        facets={catalog?.facets}
        total={catalog?.total || 0}
        onChange={setFilters}
        lessonSource={filters.lessonSource}
        onLessonSourceChange={(v) => setFilters((f) => ({ ...f, lessonSource: v }))}
      />

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {busy ? <p>Loading catalogue…</p> : null}
      {checkoutMsg ? <p data-testid="checkout-message">{checkoutMsg}</p> : null}

      <RecordedLessonsSubjectResults
        grouped={catalog?.grouped}
        onSelectLesson={(item) => setSelected(item)}
      />

      <section data-testid="marketplace-course-list">
        {(catalog?.items || []).length === 0 && !busy ? (
          <p data-testid="empty-catalogue">
            No published courses match these filters. The catalogue is loaded from Supabase when
            configured — placeholder marketplace records are not shown.
          </p>
        ) : (
          (catalog?.items || []).map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPreview={() => setSelected(course)}
              onEnrol={enrol}
            />
          ))
        )}
      </section>

      {selected ? (
        <aside
          data-testid="course-detail"
          style={{
            marginTop: 24,
            padding: 16,
            borderTop: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <h2>{selected.title}</h2>
          <p>{selected.description || 'Course detail'}</p>
          <button type="button" className="primary" onClick={() => enrol(selected)}>
            Continue to secure checkout
          </button>
        </aside>
      ) : null}
    </main>
  );
}

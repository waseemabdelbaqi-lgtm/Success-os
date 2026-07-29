'use client';

import { useCallback, useEffect, useState } from 'react';

const STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'PUBLISHED',
  'SUSPENDED',
];

/**
 * Extends the existing teacher portal with recorded-course CRUD + earnings.
 * Does not create a second teacher portal.
 */
export function TeacherRecordedCoursesPanel() {
  const [teacherId, setTeacherId] = useState('');
  const [courses, setCourses] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    curriculum: '',
    grade: '',
    language: 'ar',
    price: 50,
    currency: 'USD',
    copyrightDeclarationAccepted: false,
  });

  useEffect(() => {
    const id =
      localStorage.getItem('success-os-teacher-id') || `teacher-demo-${Date.now()}`;
    localStorage.setItem('success-os-teacher-id', id);
    setTeacherId(id);
  }, []);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setError('');
    try {
      const [cRes, eRes] = await Promise.all([
        fetch(`/api/marketplace/teacher/courses?teacherId=${encodeURIComponent(teacherId)}`, {
          cache: 'no-store',
        }),
        fetch(
          `/api/marketplace/teacher/courses?teacherId=${encodeURIComponent(teacherId)}&view=earnings`,
          { cache: 'no-store' },
        ),
      ]);
      const cJson = await cRes.json();
      const eJson = await eRes.json();
      setCourses(cJson.items || []);
      setEarnings(eJson);
    } catch (e) {
      setError(e.message || 'load failed');
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!teacherId || form.price === '' || form.price == null) {
      setPricingPreview(null);
      return;
    }
    fetch(
      `/api/marketplace/teacher/courses?teacherId=${encodeURIComponent(teacherId)}&view=pricing-preview&price=${encodeURIComponent(form.price)}&currency=${encodeURIComponent(form.currency || 'USD')}`,
      { cache: 'no-store' },
    )
      .then((r) => r.json())
      .then((j) => setPricingPreview(j.pricingPreview || null))
      .catch(() => setPricingPreview(null));
  }, [teacherId, form.price, form.currency]);

  async function createCourse() {
    setError('');
    const res = await fetch('/api/marketplace/teacher/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId, ...form }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'create failed');
      return;
    }
    setPricingPreview(json.pricingPreview || null);
    await load();
  }

  async function submitCourse(courseId) {
    const res = await fetch('/api/marketplace/teacher/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        teacherId,
        courseId,
        copyrightDeclarationAccepted: true,
        rightsPolicyFlags: {},
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'submit failed');
      return;
    }
    setPricingPreview(json.pricingPreview || null);
    await load();
  }

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, courses.filter((c) => c.publication_status === s)]),
  );

  return (
    <section
      id="my-recorded-courses"
      data-testid="teacher-recorded-courses"
      className="os-card"
      style={{ margin: '20px 0', padding: 16 }}
    >
      <header>
        <h2>My Recorded Courses</h2>
        <p style={{ margin: '4px 0 12px', fontSize: 13 }}>
          Create drafts, submit for review, track sales and payouts. Default platform commission is
          30% (read-only for teachers).
        </p>
      </header>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {earnings ? (
        <div
          data-testid="teacher-earnings"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, fontSize: 13 }}
        >
          <span>Sales: <b>{earnings.salesCount}</b></span>
          <span>Gross: <b>{earnings.grossRevenue}</b></span>
          <span>Platform Commission: <b>{earnings.platformCommission}</b></span>
          <span>Est. Net: <b>{earnings.estimatedNetEarnings}</b></span>
          <span>Pending: <b>{earnings.pendingBalance}</b></span>
          <span>Available: <b>{earnings.availableBalance}</b></span>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          Subject
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </label>
        <label>
          Curriculum
          <input
            value={form.curriculum}
            onChange={(e) => setForm({ ...form, curriculum: e.target.value })}
          />
        </label>
        <label>
          Grade
          <input
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
          />
        </label>
        <label>
          Language
          <input
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          />
        </label>
        <label>
          Public price
          <input
            type="number"
            data-testid="teacher-course-price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form.copyrightDeclarationAccepted}
            onChange={(e) =>
              setForm({ ...form, copyrightDeclarationAccepted: e.target.checked })
            }
          />
          I declare I hold the rights to this content (no unauthorised textbooks, exams, voice
          cloning, or likeness usage).
        </label>
        <button type="button" className="primary" data-testid="create-course" onClick={createCourse}>
          Create Course (Draft)
        </button>
      </div>

      {pricingPreview ? (
        <div data-testid="teacher-commission-preview" style={{ marginTop: 12, fontSize: 13 }}>
          <div>Course price: <b>{pricingPreview.coursePrice}</b> {pricingPreview.currency}</div>
          <div>
            Platform commission: <b>{pricingPreview.platformCommissionPercentage}%</b> (
            {pricingPreview.platformCommissionAmount})
          </div>
          <div>
            Teacher estimated gross share: <b>{pricingPreview.teacherEstimatedGrossShare}</b>
          </div>
          <div>Commission editable by teacher: <b>{String(pricingPreview.commissionEditableByTeacher)}</b></div>
        </div>
      ) : null}

      <div style={{ marginTop: 20 }}>
        {STATUSES.map((status) => (
          <div key={status} style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, margin: '0 0 6px' }}>
              {status.replace(/_/g, ' ')} ({byStatus[status].length})
            </h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {byStatus[status].map((c) => (
                <li key={c.id}>
                  {c.title} — {c.price} {c.currency}
                  {status === 'DRAFT' || status === 'CHANGES_REQUESTED' ? (
                    <button
                      type="button"
                      data-testid="submit-course"
                      style={{ marginLeft: 8 }}
                      onClick={() => submitCourse(c.id)}
                    >
                      Submit for review
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function QaDashboardPage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/qa-engine')
      .then((response) => response.json())
      .then(setStatus)
      .catch((reason) => setError(reason.message));
  }, []);

  async function bootstrapQa() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/qa-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bootstrap', sampleLimit: 0 }),
      });
      if (!response.ok) throw new Error(`QA_ENGINE_${response.status}`);
      setResult(await response.json());
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const dashboard = result?.dashboard;

  return (
    <main
      className="os-content phase11-engine"
      style={{ maxWidth: 1100, margin: '40px auto', padding: 24 }}
    >
      <p className="os-kicker">PHASE 7 — QUALITY ASSURANCE ENGINE</p>
      <h1>لوحة ضمان الجودة العالمية</h1>
      <p>
        يراجع محرك الجودة كل كتاب قبل النشر. لا يُنشر أي كتاب قبل اجتياز جميع
        مراحل التحقق. لا يتم الكتابة فوق إصدارات المراجعات السابقة.
      </p>
      <p>
        <a href="/digital-book-factory">← مصنع الكتب (المرحلة 6)</a>
        {' · '}
        <a href="/global-quality">محرك الجودة الحالي ←</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>المرحلة: {status.phase}</li>
            <li>إصدار المحرك: {status.qaEngineVersion}</li>
            <li>
              النشر:{' '}
              {status.publicationAllowed ? 'مسموح' : 'موقوف حتى اجتياز التحقق'}
            </li>
            <li>مراحل التحقق: {(status.pipelineStages || []).length}</li>
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={bootstrapQa}
      >
        {busy ? 'جارٍ تجهيز محرك الجودة…' : 'التحقق من محرك الجودة + اللوحة'}
      </button>

      {result ? (
        <>
          <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
            <h2>تقرير جاهزية المحرك</h2>
            <ul>
              <li>
                جاهز للإنتاج:{' '}
                {result.validation?.productionReady ? 'نعم' : 'لا'}
              </li>
              <li>الدرجة: {result.validation?.scorePercent}%</li>
              <li>{result.validation?.summary}</li>
            </ul>
            <small>{result.validationPath}</small>
          </section>

          {dashboard ? (
            <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
              <h2>Global QA Dashboard</h2>
              <ul>
                <li>Books Reviewed: {dashboard.booksReviewed}</li>
                <li>Books Approved: {dashboard.booksApproved}</li>
                <li>Books Rejected: {dashboard.booksRejected}</li>
                <li>Average Quality Score: {dashboard.averageQualityScore}</li>
                <li>
                  Estimated Review Progress:{' '}
                  {dashboard.estimatedReviewProgressPercent}%
                </li>
                <li>
                  Final Versions Published: {dashboard.finalVersionsPublished}
                </li>
              </ul>
              <h3>Common Issues</h3>
              <ul>
                {(dashboard.commonIssues || []).slice(0, 8).map((item) => (
                  <li key={item.issue}>
                    {item.issue} ({item.count})
                  </li>
                ))}
              </ul>
              <small>{result.dashboardPath}</small>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

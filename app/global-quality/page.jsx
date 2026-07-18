'use client';

import { useEffect, useState } from 'react';

export default function GlobalQualityPage() {
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadStatus() {
    const response = await fetch('/api/global-quality');
    if (!response.ok) throw new Error(`QUALITY_STATUS_${response.status}`);
    setStatus(await response.json());
  }

  useEffect(() => {
    loadStatus().catch((reason) => setError(reason.message));
  }, []);

  async function runQuality() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/global-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error(`QUALITY_RUN_${response.status}`);
      setReport(await response.json());
      await loadStatus();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="os-content phase11-engine"
      style={{ maxWidth: 1080, margin: '40px auto', padding: 24 }}
    >
      <p className="os-kicker">GLOBAL QUALITY ENGINE</p>
      <h1>محرك جودة الكتب العالمي</h1>
      <p>
        لا يعتبر الكتاب مكتملًا بمجرد بناء هيكله. يفحص المحرك كل درس والتغطية
        والترتيب والتعريفات والمصطلحات والمراجع والتكرار، ولا يمنح حالة COMPLETE
        قبل تحقق جميع بوابات الجودة، بما فيها دليل دقة علمية لا يقل عن 99%.
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة الحالية</h2>
          <ul>
            <li>الكتب: {status.books}</li>
            <li>المراجعات: {status.reviews}</li>
            <li>المكتملة: {status.completed}</li>
            <li>قيد المراجعة: {status.underReview}</li>
            <li>الإصدارات النهائية: {status.finalVersions}</li>
            <li>متوسط الجودة: {status.averageQualityScore}</li>
          </ul>
        </section>
      ) : (
        <p>جارٍ تحميل حالة الجودة…</p>
      )}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={runQuality}
      >
        {busy ? 'جارٍ فحص كل الكتب…' : 'تشغيل فحص الجودة الكامل'}
      </button>

      {report ? (
        <>
          <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
            <h2>FINAL QUALITY REPORT</h2>
            <ul>
              <li>الكتب المفحوصة: {report.totals?.booksProcessed}</li>
              <li>الكتب المكتملة: {report.totals?.booksCompleted}</li>
              <li>قيد المراجعة: {report.totals?.booksUnderReview}</li>
              <li>متوسط الجودة: {report.totals?.averageQualityScore}</li>
              <li>الدول المكتملة: {report.totals?.countriesCompleted}</li>
              <li>المناهج المكتملة: {report.totals?.curriculaCompleted}</li>
              <li>تحتاج مراجعة بشرية: {report.totals?.manualReviewRequired}</li>
              <li>زمن المعالجة: {report.processingTimeMs}ms</li>
            </ul>
            <small>التقرير: {report.reportPath}</small>
          </section>

          <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
            <h2>المواد التي لا تزال تحتاج مراجعة</h2>
            <div style={{ maxHeight: 600, overflow: 'auto' }}>
              {(report.manualReviewSubjects || []).map((item) => (
                <article
                  key={item.bookId}
                  style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}
                >
                  <strong>
                    {item.country} → {item.grade} → {item.subject}
                  </strong>
                  <div>
                    Quality {item.qualityScore} · Coverage{' '}
                    {item.coveragePercentage}% · Scientific{' '}
                    {item.scientificAccuracyPercentage}%
                  </div>
                  <small>{item.reasons.join(' ')}</small>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

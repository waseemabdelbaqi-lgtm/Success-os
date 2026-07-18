'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastResearchPage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/middle-east-research')
      .then((response) => response.json())
      .then(setStatus)
      .catch((reason) => setError(reason.message));
  }, []);

  async function runResearch() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error(`ME_RESEARCH_${response.status}`);
      setResult(await response.json());
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
      <p className="os-kicker">PHASE 1 — MIDDLE EAST EDUCATION RESEARCH</p>
      <h1>بحث التعليم في الشرق الأوسط</h1>
      <p>
        هذه المرحلة للبحث والتحقق فقط. لا يتم توليد كتب Success OS هنا. المصادر
        مقتصرة على الوزارات والجهات الرسمية وUNESCO/UNESCO-IBE وOER والمنظمات
        الدولية الرسمية للمناهج.
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      <p>
        <a href="/middle-east-mapping">فتح خرائط التعليم (المرحلة 2) ←</a>
      </p>

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>المرحلة: {status.phase}</li>
            <li>
              توليد الكتب مسموح؟ {status.bookGenerationAllowed ? 'نعم' : 'لا'}
            </li>
            <li>عتبة الجاهزية للمرحلة 2: {status.bookGenerationThreshold}%</li>
            <li>الدول: {(status.countries || []).join(', ')}</li>
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={runResearch}
      >
        {busy ? 'جارٍ حفظ قاعدة المعرفة والتقارير…' : 'تشغيل بحث المرحلة 1'}
      </button>

      {result ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>MASTER REPORT — الشرق الأوسط</h2>
          <ul>
            <li>
              متوسط الجاهزية:{' '}
              {
                result.master?.readinessForDigitalBookGeneration
                  ?.averageReadinessScore
              }
              %
            </li>
            <li>
              دول ≥95%:{' '}
              {
                result.master?.readinessForDigitalBookGeneration
                  ?.countriesAtOrAbove95
              }
            </li>
            <li>
              السماح بالمرحلة 2:{' '}
              {result.master?.readinessForDigitalBookGeneration?.phase2Allowed
                ? 'نعم'
                : 'لا'}
            </li>
            <li>
              السبب:{' '}
              {result.master?.readinessForDigitalBookGeneration?.reason}
            </li>
          </ul>
          <h3>جاهزية الدول</h3>
          <ul>
            {(result.countryReports || []).map((report) => (
              <li key={report.code}>
                {report.country}: {report.readinessScoreForBookGeneration}% —{' '}
                {(report.missingInformation || []).length} فجوات
              </li>
            ))}
          </ul>
          <small>Master: {result.masterPath}</small>
        </section>
      ) : null}
    </main>
  );
}

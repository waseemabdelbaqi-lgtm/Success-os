'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastMappingPage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/middle-east-mapping')
      .then((response) => response.json())
      .then(setStatus)
      .catch((reason) => setError(reason.message));
  }, []);

  async function runMapping() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) throw new Error(`ME_MAPPING_${response.status}`);
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
      style={{ maxWidth: 1100, margin: '40px auto', padding: 24 }}
    >
      <p className="os-kicker">PHASE 2 — MIDDLE EAST EDUCATION MAPPING</p>
      <h1>خرائط التعليم في الشرق الأوسط</h1>
      <p>
        هذه المرحلة تبني خريطة تعليمية كاملة لكل دولة (حكومة، مدارس، دولي، عالي،
        مهني). لا يتم توليد كتب رقمية هنا. التوليد يبدأ فقط بعد اكتمال الخريطة
        بنسبة ≥95% وموافقتك.
      </p>
      <p>
        <a href="/middle-east-research">← العودة إلى بحث المرحلة 1</a>
        {' · '}
        <a href="/digital-book-factory">مصنع الكتب (المرحلة 6) ←</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>المرحلة: {status.phase}</li>
            <li>
              توليد الكتب:{' '}
              {status.bookGenerationAllowed ? 'مسموح' : 'موقوف'}
            </li>
            <li>عتبة اكتمال الخريطة: {status.mapCompletenessThreshold}%</li>
            <li>الدول: {(status.countries || []).join(', ')}</li>
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={runMapping}
      >
        {busy ? 'جارٍ بناء الخرائط…' : 'تشغيل خرائط المرحلة 2'}
      </button>

      {result ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>Middle East Master Index</h2>
          <ul>
            <li>
              متوسط اكتمال الخريطة:{' '}
              {result.master?.readiness?.averageMapCompletenessPercent}%
            </li>
            <li>
              دول ≥95%: {result.master?.readiness?.countriesAtOrAbove95}
            </li>
            <li>
              الكتب الرقمية:{' '}
              {result.master?.readiness?.digitalBooksAllowed
                ? 'مسموحة'
                : 'موقوفة'}
            </li>
            <li>{result.master?.readiness?.reason}</li>
          </ul>
          <h3>ملفات الدول</h3>
          <ul>
            {(result.profiles || []).map((profile) => (
              <li key={profile.code}>
                {profile.country}: {profile.readinessScorePercent}% · جامعات{' '}
                {profile.universities} · كليات {profile.colleges} · مواد{' '}
                {profile.schoolSubjects} · فجوات {profile.missingInformation}
              </li>
            ))}
          </ul>
          <small>{result.masterPath}</small>
        </section>
      ) : null}
    </main>
  );
}

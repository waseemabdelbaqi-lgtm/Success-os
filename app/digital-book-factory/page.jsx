'use client';

import { useEffect, useState } from 'react';

export default function DigitalBookFactoryPage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/digital-book-factory')
      .then((response) => response.json())
      .then(setStatus)
      .catch((reason) => setError(reason.message));
  }, []);

  async function validateTemplate() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/digital-book-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-template' }),
      });
      if (!response.ok) throw new Error(`BOOK_FACTORY_${response.status}`);
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
      <p className="os-kicker">PHASE 6 — DIGITAL BOOK FACTORY</p>
      <h1>مصنع الكتب الرقمية — Success OS</h1>
      <p>
        هذه المرحلة تبني محرك التوليد العام وقالب الكتاب الموحد وتتحقق منهما.
        لا يتم توليد المكتبة الكاملة هنا. التوليد الجماعي يحتاج موافقة صريحة.
      </p>
      <p>
        <a href="/middle-east-mapping">← خرائط التعليم (المرحلة 2)</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>المرحلة: {status.phase}</li>
            <li>إصدار القالب: {status.templateVersion}</li>
            <li>
              التوليد الجماعي:{' '}
              {status.massGenerationAllowed ? 'مسموح' : 'موقوف'}
            </li>
            <li>أقسام الكتاب المطلوبة: {status.requiredBookSections}</li>
            <li>حقول الدرس المطلوبة: {status.requiredLessonFields}</li>
          </ul>
          {status.prerequisites ? (
            <>
              <h3>المتطلبات السابقة</h3>
              <ul>
                {Object.entries(status.prerequisites.checks || {}).map(
                  ([name, ok]) => (
                    <li key={name}>
                      {ok ? '✓' : '✗'} {name}
                    </li>
                  ),
                )}
              </ul>
              <p>
                <small>{status.prerequisites.note}</small>
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={validateTemplate}
      >
        {busy ? 'جارٍ التحقق من القالب…' : 'التحقق من القالب الموحد'}
      </button>

      {result ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>تقرير التحقق</h2>
          <ul>
            <li>
              جاهز للإنتاج:{' '}
              {result.validation?.productionReady ? 'نعم' : 'لا'}
            </li>
            <li>الدرجة: {result.validation?.scorePercent}%</li>
            <li>
              التوليد الجماعي:{' '}
              {result.report?.massGenerationAllowed ? 'مسموح' : 'موقوف'}
            </li>
            <li>{result.validation?.summary}</li>
          </ul>
          <small>{result.reportPath}</small>
        </section>
      ) : null}
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function ContentEnginePage() {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [sample, setSample] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/content-engine')
      .then((response) => response.json())
      .then(setStatus)
      .catch((reason) => setError(reason.message));
  }, []);

  async function validateEngine() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/content-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });
      if (!response.ok) throw new Error(`CONTENT_ENGINE_${response.status}`);
      setResult(await response.json());
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateSample() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/content-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-sample-subject', persist: true }),
      });
      if (!response.ok) throw new Error(`CONTENT_SAMPLE_${response.status}`);
      setSample(await response.json());
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
      <p className="os-kicker">PHASE 8 — EDUCATIONAL CONTENT GENERATION</p>
      <h1>محرك توليد المحتوى التعليمي</h1>
      <p>
        يولد المحرك محتوى تعليميًا أصليًا كمسودة من أهداف المناهج الرسمية
        والمصادر المفتوحة. لا ينسخ الكتب المحمية، ولا ينشر تلقائيًا، ولا يبني
        المكتبة الكاملة دون موافقة لاحقة.
      </p>
      <p>
        <a href="/qa-dashboard">← ضمان الجودة (المرحلة 7)</a>
        {' · '}
        <a href="/digital-book-factory">مصنع الكتب ←</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>المرحلة: {status.phase}</li>
            <li>الإصدار: {status.engineVersion}</li>
            <li>حالة المحتوى: {status.draftStatus}</li>
            <li>
              توليد المكتبة الكاملة:{' '}
              {status.massLibraryGenerationAllowed ? 'مسموح' : 'موقوف'}
            </li>
            <li>
              النشر التلقائي: {status.autoPublishAllowed ? 'نعم' : 'لا'}
            </li>
            <li>
              حقول الدرس المطلوبة: {(status.requiredLessonFields || []).length}
            </li>
          </ul>
        </section>
      ) : null}

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="os-primary"
          disabled={busy}
          onClick={validateEngine}
        >
          {busy ? 'جارٍ العمل…' : 'التحقق من جاهزية المحرك'}
        </button>
        <button
          type="button"
          className="os-primary"
          disabled={busy}
          onClick={generateSample}
        >
          توليد مسودة مادة تجريبية (Jordan Math G5)
        </button>
      </div>

      {result ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>تقرير التحقق</h2>
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
      ) : null}

      {sample ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>مسودة المادة التجريبية</h2>
          <ul>
            <li>المادة: {sample.subjectDraft?.identity?.subject}</li>
            <li>الوحدات: {sample.subjectDraft?.units?.length}</li>
            <li>
              الدروس:{' '}
              {sample.subjectDraft?.subjectCompletionReport?.lessonsCompleted}
            </li>
            <li>كتل المحتوى: {sample.contentBlocks?.length}</li>
            <li>الحالة: {sample.subjectDraft?.status}</li>
            <li>
              النشر:{' '}
              {sample.subjectDraft?.publicationAllowed ? 'مسموح' : 'موقوف'}
            </li>
          </ul>
          <small>{sample.paths?.draftPath}</small>
        </section>
      ) : null}
    </main>
  );
}

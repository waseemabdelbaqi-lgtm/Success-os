'use client';

import { useEffect, useState } from 'react';

export default function GlobalKnowledgePage() {
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadStatus() {
    const response = await fetch('/api/global-knowledge');
    setStatus(await response.json());
  }

  useEffect(() => {
    loadStatus().catch((err) => setError(err.message));
  }, []);

  async function runEngine() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/global-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json();
      setReport(payload);
      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 960, margin: '40px auto', padding: 24 }}>
      <p className="os-kicker">GLOBAL KNOWLEDGE ENGINE</p>
      <h1>المكتبة التعليمية العالمية</h1>
      <p>
        يجمع SUCCESS OS المناهج من مصادر رسمية أو مفتوحة الترخيص فقط، يتحقق منها،
        ينظمها حسب التسلسل الهرمي، وينشئ كتابًا رقميًا واحدًا لكل مادة موثّقة —
        دون اختلاق وحدات أو دروس.
      </p>
      <p>
        <a href="/global-quality">فتح محرك جودة الكتب ←</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {status ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>الحالة</h2>
          <ul>
            <li>الدول في السجل: {status.inventory?.countries}</li>
            <li>مواد قابلة للمعالجة: {status.inventory?.processableSubjects}</li>
            <li>صفوف بانتظار توثيق القائمة: {status.inventory?.skippedGrades}</li>
            <li>
              خطوط الأساس الموثّقة: {status.baselines?.verified}/
              {status.baselines?.total}
            </li>
            <li>كتب المكتبة الدائمة: {status.libraryBooks}</li>
          </ul>
          <ol>
            {(status.hierarchy || []).map((level) => (
              <li key={level}>{level}</li>
            ))}
          </ol>
        </section>
      ) : (
        <p>جارٍ تحميل الحالة…</p>
      )}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={runEngine}
      >
        {busy ? 'يعمل على كل المناهج…' : 'تشغيل المحرك حتى اكتمال كل المناهج'}
      </button>

      {report ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>التقرير النهائي</h2>
          <ul>
            <li>المناهج المعالجة: {report.totals?.curriculaProcessed}</li>
            <li>المواد المكتملة: {report.totals?.subjectsCompleted}</li>
            <li>الكتب المنشأة في هذه الجولة: {report.totals?.booksCreated}</li>
            <li>المواد المتخطاة: {report.totals?.subjectsSkipped}</li>
            <li>زمن المعالجة: {report.processingTimeMs}ms</li>
          </ul>
          <h3>الخطوات البشرية التالية</h3>
          <ul>
            {(report.nextRequiredHumanActions || []).map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p>
            <small>التقرير محفوظ في: {report.reportPath}</small>
          </p>
        </section>
      ) : null}
    </main>
  );
}

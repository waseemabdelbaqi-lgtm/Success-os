'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastCompletionDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadDashboard() {
    const response = await fetch('/api/middle-east-expansion?view=dashboard', {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`DASHBOARD_${response.status}`);
    setDashboard(await response.json());
  }

  useEffect(() => {
    loadDashboard().catch((reason) => setError(reason.message));
  }, []);

  async function expandBatch() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-expansion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expand', limit: 25 }),
      });
      if (!response.ok) throw new Error(`EXPAND_${response.status}`);
      setResult(await response.json());
      await loadDashboard();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const totals = dashboard?.totals;

  return (
    <main
      className="os-content phase11-engine"
      style={{ maxWidth: 1200, margin: '40px auto', padding: 24 }}
    >
      <p className="os-kicker">PHASE 10 — MIDDLE EAST DIGITAL LIBRARY</p>
      <h1>لوحة اكتمال مكتبة الشرق الأوسط</h1>
      <p>
        توليد وربط كتب Success OS الرقمية لأنظمة التعليم في الشرق الأوسط فقط.
        زر 📖 Book يتفعل فور توفر الكتاب، وأحدث إصدار يظهر فورًا في وضع المعاينة
        الإدارية.
      </p>
      <p>
        <a href="/student/books">← مكتبة الطالب الحية</a>
        {' · '}
        <a href="/content-engine">محرك المحتوى ←</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      {totals ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>Regional Dashboard</h2>
          <ul>
            <li>Countries Completed: {totals.totalCountriesCompleted}</li>
            <li>Educational Systems: {totals.totalEducationalSystems}</li>
            <li>Curricula: {totals.totalCurricula}</li>
            <li>Universities: {totals.totalUniversities}</li>
            <li>Colleges: {totals.totalColleges}</li>
            <li>Professional Programs: {totals.totalProfessionalPrograms}</li>
            <li>Subjects: {totals.totalSubjects}</li>
            <li>Books: {totals.totalBooks}</li>
            <li>Units: {totals.totalUnits}</li>
            <li>Lessons: {totals.totalLessons}</li>
            <li>Live Indexed: {totals.liveBooksIndexed ?? '—'}</li>
            <li>Remaining Missing: {totals.remainingMissing ?? '—'}</li>
            <li>
              Overall Middle East Completion:{' '}
              {totals.overallMiddleEastCompletionPercentage}%
            </li>
          </ul>
        </section>
      ) : (
        <p>Loading dashboard…</p>
      )}

      <button
        type="button"
        className="os-primary"
        style={{ marginTop: 20 }}
        disabled={busy}
        onClick={expandBatch}
      >
        {busy ? 'Expanding Middle East batch…' : 'Expand next 25 missing books'}
      </button>

      {result ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>Last Expansion Batch</h2>
          <ul>
            <li>Processed: {result.report?.processed}</li>
            <li>Created: {result.report?.created}</li>
            <li>Updated: {result.report?.updated}</li>
            <li>Remaining missing: {result.report?.remainingMissing}</li>
            <li>Live indexed: {result.report?.liveBooksIndexed}</li>
          </ul>
          <small>{result.reportPath}</small>
        </section>
      ) : null}

      {dashboard?.rows ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>Subject Completion Table</h2>
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {[
                    'Country',
                    'System',
                    'Curriculum',
                    'Level',
                    'Subject',
                    'Status',
                    'Version',
                    'Units',
                    'Lessons',
                    'Completion %',
                    'Quality',
                    'Updated',
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: 'left',
                        borderBottom: '1px solid #ddd',
                        padding: '6px 4px',
                        position: 'sticky',
                        top: 0,
                        background: '#fffaf0',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.slice(0, 300).map((row) => (
                  <tr key={`${row.countryCode}-${row.subject}-${row.academicLevel}-${row.curriculum}`}>
                    <td style={{ padding: '6px 4px' }}>{row.country}</td>
                    <td style={{ padding: '6px 4px' }}>{row.educationalSystem}</td>
                    <td style={{ padding: '6px 4px' }}>{row.curriculum}</td>
                    <td style={{ padding: '6px 4px' }}>{row.academicLevel}</td>
                    <td style={{ padding: '6px 4px' }}>{row.subject}</td>
                    <td style={{ padding: '6px 4px' }}>{row.bookStatus}</td>
                    <td style={{ padding: '6px 4px' }}>{row.bookVersion || '—'}</td>
                    <td style={{ padding: '6px 4px' }}>{row.units}</td>
                    <td style={{ padding: '6px 4px' }}>{row.lessons}</td>
                    <td style={{ padding: '6px 4px' }}>{row.completionPercent}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {row.qualityScore ?? '—'}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {row.lastUpdated
                        ? new Date(row.lastUpdated).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

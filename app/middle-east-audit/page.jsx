'use client';

import { useEffect, useState } from 'react';

export default function MiddleEastMasterAuditPage() {
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function loadReport() {
    const response = await fetch('/api/middle-east-audit', { cache: 'no-store' });
    if (!response.ok) throw new Error(`AUDIT_${response.status}`);
    setReport(await response.json());
  }

  useEffect(() => {
    loadReport().catch((reason) => setError(reason.message));
  }, []);

  async function runAudit() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/middle-east-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairConnections: true }),
      });
      if (!response.ok) throw new Error(`RUN_${response.status}`);
      const payload = await response.json();
      setReport(payload.master);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  }

  const summary = report?.globalSummary;
  const certification = report?.certification;

  return (
    <main className="os-content phase11-engine" style={{ maxWidth: 1200 }}>
      <p className="os-kicker">PHASE 13 — MIDDLE EAST VERIFICATION & AUDIT</p>
      <h1>تقرير تدقيق مكتبة الشرق الأوسط</h1>
      <p>
        تدقيق فقط: لا توليد كتب جديدة، ولا تعديل تصميم المنصة. يتم إصلاح روابط
        الموضوع→الكتاب المكسورة فقط.
      </p>
      <p>
        <a href="/middle-east-completion">← Completion Dashboard</a>
        {' · '}
        <a href="/student/books">Live Library</a>
      </p>

      {error ? <p style={{ color: '#9e1722' }}>{error}</p> : null}

      <button
        type="button"
        className="os-primary"
        disabled={busy}
        onClick={runAudit}
        style={{ marginTop: 16 }}
      >
        {busy ? 'Running audit…' : 'Run Middle East Audit'}
      </button>

      {summary ? (
        <section className="os-card" style={{ padding: 20, marginTop: 20 }}>
          <h2>Global Summary</h2>
          <ul>
            <li>Countries Audited: {summary.countriesAudited}</li>
            <li>Countries Certified: {summary.countriesCertified}</li>
            <li>Educational Systems: {summary.educationalSystems}</li>
            <li>Curricula: {summary.curricula}</li>
            <li>Universities: {summary.universities}</li>
            <li>Colleges: {summary.colleges}</li>
            <li>Professional Programs: {summary.professionalPrograms}</li>
            <li>Subjects: {summary.subjects}</li>
            <li>Books: {summary.books}</li>
            <li>Units: {summary.units}</li>
            <li>Lessons: {summary.lessons}</li>
            <li>Reading Ready Books: {summary.readingReadyBooks}</li>
            <li>Broken Links Fixed: {summary.brokenLinksFixed}</li>
            <li>Missing Books: {summary.missingBooks}</li>
            <li>Missing Subjects: {summary.missingSubjects}</li>
            <li>
              Overall Middle East Completion:{' '}
              {summary.overallMiddleEastCompletionPercentage}%
            </li>
          </ul>
          <p>
            <strong>Certification:</strong> {certification?.status}
          </p>
          <p>
            <strong>Blocked Countries:</strong>{' '}
            {(certification?.blockedCountries || []).join(', ') || 'none'}
          </p>
        </section>
      ) : (
        <p style={{ marginTop: 20 }}>No audit report yet. Run the audit.</p>
      )}

      {report?.countries ? (
        <section className="os-card" style={{ padding: 20, marginTop: 24 }}>
          <h2>Country Certification Table</h2>
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
            >
              <thead>
                <tr>
                  {[
                    'Country',
                    'Systems',
                    'Subjects',
                    'Books',
                    'Units',
                    'Lessons',
                    'Completion %',
                    'Quality %',
                    'Broken Fixed',
                    'Missing Books',
                    'Status',
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
                {report.countries.map((country) => (
                  <tr key={country.countryCode}>
                    <td style={{ padding: '6px 4px' }}>{country.country}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.educationalSystems}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{country.subjects}</td>
                    <td style={{ padding: '6px 4px' }}>{country.books}</td>
                    <td style={{ padding: '6px 4px' }}>{country.units}</td>
                    <td style={{ padding: '6px 4px' }}>{country.lessons}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.completionPercentage}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.qualityPercentage}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.brokenLinksFixed}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.missingBooks}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {country.certification?.status}
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

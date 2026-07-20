'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'SOC Overview', labelAr: 'مركز الأمن' },
  { id: 'audit', label: 'Security Audit', labelAr: 'تدقيق أمني' },
  { id: 'tests', label: 'Security Tests', labelAr: 'اختبارات أمنية' },
  { id: 'mfa', label: 'MFA & Sessions', labelAr: 'MFA والجلسات' },
  { id: 'pam', label: 'PAM / Impersonation', labelAr: 'صلاحيات مرتفعة' },
  { id: 'tenant', label: 'Tenant Isolation', labelAr: 'عزل المستأجرين' },
  { id: 'privacy', label: 'Privacy & Consent', labelAr: 'الخصوصية والموافقة' },
  { id: 'ai', label: 'AI Governance', labelAr: 'حوكمة الذكاء' },
  { id: 'finance', label: 'Financial Controls', labelAr: 'ضوابط مالية' },
  { id: 'files', label: 'File Security', labelAr: 'أمن الملفات' },
  { id: 'fraud', label: 'Fraud & DLP', labelAr: 'الاحتيال وDLP' },
  { id: 'incidents', label: 'Incidents', labelAr: 'الحوادث' },
  { id: 'compliance', label: 'Compliance & Policies', labelAr: 'الامتثال والسياسات' },
  { id: 'vendors', label: 'Vendors & Evidence', labelAr: 'الموردون والأدلة' },
  { id: 'flags', label: 'Emergency Flags', labelAr: 'أعلام الطوارئ' },
  { id: 'gates', label: 'Release Gates', labelAr: 'بوابات الإطلاق' },
];

function Stat({ label, value, warn }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '0.85rem',
        background: warn ? '#fff7ed' : 'var(--ea-card, #fff)',
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: warn ? '#c2410c' : undefined }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <section
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        background: 'var(--ea-card, #fff)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
      </div>
      {children}
    </section>
  );
}

function Table({ columns, rows, empty = 'No rows' }) {
  if (!rows?.length) return <p style={{ color: '#6b7280', margin: 0 }}>{empty}</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: 'start', borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.code || row.key || idx}>
              {columns.map((c) => (
                <td key={c.key} style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 6px', verticalAlign: 'top' }}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function severityColor(sev) {
  if (sev === 'critical') return '#991b1b';
  if (sev === 'high') return '#c2410c';
  if (sev === 'medium') return '#a16207';
  return '#374151';
}

export function EnterpriseSecurityCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [filters, setFilters] = useState({ severity: '', country: '', tenant: '', module: '' });
  const [flagForm, setFlagForm] = useState({ key: 'mandatory_mfa', enabled: true, reason: '', expiresAt: '' });
  const [privacyType, setPrivacyType] = useState('access');
  const [consentType, setConsentType] = useState('marketing');

  const isAr = lang === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ view: 'dashboard' });
    if (filters.severity) params.set('severity', filters.severity);
    if (filters.country) params.set('country', filters.country);
    if (filters.tenant) params.set('tenant', filters.tenant);
    if (filters.module) params.set('module', filters.module);
    const res = await fetch(`/api/security?${params}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Security Trust Engine');
    setData(await res.json());
  }, [filters]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/security?view=stream');
      es.onmessage = () => {
        setLive(true);
        load().catch(() => {});
      };
      es.onerror = () => {
        setLive(false);
        es.close();
      };
    } catch {
      /* ignore */
    }
    return () => es?.close();
  }, [load]);

  async function runAction(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const stats = data?.stats || {};
  const disclaimer = data?.config?.disclaimer || data?.stats?.disclaimer;

  const openFindings = useMemo(
    () => (data?.findings || []).filter((f) => !['verified', 'accepted'].includes(f.status)),
    [data],
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            {t('Security, Privacy & Trust Engine', 'محرك الأمن والخصوصية والثقة')}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'Zero-trust · tenant-aware · policy-driven · Owner SOC',
              'ثقة صفرية · واعٍ بالمستأجر · قائم على السياسات · مركز عمليات المالك',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>
            {isAr ? 'EN' : 'ع'}
          </button>
          <button type="button" disabled={busy} onClick={() => load()}>
            {t('Refresh', 'تحديث')}
          </button>
          <button type="button" disabled={busy} onClick={() => runAction('runSecurityTests')}>
            {t('Run security tests', 'تشغيل الاختبارات الأمنية')}
          </button>
          <button type="button" disabled={busy} onClick={() => runAction('evaluateReleaseGates')}>
            {t('Evaluate release gates', 'تقييم بوابات الإطلاق')}
          </button>
        </div>
      </div>

      {disclaimer ? (
        <p
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 13,
            color: '#92400e',
          }}
        >
          {disclaimer}
        </p>
      ) : null}

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          placeholder={t('Severity', 'الخطورة')}
          value={filters.severity}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <input
          placeholder={t('Country', 'الدولة')}
          value={filters.country}
          onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <input
          placeholder={t('Tenant', 'المستأجر')}
          value={filters.tenant}
          onChange={(e) => setFilters((f) => ({ ...f, tenant: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <input
          placeholder={t('Module', 'الوحدة')}
          value={filters.module}
          onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: tab === tabItem.id ? '1px solid #0f766e' : '1px solid #e5e7eb',
              background: tab === tabItem.id ? '#0f766e' : '#fff',
              color: tab === tabItem.id ? '#fff' : '#111',
              fontWeight: 600,
            }}
          >
            {isAr ? tabItem.labelAr : tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', marginBottom: 14 }}>
            <Stat label={t('Security score', 'درجة الأمن')} value={stats.securityScore} warn={stats.securityScore < 70} />
            <Stat label={t('Privacy score', 'درجة الخصوصية')} value={stats.privacyScore} />
            <Stat label={t('Readiness', 'الجاهزية')} value={stats.productionSecurityReadinessScore} warn={stats.productionSecurityReadinessScore < 70} />
            <Stat label={t('Open critical', 'حرج مفتوح')} value={stats.openCritical} warn={stats.openCritical > 0} />
            <Stat label={t('Open high', 'عالي مفتوح')} value={stats.openHigh} warn={stats.openHigh > 0} />
            <Stat label={t('MFA adoption %', 'اعتماد MFA %')} value={stats.mfaAdoptionPct} />
            <Stat label={t('Fraud alerts', 'تنبيهات احتيال')} value={stats.fraudAlerts} />
            <Stat label={t('Active incidents', 'حوادث نشطة')} value={stats.activeIncidents} warn={stats.activeIncidents > 0} />
            <Stat label={t('Isolation tests', 'اختبارات العزل')} value={stats.isolationPassed == null ? '—' : stats.isolationPassed ? 'PASS' : 'FAIL'} warn={stats.isolationPassed === false} />
            <Stat label={t('Release gate', 'بوابة الإطلاق')} value={stats.releaseBlocked == null ? '—' : stats.releaseBlocked ? 'BLOCKED' : 'CLEAR'} warn={stats.releaseBlocked === true} />
            <Stat label={t('Compliance', 'الامتثال')} value={stats.complianceStatus} />
            <Stat label={t('Missing secrets', 'أسرار ناقصة')} value={stats.secretsMissing} />
          </div>

          <Panel title={t('Live SOC events', 'أحداث مركز العمليات')}>
            <Table
              columns={[
                { key: 'at', label: t('Time', 'الوقت') },
                { key: 'type', label: t('Type', 'النوع') },
                {
                  key: 'severity',
                  label: t('Severity', 'الخطورة'),
                  render: (r) => <span style={{ color: severityColor(r.severity), fontWeight: 700 }}>{r.severity}</span>,
                },
                {
                  key: 'detail',
                  label: t('Detail', 'التفصيل'),
                  render: (r) => r.title || r.key || r.tool || r.sessionId || r.incidentId || '—',
                },
              ]}
              rows={data?.socEvents || []}
            />
          </Panel>

          <Panel title={t('Infrastructure residency', 'إقامة البنية')}>
            <p style={{ margin: 0, fontSize: 13 }}>{data?.config?.residency?.claim}</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b7280' }}>
              Primary: {data?.config?.residency?.primaryRegion} · Backup:{' '}
              {(data?.config?.residency?.backupRegions || []).join(', ')} · Verified:{' '}
              {String(data?.config?.residency?.infrastructureVerified)}
            </p>
          </Panel>
        </>
      ) : null}

      {tab === 'audit' ? (
        <Panel
          title={t('Remediation register', 'سجل المعالجة')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('runSecurityAudit')}>
              {t('Refresh audit catalog', 'تحديث كتالوج التدقيق')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'code', label: 'Code' },
              {
                key: 'severity',
                label: t('Severity', 'الخطورة'),
                render: (r) => <span style={{ color: severityColor(r.severity), fontWeight: 700 }}>{r.severity}</span>,
              },
              { key: 'title', label: t('Issue', 'المشكلة') },
              { key: 'module', label: t('Module', 'الوحدة') },
              { key: 'status', label: t('Status', 'الحالة') },
              { key: 'responsibleTeam', label: t('Team', 'الفريق') },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  openFindings.some((f) => f.id === r.id) ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        runAction('updateFinding', {
                          id: r.id,
                          patch: { status: 'in_progress' },
                        })
                      }
                    >
                      {t('Start', 'بدء')}
                    </button>
                  ) : null,
              },
            ]}
            rows={data?.findings || []}
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>
            {t(
              'Findings are never marked fixed without automated verification.',
              'لا تُعلَّم النتائج كمُصلحة دون تحقق آلي.',
            )}
          </p>
        </Panel>
      ) : null}

      {tab === 'tests' ? (
        <Panel
          title={t('Automated security tests', 'اختبارات أمنية آلية')}
          actions={
            <>
              <button type="button" disabled={busy} onClick={() => runAction('runSecurityTests')}>
                {t('Run all', 'تشغيل الكل')}
              </button>
              <button type="button" disabled={busy} onClick={() => runAction('runTenantIsolationTests')}>
                {t('Tenant isolation', 'عزل المستأجرين')}
              </button>
            </>
          }
        >
          {data?.lastTestRun ? (
            <>
              <p style={{ fontSize: 13 }}>
                {t('Last run', 'آخر تشغيل')}: {data.lastTestRun.at} · {data.lastTestRun.passed}/
                {data.lastTestRun.total} {t('passed', 'ناجح')}
              </p>
              <Table
                columns={[
                  { key: 'name', label: t('Test', 'الاختبار') },
                  {
                    key: 'pass',
                    label: t('Result', 'النتيجة'),
                    render: (r) => (r.pass ? 'PASS' : 'FAIL'),
                  },
                ]}
                rows={data.lastTestRun.tests || []}
              />
            </>
          ) : (
            <p style={{ color: '#6b7280' }}>{t('No test runs yet', 'لا توجد اختبارات بعد')}</p>
          )}
        </Panel>
      ) : null}

      {tab === 'mfa' ? (
        <>
          <Panel title={t('MFA policies (mandatory roles)', 'سياسات MFA')}>
            <Table
              columns={[
                { key: 'role', label: t('Role', 'الدور') },
                { key: 'mandatory', label: 'Mandatory', render: (r) => String(r.mandatory) },
                {
                  key: 'methods',
                  label: t('Methods', 'الطرق'),
                  render: (r) => (r.methods || []).join(', '),
                },
                {
                  key: 'stepUpFor',
                  label: t('Step-up', 'تصعيد'),
                  render: (r) => (r.stepUpFor || []).join(', '),
                },
              ]}
              rows={data?.mfaPolicies || []}
            />
          </Panel>
          <Panel
            title={t('Active sessions', 'الجلسات النشطة')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('registerSession', {
                    userId: 'demo-owner',
                    role: 'owner',
                    deviceLabel: 'Owner Dashboard',
                  })
                }
              >
                {t('Register demo session', 'تسجيل جلسة تجريبية')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'userId', label: 'User' },
                { key: 'role', label: 'Role' },
                { key: 'deviceLabel', label: 'Device' },
                { key: 'expiresAt', label: 'Expires' },
                { key: 'status', label: 'Status' },
                {
                  key: 'x',
                  label: '',
                  render: (r) => (
                    <button type="button" disabled={busy} onClick={() => runAction('revokeSession', { sessionId: r.id, reason: 'owner_remote_logout' })}>
                      {t('Revoke', 'إلغاء')}
                    </button>
                  ),
                },
              ]}
              rows={data?.sessions || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'pam' ? (
        <>
          <Panel
            title={t('Just-in-time elevation', 'رفع صلاحيات مؤقت')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('requestPamElevation', {
                    userId: 'owner',
                    role: 'owner',
                    permissions: ['finance.payout'],
                    reason: 'Emergency payout review',
                    mfaVerified: true,
                    durationMinutes: 30,
                  })
                }
              >
                {t('Request JIT access', 'طلب وصول مؤقت')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'userId', label: 'User' },
                { key: 'status', label: 'Status' },
                { key: 'reason', label: 'Reason' },
                { key: 'expiresAt', label: 'Expires' },
                {
                  key: 'a',
                  label: '',
                  render: (r) =>
                    r.status === 'pending_approval' ? (
                      <button type="button" disabled={busy} onClick={() => runAction('approvePamElevation', { grantId: r.id })}>
                        {t('Approve', 'اعتماد')}
                      </button>
                    ) : null,
                },
              ]}
              rows={data?.pamGrants || []}
            />
          </Panel>
          <Panel
            title={t('Impersonation (fully audited)', 'انتحال الهوية (مُدقَّق بالكامل)')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('startImpersonation', {
                    actorId: 'owner',
                    targetTenantId: 'demo-tenant',
                    reason: 'Support investigation',
                    mfaVerified: true,
                    durationMinutes: 15,
                  })
                }
              >
                {t('Start impersonation', 'بدء الانتحال')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'actorId', label: 'Actor' },
                { key: 'targetTenantId', label: 'Tenant' },
                { key: 'targetUserId', label: 'User' },
                { key: 'reason', label: 'Reason' },
                { key: 'status', label: 'Status' },
                { key: 'expiresAt', label: 'Expires' },
                {
                  key: 'e',
                  label: '',
                  render: (r) =>
                    r.status === 'active' ? (
                      <button type="button" disabled={busy} onClick={() => runAction('endImpersonation', { id: r.id, reason: 'done' })}>
                        {t('End', 'إنهاء')}
                      </button>
                    ) : null,
                },
              ]}
              rows={data?.impersonations || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'tenant' ? (
        <Panel
          title={t('Tenant isolation tests', 'اختبارات عزل المستأجرين')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('runTenantIsolationTests')}>
              {t('Run isolation suite', 'تشغيل مجموعة العزل')}
            </button>
          }
        >
          {data?.lastIsolationTest ? (
            <>
              <p style={{ fontSize: 13 }}>
                {data.lastIsolationTest.at} · {data.lastIsolationTest.passed ? 'PASS' : 'FAIL'}
              </p>
              <Table
                columns={[
                  { key: 'name', label: t('Test', 'الاختبار') },
                  { key: 'pass', label: t('Result', 'النتيجة'), render: (r) => (r.pass ? 'PASS' : 'FAIL') },
                ]}
                rows={data.lastIsolationTest.tests || []}
              />
            </>
          ) : (
            <p style={{ color: '#6b7280' }}>{t('No isolation runs yet', 'لا توجد تشغيلات عزل بعد')}</p>
          )}
        </Panel>
      ) : null}

      {tab === 'privacy' ? (
        <>
          <Panel
            title={t('Privacy requests', 'طلبات الخصوصية')}
            actions={
              <>
                <select value={privacyType} onChange={(e) => setPrivacyType(e.target.value)}>
                  {(data?.catalog?.consentTypes ? ['access', 'download', 'correct', 'delete', 'close_account'] : ['access']).map(
                    (x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ),
                  )}
                  <option value="access">access</option>
                  <option value="download">download</option>
                  <option value="correct">correct</option>
                  <option value="delete">delete</option>
                  <option value="close_account">close_account</option>
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runAction('submitPrivacyRequest', { type: privacyType, userId: 'demo-user', country: 'JO' })}
                >
                  {t('Submit request', 'إرسال طلب')}
                </button>
              </>
            }
          >
            <Table
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'userId', label: 'User' },
                { key: 'status', label: 'Status' },
                { key: 'deadline', label: 'Deadline' },
                { key: 'country', label: 'Country' },
              ]}
              rows={data?.privacyRequests || []}
            />
          </Panel>
          <Panel
            title={t('Consent ledger', 'سجل الموافقات')}
            actions={
              <>
                <select value={consentType} onChange={(e) => setConsentType(e.target.value)}>
                  {(data?.catalog?.consentTypes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    runAction('recordConsent', {
                      type: consentType,
                      granted: true,
                      userId: 'demo-user',
                      consentVersion: '1.0.0',
                      policyVersion: '1.0.0',
                      country: 'JO',
                      language: isAr ? 'ar' : 'en',
                    })
                  }
                >
                  {t('Record consent', 'تسجيل موافقة')}
                </button>
              </>
            }
          >
            <Table
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'granted', label: 'Granted', render: (r) => String(r.granted) },
                { key: 'consentVersion', label: 'Consent ver.' },
                { key: 'policyVersion', label: 'Policy ver.' },
                { key: 'country', label: 'Country' },
                { key: 'at', label: 'At' },
              ]}
              rows={data?.consents || []}
            />
          </Panel>
          <Panel title={t('Retention rules', 'قواعد الاحتفاظ')}>
            <Table
              columns={[
                { key: 'dataType', label: 'Data type' },
                { key: 'action', label: 'Action' },
                { key: 'retentionDays', label: 'Days' },
                { key: 'userDeletionExempt', label: 'Exempt', render: (r) => String(r.userDeletionExempt) },
              ]}
              rows={data?.retentionRules || []}
            />
          </Panel>
          <Panel title={t('Data classifications', 'تصنيفات البيانات')}>
            <Table
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'label', label: 'Label' },
                { key: 'encryption', label: 'Encryption' },
                { key: 'exportable', label: 'Export', render: (r) => String(r.exportable) },
                { key: 'retentionDays', label: 'Retention' },
              ]}
              rows={data?.catalog?.classifications || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'ai' ? (
        <Panel
          title={t('AI agent guards', 'حراس وكلاء الذكاء')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('assertAiAction', { agentRole: 'default', tool: 'approve_large_payout', tenantId: 't1' })}
            >
              {t('Probe denied payout tool', 'اختبار أداة دفع مرفوضة')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'agentRole', label: 'Role' },
              { key: 'allowedTools', label: 'Allowed', render: (r) => (r.allowedTools || []).join(', ') },
              { key: 'deniedTools', label: 'Denied', render: (r) => (r.deniedTools || []).join(', ') },
              { key: 'tenantScoped', label: 'Tenant', render: (r) => String(r.tenantScoped) },
              { key: 'costLimitUsd', label: 'Cost $' },
              { key: 'systemPromptVersion', label: 'Prompt ver.' },
            ]}
            rows={data?.aiGuards || []}
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            {t(
              'Denied actions always blocked unless a human-authorized workflow is present.',
              'الإجراءات المرفوضة تُحظر دائمًا ما لم يوجد سير عمل بشري مصرّح.',
            )}
          </p>
        </Panel>
      ) : null}

      {tab === 'finance' ? (
        <Panel
          title={t('Financial security controls', 'ضوابط الأمن المالي')}
          actions={
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction('requireFinancialControls', { action: 'payout', amount: 6000 })}
              >
                {t('Probe high payout', 'اختبار دفعة عالية')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('createLedgerAdjustment', {
                    amount: -10,
                    currency: 'USD',
                    reason: 'Correction entry — never silent edit',
                    originalEntryId: 'demo',
                  })
                }
              >
                {t('Create adjustment', 'إنشاء تسوية')}
              </button>
            </>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            <li>Idempotency required: {String(data?.config?.financial?.idempotencyRequired)}</li>
            <li>Immutable ledger: {String(data?.config?.financial?.immutableLedger)}</li>
            <li>MFA above: {data?.config?.financial?.requireMfaAbove}</li>
            <li>Dual approval threshold: {data?.config?.financial?.dualApprovalThreshold}</li>
            <li>Payment hold flag: {String(data?.flags?.find((f) => f.key === 'payment_hold')?.enabled)}</li>
            <li>Payout hold flag: {String(data?.flags?.find((f) => f.key === 'payout_hold')?.enabled)}</li>
          </ul>
        </Panel>
      ) : null}

      {tab === 'files' ? (
        <Panel
          title={t('File & media guards', 'حماية الملفات والوسائط')}
          actions={
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction('validateUpload', { name: 'payload.exe', sizeBytes: 100, malwareScanStatus: 'clean' })}
              >
                {t('Probe exe upload', 'اختبار رفع تنفيذي')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('validateUpload', {
                    name: 'lesson.pdf',
                    sizeBytes: 2048,
                    claimedMime: 'application/pdf',
                    detectedMime: 'application/pdf',
                    bytes: [0x25, 0x50, 0x44, 0x46],
                    malwareScanStatus: 'clean',
                  })
                }
              >
                {t('Probe PDF upload', 'اختبار رفع PDF')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction('createSignedUrl', { resourceId: 'asset-demo', userId: 'owner' })}
              >
                {t('Issue signed URL', 'إصدار رابط موقّع')}
              </button>
            </>
          }
        >
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            <li>Max upload MB: {data?.config?.files?.maxUploadMb}</li>
            <li>MIME match: {String(data?.config?.files?.requireMimeMatch)}</li>
            <li>Signature check: {String(data?.config?.files?.requireSignatureCheck)}</li>
            <li>Malware scan required: {String(data?.config?.files?.malwareScanRequired)}</li>
            <li>Signed URL TTL sec: {data?.config?.files?.signedUrlTtlSec}</li>
            <li>Block executables: {String(data?.config?.files?.blockExecutables)}</li>
          </ul>
        </Panel>
      ) : null}

      {tab === 'fraud' ? (
        <>
          <Panel
            title={t('Fraud & abuse', 'الاحتيال وإساءة الاستخدام')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('recordFraudEvent', {
                    userId: 'u-risk',
                    signals: { failedLogins: 6, newDevice: true, impossibleTravel: true },
                  })
                }
              >
                {t('Simulate risk event', 'محاكاة حدث مخاطر')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'at', label: 'At' },
                { key: 'userId', label: 'User' },
                { key: 'score', label: 'Score' },
                { key: 'action', label: 'Action' },
              ]}
              rows={data?.fraudEvents || []}
            />
          </Panel>
          <Panel title={t('DLP events', 'أحداث منع فقدان البيانات')}>
            <Table
              columns={[
                { key: 'at', label: 'At' },
                { key: 'type', label: 'Type' },
                { key: 'recordCount', label: 'Records' },
                { key: 'action', label: 'Action' },
              ]}
              rows={data?.dlpEvents || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'incidents' ? (
        <Panel
          title={t('Incident response', 'الاستجابة للحوادث')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('createIncident', {
                  title: 'Suspicious admin session',
                  severity: 'high',
                  affectedTenants: ['demo'],
                  affectedCountries: ['JO'],
                })
              }
            >
              {t('Open incident', 'فتح حادثة')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'title', label: 'Title' },
              {
                key: 'severity',
                label: 'Severity',
                render: (r) => <span style={{ color: severityColor(r.severity) }}>{r.severity}</span>,
              },
              { key: 'status', label: 'Status' },
              { key: 'owner', label: 'Owner' },
              {
                key: 'a',
                label: '',
                render: (r) =>
                  r.status !== 'closed' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runAction('updateIncident', { id: r.id, patch: { status: 'contained' } })}
                    >
                      {t('Contain', 'احتواء')}
                    </button>
                  ) : null,
              },
            ]}
            rows={data?.incidents || []}
          />
        </Panel>
      ) : null}

      {tab === 'compliance' ? (
        <>
          <Panel title={t('Compliance jurisdictions (draft config — not certification)', 'ولايات الامتثال (مسودة — ليست شهادة)')}>
            <Table
              columns={[
                { key: 'jurisdiction', label: 'Jurisdiction' },
                { key: 'region', label: 'Region' },
                { key: 'approvalStatus', label: 'Status' },
                {
                  key: 'domains',
                  label: 'Domains',
                  render: (r) => (r.domains || []).slice(0, 4).join(', ') + (r.domains?.length > 4 ? '…' : ''),
                },
                { key: 'note', label: 'Note' },
              ]}
              rows={data?.compliance || []}
            />
          </Panel>
          <Panel title={t('Policy center', 'مركز السياسات')}>
            <Table
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'version', label: 'Version' },
                { key: 'status', label: 'Status' },
                { key: 'legalReviewRequired', label: 'Legal review', render: (r) => String(r.legalReviewRequired) },
              ]}
              rows={data?.policies || []}
            />
          </Panel>
          <Panel title={t('Threat models', 'نماذج التهديد')}>
            <Table
              columns={[
                { key: 'asset', label: 'Asset' },
                { key: 'threatActor', label: 'Actor' },
                { key: 'likelihood', label: 'Likelihood' },
                { key: 'impact', label: 'Impact' },
                { key: 'residualRisk', label: 'Residual' },
                { key: 'owner', label: 'Owner' },
              ]}
              rows={data?.threatModels || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'vendors' ? (
        <>
          <Panel title={t('Vendor risk', 'مخاطر الموردين')}>
            <Table
              columns={[
                { key: 'id', label: 'Provider' },
                { key: 'service', label: 'Service' },
                { key: 'criticality', label: 'Criticality' },
                { key: 'securityStatus', label: 'Security' },
                { key: 'riskScore', label: 'Risk' },
              ]}
              rows={data?.vendors || []}
            />
          </Panel>
          <Panel
            title={t('Evidence center', 'مركز الأدلة')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('addEvidence', {
                    category: 'security_test',
                    title: 'Automated security test run evidence',
                    department: 'security',
                  })
                }
              >
                {t('Add evidence', 'إضافة دليل')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'category', label: 'Category' },
                { key: 'status', label: 'Status' },
                { key: 'version', label: 'Version' },
              ]}
              rows={data?.evidence || []}
            />
          </Panel>
          <Panel
            title={t('Backup checks', 'فحوصات النسخ الاحتياطي')}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('recordBackupCheck', {
                    encrypted: true,
                    immutableCopy: true,
                    isolatedCopy: true,
                    integrityOk: true,
                    restoreTested: true,
                    restoreOk: true,
                    notes: 'Controlled restore drill',
                  })
                }
              >
                {t('Record restore drill', 'تسجيل تمرين الاستعادة')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'at', label: 'At' },
                { key: 'region', label: 'Region' },
                { key: 'encrypted', label: 'Encrypted', render: (r) => String(r.encrypted) },
                { key: 'restoreOk', label: 'Restore OK', render: (r) => String(r.restoreOk) },
              ]}
              rows={data?.backups || []}
            />
          </Panel>
          <Panel
            title={t('Secrets inventory (values never shown)', 'جرد الأسرار (لا تُعرض القيم)')}
            actions={
              <button type="button" disabled={busy} onClick={() => runAction('refreshSecretsInventory')}>
                {t('Refresh inventory', 'تحديث الجرد')}
              </button>
            }
          >
            <Table
              columns={[
                { key: 'name', label: 'Name' },
                { key: 'category', label: 'Category' },
                { key: 'status', label: 'Status' },
                { key: 'environment', label: 'Env' },
                { key: 'maskedHint', label: 'Hint' },
              ]}
              rows={data?.secretsInventory || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'flags' ? (
        <Panel title={t('Emergency security flags', 'أعلام الأمن الطارئة')}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select value={flagForm.key} onChange={(e) => setFlagForm((f) => ({ ...f, key: e.target.value }))}>
              {(data?.flags || []).map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={flagForm.enabled}
                onChange={(e) => setFlagForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              {t('Enabled', 'مفعّل')}
            </label>
            <input
              placeholder={t('Reason (required)', 'السبب (مطلوب)')}
              value={flagForm.reason}
              onChange={(e) => setFlagForm((f) => ({ ...f, reason: e.target.value }))}
              style={{ minWidth: 220, padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('setSecurityFlag', {
                  key: flagForm.key,
                  enabled: flagForm.enabled,
                  reason: flagForm.reason,
                  confirmation: 'CONFIRM_EMERGENCY',
                  expiresAt: flagForm.expiresAt || null,
                })
              }
            >
              {t('Apply flag', 'تطبيق العلم')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'label', label: 'Label' },
              { key: 'enabled', label: 'Enabled', render: (r) => String(r.enabled) },
              { key: 'reason', label: 'Reason' },
              { key: 'expiresAt', label: 'Expires' },
            ]}
            rows={data?.flags || []}
          />
        </Panel>
      ) : null}

      {tab === 'gates' ? (
        <Panel
          title={t('Production release gates', 'بوابات إطلاق الإنتاج')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('evaluateReleaseGates')}>
              {t('Re-evaluate', 'إعادة تقييم')}
            </button>
          }
        >
          {data?.lastReleaseGate ? (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: data.lastReleaseGate.blocked ? '#991b1b' : '#047857' }}>
                {data.lastReleaseGate.blocked ? 'BLOCKED' : 'CLEAR'} · {data.lastReleaseGate.at}
              </p>
              <Table
                columns={[
                  { key: 'code', label: 'Blocker' },
                  { key: 'count', label: 'Count', render: (r) => r.count ?? '—' },
                ]}
                rows={data.lastReleaseGate.blockers || []}
                empty={t('No blockers', 'لا موانع')}
              />
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                {t(
                  'Exceptions require Owner + Security confirmation, reason, mitigation, and expiration.',
                  'الاستثناءات تتطلب تأكيد المالك والأمن وسببًا وتخفيفًا وتاريخ انتهاء.',
                )}
              </p>
            </>
          ) : (
            <p style={{ color: '#6b7280' }}>{t('No gate evaluation yet', 'لا تقييم بعد')}</p>
          )}
        </Panel>
      ) : null}

      <Panel title={t('Recent security audit trail', 'سجل تدقيق أمني حديث')}>
        <Table
          columns={[
            { key: 'at', label: 'At' },
            { key: 'action', label: 'Action' },
            { key: 'actor', label: 'Actor' },
            { key: 'result', label: 'Result' },
            { key: 'reason', label: 'Reason' },
          ]}
          rows={data?.auditTrail || []}
        />
      </Panel>
    </div>
  );
}

export default EnterpriseSecurityCenter;

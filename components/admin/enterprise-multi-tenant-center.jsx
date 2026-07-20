'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'tenants', label: 'Tenants', labelAr: 'المستأجرون' },
  { id: 'white-label', label: 'White Label', labelAr: 'العلامة البيضاء' },
  { id: 'modules', label: 'Modules', labelAr: 'الوحدات' },
  { id: 'subscriptions', label: 'Subscriptions', labelAr: 'الاشتراكات' },
  { id: 'billing', label: 'Billing', labelAr: 'الفوترة' },
  { id: 'limits', label: 'Limits', labelAr: 'الحدود' },
  { id: 'isolation', label: 'Data Isolation', labelAr: 'عزل البيانات' },
  { id: 'tenant-admin', label: 'Tenant Admin', labelAr: 'مدير المستأجر' },
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات' },
  { id: 'security', label: 'Security', labelAr: 'الأمان' },
];

function Stat({ label, value }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.85rem', background: 'var(--ea-card, #fff)' }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value ?? '—'}</div>
    </div>
  );
}

function Panel({ title, children, actions }) {
  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, background: 'var(--ea-card, #fff)', marginBottom: 14 }}>
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
              <th key={c.key} style={{ textAlign: 'start', borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.tenantId || row.key || idx}>
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

export function EnterpriseMultiTenantCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [tenantAdminView, setTenantAdminView] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    orgType: 'school',
    planKey: 'starter',
    billingCycle: 'monthly',
    country: 'JO',
    currency: 'USD',
  });

  const isAr = lang === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/multi-tenant?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load multi-tenant platform');
    const json = await res.json();
    setData(json);
    if (!selectedId && json.tenants?.[0]?.tenantId) setSelectedId(json.tenants[0].tenantId);
  }, [selectedId]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/multi-tenant?view=stream');
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
      const res = await fetch('/api/multi-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'tenantAdminDashboard') setTenantAdminView(json);
      if (action === 'impersonate') setTenantAdminView({ ...json.tenantContext, impersonation: json.session });
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const selected = useMemo(
    () => (data?.tenants || []).find((t) => t.tenantId === selectedId) || null,
    [data, selectedId],
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{t('Multi-Tenant & White Label', 'المنصة متعددة المستأجرين والعلامة البيضاء')}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'One codebase · unlimited organizations · isolated data · Owner control',
              'كود واحد · مؤسسات بلا حد · بيانات معزولة · تحكم المالك',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'ع'}</button>
          <button type="button" disabled={busy} onClick={() => load()}>{t('Refresh', 'تحديث')}</button>
          <button type="button" disabled={busy} onClick={() => runAction('billingTick')}>{t('Billing tick', 'دورة الفوترة')}</button>
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

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
            <Stat label={t('Tenants', 'المستأجرون')} value={data?.stats?.tenants} />
            <Stat label={t('Active', 'نشط')} value={data?.stats?.active} />
            <Stat label={t('Trial', 'تجريبي')} value={data?.stats?.trial} />
            <Stat label={t('Suspended', 'موقوف')} value={data?.stats?.suspended} />
            <Stat label={t('Revenue', 'الإيرادات')} value={data?.stats?.revenue} />
            <Stat label={t('Users', 'المستخدمون')} value={data?.stats?.users} />
            <Stat label={t('Health avg', 'متوسط الصحة')} value={data?.stats?.healthAvg} />
            <Stat label={t('Open invoices', 'فواتير مفتوحة')} value={data?.stats?.openInvoices} />
          </div>
          <Panel title={t('Top performing tenants', 'أفضل المستأجرين')}>
            <Table
              columns={[
                { key: 'name', label: t('Name', 'الاسم') },
                { key: 'planKey', label: t('Plan', 'الخطة') },
                { key: 'healthScore', label: t('Health', 'الصحة') },
                { key: 'users', label: t('Users', 'المستخدمون') },
                { key: 'revenue', label: t('Revenue', 'الإيرادات') },
              ]}
              rows={data?.analytics?.topPerformingTenants || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'tenants' ? (
        <>
          <Panel title={t('Create tenant', 'إنشاء مستأجر')}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input
                placeholder={t('Organization name', 'اسم المؤسسة')}
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 200 }}
              />
              <select value={createForm.orgType} onChange={(e) => setCreateForm((f) => ({ ...f, orgType: e.target.value }))}>
                {(data?.catalog?.orgTypes || []).map((o) => (
                  <option key={o.key} value={o.key}>{isAr ? o.labelAr : o.label}</option>
                ))}
              </select>
              <select value={createForm.planKey} onChange={(e) => setCreateForm((f) => ({ ...f, planKey: e.target.value }))}>
                {(data?.catalog?.plans || []).map((p) => (
                  <option key={p.key} value={p.key}>{isAr ? p.labelAr : p.label}</option>
                ))}
              </select>
              <select value={createForm.billingCycle} onChange={(e) => setCreateForm((f) => ({ ...f, billingCycle: e.target.value }))}>
                {(data?.catalog?.billingCycles || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !createForm.name.trim()}
                onClick={() =>
                  runAction('createTenant', createForm).then((r) => {
                    if (r?.tenant?.tenantId) {
                      setSelectedId(r.tenant.tenantId);
                      setCreateForm((f) => ({ ...f, name: '' }));
                    }
                  })
                }
                style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}
              >
                {t('Create', 'إنشاء')}
              </button>
            </div>
          </Panel>
          <Panel
            title={t('All tenants', 'كل المستأجرين')}
            actions={
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {(data?.tenants || []).map((tn) => (
                  <option key={tn.tenantId} value={tn.tenantId}>{tn.name}</option>
                ))}
              </select>
            }
          >
            <Table
              columns={[
                { key: 'name', label: t('Name', 'الاسم') },
                { key: 'orgType', label: t('Type', 'النوع') },
                { key: 'subdomain', label: 'Subdomain' },
                { key: 'planKey', label: t('Plan', 'الخطة') },
                { key: 'status', label: t('Status', 'الحالة') },
                { key: 'healthScore', label: t('Health', 'الصحة') },
                {
                  key: 'actions',
                  label: '',
                  render: (r) => (
                    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setSelectedId(r.tenantId)}>{t('Select', 'اختيار')}</button>
                      {r.status !== 'suspended' ? (
                        <button type="button" disabled={busy} onClick={() => runAction('suspend', { tenantId: r.tenantId, reason: 'owner_action' })}>
                          {t('Suspend', 'إيقاف')}
                        </button>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => runAction('activate', { tenantId: r.tenantId })}>
                          {t('Activate', 'تفعيل')}
                        </button>
                      )}
                      <button type="button" disabled={busy} onClick={() => runAction('softDelete', { tenantId: r.tenantId })}>
                        {t('Delete', 'حذف')}
                      </button>
                    </span>
                  ),
                },
              ]}
              rows={data?.tenants || []}
            />
          </Panel>
          {(data?.deletedTenants || []).length ? (
            <Panel title={t('Soft-deleted (restore)', 'محذوفون (استعادة)')}>
              <Table
                columns={[
                  { key: 'name', label: 'Name' },
                  { key: 'deletedAt', label: 'Deleted' },
                  {
                    key: 'actions',
                    label: '',
                    render: (r) => (
                      <button type="button" disabled={busy} onClick={() => runAction('restore', { tenantId: r.tenantId })}>
                        {t('Restore', 'استعادة')}
                      </button>
                    ),
                  },
                ]}
                rows={data?.deletedTenants || []}
              />
            </Panel>
          ) : null}
        </>
      ) : null}

      {tab === 'white-label' && selected ? (
        <Panel title={`${t('White label', 'العلامة البيضاء')}: ${selected.name}`}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 520, fontSize: 13 }}>
            <div>Brand: {selected.branding?.brandName}</div>
            <div>
              Colors:{' '}
              <span style={{ display: 'inline-block', width: 14, height: 14, background: selected.branding?.primaryColor, borderRadius: 4 }} />{' '}
              {selected.branding?.primaryColor} / {selected.branding?.secondaryColor}
            </div>
            <div>Typography: {selected.branding?.typography}</div>
            <div>Domain: {selected.domain || '—'} · Subdomain: {selected.subdomain}</div>
            <div>Public URL: {selected.publicUrl}</div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const primaryColor = window.prompt('Primary color', selected.branding?.primaryColor || '#0f766e');
                if (!primaryColor) return;
                const brandName = window.prompt('Brand name', selected.branding?.brandName || selected.name);
                runAction('updateWhiteLabel', {
                  tenantId: selected.tenantId,
                  primaryColor,
                  brandName,
                  dashboardTheme: { density: 'comfortable', sidebar: 'left' },
                });
              }}
            >
              {t('Customize branding', 'تخصيص الهوية')}
            </button>
          </div>
        </Panel>
      ) : null}

      {tab === 'modules' && selected ? (
        <Panel title={`${t('Modules', 'الوحدات')}: ${selected.name}`}>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            {(data?.catalog?.modules || []).map((m) => {
              const on = Boolean(selected.modules?.[m.key]);
              return (
                <label key={m.key} style={{ display: 'flex', gap: 8, alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10 }}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={busy}
                    onChange={(e) =>
                      runAction('setModules', {
                        tenantId: selected.tenantId,
                        modules: { [m.key]: e.target.checked },
                      })
                    }
                  />
                  <span style={{ fontSize: 13 }}>{isAr ? m.labelAr : m.label}</span>
                </label>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {tab === 'subscriptions' ? (
        <Panel
          title={t('Subscriptions', 'الاشتراكات')}
          actions={
            selected ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const planKey = window.prompt('Plan key', selected.planKey);
                  if (!planKey) return;
                  runAction('changePlan', { tenantId: selected.tenantId, planKey });
                }}
              >
                {t('Change plan', 'تغيير الخطة')}
              </button>
            ) : null
          }
        >
          <Table
            columns={[
              { key: 'tenantId', label: 'Tenant' },
              { key: 'planKey', label: 'Plan' },
              { key: 'billingCycle', label: 'Cycle' },
              { key: 'price', label: 'Price' },
              { key: 'status', label: 'Status' },
              { key: 'renewsAt', label: 'Renews' },
            ]}
            rows={data?.subscriptions || []}
          />
          <h4 style={{ marginTop: 14 }}>{t('Plans catalog', 'كتالوج الخطط')}</h4>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'label', label: 'Label', render: (r) => (isAr ? r.labelAr : r.label) },
              { key: 'priceMonthly', label: 'Monthly' },
              { key: 'priceYearly', label: 'Yearly' },
            ]}
            rows={data?.catalog?.plans || []}
          />
        </Panel>
      ) : null}

      {tab === 'billing' ? (
        <Panel
          title={t('Billing & invoices', 'الفوترة والفواتير')}
          actions={
            selected ? (
              <button type="button" disabled={busy} onClick={() => runAction('createInvoice', { tenantId: selected.tenantId })}>
                {t('Create invoice', 'إنشاء فاتورة')}
              </button>
            ) : null
          }
        >
          <Table
            columns={[
              { key: 'number', label: '#' },
              { key: 'tenantId', label: 'Tenant' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Created' },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  r.status === 'open' ? (
                    <button type="button" disabled={busy} onClick={() => runAction('payInvoice', { invoiceId: r.id })}>
                      {t('Mark paid', 'تسديد')}
                    </button>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data?.invoices || []}
          />
        </Panel>
      ) : null}

      {tab === 'limits' && selected ? (
        <Panel
          title={`${t('Resource limits', 'حدود الموارد')}: ${selected.name}`}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const users = window.prompt('Users limit (blank = unlimited)', String(selected.limits?.users ?? ''));
                if (users === null) return;
                runAction('setLimits', {
                  tenantId: selected.tenantId,
                  limits: { users: users === '' ? null : Number(users) },
                });
              }}
            >
              {t('Edit users limit', 'تعديل حد المستخدمين')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'key', label: 'Resource' },
              { key: 'used', label: 'Used' },
              { key: 'limit', label: 'Limit' },
              { key: 'pct', label: '%' },
              { key: 'exceeded', label: 'Exceeded' },
            ]}
            rows={Object.entries(selected.limitStatus || {}).map(([key, v]) => ({
              key,
              used: v.used,
              limit: v.unlimited ? '∞' : v.limit,
              pct: v.unlimited ? '—' : Math.round(v.pct * 100),
              exceeded: String(v.exceeded),
            }))}
          />
        </Panel>
      ) : null}

      {tab === 'isolation' && selected ? (
        <Panel title={`${t('Data isolation', 'عزل البيانات')}: ${selected.name}`}>
          <p style={{ fontSize: 13, color: '#334155' }}>
            {t(
              'Each tenant owns isolated users, students, teachers, courses, payments, reports, and audit logs. Owner aggregates globally without mixing records.',
              'كل مستأجر يملك بياناته المعزولة. المالك يجمع الإحصاءات عالمياً دون خلط السجلات.',
            )}
          </p>
          <div style={{ fontSize: 13 }}>Namespace: tenant:{selected.tenantId}</div>
          <div style={{ fontSize: 13 }}>Encrypted at rest: {String(selected.isolation?.encryptedAtRest)}</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Collections: {(data?.catalog?.isolatedCollections || []).join(' · ')}
          </div>
        </Panel>
      ) : null}

      {tab === 'tenant-admin' ? (
        <Panel
          title={t('Tenant Admin scope', 'نطاق مدير المستأجر')}
          actions={
            selected ? (
              <span style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={busy} onClick={() => runAction('tenantAdminDashboard', { tenantId: selected.tenantId })}>
                  {t('Open tenant view', 'فتح عرض المستأجر')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt('Impersonation reason (audited)', 'support_debug');
                    if (!reason) return;
                    runAction('impersonate', { tenantId: selected.tenantId, reason });
                  }}
                >
                  {t('Impersonate', 'انتحال هوية')}
                </button>
              </span>
            ) : null
          }
        >
          <p style={{ fontSize: 13 }}>{t('Tenant Admin manages only its organization. No cross-tenant access.', 'مدير المستأجر يدير مؤسسته فقط.')}</p>
          {tenantAdminView ? (
            <pre style={{ background: '#f0fdfa', padding: 12, borderRadius: 10, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(tenantAdminView, null, 2)}
            </pre>
          ) : null}
        </Panel>
      ) : null}

      {tab === 'analytics' ? (
        <Panel title={t('Global Owner analytics', 'تحليلات المالك العالمية')}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', marginBottom: 12 }}>
            <Stat label={t('Tenants', 'المستأجرون')} value={data?.analytics?.totalTenants} />
            <Stat label={t('Revenue', 'الإيرادات')} value={data?.analytics?.revenueTotal} />
            <Stat label={t('AI usage', 'استخدام الذكاء')} value={data?.analytics?.aiUsage} />
            <Stat label={t('Storage GB', 'التخزين')} value={data?.analytics?.storageUsageGb} />
          </div>
          <h4>{t('By plan', 'حسب الخطة')}</h4>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
            {JSON.stringify(data?.analytics?.byPlan || {}, null, 2)}
          </pre>
          <h4 style={{ marginTop: 12 }}>{t('Subscription status', 'حالة الاشتراك')}</h4>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
            {JSON.stringify(data?.analytics?.subscriptionStatus || {}, null, 2)}
          </pre>
        </Panel>
      ) : null}

      {tab === 'security' ? (
        <Panel title={t('Security & audit', 'الأمان والتدقيق')}>
          <div style={{ fontSize: 13, marginBottom: 10 }}>
            Tenant isolation · RBAC · custom domains/SSL flags · encryption · backups · disaster recovery markers · audited impersonation
          </div>
          <h4>{t('Impersonation log', 'سجل انتحال الهوية')}</h4>
          <Table
            columns={[
              { key: 'tenantId', label: 'Tenant' },
              { key: 'actor', label: 'Actor' },
              { key: 'reason', label: 'Reason' },
              { key: 'status', label: 'Status' },
              { key: 'startedAt', label: 'Started' },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  r.status === 'active' ? (
                    <button type="button" disabled={busy} onClick={() => runAction('endImpersonation', { sessionId: r.id })}>
                      {t('End', 'إنهاء')}
                    </button>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data?.impersonations || []}
          />
          <h4 style={{ marginTop: 14 }}>{t('Audit', 'التدقيق')}</h4>
          <Table
            columns={[
              { key: 'at', label: 'At' },
              { key: 'action', label: 'Action' },
              { key: 'tenantId', label: 'Tenant' },
              { key: 'user', label: 'User' },
            ]}
            rows={data?.audit || []}
          />
        </Panel>
      ) : null}

      {!selected && ['white-label', 'modules', 'limits', 'isolation'].includes(tab) ? (
        <p style={{ color: '#6b7280' }}>{t('Select a tenant first (Tenants tab).', 'اختر مستأجراً أولاً من تبويب المستأجرين.')}</p>
      ) : null}
    </div>
  );
}

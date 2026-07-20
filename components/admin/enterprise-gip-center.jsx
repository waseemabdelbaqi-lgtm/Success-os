'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'hub', label: 'Integration Hub', labelAr: 'مركز التكامل' },
  { id: 'marketplace', label: 'Marketplace', labelAr: 'سوق التكاملات' },
  { id: 'payments', label: 'Payments', labelAr: 'المدفوعات' },
  { id: 'invoke', label: 'Invoke', labelAr: 'استدعاء' },
  { id: 'secrets', label: 'Secrets', labelAr: 'الأسرار' },
  { id: 'webhooks', label: 'Webhooks', labelAr: 'ويب هوك' },
  { id: 'monitoring', label: 'Monitoring', labelAr: 'المراقبة' },
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
            <tr key={row.id || row.key || idx}>
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

export function EnterpriseGipCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [category, setCategory] = useState('all');
  const [invokeConnector, setInvokeConnector] = useState('');
  const [invokeOp, setInvokeOp] = useState('ping');
  const [invokeResult, setInvokeResult] = useState(null);
  const [secretConnector, setSecretConnector] = useState('');
  const [secretName, setSecretName] = useState('default');
  const [secretValue, setSecretValue] = useState('');
  const [lastSecretOnce, setLastSecretOnce] = useState('');

  const isAr = lang === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/integrations?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load GIP');
    const json = await res.json();
    setData(json);
    if (!invokeConnector && json.connectors?.length) {
      const enabled = json.connectors.find((c) => c.enabled) || json.connectors[0];
      setInvokeConnector(enabled.key);
      setSecretConnector(enabled.key);
    }
  }, [invokeConnector]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/integrations?view=stream');
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
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || json.message || 'action failed');
      if (action === 'invoke') setInvokeResult(json);
      if (action === 'registerWebhook' && json.secretOnce) setLastSecretOnce(json.secretOnce);
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const connectors = useMemo(() => {
    const list = data?.connectors || [];
    if (category === 'all') return list;
    return list.filter((c) => c.category === category);
  }, [data, category]);

  const paymentConnectors = useMemo(
    () => (data?.connectors || []).filter((c) => c.category === 'payments'),
    [data],
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{t('Global Integration Platform', 'منصة التكامل العالمية')}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'All external services route through one Integration Hub — no direct vendor calls.',
              'كل الخدمات الخارجية تمر عبر مركز تكامل واحد — بدون اتصال مباشر بالموردين.',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'ع'}</button>
          <button type="button" disabled={busy} onClick={() => load()}>{t('Refresh', 'تحديث')}</button>
          <button type="button" disabled={busy} onClick={() => runAction('healthCheck')}>{t('Health check', 'فحص الصحة')}</button>
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
            <Stat label={t('Connectors', 'الموصلات')} value={data?.stats?.connectors} />
            <Stat label={t('Installed', 'مثبّت')} value={data?.stats?.installed} />
            <Stat label={t('Enabled', 'مفعّل')} value={data?.stats?.enabled} />
            <Stat label={t('Healthy', 'سليم')} value={data?.stats?.healthy} />
            <Stat label={t('Calls', 'الاستدعاءات')} value={data?.stats?.calls} />
            <Stat label={t('Failures', 'الأخطاء')} value={data?.stats?.failures} />
            <Stat label={t('Avg latency', 'متوسط الزمن')} value={data?.stats?.avgLatencyMs} />
            <Stat label={t('Cost USD', 'التكلفة')} value={data?.stats?.costUsd} />
          </div>
          <Panel title={t('Categories', 'التصنيفات')}>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
              {(data?.catalog?.categories || []).map((c) => {
                const mon = data?.monitoring?.byCategory?.[c.key];
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setCategory(c.key);
                      setTab('marketplace');
                    }}
                    style={{ textAlign: 'start', padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc' }}
                  >
                    <div style={{ fontWeight: 700 }}>{isAr ? c.labelAr : c.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {mon?.enabled || 0}/{mon?.total || 0} {t('enabled', 'مفعّل')}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel title={t('Recent calls', 'أحدث الاستدعاءات')}>
            <Table
              columns={[
                { key: 'connectorKey', label: 'Connector' },
                { key: 'operation', label: 'Op' },
                { key: 'status', label: 'Status' },
                { key: 'latencyMs', label: 'ms' },
                { key: 'attempts', label: 'Tries' },
                { key: 'at', label: 'At' },
              ]}
              rows={data?.calls || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'hub' ? (
        <Panel title={t('Integration Hub capabilities', 'قدرات مركز التكامل')}>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>
            <li>Authentication · API Keys · OAuth2 · JWT</li>
            <li>Webhooks · REST · GraphQL · SDKs</li>
            <li>Retries · Rate limiting · Error recovery</li>
            <li>Logging · Versioning · Encrypted secrets</li>
          </ul>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            Protocols: {(data?.catalog?.protocols || []).join(' · ')}
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            Auth methods: {(data?.catalog?.authMethods || []).join(' · ')}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#0f766e' }}>
            Hub routing required: {String(data?.config?.requireHubRouting)} · max retries:{' '}
            {data?.config?.maxRetries} · rate/min: {data?.config?.connectorRateLimitPerMinute}
          </div>
        </Panel>
      ) : null}

      {tab === 'marketplace' || tab === 'payments' ? (
        <Panel
          title={tab === 'payments' ? t('Payment Gateways', 'بوابات الدفع') : t('Integration Marketplace', 'سوق التكاملات')}
          actions={
            tab === 'marketplace' ? (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">{t('All', 'الكل')}</option>
                {(data?.catalog?.categories || []).map((c) => (
                  <option key={c.key} value={c.key}>
                    {isAr ? c.labelAr : c.label}
                  </option>
                ))}
              </select>
            ) : null
          }
        >
          <Table
            columns={[
              { key: 'name', label: t('Name', 'الاسم'), render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'category', label: t('Category', 'التصنيف') },
              { key: 'protocol', label: 'Protocol' },
              { key: 'version', label: 'Ver' },
              {
                key: 'installed',
                label: t('Installed', 'مثبّت'),
                render: (r) => (r.installed ? 'yes' : 'no'),
              },
              {
                key: 'enabled',
                label: t('Enabled', 'مفعّل'),
                render: (r) => (r.enabled ? 'yes' : 'no'),
              },
              { key: 'health', label: t('Health', 'الصحة') },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {!r.installed ? (
                      <button type="button" disabled={busy} onClick={() => runAction('install', { connectorKey: r.key })}>
                        {t('Install', 'تثبيت')}
                      </button>
                    ) : null}
                    {r.installed && !r.enabled ? (
                      <button type="button" disabled={busy} onClick={() => runAction('enable', { connectorKey: r.key })}>
                        {t('Enable', 'تفعيل')}
                      </button>
                    ) : null}
                    {r.enabled ? (
                      <button type="button" disabled={busy} onClick={() => runAction('disable', { connectorKey: r.key })}>
                        {t('Disable', 'إيقاف')}
                      </button>
                    ) : null}
                    {r.installed ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const v = window.prompt('Version', r.version || '1.0.0');
                          if (!v) return;
                          runAction('updateVersion', { connectorKey: r.key, version: v });
                        }}
                      >
                        {t('Update', 'تحديث')}
                      </button>
                    ) : null}
                  </span>
                ),
              },
            ]}
            rows={tab === 'payments' ? paymentConnectors : connectors}
          />
        </Panel>
      ) : null}

      {tab === 'invoke' ? (
        <Panel title={t('Invoke via Hub (only path)', 'استدعاء عبر المركز فقط')}>
          <div style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              Connector
              <select value={invokeConnector} onChange={(e) => setInvokeConnector(e.target.value)}>
                {(data?.connectors || [])
                  .filter((c) => c.enabled)
                  .map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.category} · {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              Operation
              <input value={invokeOp} onChange={(e) => setInvokeOp(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </label>
            <button
              type="button"
              disabled={busy || !invokeConnector}
              onClick={() =>
                runAction('invoke', {
                  connectorKey: invokeConnector,
                  operation: invokeOp,
                  payload: invokeOp === 'charge' ? { amount: 25, currency: 'USD' } : {},
                })
              }
              style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}
            >
              {busy ? '…' : t('InvokeThroughGip', 'استدعاء عبر GIP')}
            </button>
          </div>
          {invokeResult ? (
            <pre style={{ marginTop: 12, background: '#f0fdfa', padding: 12, borderRadius: 10, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify(invokeResult, null, 2)}
            </pre>
          ) : null}
        </Panel>
      ) : null}

      {tab === 'secrets' ? (
        <Panel title={t('Encrypted secrets', 'أسرار مشفّرة')}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select value={secretConnector} onChange={(e) => setSecretConnector(e.target.value)}>
              {(data?.connectors || []).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.key}
                </option>
              ))}
            </select>
            <input value={secretName} onChange={(e) => setSecretName(e.target.value)} placeholder="name" style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <input
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="secret value"
              type="password"
              style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 180 }}
            />
            <button
              type="button"
              disabled={busy || !secretValue}
              onClick={() =>
                runAction('upsertSecret', { connectorKey: secretConnector, name: secretName, value: secretValue }).then(() =>
                  setSecretValue(''),
                )
              }
            >
              {t('Save encrypted', 'حفظ مشفّر')}
            </button>
          </div>
          <Table
            columns={[
              { key: 'connectorKey', label: 'Connector' },
              { key: 'name', label: 'Name' },
              { key: 'masked', label: 'Masked' },
              { key: 'rotatedAt', label: 'Rotated' },
            ]}
            rows={data?.secrets || []}
          />
        </Panel>
      ) : null}

      {tab === 'webhooks' ? (
        <Panel
          title={t('Webhooks', 'ويب هوك')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const key = window.prompt('Connector key', invokeConnector || 'stripe');
                if (!key) return;
                runAction('registerWebhook', { connectorKey: key, events: ['payment.succeeded', '*'] });
              }}
            >
              {t('Register', 'تسجيل')}
            </button>
          }
        >
          {lastSecretOnce ? (
            <p style={{ color: '#0f766e', fontSize: 13 }}>
              {t('Copy webhook secret now (shown once)', 'انسخ سر الويب هوك الآن (يظهر مرة واحدة')}: <code>{lastSecretOnce}</code>
            </p>
          ) : null}
          <Table
            columns={[
              { key: 'connectorKey', label: 'Connector' },
              { key: 'path', label: 'Path' },
              {
                key: 'events',
                label: 'Events',
                render: (r) => (r.events || []).join(', '),
              },
              { key: 'secretMasked', label: 'Secret' },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.webhooks || []}
          />
        </Panel>
      ) : null}

      {tab === 'monitoring' ? (
        <Panel title={t('Integration monitoring', 'مراقبة التكاملات')}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', marginBottom: 12 }}>
            <Stat label="Success rate" value={data?.monitoring?.successRate} />
            <Stat label="Avg latency" value={data?.monitoring?.avgLatencyMs} />
            <Stat label="Retries" value={data?.monitoring?.totalRetries} />
            <Stat label="Cost" value={data?.monitoring?.totalCostUsd} />
          </div>
          <h4>{t('Top failures', 'أكثر الأعطال')}</h4>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'failures', label: 'Failures' },
              { key: 'calls', label: 'Calls' },
              { key: 'health', label: 'Health' },
            ]}
            rows={data?.monitoring?.topFailures || []}
          />
          <h4 style={{ marginTop: 14 }}>{t('Health history', 'سجل الصحة')}</h4>
          <Table
            columns={[
              { key: 'connectorKey', label: 'Connector' },
              { key: 'status', label: 'Status' },
              { key: 'latencyMs', label: 'ms' },
              { key: 'at', label: 'At' },
            ]}
            rows={data?.health || []}
          />
        </Panel>
      ) : null}

      {tab === 'security' ? (
        <Panel title={t('Security & audit', 'الأمان والتدقيق')}>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            Encrypted secrets · rotation · webhook validation · permission-based access · API rate limits · audit logs
          </div>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            Secret rotation days: {data?.config?.secretRotationDays} · webhook signature required:{' '}
            {String(data?.config?.webhookSignatureRequired)}
          </div>
          <Table
            columns={[
              { key: 'at', label: 'At' },
              { key: 'action', label: 'Action' },
              { key: 'connectorKey', label: 'Connector' },
              { key: 'operation', label: 'Op' },
              { key: 'latencyMs', label: 'ms' },
              { key: 'user', label: 'User' },
            ]}
            rows={data?.audit || []}
          />
        </Panel>
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'pages', label: 'Pages', labelAr: 'الصفحات' },
  { id: 'labels', label: 'Titles & Labels', labelAr: 'العناوين والتسميات' },
  { id: 'navigation', label: 'Navigation', labelAr: 'التنقل' },
  { id: 'buttons', label: 'Buttons', labelAr: 'الأزرار' },
  { id: 'forms', label: 'Forms', labelAr: 'النماذج' },
  { id: 'filters', label: 'Filters', labelAr: 'الفلاتر' },
  { id: 'journeys', label: 'Journeys', labelAr: 'الرحلات' },
  { id: 'dashboards', label: 'Dashboards', labelAr: 'لوحات التحكم' },
  { id: 'tables', label: 'Tables', labelAr: 'الجداول' },
  { id: 'settings', label: 'Settings Registry', labelAr: 'سجل الإعدادات' },
  { id: 'flags', label: 'Feature Flags', labelAr: 'أعلام الميزات' },
  { id: 'notifications', label: 'Notifications', labelAr: 'الإشعارات' },
  { id: 'workflows', label: 'Workflows', labelAr: 'سير العمل' },
  { id: 'branding', label: 'Branding', labelAr: 'الهوية' },
  { id: 'resolve', label: 'Context Resolve', labelAr: 'حل السياق' },
  { id: 'quality', label: 'Quality Audit', labelAr: 'تدقيق الجودة' },
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

export function EnterpriseDynamicPlatformCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [ctx, setCtx] = useState({
    role: 'teacher',
    userType: 'teacher',
    country: 'JO',
    language: 'ar',
    institutionType: 'school',
    user_name: 'Waseem',
    commission_rate: '',
  });

  const isAr = lang === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/dynamic-platform?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Dynamic Platform');
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/dynamic-platform?view=stream');
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
      const res = await fetch('/api/dynamic-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'resolveContext' || action === 'qualityAudit') setResolved(json);
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

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{t('Global Dynamic Platform Engine', 'محرك المنصة الديناميكية العالمية')}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'Configuration-driven platform · existing modules preserved · Owner editable',
              'منصة قائمة على الإعدادات · الوحدات الحالية محفوظة · قابلة للتعديل من المالك',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'ع'}</button>
          <button type="button" disabled={busy} onClick={() => load()}>{t('Refresh', 'تحديث')}</button>
          <button type="button" disabled={busy} onClick={() => runAction('qualityAudit')}>{t('Run quality audit', 'تدقيق الجودة')}</button>
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
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', marginBottom: 14 }}>
            <Stat label={t('Pages', 'صفحات')} value={stats.pages} />
            <Stat label={t('Labels', 'تسميات')} value={stats.labels} />
            <Stat label={t('Nav items', 'عناصر تنقل')} value={stats.navItems} />
            <Stat label={t('Forms', 'نماذج')} value={stats.forms} />
            <Stat label={t('Filters', 'فلاتر')} value={stats.filterChains} />
            <Stat label={t('Journeys', 'رحلات')} value={stats.journeys} />
            <Stat label={t('Dashboards', 'لوحات')} value={stats.dashboards} />
            <Stat label={t('Flags', 'أعلام')} value={stats.flags} />
            <Stat label={t('Workflows', 'سير عمل')} value={stats.workflows} />
            <Stat label={t('Commission %', 'عمولة %')} value={stats.commissionDefaultPercent} />
            <Stat label={t('Quality open', 'ملاحظات مفتوحة')} value={stats.openQualityFindings} />
          </div>
          <Panel title={t('Safety bridges (no rebuild)', 'جسور الأمان (بدون إعادة بناء)')}>
            <pre style={{ margin: 0, fontSize: 12, background: '#f0fdfa', padding: 12, borderRadius: 10 }}>
              {JSON.stringify(data?.bridges || {}, null, 2)}
            </pre>
            <p style={{ fontSize: 13, color: '#0f766e', marginTop: 8 }}>
              {t(
                'Commission default 10% lives in Commission Engine config only — editable, never hardcoded in callers.',
                'عمولة 10% الافتراضية موجودة في إعدادات محرك العمولة فقط — قابلة للتعديل وليست مثبتة في الكود.',
              )}
            </p>
          </Panel>
        </>
      ) : null}

      {tab === 'pages' ? (
        <Panel
          title={t('Dynamic pages', 'صفحات ديناميكية')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const title = window.prompt('Page title', 'New landing');
                if (!title) return;
                runAction('upsertPage', {
                  title,
                  titleAr: title,
                  slug: `pages/${title.toLowerCase().replace(/\s+/g, '-')}`,
                  status: 'draft',
                  sections: [{ id: 'main', type: 'content', titleKey: 'portal.welcome' }],
                });
              }}
            >
              {t('Create page', 'إنشاء صفحة')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'slug', label: 'Slug' },
              { key: 'status', label: 'Status' },
              { key: 'version', label: 'Ver' },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button type="button" disabled={busy || r.status === 'published'} onClick={() => runAction('publishPage', { id: r.id })}>
                    {t('Publish', 'نشر')}
                  </button>
                ),
              },
            ]}
            rows={data?.pages || []}
          />
        </Panel>
      ) : null}

      {tab === 'labels' ? (
        <Panel
          title={t('Dynamic titles & labels', 'عناوين وتسميات ديناميكية')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const key = window.prompt('Label key', 'portal.custom.hello');
                if (!key) return;
                const en = window.prompt('English', 'Hello {{user_name}}');
                const ar = window.prompt('Arabic', 'مرحباً {{user_name}}');
                runAction('upsertLabel', { key, en, ar, contexts: { userType: ['*'] } });
              }}
            >
              {t('Add label', 'إضافة تسمية')}
            </button>
          }
        >
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            Variables: {(data?.catalog?.textVariables || []).map((v) => `{{${v}}}`).join(' · ')}
          </div>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'en', label: 'EN' },
              { key: 'ar', label: 'AR' },
              { key: 'version', label: 'Ver' },
            ]}
            rows={data?.labels || []}
          />
        </Panel>
      ) : null}

      {tab === 'navigation' ? (
        <Panel title={t('Dynamic navigation (seeded from Admin nav)', 'تنقل ديناميكي (من قائمة الأدمن)')}>
          <Table
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'route', label: 'Route' },
              { key: 'group', label: 'Group' },
              { key: 'order', label: 'Order' },
              { key: 'status', label: 'Status' },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const title = window.prompt('Title', r.title);
                      if (!title) return;
                      runAction('upsertNav', { key: r.key, title, titleAr: title, route: r.route, order: r.order, surface: r.surface, group: r.group });
                    }}
                  >
                    {t('Edit', 'تعديل')}
                  </button>
                ),
              },
            ]}
            rows={(data?.nav || []).slice(0, 40)}
          />
        </Panel>
      ) : null}

      {tab === 'buttons' ? (
        <Panel title={t('Configurable actions (all functional)', 'إجراءات قابلة للتهيئة')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'title', label: 'Title' },
              { key: 'action', label: 'Action' },
              { key: 'confirmation', label: 'Confirm', render: (r) => String(r.confirmation) },
              { key: 'functional', label: 'Functional', render: (r) => String(r.functional) },
            ]}
            rows={data?.buttons || []}
          />
        </Panel>
      ) : null}

      {tab === 'forms' ? (
        <Panel title={t('Form builder registry', 'سجل منشئ النماذج')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'title', label: 'Title' },
              { key: 'audience', label: 'Audience' },
              {
                key: 'fields',
                label: 'Fields',
                render: (r) => (r.fields || []).map((f) => f.key).join(', '),
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.forms || []}
          />
        </Panel>
      ) : null}

      {tab === 'filters' ? (
        <Panel
          title={t('Dependent filter chains', 'سلاسل فلاتر مرتبطة')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('applyFilterDependency', {
                  chainKey: 'education_onboarding',
                  selections: { country: 'JO', educational_system: '', grade: '5' },
                }).then((r) => setResolved(r))
              }
            >
              {t('Demo parent reset', 'تجربة إعادة الأبناء')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'key', label: 'Chain' },
              { key: 'label', label: 'Label' },
              {
                key: 'steps',
                label: 'Steps',
                render: (r) => (r.steps || []).map((s) => `${s.key}${s.dependsOn ? `←${s.dependsOn}` : ''}`).join(' · '),
              },
            ]}
            rows={data?.filters || []}
          />
        </Panel>
      ) : null}

      {tab === 'journeys' ? (
        <Panel title={t('User journey builder', 'منشئ رحلات المستخدم')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'type', label: 'Type' },
              { key: 'title', label: 'Title' },
              {
                key: 'steps',
                label: 'Steps',
                render: (r) => (r.steps || []).length,
              },
              { key: 'draftSaving', label: 'Draft', render: (r) => String(r.draftSaving) },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.journeys || []}
          />
        </Panel>
      ) : null}

      {tab === 'dashboards' ? (
        <Panel title={t('Dashboard builder', 'منشئ لوحات التحكم')}>
          <Table
            columns={[
              { key: 'key', label: 'Type' },
              { key: 'title', label: 'Title' },
              {
                key: 'widgets',
                label: 'Widgets',
                render: (r) => (r.widgets || []).map((w) => w.type).join(', '),
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.dashboards || []}
          />
        </Panel>
      ) : null}

      {tab === 'tables' ? (
        <Panel title={t('Data table engine', 'محرك الجداول')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'title', label: 'Title' },
              {
                key: 'columns',
                label: 'Columns',
                render: (r) => (r.columns || []).filter((c) => c.visible).map((c) => c.key).join(', '),
              },
              {
                key: 'features',
                label: 'Features',
                render: (r) =>
                  Object.entries(r.features || [])
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .slice(0, 6)
                    .join(', '),
              },
            ]}
            rows={data?.tables || []}
          />
        </Panel>
      ) : null}

      {tab === 'settings' ? (
        <Panel
          title={t('Settings registry (inheritance)', 'سجل الإعدادات (توارث)')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const value = window.prompt('Default currency', 'USD');
                if (!value) return;
                runAction('upsertSetting', { key: 'platform.default_currency', level: 'global', value, category: 'finance' });
              }}
            >
              {t('Edit currency', 'تعديل العملة')}
            </button>
          }
        >
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            Levels: {(data?.catalog?.settingsLevels || []).join(' → ')}
          </div>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'level', label: 'Level' },
              { key: 'scope', label: 'Scope' },
              { key: 'value', label: 'Value', render: (r) => JSON.stringify(r.value) },
              { key: 'category', label: 'Category' },
            ]}
            rows={data?.settings || []}
          />
        </Panel>
      ) : null}

      {tab === 'flags' ? (
        <Panel title={t('Feature flags', 'أعلام الميزات')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'label', label: 'Label' },
              { key: 'enabled', label: 'On', render: (r) => String(r.enabled) },
              { key: 'rolloutPercent', label: '%' },
              { key: 'emergencyDisabled', label: 'Kill', render: (r) => String(r.emergencyDisabled) },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runAction('setFlag', { key: r.key, enabled: !r.enabled, rolloutPercent: r.rolloutPercent })}
                  >
                    {r.enabled ? t('Disable', 'إيقاف') : t('Enable', 'تفعيل')}
                  </button>
                ),
              },
            ]}
            rows={data?.flags || []}
          />
        </Panel>
      ) : null}

      {tab === 'notifications' ? (
        <Panel title={t('Notification templates', 'قوالب الإشعارات')}>
          <Table
            columns={[
              { key: 'trigger', label: 'Trigger' },
              {
                key: 'channels',
                label: 'Channels',
                render: (r) => (r.channels || []).join(', '),
              },
              { key: 'titleEn', label: 'Title EN' },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.notifications || []}
          />
        </Panel>
      ) : null}

      {tab === 'workflows' ? (
        <Panel title={t('Workflow & approval engine', 'محرك سير العمل والموافقات')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'title', label: 'Title' },
              { key: 'trigger', label: 'Trigger' },
              {
                key: 'steps',
                label: 'Steps',
                render: (r) => (r.steps || []).map((s) => s.type).join(' → '),
              },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.workflows || []}
          />
        </Panel>
      ) : null}

      {tab === 'branding' ? (
        <Panel
          title={t('Platform branding', 'هوية المنصة')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const primaryColor = window.prompt('Primary color', data?.branding?.[0]?.primaryColor || '#0f766e');
                if (!primaryColor) return;
                runAction('updateBranding', { primaryColor, brandName: data?.branding?.[0]?.brandName || 'Success OS' });
              }}
            >
              {t('Update colors', 'تحديث الألوان')}
            </button>
          }
        >
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', padding: 12, borderRadius: 10, overflow: 'auto' }}>
            {JSON.stringify(data?.branding?.[0] || {}, null, 2)}
          </pre>
        </Panel>
      ) : null}

      {tab === 'resolve' ? (
        <Panel
          title={t('Resolve context bundle', 'حل حزمة السياق')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('resolveContext', {
                  context: {
                    ...ctx,
                    commission_rate: ctx.commission_rate || data?.stats?.commissionDefaultPercent,
                  },
                })
              }
            >
              {t('Resolve', 'حل')}
            </button>
          }
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {['role', 'userType', 'country', 'language', 'institutionType', 'user_name'].map((k) => (
              <input
                key={k}
                value={ctx[k]}
                onChange={(e) => setCtx((c) => ({ ...c, [k]: e.target.value }))}
                placeholder={k}
                style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb', width: 120 }}
              />
            ))}
          </div>
          <pre style={{ margin: 0, fontSize: 12, background: '#f0fdfa', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 420 }}>
            {JSON.stringify(resolved, null, 2)}
          </pre>
        </Panel>
      ) : null}

      {tab === 'quality' ? (
        <Panel
          title={t('Quality audit findings', 'نتائج تدقيق الجودة')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('qualityAudit')}>
              {t('Re-scan', 'إعادة فحص')}
            </button>
          }
        >
          <p style={{ fontSize: 13, color: '#334155' }}>
            {t(
              'Detects hardcoded titles, percentages, placeholders, and roles — recommends moving to DPE config without rebuilding modules.',
              'يكتشف العناوين والنسب والعناصر المؤقتة والأدوار المثبتة — ويوصي بنقلها لإعدادات DPE دون إعادة بناء الوحدات.',
            )}
          </p>
          <Table
            columns={[
              { key: 'severity', label: 'Severity' },
              { key: 'category', label: 'Category' },
              { key: 'file', label: 'File' },
              { key: 'line', label: 'Line' },
              { key: 'snippet', label: 'Snippet' },
            ]}
            rows={data?.quality || []}
          />
        </Panel>
      ) : null}
    </div>
  );
}

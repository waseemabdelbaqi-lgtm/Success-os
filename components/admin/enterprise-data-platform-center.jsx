'use client';

import { useCallback, useEffect, useState } from 'react';

const TABS = [
  { id: 'intelligence', label: 'Owner Intelligence', labelAr: 'ذكاء المالك' },
  { id: 'graph', label: 'Knowledge Graph', labelAr: 'الرسم المعرفي' },
  { id: 'learning', label: 'Learning Graph', labelAr: 'رسم التعلم' },
  { id: 'skills', label: 'Skills Graph', labelAr: 'رسم المهارات' },
  { id: 'twins', label: 'Digital Twins', labelAr: 'التوائم الرقمية' },
  { id: 'personalization', label: 'Personalization', labelAr: 'التخصيص' },
  { id: 'recommendations', label: 'Recommendations', labelAr: 'التوصيات' },
  { id: 'predictions', label: 'Predictions', labelAr: 'التنبؤات' },
  { id: 'decisions', label: 'Decision Support', labelAr: 'دعم القرار' },
  { id: 'events', label: 'Event Stream', labelAr: 'تيار الأحداث' },
  { id: 'features', label: 'Feature Store', labelAr: 'مخزن السمات' },
  { id: 'governance', label: 'Governance', labelAr: 'الحوكمة' },
  { id: 'quality', label: 'Data Quality', labelAr: 'جودة البيانات' },
  { id: 'search', label: 'Search', labelAr: 'البحث' },
  { id: 'semantic', label: 'Semantic Layer', labelAr: 'الطبقة الدلالية' },
  { id: 'ai', label: 'AI Pipeline', labelAr: 'خط الذكاء' },
  { id: 'simulation', label: 'Simulation', labelAr: 'المحاكاة' },
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
                  {c.render ? c.render(row) : (typeof row[c.key] === 'object' ? JSON.stringify(row[c.key]) : row[c.key]) ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EnterpriseDataPlatformCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('intelligence');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [filters, setFilters] = useState({ country: '', tenant: '' });
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [simType, setSimType] = useState('commission_change');
  const [audience, setAudience] = useState('owner');

  const isAr = lang === 'ar';
  const t = (en, ar) => (isAr ? ar : en);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ view: 'dashboard' });
    if (filters.country) params.set('country', filters.country);
    if (filters.tenant) params.set('tenant', filters.tenant);
    const res = await fetch(`/api/data-platform?${params}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Data Platform');
    setData(await res.json());
  }, [filters]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/data-platform?view=stream');
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
      const res = await fetch('/api/data-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'search') setSearchResults(json.results || []);
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
  const intel = data?.intelligence || {};

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            {t('Enterprise Data Platform & Digital Twin', 'منصة البيانات المؤسسية والتوأم الرقمي')}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'Unified graph · events · features · twins · Owner intelligence',
              'رسم موحّد · أحداث · سمات · توائم · ذكاء المالك',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'ع'}</button>
          <button type="button" disabled={busy} onClick={() => load()}>{t('Refresh', 'تحديث')}</button>
          <button type="button" disabled={busy} onClick={() => runAction('ingestFromErpModules')}>{t('Ingest ERP', 'استيعاب ERP')}</button>
          <button type="button" disabled={busy} onClick={() => runAction('syncAllTwins')}>{t('Sync twins', 'مزامنة التوائم')}</button>
        </div>
      </div>

      {data?.config?.disclaimer ? (
        <p style={{ background: '#ecfeff', border: '1px solid #22d3ee', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#155e75' }}>
          {data.config.disclaimer}
        </p>
      ) : null}

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder={t('Country', 'الدولة')} value={filters.country} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        <input placeholder={t('Tenant', 'المستأجر')} value={filters.tenant} onChange={(e) => setFilters((f) => ({ ...f, tenant: e.target.value }))} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
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

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginBottom: 14 }}>
        <Stat label={t('Health', 'الصحة')} value={stats.businessHealth} />
        <Stat label={t('Entities', 'كيانات')} value={stats.entities} />
        <Stat label={t('Edges', 'علاقات')} value={stats.edges} />
        <Stat label={t('Twins', 'توائم')} value={stats.twins} />
        <Stat label={t('Events', 'أحداث')} value={stats.events} />
        <Stat label={t('Features', 'سمات')} value={stats.features} />
        <Stat label={t('Predictions', 'تنبؤات')} value={stats.predictions} />
        <Stat label={t('Quality open', 'جودة مفتوحة')} value={stats.qualityOpen} />
      </div>

      {tab === 'intelligence' ? (
        <>
          <Panel title={t('Business health & growth', 'صحة النمو والأعمال')}>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
              <Stat label="Score" value={intel.businessHealth?.score} />
              <Stat label="Twins" value={intel.businessHealth?.twins} />
              <Stat label="Events 24h" value={intel.businessHealth?.events24h} />
              <Stat label="Quality open" value={intel.businessHealth?.qualityOpen} />
              <Stat label="Entities" value={intel.growth?.entities} />
              <Stat label="Edges" value={intel.growth?.edges} />
            </div>
          </Panel>
          <Panel title={t('Risks & predictions', 'المخاطر والتنبؤات')}>
            <Table
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'score', label: 'Score' },
                { key: 'confidence', label: 'Confidence' },
                { key: 'why', label: 'Why' },
                { key: 'requiredAction', label: 'Action' },
              ]}
              rows={intel.risks || []}
            />
          </Panel>
          <Panel title={t('Country comparison', 'مقارنة الدول')}>
            <Table
              columns={[
                { key: 'country', label: 'Country', render: (r) => r.country },
                { key: 'entities', label: 'Entities' },
                { key: 'kinds', label: 'Kinds', render: (r) => Object.keys(r.kinds || {}).join(', ') },
              ]}
              rows={Object.entries(intel.countryComparison || {}).map(([country, v]) => ({ country, ...v }))}
            />
          </Panel>
          <Panel title={t('AI & educational impact', 'أثر الذكاء والتعليم')}>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              <li>Recommendations: {intel.aiPerformance?.recommendations}</li>
              <li>Feature store: {intel.aiPerformance?.featureStoreSize}</li>
              <li>Training jobs: {intel.aiPerformance?.trainingJobs}</li>
              <li>Learning rows: {intel.educationalImpact?.learningProgressRows}</li>
              <li>Mastery features: {intel.educationalImpact?.masteryFeatures}</li>
              <li>Revenue feature: {String(intel.financialHealth?.revenueFeature)}</li>
            </ul>
          </Panel>
        </>
      ) : null}

      {tab === 'graph' ? (
        <Panel
          title={t('Global knowledge graph', 'الرسم المعرفي العالمي')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('linkEntities', {
                  fromKind: 'student',
                  fromKey: 'demo-student-1',
                  type: 'similar_to',
                  toKind: 'career',
                  toKey: 'data-analyst',
                  tenantId: 'global',
                  allowCustom: true,
                })
              }
            >
              {t('Add demo edge', 'إضافة علاقة تجريبية')}
            </button>
          }
        >
          <p style={{ fontSize: 13 }}>
            {t('Kinds', 'أنواع')}: {data?.graph?.kindsSupported} · {t('Edge types', 'أنواع العلاقات')}: {data?.graph?.edgeTypesSupported}
          </p>
          <Table
            columns={[
              { key: 'kind', label: 'Kind' },
              { key: 'key', label: 'Key' },
              { key: 'name', label: 'Name' },
              { key: 'country', label: 'Country' },
              { key: 'confidence', label: 'Confidence' },
            ]}
            rows={data?.entities || []}
          />
          <h4 style={{ marginTop: 16 }}>{t('Edges', 'العلاقات')}</h4>
          <Table
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'fromId', label: 'From' },
              { key: 'toId', label: 'To' },
              { key: 'weight', label: 'Weight' },
            ]}
            rows={data?.edges || []}
          />
        </Panel>
      ) : null}

      {tab === 'learning' ? (
        <Panel
          title={t('Learning journey updates', 'تحديثات رحلة التعلم')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('updateLearningProgress', {
                  studentKey: 'demo-student-1',
                  step: 'quiz',
                  resourceKind: 'lesson',
                  resourceKey: 'math-g10-l1',
                  score: 0.72,
                  mastery: 0.72,
                  weakness: ['algebra'],
                  strength: ['arithmetic'],
                  country: 'JO',
                  tenantId: 'global',
                })
              }
            >
              {t('Record progress', 'تسجيل تقدم')}
            </button>
          }
        >
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Path: {(data?.config?.learningPath || []).join(' → ')}
          </p>
          <Table
            columns={[
              { key: 'studentKey', label: 'Student' },
              { key: 'step', label: 'Step' },
              { key: 'mastery', label: 'Mastery' },
              { key: 'weakness', label: 'Weakness', render: (r) => (r.weakness || []).join(', ') },
              { key: 'at', label: 'At' },
            ]}
            rows={data?.learning || []}
          />
        </Panel>
      ) : null}

      {tab === 'skills' ? (
        <Panel
          title={t('Skills / career mapping', 'ربط المهارات والمسارات')}
          actions={<button type="button" disabled={busy} onClick={() => runAction('getSkillsGraph', { tenantId: 'global' })}>{t('Refresh skills graph', 'تحديث رسم المهارات')}</button>}
        >
          <Table
            columns={[
              { key: 'kind', label: 'Kind' },
              { key: 'name', label: 'Name' },
              { key: 'key', label: 'Key' },
              { key: 'country', label: 'Country' },
            ]}
            rows={(data?.entities || []).filter((e) =>
              ['skill', 'competency', 'certification', 'degree', 'job', 'career', 'employer', 'learningOutcome'].includes(e.kind),
            )}
          />
        </Panel>
      ) : null}

      {tab === 'twins' ? (
        <Panel title={t('Digital twins', 'التوائم الرقمية')} actions={<button type="button" disabled={busy} onClick={() => runAction('syncAllTwins')}>{t('Sync all', 'مزامنة الكل')}</button>}>
          <Table
            columns={[
              { key: 'kind', label: 'Twin kind' },
              { key: 'subjectId', label: 'Subject' },
              { key: 'lastSyncedAt', label: 'Synced' },
              { key: 'confidence', label: 'Confidence' },
              {
                key: 'snapshot',
                label: 'Snapshot',
                render: (r) => `degree=${r.snapshot?.graphDegree ?? '—'} mastery=${r.snapshot?.mastery ?? '—'}`,
              },
            ]}
            rows={data?.twins || []}
          />
        </Panel>
      ) : null}

      {tab === 'personalization' ? (
        <Panel
          title={t('Personalization engine', 'محرك التخصيص')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('resolvePersonalization', {
                  userId: 'demo-student-1',
                  goals: 'STEM career',
                  age: 16,
                  country: 'JO',
                  performance: 0.45,
                  interests: 'math',
                  career: 'data-analyst',
                  curriculum: 'jordan-g10',
                  language: isAr ? 'ar' : 'en',
                  learning_style: 'visual',
                  tenantId: 'global',
                })
              }
            >
              {t('Resolve profile', 'حل الملف')}
            </button>
          }
        >
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            Dimensions: {(data?.config?.personalizationDimensions || []).join(', ')}
          </p>
          <Table
            columns={[
              { key: 'userId', label: 'User' },
              { key: 'layout', label: 'Layout', render: (r) => JSON.stringify(r.layout) },
              { key: 'at', label: 'At' },
            ]}
            rows={data?.personalization || []}
          />
        </Panel>
      ) : null}

      {tab === 'recommendations' ? (
        <Panel
          title={t('Recommendation engine', 'محرك التوصيات')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('generateRecommendations', { studentKey: 'demo-student-1', country: 'JO', tenantId: 'global' })}>
              {t('Generate', 'توليد')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'targetName', label: 'Target' },
              { key: 'why', label: 'Why' },
              { key: 'confidence', label: 'Confidence' },
              { key: 'requiredAction', label: 'Action' },
            ]}
            rows={data?.recommendations || []}
          />
        </Panel>
      ) : null}

      {tab === 'predictions' ? (
        <Panel
          title={t('Predictive analytics', 'تحليلات تنبؤية')}
          actions={
            <button type="button" disabled={busy} onClick={() => runAction('generatePredictions', { studentKey: 'demo-student-1', country: 'JO', tenantId: 'global' })}>
              {t('Generate', 'توليد')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'score', label: 'Score' },
              { key: 'confidence', label: 'Confidence' },
              { key: 'why', label: 'Why' },
              { key: 'requiredAction', label: 'Action' },
            ]}
            rows={data?.predictions || []}
          />
        </Panel>
      ) : null}

      {tab === 'decisions' ? (
        <Panel
          title={t('Decision support packs', 'حزم دعم القرار')}
          actions={
            <>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                {(data?.config?.decisionAudiences || ['owner']).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button type="button" disabled={busy} onClick={() => runAction('buildDecisionSupport', { audience, tenantId: 'global' })}>
                {t('Build pack', 'بناء حزمة')}
              </button>
            </>
          }
        >
          {(data?.decisions || []).map((pack) => (
            <div key={pack.id} style={{ marginBottom: 12 }}>
              <strong>{pack.audience}</strong> · {pack.at}
              <Table
                columns={[
                  { key: 'title', label: 'Title' },
                  { key: 'why', label: 'Why' },
                  { key: 'confidence', label: 'Confidence' },
                  { key: 'requiredAction', label: 'Action' },
                ]}
                rows={pack.recommendations || []}
              />
            </div>
          ))}
        </Panel>
      ) : null}

      {tab === 'events' ? (
        <Panel
          title={t('Structured event stream', 'تيار الأحداث المهيكل')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                runAction('ingestEvent', {
                  type: 'lesson',
                  actorId: 'global:student:demo-student-1',
                  tenantId: 'global',
                  country: 'JO',
                  module: 'lessons',
                  payload: { lessonKey: 'math-g10-l1' },
                })
              }
            >
              {t('Ingest lesson event', 'تسجيل حدث درس')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'at', label: 'At' },
              { key: 'type', label: 'Type' },
              { key: 'actorId', label: 'Actor' },
              { key: 'tenantId', label: 'Tenant' },
              { key: 'country', label: 'Country' },
            ]}
            rows={data?.events || []}
          />
        </Panel>
      ) : null}

      {tab === 'features' ? (
        <Panel title={t('Feature store', 'مخزن السمات')}>
          <Table
            columns={[
              { key: 'key', label: 'Feature' },
              { key: 'subjectId', label: 'Subject' },
              { key: 'value', label: 'Value' },
              { key: 'expiresAt', label: 'Expires' },
              { key: 'domain', label: 'Domain' },
            ]}
            rows={data?.features || []}
          />
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Defined features: {(data?.config?.featureDefs || []).map((f) => f.key).join(', ')}
          </p>
        </Panel>
      ) : null}

      {tab === 'governance' ? (
        <>
          <Panel title={t('Metadata / schema registry', 'سجل المخططات')}>
            <Table
              columns={[
                { key: 'name', label: 'Schema' },
                { key: 'version', label: 'Version' },
                { key: 'owner', label: 'Owner' },
                { key: 'status', label: 'Status' },
              ]}
              rows={data?.schemas || []}
            />
          </Panel>
          <Panel title={t('Data stewards', 'مسؤولو البيانات')}>
            <Table
              columns={[
                { key: 'domain', label: 'Domain' },
                { key: 'steward', label: 'Steward' },
                { key: 'responsibilities', label: 'Owns', render: (r) => (r.responsibilities || []).join(', ') },
              ]}
              rows={data?.stewards || []}
            />
          </Panel>
          <Panel title={t('Lineage', 'النسب')}>
            <Table
              columns={[
                { key: 'at', label: 'At' },
                { key: 'action', label: 'Action' },
                { key: 'entityId', label: 'Entity' },
                { key: 'from', label: 'From' },
                { key: 'to', label: 'To' },
              ]}
              rows={data?.lineage || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'quality' ? (
        <Panel
          title={t('Data quality findings', 'نتائج جودة البيانات')}
          actions={<button type="button" disabled={busy} onClick={() => runAction('runDataQualityScan')}>{t('Run scan', 'تشغيل الفحص')}</button>}
        >
          <Table
            columns={[
              { key: 'ruleId', label: 'Rule' },
              { key: 'type', label: 'Type' },
              { key: 'severity', label: 'Severity' },
              { key: 'message', label: 'Message' },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.quality || []}
          />
        </Panel>
      ) : null}

      {tab === 'search' ? (
        <Panel
          title={t('Permission-aware search', 'بحث واعٍ بالصلاحيات')}
          actions={
            <>
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={t('Query', 'استعلام')} style={{ padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button type="button" disabled={busy} onClick={() => runAction('search', { q: searchQ, tenantId: filters.tenant || undefined, country: filters.country || undefined, permissions: ['users.read'] })}>
                {t('Search', 'بحث')}
              </button>
              <button type="button" disabled={busy} onClick={() => runAction('rebuildSearchIndex')}>{t('Rebuild index', 'إعادة الفهرسة')}</button>
            </>
          }
        >
          <Table
            columns={[
              { key: 'kind', label: 'Kind' },
              { key: 'name', label: 'Name' },
              { key: 'country', label: 'Country' },
              { key: 'tenantId', label: 'Tenant' },
            ]}
            rows={searchResults.length ? searchResults : []}
            empty={t('Run a search', 'نفّذ بحثًا')}
          />
          <p style={{ fontSize: 12, color: '#6b7280' }}>Indexed docs: {stats.searchDocs}</p>
        </Panel>
      ) : null}

      {tab === 'semantic' ? (
        <Panel title={t('Business semantic layer', 'الطبقة الدلالية للأعمال')}>
          <Table
            columns={[
              { key: 'key', label: 'Term' },
              { key: 'definition', label: 'Definition' },
              { key: 'owner', label: 'Owner' },
              { key: 'aliases', label: 'Aliases', render: (r) => (r.aliases || []).join(', ') },
            ]}
            rows={data?.masters || []}
          />
        </Panel>
      ) : null}

      {tab === 'ai' ? (
        <Panel
          title={t('AI training data pipeline (anonymized)', 'خط بيانات تدريب الذكاء (مجهّل)')}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction('prepareAiTrainingDataset', { purpose: 'student_success_prediction', authorized: true, tenantId: 'global' })}
            >
              {t('Prepare dataset', 'تجهيز مجموعة')}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'purpose', label: 'Purpose' },
              { key: 'rowCount', label: 'Rows' },
              { key: 'anonymized', label: 'Anonymized', render: (r) => String(r.anonymized) },
              { key: 'status', label: 'Status' },
              { key: 'at', label: 'At' },
            ]}
            rows={data?.trainingJobs || []}
          />
        </Panel>
      ) : null}

      {tab === 'simulation' ? (
        <Panel
          title={t('Simulation before activation', 'محاكاة قبل التفعيل')}
          actions={
            <>
              <select value={simType} onChange={(e) => setSimType(e.target.value)}>
                {(data?.config?.simulationTypes || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction('runSimulation', {
                    type: simType,
                    newRate: 0.12,
                    monthlyVolume: 100000,
                    newPrice: 55,
                    currentPrice: 50,
                    subscribers: 1000,
                    country: 'SA',
                    expectedStudents: 800,
                    lessons: 40,
                    newChurn: 0.035,
                  })
                }
              >
                {t('Run simulation', 'تشغيل المحاكاة')}
              </button>
            </>
          }
        >
          <Table
            columns={[
              { key: 'type', label: 'Type' },
              { key: 'baseline', label: 'Baseline' },
              { key: 'projected', label: 'Projected' },
              { key: 'impact', label: 'Impact' },
              { key: 'confidence', label: 'Confidence' },
            ]}
            rows={data?.simulations || []}
          />
        </Panel>
      ) : null}

      <Panel title={t('Recent data platform audit', 'تدقيق منصة البيانات')}>
        <Table
          columns={[
            { key: 'at', label: 'At' },
            { key: 'action', label: 'Action' },
            { key: 'actor', label: 'Actor' },
            { key: 'tenantId', label: 'Tenant' },
          ]}
          rows={data?.auditTrail || []}
        />
      </Panel>
    </div>
  );
}

export default EnterpriseDataPlatformCenter;

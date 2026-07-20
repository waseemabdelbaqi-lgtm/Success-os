'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'orchestrator', label: 'Orchestrator', labelAr: 'المنسّق' },
  { id: 'agents', label: 'Agents', labelAr: 'الوكلاء' },
  { id: 'run', label: 'Run Agent', labelAr: 'تشغيل وكيل' },
  { id: 'memory', label: 'Memory', labelAr: 'الذاكرة' },
  { id: 'prompts', label: 'Prompts', labelAr: 'الأوامر' },
  { id: 'providers', label: 'Multi-LLM', labelAr: 'مزودو الذكاء' },
  { id: 'governance', label: 'Governance', labelAr: 'الحوكمة' },
  { id: 'reviews', label: 'Human Review', labelAr: 'مراجعة بشرية' },
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات' },
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

export function EnterpriseAiAgentsCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [familyFilter, setFamilyFilter] = useState('all');
  const [agentKey, setAgentKey] = useState('');
  const [message, setMessage] = useState('');
  const [lastRun, setLastRun] = useState(null);
  const [memoryContent, setMemoryContent] = useState('');
  const [memoryScope, setMemoryScope] = useState('session');

  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/ai-agents?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load AI Agents OS');
    const json = await res.json();
    setData(json);
    if (!agentKey && json.agents?.[0]?.key) setAgentKey(json.agents.find((a) => a.family !== 'orchestrator')?.key || json.agents[0].key);
  }, [agentKey]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/ai-agents?view=stream');
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
      const res = await fetch('/api/ai-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'orchestrate' || action === 'runAgent' || action === 'chat') setLastRun(json);
      await load();
      return json;
    } catch (e) {
      setError(e.message || 'action failed');
      return null;
    } finally {
      setBusy(false);
    }
  }

  const families = data?.catalog?.families || [];
  const agents = useMemo(() => {
    const list = data?.agents || [];
    if (familyFilter === 'all') return list;
    return list.filter((a) => a.family === familyFilter);
  }, [data, familyFilter]);

  const t = (en, ar) => (isAr ? ar : en);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>{t('AI Agents Operating System', 'نظام تشغيل وكلاء الذكاء الاصطناعي')}</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>
            {t(
              'Master Orchestrator · shared knowledge · memory · multi-LLM · governance',
              'المنسّق الرئيسي · معرفة مشتركة · ذاكرة · مزودون متعددون · حوكمة',
            )}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {live ? ` · ${t('Live', 'مباشر')}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'ع'}</button>
          <button type="button" disabled={busy} onClick={() => load()}>{t('Refresh', 'تحديث')}</button>
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
            <Stat label={t('Agents', 'الوكلاء')} value={data?.stats?.agents} />
            <Stat label={t('Active', 'نشط')} value={data?.stats?.activeAgents} />
            <Stat label={t('Runs', 'التشغيلات')} value={data?.stats?.runs} />
            <Stat label={t('Pending Reviews', 'مراجعات معلّقة')} value={data?.stats?.pendingReviews} />
            <Stat label={t('Memories', 'الذكريات')} value={data?.stats?.memories} />
            <Stat label={t('Cost USD', 'التكلفة')} value={data?.stats?.costUsd} />
            <Stat label={t('Avg Quality', 'متوسط الجودة')} value={data?.stats?.avgQuality} />
            <Stat label={t('LLM Configured', 'مزودون مهيأون')} value={data?.stats?.providersConfigured} />
          </div>
          <Panel title={t('Agent Families', 'عائلات الوكلاء')}>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
              {families.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setFamilyFilter(f.key);
                    setTab('agents');
                  }}
                  style={{ textAlign: 'start', padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc' }}
                >
                  <div style={{ fontWeight: 700 }}>{isAr ? f.labelAr : f.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{f.agentCount} agents · {f.portal}</div>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={t('Recent Runs', 'أحدث التشغيلات')}>
            <Table
              columns={[
                { key: 'agentKey', label: 'Agent' },
                { key: 'provider', label: 'Provider' },
                { key: 'quality', label: 'Quality' },
                { key: 'costUsd', label: 'Cost' },
                { key: 'status', label: 'Status' },
                { key: 'createdAt', label: 'At' },
              ]}
              rows={data?.runs || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'orchestrator' ? (
        <Panel title={t('Master AI Controller', 'المتحكم الرئيسي')}>
          <p style={{ color: '#334155', fontSize: 14 }}>
            {t(
              'All agents communicate only through the orchestrator. Shared permissions, knowledge graph, ERP, CRM, finance, marketplace, workflow, analytics, and notifications.',
              'كل الوكلاء يتواصلون عبر المنسّق فقط. صلاحيات ومعرفة وERP وCRM ومالية وسوق وسير عمل وتحليلات وإشعارات مشتركة.',
            )}
          </p>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>
            {(data?.catalog?.orchestratorCapabilities || []).map((c) => (
              <li key={c}>{c.replace(/_/g, ' ')}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <strong>{t('Shared knowledge', 'المعرفة المشتركة')}:</strong>{' '}
            {(data?.catalog?.sharedKnowledge || []).join(' · ')}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#0f766e' }}>
            Health circuits: {(data?.health?.circuits || []).length} · automatic fallback:{' '}
            {String(data?.health?.selection?.automaticFallback)}
          </div>
        </Panel>
      ) : null}

      {tab === 'agents' ? (
        <Panel
          title={t('Specialized Agents', 'الوكلاء المتخصصون')}
          actions={
            <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}>
              <option value="all">{t('All families', 'كل العائلات')}</option>
              {families.map((f) => (
                <option key={f.key} value={f.key}>
                  {isAr ? f.labelAr : f.label}
                </option>
              ))}
            </select>
          }
        >
          <Table
            columns={[
              { key: 'name', label: t('Name', 'الاسم'), render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'family', label: t('Family', 'العائلة') },
              { key: 'portal', label: 'Portal' },
              { key: 'runs', label: t('Runs', 'تشغيل') },
              { key: 'avgQuality', label: t('Quality', 'الجودة') },
              { key: 'status', label: t('Status', 'الحالة') },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setAgentKey(r.key);
                      setTab('run');
                    }}
                  >
                    {t('Run', 'تشغيل')}
                  </button>
                ),
              },
            ]}
            rows={agents}
          />
        </Panel>
      ) : null}

      {tab === 'run' ? (
        <Panel title={t('Orchestrated Run', 'تشغيل عبر المنسّق')}>
          <div style={{ display: 'grid', gap: 10, maxWidth: 720 }}>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              {t('Agent', 'الوكيل')}
              <select value={agentKey} onChange={(e) => setAgentKey(e.target.value)}>
                {(data?.agents || [])
                  .filter((a) => a.family !== 'orchestrator')
                  .map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.family} · {isAr ? a.nameAr || a.name : a.name}
                    </option>
                  ))}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              {t('Message / Goal', 'الرسالة / الهدف')}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={t('Describe the task…', 'صف المهمة…')}
                style={{ padding: 10, borderRadius: 10, border: '1px solid #e5e7eb' }}
              />
            </label>
            <button
              type="button"
              disabled={busy || !message.trim()}
              onClick={() => runAction('orchestrate', { agentKey, message, subject: 'math', sessionId: 'owner-session' })}
              style={{ background: '#0f766e', color: '#fff', border: 0, borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}
            >
              {busy ? t('Running…', 'جارٍ التشغيل…') : t('Send via Orchestrator', 'إرسال عبر المنسّق')}
            </button>
          </div>
          {lastRun?.run ? (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: '#f0fdfa', border: '1px solid #99f6e4' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {lastRun.orchestrator?.routedTo} · {lastRun.run.provider} · Q={lastRun.run.quality} · ${lastRun.run.costUsd}
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 13 }}>{lastRun.run.output}</pre>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {tab === 'memory' ? (
        <>
          <Panel title={t('Write Memory', 'كتابة ذاكرة')}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <select value={memoryScope} onChange={(e) => setMemoryScope(e.target.value)}>
                {(data?.catalog?.memoryScopes || []).map((s) => (
                  <option key={s.key} value={s.key}>
                    {isAr ? s.labelAr : s.label}
                  </option>
                ))}
              </select>
              <input
                value={memoryContent}
                onChange={(e) => setMemoryContent(e.target.value)}
                placeholder={t('Memory content', 'محتوى الذاكرة')}
                style={{ flex: 1, minWidth: 220, padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <button
                type="button"
                disabled={busy || !memoryContent.trim()}
                onClick={() =>
                  runAction('writeMemory', {
                    scope: memoryScope,
                    content: memoryContent,
                    userId: 'owner',
                    orgId: 'platform',
                    sessionId: 'owner-session',
                  }).then(() => setMemoryContent(''))
                }
              >
                {t('Save', 'حفظ')}
              </button>
            </div>
          </Panel>
          <Panel title={t('Recent Memories', 'أحدث الذكريات')}>
            <Table
              columns={[
                { key: 'scope', label: t('Scope', 'النطاق') },
                { key: 'summary', label: t('Summary', 'الملخص') },
                { key: 'agentKey', label: 'Agent' },
                { key: 'updatedAt', label: 'At' },
              ]}
              rows={data?.memories || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'prompts' ? (
        <Panel title={t('Shared Prompt Library (versioned)', 'مكتبة الأوامر المشتركة (نسخ)')}>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'title', label: t('Title', 'العنوان') },
              { key: 'version', label: 'Ver' },
              {
                key: 'body',
                label: t('Body', 'النص'),
                render: (r) => <span style={{ display: 'inline-block', maxWidth: 420 }}>{String(r.body || '').slice(0, 140)}…</span>,
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const body = window.prompt('New prompt body', r.body);
                      if (!body) return;
                      runAction('upsertPrompt', { key: r.key, title: r.title, body });
                    }}
                  >
                    {t('Version+', 'نسخة+')}
                  </button>
                ),
              },
            ]}
            rows={data?.prompts || []}
          />
        </Panel>
      ) : null}

      {tab === 'providers' ? (
        <>
          <Panel title={t('Multi-LLM Providers', 'مزودو الذكاء المتعددون')}>
            <Table
              columns={[
                { key: 'label', label: 'Provider' },
                { key: 'state', label: 'State' },
                {
                  key: 'configured',
                  label: 'Configured',
                  render: (r) => (r.configured ? 'yes' : 'no'),
                },
                {
                  key: 'tasks',
                  label: 'Tasks',
                  render: (r) => (r.tasks || []).join(', '),
                },
              ]}
              rows={data?.providers || []}
            />
          </Panel>
          <Panel title={t('Task → Model Assignments', 'تعيين النماذج للمهام')}>
            <Table
              columns={[
                { key: 'task', label: 'Task' },
                {
                  key: 'preferredProviders',
                  label: 'Preferred',
                  render: (r) => (r.preferredProviders || []).join(', '),
                },
                { key: 'modelHint', label: 'Model' },
                {
                  key: 'actions',
                  label: '',
                  render: (r) => (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        const raw = window.prompt('Preferred providers (comma-separated)', (r.preferredProviders || []).join(','));
                        if (!raw) return;
                        runAction('assignModel', {
                          task: r.task,
                          preferredProviders: raw.split(',').map((s) => s.trim()).filter(Boolean),
                          modelHint: r.modelHint,
                        });
                      }}
                    >
                      {t('Edit', 'تعديل')}
                    </button>
                  ),
                },
              ]}
              rows={data?.models || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'governance' ? (
        <Panel title={t('AI Governance', 'حوكمة الذكاء الاصطناعي')}>
          <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
            <div>Daily request limit / user: {data?.config?.dailyRequestLimitPerUser}</div>
            <div>Daily cost limit / user (USD): {data?.config?.dailyCostLimitUsd}</div>
            <div>Org daily cost limit: {data?.config?.orgDailyCostLimitUsd}</div>
            <div>Quality threshold: {data?.config?.qualityThreshold}</div>
            <div>Human review threshold: {data?.config?.humanReviewThreshold}</div>
            <div>Require graph consultation: {String(data?.config?.requireGraphConsultation)}</div>
            <div>Require orchestrator: {String(data?.config?.requireOrchestrator)}</div>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const limit = Number(window.prompt('Daily request limit per user', String(data?.config?.dailyRequestLimitPerUser || 500)));
                if (!limit) return;
                runAction('setConfig', { dailyRequestLimitPerUser: limit });
              }}
            >
              {t('Update usage limit', 'تحديث حد الاستخدام')}
            </button>
          </div>
          <h4 style={{ marginTop: 16 }}>{t('Usage (today)', 'الاستخدام (اليوم)')}</h4>
          <Table
            columns={[
              { key: 'userId', label: 'User' },
              { key: 'orgId', label: 'Org' },
              { key: 'requests', label: 'Requests' },
              { key: 'tokens', label: 'Tokens' },
              { key: 'costUsd', label: 'Cost' },
            ]}
            rows={data?.usage || []}
          />
          <h4 style={{ marginTop: 16 }}>{t('Audit', 'التدقيق')}</h4>
          <Table
            columns={[
              { key: 'at', label: 'At' },
              { key: 'agentKey', label: 'Agent' },
              { key: 'provider', label: 'Provider' },
              { key: 'costUsd', label: 'Cost' },
              { key: 'quality', label: 'Quality' },
              { key: 'status', label: 'Status' },
            ]}
            rows={data?.audit || []}
          />
        </Panel>
      ) : null}

      {tab === 'reviews' ? (
        <Panel title={t('Human Review Queue', 'قائمة المراجعة البشرية')}>
          <Table
            columns={[
              { key: 'agentKey', label: 'Agent' },
              { key: 'reason', label: t('Reason', 'السبب') },
              { key: 'quality', label: t('Quality', 'الجودة') },
              { key: 'status', label: t('Status', 'الحالة') },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  r.status === 'pending' ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={busy} onClick={() => runAction('decideReview', { reviewId: r.id, decision: 'approve' })}>
                        {t('Approve', 'موافقة')}
                      </button>
                      <button type="button" disabled={busy} onClick={() => runAction('decideReview', { reviewId: r.id, decision: 'reject' })}>
                        {t('Reject', 'رفض')}
                      </button>
                    </span>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data?.reviews || []}
            empty={t('No reviews', 'لا مراجعات')}
          />
        </Panel>
      ) : null}

      {tab === 'analytics' ? (
        <Panel title={t('AI OS Analytics', 'تحليلات نظام الوكلاء')}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', marginBottom: 12 }}>
            <Stat label={t('Total runs', 'إجمالي التشغيل')} value={data?.analytics?.totalRuns} />
            <Stat label={t('Cost USD', 'التكلفة')} value={data?.analytics?.totalCostUsd} />
            <Stat label={t('Avg quality', 'متوسط الجودة')} value={data?.analytics?.avgQuality} />
            <Stat label={t('Pending reviews', 'مراجعات معلّقة')} value={data?.analytics?.pendingReviews} />
          </div>
          <h4>{t('Top agents', 'أفضل الوكلاء')}</h4>
          <Table
            columns={[
              { key: 'key', label: 'Key' },
              { key: 'name', label: 'Name' },
              { key: 'runs', label: 'Runs' },
              { key: 'avgQuality', label: 'Quality' },
              { key: 'totalCostUsd', label: 'Cost' },
            ]}
            rows={data?.analytics?.topAgents || []}
          />
          <h4 style={{ marginTop: 14 }}>{t('By family', 'حسب العائلة')}</h4>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
            {JSON.stringify(data?.analytics?.byFamily || {}, null, 2)}
          </pre>
          <h4 style={{ marginTop: 14 }}>{t('By provider', 'حسب المزود')}</h4>
          <pre style={{ margin: 0, fontSize: 12, background: '#f8fafc', padding: 10, borderRadius: 8 }}>
            {JSON.stringify(data?.analytics?.byProvider || {}, null, 2)}
          </pre>
        </Panel>
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'workflows', label: 'Workflows', labelAr: 'سير العمل' },
  { id: 'approvals', label: 'Approval Center', labelAr: 'مركز الموافقات' },
  { id: 'rules', label: 'Smart Rules', labelAr: 'القواعد الذكية' },
  { id: 'scheduler', label: 'Scheduler', labelAr: 'الجدولة' },
  { id: 'templates', label: 'Templates', labelAr: 'القوالب' },
  { id: 'inbox', label: 'Internal Comms', labelAr: 'التواصل الداخلي' },
  { id: 'escalations', label: 'Escalations', labelAr: 'التصعيد' },
  { id: 'integrations', label: 'Integrations', labelAr: 'التكاملات' },
  { id: 'runs', label: 'Execution Log', labelAr: 'سجل التنفيذ' },
];

function Stat({ label, value, tone = 'default' }) {
  const bg =
    tone === 'warn' ? '#fff7ed' : tone === 'danger' ? '#fef2f2' : tone === 'ok' ? '#ecfdf5' : '#f8fafc';
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.85rem', background: bg }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value ?? '—'}</div>
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

function RowTable({ columns, rows, empty = 'No rows' }) {
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
          {rows.map((row) => (
            <tr key={row.id || row.key}>
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

export function EnterpriseAutomationCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [eventKey, setEventKey] = useState('student.created');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/automation?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load automation engine');
    setData(await res.json());
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/automation?view=stream');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          setLive(true);
          if (payload.type === 'hello' && payload.dashboard) {
            setData(payload.dashboard);
            return;
          }
          if (payload.stats) {
            setData((prev) => (prev ? { ...prev, stats: { ...prev.stats, ...payload.stats }, liveVersion: (prev.liveVersion || 0) + 1 } : prev));
          }
          if (payload.type === 'live') {
            load().catch(() => {});
          }
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => setLive(false);
    } catch {
      /* EventSource unavailable */
    }
    return () => {
      try {
        es?.close();
      } catch {
        /* ignore */
      }
    };
  }, [load]);

  async function run(action, payload = {}) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner' }),
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

  const t = useMemo(
    () => ({
      title: isAr ? 'محرك أتمتة الأعمال' : 'Business Automation Engine',
      subtitle: isAr
        ? 'العصب المركزي لـ SUCCESS OS — كل عملية قابلة للتكوين من لوحة المالك دون تعديل الكود.'
        : 'Central nervous system of SUCCESS OS — configure every process from the Owner dashboard without code changes.',
      live: isAr ? 'بث مباشر مفعّل' : 'Live stream on',
      offline: isAr ? 'البث غير متصل' : 'Live stream off',
    }),
    [isAr],
  );

  const stats = data?.stats || {};
  const catalogEvents = data?.catalog?.events || [];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t.title}</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', maxWidth: 720 }}>{t.subtitle}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: live ? '#047857' : '#b45309' }}>
            {live ? t.live : t.offline}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '8px 10px', borderRadius: 10 }}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <button type="button" disabled={busy} onClick={() => load()}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('tickScheduler')}>
            {isAr ? 'تشغيل الجدولة' : 'Tick scheduler'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('sweepEscalations')}>
            {isAr ? 'مسح التصعيد' : 'Sweep escalations'}
          </button>
          <button type="button" disabled={busy} onClick={() => run('seed')}>
            {isAr ? 'مزامنة البذور' : 'Reseed catalog'}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label={isAr ? 'سير العمل' : 'Workflows'} value={stats.activeWorkflows} tone="ok" />
        <Stat label={isAr ? 'موافقات معلّقة' : 'Pending approvals'} value={stats.pendingApprovals} tone="warn" />
        <Stat label={isAr ? 'قواعد' : 'Rules'} value={stats.rules} />
        <Stat label={isAr ? 'جداول' : 'Schedules'} value={stats.schedules} />
        <Stat label={isAr ? 'تصعيد مفتوح' : 'Open escalations'} value={stats.openEscalations} tone="danger" />
        <Stat label={isAr ? 'رسائل غير مقروءة' : 'Unread messages'} value={stats.unreadMessages} />
        <Stat label={isAr ? 'تشغيلات فاشلة' : 'Failed runs'} value={stats.failedRuns} tone="danger" />
        <Stat label={isAr ? 'أحداث' : 'Events'} value={stats.events} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              borderRadius: 999,
              border: tab === item.id ? '1px solid #0f766e' : '1px solid #e5e7eb',
              background: tab === item.id ? '#ecfdf5' : '#fff',
              color: tab === item.id ? '#065f46' : '#111827',
              padding: '8px 12px',
              fontWeight: tab === item.id ? 700 : 500,
            }}
          >
            {isAr ? item.labelAr : item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <Panel
            title={isAr ? 'تشغيل حدث تجريبي' : 'Emit test event'}
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run('emitEvent', {
                    eventKey,
                    payload: {
                      name: 'Demo User',
                      email: 'demo@success-os.local',
                      grossAmount: 1500,
                      currency: 'USD',
                      daysLeft: 7,
                      inactiveDays: 30,
                      teacherRating: 2.5,
                    },
                  })
                }
              >
                {isAr ? 'إطلاق الحدث' : 'Emit event'}
              </button>
            }
          >
            <select value={eventKey} onChange={(e) => setEventKey(e.target.value)} style={{ width: '100%', maxWidth: 420, padding: 10, borderRadius: 10 }}>
              {catalogEvents.map((ev) => (
                <option key={ev.key} value={ev.key}>
                  {isAr ? ev.labelAr : ev.label} ({ev.key})
                </option>
              ))}
            </select>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 0 }}>
              {isAr
                ? 'كل حدث يشغّل سير العمل والقواعد الذكية المتطابقة ويقوم بتحديث لوحة التحكم مباشرة.'
                : 'Each event runs matching workflows and smart rules, then live-updates dashboards.'}
            </p>
          </Panel>

          <Panel title={isAr ? 'أحدث التشغيلات' : 'Recent runs'}>
            <RowTable
              columns={[
                { key: 'workflowName', label: isAr ? 'سير العمل' : 'Workflow' },
                { key: 'trigger', label: isAr ? 'المحفّز' : 'Trigger' },
                { key: 'status', label: isAr ? 'الحالة' : 'Status' },
                { key: 'executionMs', label: isAr ? 'المدة (ms)' : 'Duration' },
                { key: 'user', label: isAr ? 'المستخدم' : 'User' },
              ]}
              rows={data?.runs || []}
            />
          </Panel>
        </>
      ) : null}

      {tab === 'workflows' ? (
        <Panel title={isAr ? 'سير العمل غير المحدود' : 'Unlimited workflows'}>
          <RowTable
            columns={[
              {
                key: 'name',
                label: isAr ? 'الاسم' : 'Name',
                render: (row) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{isAr ? row.nameAr || row.name : row.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 11 }}>{row.key}</div>
                  </div>
                ),
              },
              {
                key: 'trigger',
                label: isAr ? 'المحفّز' : 'Trigger',
                render: (row) => `${row.trigger?.type || '—'} · ${row.trigger?.eventKey || row.trigger?.cron || '—'}`,
              },
              { key: 'mode', label: isAr ? 'النمط' : 'Mode' },
              {
                key: 'steps',
                label: isAr ? 'الخطوات' : 'Steps',
                render: (row) => (row.steps || []).length,
              },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              {
                key: 'run',
                label: isAr ? 'تشغيل' : 'Run',
                render: (row) => (
                  <button type="button" disabled={busy} onClick={() => run('runWorkflow', { workflowKey: row.key, payload: { name: 'Manual run' } })}>
                    {isAr ? 'تشغيل' : 'Run'}
                  </button>
                ),
              },
            ]}
            rows={data?.workflows || []}
          />
        </Panel>
      ) : null}

      {tab === 'approvals' ? (
        <Panel title={isAr ? 'مركز الموافقات' : 'Approval Center'}>
          <RowTable
            empty={isAr ? 'لا توجد موافقات حاليًا — أطلق حدث تسجيل لتجربتها.' : 'No approvals yet — emit a registration event to try.'}
            columns={[
              { key: 'approvalType', label: isAr ? 'النوع' : 'Type' },
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              {
                key: 'assignees',
                label: isAr ? 'المعيّنون' : 'Assignees',
                render: (row) => (row.assignees || []).join(', '),
              },
              {
                key: 'actions',
                label: isAr ? 'قرار' : 'Decision',
                render: (row) =>
                  row.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" disabled={busy} onClick={() => run('approve', { id: row.id, note: 'Approved from center' })}>
                        {isAr ? 'موافقة' : 'Approve'}
                      </button>
                      <button type="button" disabled={busy} onClick={() => run('reject', { id: row.id, note: 'Rejected from center' })}>
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    row.status
                  ),
              },
            ]}
            rows={data?.approvals || []}
          />
        </Panel>
      ) : null}

      {tab === 'rules' ? (
        <Panel title={isAr ? 'محرك القواعد الذكية (بدون برمجة)' : 'Smart rule engine (no coding)'}>
          <RowTable
            columns={[
              {
                key: 'name',
                label: isAr ? 'القاعدة' : 'Rule',
                render: (row) => (isAr ? row.nameAr || row.name : row.name),
              },
              { key: 'eventKey', label: isAr ? 'الحدث' : 'Event' },
              {
                key: 'conditions',
                label: isAr ? 'الشرط' : 'IF',
                render: (row) =>
                  (row.conditions || []).map((c) => `${c.field} ${c.op} ${c.value}`).join(' AND ') || '—',
              },
              {
                key: 'actions',
                label: isAr ? 'إذن' : 'THEN',
                render: (row) => (row.actions || []).map((a) => a.actionKey).join(', '),
              },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.rules || []}
          />
        </Panel>
      ) : null}

      {tab === 'scheduler' ? (
        <Panel title={isAr ? 'الجدولة التلقائية' : 'Automatic scheduler'}>
          <RowTable
            columns={[
              {
                key: 'name',
                label: isAr ? 'المهمة' : 'Job',
                render: (row) => (isAr ? row.nameAr || row.name : row.name),
              },
              { key: 'cadence', label: isAr ? 'التكرار' : 'Cadence' },
              { key: 'cron', label: 'Cron' },
              { key: 'timezone', label: isAr ? 'المنطقة الزمنية' : 'Timezone' },
              { key: 'lastRunAt', label: isAr ? 'آخر تشغيل' : 'Last run' },
              { key: 'failureCount', label: isAr ? 'فشل' : 'Failures' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.schedules || []}
          />
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 0 }}>
            {isAr
              ? 'يدعم يومي/أسبوعي/شهري/سنوي/Cron مع إعادة المحاولة واستعادة الفشل.'
              : 'Supports daily/weekly/monthly/yearly/cron with retries and failure recovery.'}
          </p>
        </Panel>
      ) : null}

      {tab === 'templates' ? (
        <Panel title={isAr ? 'محرك القوالب متعدد اللغات' : 'Multi-language template engine'}>
          <RowTable
            columns={[
              {
                key: 'name',
                label: isAr ? 'القالب' : 'Template',
                render: (row) => (isAr ? row.nameAr || row.name : row.name),
              },
              { key: 'channel', label: isAr ? 'القناة' : 'Channel' },
              { key: 'lang', label: isAr ? 'اللغة' : 'Lang' },
              { key: 'subject', label: isAr ? 'الموضوع' : 'Subject' },
              {
                key: 'body',
                label: isAr ? 'المحتوى' : 'Body',
                render: (row) => <span style={{ display: 'inline-block', maxWidth: 280 }}>{row.body}</span>,
              },
            ]}
            rows={data?.templates || []}
          />
        </Panel>
      ) : null}

      {tab === 'inbox' ? (
        <Panel
          title={isAr ? 'التواصل الداخلي' : 'Internal communication'}
          actions={
            <button
              type="button"
              disabled={busy || !messageTitle}
              onClick={() => {
                run('createMessage', {
                  type: 'inbox',
                  title: messageTitle,
                  body: messageBody,
                  department: 'general',
                }).then(() => {
                  setMessageTitle('');
                  setMessageBody('');
                });
              }}
            >
              {isAr ? 'إرسال' : 'Send'}
            </button>
          }
        >
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            <input
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              placeholder={isAr ? 'عنوان الرسالة' : 'Message title'}
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder={isAr ? 'نص الرسالة / تعليق / ملاحظة موافقة' : 'Body / comment / approval note'}
              rows={3}
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>
          <RowTable
            columns={[
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'department', label: isAr ? 'القسم' : 'Dept' },
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'body', label: isAr ? 'النص' : 'Body' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.messages || []}
          />
        </Panel>
      ) : null}

      {tab === 'escalations' ? (
        <Panel title={isAr ? 'نظام التصعيد' : 'Escalation system'}>
          <RowTable
            empty={isAr ? 'لا توجد تصعيدات مفتوحة.' : 'No open escalations.'}
            columns={[
              { key: 'reason', label: isAr ? 'السبب' : 'Reason' },
              { key: 'entityType', label: isAr ? 'الكيان' : 'Entity' },
              { key: 'entityId', label: 'ID' },
              { key: 'target', label: isAr ? 'المستهدف' : 'Target' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.escalations || []}
          />
        </Panel>
      ) : null}

      {tab === 'integrations' ? (
        <Panel title={isAr ? 'واجهات وتكاملات' : 'API & integrations'}>
          <RowTable
            columns={[
              { key: 'name', label: isAr ? 'المزوّد' : 'Provider' },
              { key: 'key', label: 'Key' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              {
                key: 'connected',
                label: isAr ? 'متصل' : 'Connected',
                render: (row) => (row.connected ? (isAr ? 'نعم' : 'Yes') : isAr ? 'لا' : 'No'),
              },
            ]}
            rows={data?.integrations || []}
          />
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 0 }}>
            {isAr
              ? 'كل سير عمل يمكنه استدعاء بوابات الدفع، البريد، SMS، واتساب، Google Calendar، Zoom، Teams والتكاملات المستقبلية.'
              : 'Every workflow can call payment gateways, email, SMS, WhatsApp, Google Calendar, Zoom, Teams, and future integrations.'}
          </p>
        </Panel>
      ) : null}

      {tab === 'runs' ? (
        <Panel title={isAr ? 'سجل التنفيذ الكامل' : 'Full execution log'}>
          <RowTable
            columns={[
              { key: 'workflowName', label: isAr ? 'سير العمل' : 'Workflow' },
              { key: 'trigger', label: isAr ? 'المحفّز' : 'Trigger' },
              {
                key: 'actions',
                label: isAr ? 'الإجراءات' : 'Actions',
                render: (row) => (row.actions || []).join(' → '),
              },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'executionMs', label: isAr ? 'الوقت' : 'Time' },
              { key: 'user', label: isAr ? 'المستخدم' : 'User' },
              {
                key: 'errors',
                label: isAr ? 'أخطاء' : 'Errors',
                render: (row) => (row.errors?.length ? row.errors.map((e) => e.error).join('; ') : '—'),
              },
              {
                key: 'rollback',
                label: isAr ? 'التراجع' : 'Rollback',
                render: (row) => row.rollback?.info || (row.rollback?.enabled ? 'ready' : '—'),
              },
            ]}
            rows={data?.runs || []}
          />
        </Panel>
      ) : null}

      <Panel title={isAr ? 'إعدادات المحرك' : 'Engine config'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {Object.entries(data?.config || {}).map(([key, value]) => (
            <label key={key} style={{ fontSize: 12, color: '#374151' }}>
              <div style={{ marginBottom: 4 }}>{key}</div>
              <input
                defaultValue={String(value ?? '')}
                disabled={busy || key === 'updatedAt' || key === 'updatedBy'}
                onBlur={(e) => {
                  if (key === 'updatedAt' || key === 'updatedBy') return;
                  const raw = e.target.value;
                  const parsed = raw === 'true' ? true : raw === 'false' ? false : Number.isFinite(Number(raw)) && raw !== '' ? Number(raw) : raw;
                  run('setConfig', { [key]: parsed });
                }}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </label>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default EnterpriseAutomationCenter;

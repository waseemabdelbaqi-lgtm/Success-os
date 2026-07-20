'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'messaging', label: 'Messaging', labelAr: 'الرسائل' },
  { id: 'meetings', label: 'Video Meetings', labelAr: 'اجتماعات فيديو' },
  { id: 'calls', label: 'Voice Calls', labelAr: 'مكالمات صوتية' },
  { id: 'announcements', label: 'Announcements', labelAr: 'إعلانات' },
  { id: 'helpdesk', label: 'Help Desk', labelAr: 'مكتب المساعدة' },
  { id: 'notifications', label: 'Notifications', labelAr: 'الإشعارات' },
  { id: 'documents', label: 'Documents', labelAr: 'المستندات' },
  { id: 'calendar', label: 'Calendar', labelAr: 'التقويم' },
  { id: 'collaboration', label: 'Collaboration', labelAr: 'التعاون' },
  { id: 'parents', label: 'Parent Comms', labelAr: 'تواصل أولياء الأمور' },
  { id: 'ai', label: 'AI Assistant', labelAr: 'مساعد الذكاء' },
  { id: 'search', label: 'Search', labelAr: 'بحث' },
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

export function EnterpriseCommunicationCenter() {
  const [lang, setLang] = useState('ar');
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [channelId, setChannelId] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiOut, setAiOut] = useState('');

  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setError('');
    const res = await fetch('/api/communication?view=dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load communication platform');
    const json = await res.json();
    setData(json);
    if (!channelId && json.channels?.[0]?.id) setChannelId(json.channels[0].id);
  }, [channelId]);

  useEffect(() => {
    load().catch((e) => setError(e.message || 'load failed'));
  }, [load]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource('/api/communication?view=stream');
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          setLive(true);
          if (payload.dashboard) setData(payload.dashboard);
          else if (payload.stats) {
            setData((prev) => (prev ? { ...prev, stats: { ...prev.stats, ...payload.stats } } : prev));
          }
          if (payload.type === 'live') load().catch(() => {});
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => setLive(false);
    } catch {
      /* ignore */
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
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, user: 'owner', role: 'owner' }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'action failed');
      if (action === 'aiAssist') setAiOut(json.session?.output || '');
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

  const t = useMemo(
    () => ({
      title: isAr ? 'منصة التواصل والتعاون' : 'Communication & Collaboration Platform',
      subtitle: isAr
        ? 'رسائل مشفّرة، اجتماعات، دعم، إعلانات، مستندات وتقويم — متزامنة لحظيًا ومتصلة بالصلاحيات الحالية.'
        : 'Encrypted messaging, meetings, help desk, announcements, documents & calendar — real-time sync with existing permissions.',
      live: isAr ? 'مزامنة مباشرة' : 'Live sync',
      offline: isAr ? 'غير متصل' : 'Offline',
    }),
    [isAr],
  );

  const stats = data?.stats || {};

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{t.title}</h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', maxWidth: 760 }}>{t.subtitle}</p>
          <div style={{ marginTop: 8, fontSize: 12, color: live ? '#047857' : '#b45309' }}>
            {live ? t.live : t.offline}
            {data?.generatedAt ? ` · ${data.generatedAt}` : ''}
            {stats.encrypted ? (isAr ? ' · التشفير مفعّل' : ' · Encryption on') : ''}
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
          <button type="button" disabled={busy} onClick={() => run('sweepSla')}>
            {isAr ? 'مسح SLA' : 'Sweep SLA'}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
        <Stat label={isAr ? 'القنوات' : 'Channels'} value={stats.channels} />
        <Stat label={isAr ? 'الرسائل' : 'Messages'} value={stats.messages} />
        <Stat label={isAr ? 'اجتماعات' : 'Meetings'} value={stats.meetings} />
        <Stat label={isAr ? 'مباشر' : 'Live'} value={stats.liveMeetings} />
        <Stat label={isAr ? 'مكالمات' : 'Calls'} value={stats.calls} />
        <Stat label={isAr ? 'تذاكر مفتوحة' : 'Open tickets'} value={stats.openTickets} />
        <Stat label={isAr ? 'مستندات' : 'Documents'} value={stats.documents} />
        <Stat label={isAr ? 'أحداث تقويم' : 'Calendar'} value={stats.calendarEvents} />
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
        <Panel title={isAr ? 'دليل المستخدمين من النظام (بدون تكرار)' : 'Directory from platform identities (no duplicates)'}>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            {isAr
              ? 'الهويات مأخوذة من مجموعات ERP الحالية (طلاب، معلمون، أولياء أمور...).'
              : 'Identities come from existing ERP collections (students, teachers, parents…).'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
            {Object.entries(data?.directory || {}).map(([key, list]) => (
              <Stat key={key} label={key} value={(list || []).length} />
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === 'messaging' ? (
        <Panel
          title={isAr ? 'الرسائل الداخلية' : 'Internal messaging'}
          actions={
            <button
              type="button"
              disabled={busy || !messageBody || !channelId}
              onClick={() => {
                run('sendMessage', { channelId, body: messageBody }).then(() => setMessageBody(''));
              }}
            >
              {isAr ? 'إرسال' : 'Send'}
            </button>
          }
        >
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
              {(data?.channels || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {(isAr ? c.nameAr || c.name : c.name) + ` · ${c.type}`}
                </option>
              ))}
            </select>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={3}
              placeholder={isAr ? 'اكتب رسالة مشفّرة...' : 'Write an encrypted message...'}
              style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
            />
          </div>
          <Table
            columns={[
              { key: 'from', label: isAr ? 'من' : 'From' },
              { key: 'body', label: isAr ? 'النص' : 'Body' },
              { key: 'channelType', label: isAr ? 'النوع' : 'Type' },
              { key: 'createdAt', label: isAr ? 'الوقت' : 'At' },
            ]}
            rows={data?.messages || []}
          />
        </Panel>
      ) : null}

      {tab === 'meetings' ? (
        <Panel
          title={isAr ? 'اجتماعات الفيديو' : 'Video meetings'}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run('createMeeting', {
                  title: isAr ? 'اجتماع جديد' : 'New meeting',
                  type: 'group',
                  screenSharing: true,
                  recording: true,
                })
              }
            >
              {isAr ? 'إنشاء اجتماع' : 'Create meeting'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'code', label: isAr ? 'الرمز' : 'Code' },
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              {
                key: 'actions',
                label: isAr ? 'إجراءات' : 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={busy} onClick={() => run('joinMeeting', { id: row.id })}>
                      {isAr ? 'انضمام' : 'Join'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('endMeeting', { id: row.id })}>
                      {isAr ? 'إنهاء' : 'End'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.meetings || []}
          />
        </Panel>
      ) : null}

      {tab === 'calls' ? (
        <Panel
          title={isAr ? 'المكالمات الصوتية' : 'Voice calls'}
          actions={
            <button type="button" disabled={busy} onClick={() => run('startCall', { toUserId: 'admin', recording: true })}>
              {isAr ? 'بدء مكالمة' : 'Start call'}
            </button>
          }
        >
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            {isAr
              ? `تحليلات: ${data?.callAnalytics?.total || 0} مكالمة · متوسط ${data?.callAnalytics?.avgDurationSec || 0} ث`
              : `Analytics: ${data?.callAnalytics?.total || 0} calls · avg ${data?.callAnalytics?.avgDurationSec || 0}s`}
          </p>
          <Table
            columns={[
              { key: 'from', label: isAr ? 'من' : 'From' },
              { key: 'to', label: isAr ? 'إلى' : 'To' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'durationSec', label: isAr ? 'المدة' : 'Duration' },
              {
                key: 'end',
                label: isAr ? 'إنهاء' : 'End',
                render: (row) =>
                  row.status === 'ringing' || row.status === 'live' ? (
                    <button type="button" disabled={busy} onClick={() => run('endCall', { id: row.id })}>
                      {isAr ? 'إنهاء' : 'End'}
                    </button>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data?.calls || []}
          />
        </Panel>
      ) : null}

      {tab === 'announcements' ? (
        <Panel
          title={isAr ? 'الإعلانات' : 'Announcements'}
          actions={
            <button
              type="button"
              disabled={busy || !announceTitle}
              onClick={() => {
                run('announce', { title: announceTitle, body: announceBody, scope: 'global' }).then(() => {
                  setAnnounceTitle('');
                  setAnnounceBody('');
                });
              }}
            >
              {isAr ? 'نشر' : 'Publish'}
            </button>
          }
        >
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            <input value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} placeholder={isAr ? 'عنوان الإعلان' : 'Title'} style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }} />
            <textarea value={announceBody} onChange={(e) => setAnnounceBody(e.target.value)} rows={3} placeholder={isAr ? 'النص' : 'Body'} style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(data?.catalog?.announcementScopes || []).map((scope) => (
                <button key={scope} type="button" disabled={busy || !announceTitle} onClick={() => run('announce', { title: announceTitle || scope, body: announceBody, scope, emergency: scope === 'emergency' })}>
                  {scope}
                </button>
              ))}
            </div>
          </div>
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'scope', label: isAr ? 'النطاق' : 'Scope' },
              { key: 'emergency', label: isAr ? 'طارئ' : 'Emergency', render: (r) => (r.emergency ? (isAr ? 'نعم' : 'Yes') : '—') },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.announcements || []}
          />
        </Panel>
      ) : null}

      {tab === 'helpdesk' ? (
        <Panel
          title={isAr ? 'مكتب المساعدة' : 'Help desk'}
          actions={
            <button
              type="button"
              disabled={busy || !ticketSubject}
              onClick={() => {
                run('createTicket', { subject: ticketSubject, body: ticketSubject, priority: 'high', department: 'support' }).then(() => setTicketSubject(''));
              }}
            >
              {isAr ? 'تذكرة جديدة' : 'New ticket'}
            </button>
          }
        >
          <input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder={isAr ? 'موضوع التذكرة' : 'Ticket subject'} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 12 }} />
          <Table
            columns={[
              { key: 'subject', label: isAr ? 'الموضوع' : 'Subject' },
              { key: 'priority', label: isAr ? 'الأولوية' : 'Priority' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'slaDueAt', label: 'SLA' },
              {
                key: 'actions',
                label: isAr ? 'إجراءات' : 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => run('ticketAction', { id: row.id, ticketAction: 'assign', assignee: 'admin' })}>
                      {isAr ? 'تعيين' : 'Assign'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('ticketAction', { id: row.id, ticketAction: 'note', body: 'Internal note' })}>
                      {isAr ? 'ملاحظة' : 'Note'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('ticketAction', { id: row.id, ticketAction: 'escalate' })}>
                      {isAr ? 'تصعيد' : 'Escalate'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('ticketAction', { id: row.id, ticketAction: 'resolve' })}>
                      {isAr ? 'حل' : 'Resolve'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.tickets || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'قاعدة المعرفة' : 'Knowledge base'}</h4>
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title', render: (r) => (isAr ? r.titleAr || r.title : r.title) },
              { key: 'tags', label: isAr ? 'وسوم' : 'Tags', render: (r) => (r.tags || []).join(', ') },
            ]}
            rows={data?.knowledge || []}
          />
        </Panel>
      ) : null}

      {tab === 'notifications' ? (
        <Panel
          title={isAr ? 'مركز الإشعارات' : 'Notification center'}
          actions={
            <>
              {(data?.catalog?.notificationChannels || ['push', 'email', 'sms', 'whatsapp', 'in_app']).map((ch) => (
                <button key={ch} type="button" disabled={busy} onClick={() => run('notify', { channel: ch, title: `Test ${ch}`, body: 'Communication platform notification', audience: ['owner'] })}>
                  {ch}
                </button>
              ))}
            </>
          }
        >
          <Table
            columns={[
              { key: 'channel', label: isAr ? 'القناة' : 'Channel' },
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'scheduleAt', label: isAr ? 'جدولة' : 'Schedule' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.notifications || []}
          />
        </Panel>
      ) : null}

      {tab === 'documents' ? (
        <Panel
          title={isAr ? 'مشاركة المستندات' : 'Document sharing'}
          actions={
            <button type="button" disabled={busy} onClick={() => run('uploadDocument', { name: isAr ? 'مستند جديد.pdf' : 'New document.pdf', mime: 'application/pdf', size: 1024 })}>
              {isAr ? 'رفع' : 'Upload'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'name', label: isAr ? 'الاسم' : 'Name' },
              { key: 'version', label: isAr ? 'الإصدار' : 'Version' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'downloadCount', label: isAr ? 'تحميلات' : 'Downloads' },
              {
                key: 'actions',
                label: isAr ? 'إجراءات' : 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy} onClick={() => run('documentAction', { id: row.id, documentAction: 'comment', body: 'Looks good' })}>
                      {isAr ? 'تعليق' : 'Comment'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('documentAction', { id: row.id, documentAction: 'approve' })}>
                      {isAr ? 'موافقة' : 'Approve'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('documentAction', { id: row.id, documentAction: 'version' })}>
                      {isAr ? 'إصدار' : 'Version'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('documentAction', { id: row.id, documentAction: 'download' })}>
                      {isAr ? 'تحميل' : 'Download'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.documents || []}
          />
        </Panel>
      ) : null}

      {tab === 'calendar' ? (
        <Panel
          title={isAr ? 'التقويم' : 'Calendar'}
          actions={
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run('calendarEvent', {
                  type: 'deadline',
                  title: isAr ? 'موعد نهائي' : 'Deadline',
                  startsAt: new Date(Date.now() + 86400000).toISOString(),
                  reminderAt: new Date(Date.now() + 3600000).toISOString(),
                })
              }
            >
              {isAr ? 'إضافة حدث' : 'Add event'}
            </button>
          }
        >
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'startsAt', label: isAr ? 'البداية' : 'Starts' },
              { key: 'reminderAt', label: isAr ? 'تذكير' : 'Reminder' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
            ]}
            rows={data?.calendar || []}
          />
        </Panel>
      ) : null}

      {tab === 'collaboration' ? (
        <Panel
          title={isAr ? 'التعاون ومساحات العمل' : 'Collaboration & workspaces'}
          actions={
            <button type="button" disabled={busy} onClick={() => run('createNote', { title: isAr ? 'ملاحظة مشتركة' : 'Shared note', body: 'Collaborative draft' })}>
              {isAr ? 'ملاحظة مشتركة' : 'Shared note'}
            </button>
          }
        >
          <h4 style={{ margin: '0 0 8px' }}>{isAr ? 'مساحات العمل' : 'Workspaces'}</h4>
          <Table
            columns={[
              { key: 'name', label: isAr ? 'الاسم' : 'Name', render: (r) => (isAr ? r.nameAr || r.name : r.name) },
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'members', label: isAr ? 'الأعضاء' : 'Members', render: (r) => (r.members || []).join(', ') },
            ]}
            rows={data?.workspaces || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'ملاحظات مشتركة' : 'Shared notes'}</h4>
          <Table
            columns={[
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'body', label: isAr ? 'النص' : 'Body' },
              { key: 'collaborators', label: isAr ? 'المتعاونون' : 'Collaborators', render: (r) => (r.collaborators || []).join(', ') },
            ]}
            rows={data?.notes || []}
          />
        </Panel>
      ) : null}

      {tab === 'parents' ? (
        <Panel title={isAr ? 'تواصل أولياء الأمور' : 'Parent communication'}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {(data?.catalog?.parentMessageTypes || []).map((type) => (
              <button
                key={type}
                type="button"
                disabled={busy}
                onClick={() =>
                  run('parentMessage', {
                    type,
                    title: type,
                    body: isAr ? `تحديث: ${type}` : `Update: ${type}`,
                    toParentId: 'parent',
                  })
                }
              >
                {type}
              </button>
            ))}
          </div>
          <Table
            columns={[
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'from', label: isAr ? 'من' : 'From' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.parentMessages || []}
          />
        </Panel>
      ) : null}

      {tab === 'ai' ? (
        <Panel
          title={isAr ? 'مساعد الذكاء الاصطناعي' : 'AI assistant'}
          actions={
            <>
              {['chat', 'smart_reply', 'translate', 'meeting_summary', 'action_items', 'reminder_suggestion'].map((mode) => (
                <button key={mode} type="button" disabled={busy} onClick={() => run('aiAssist', { mode, input: aiInput || 'Follow up with parent', lang: lang })}>
                  {mode}
                </button>
              ))}
            </>
          }
        >
          <textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} rows={3} placeholder={isAr ? 'اكتب طلبك للمساعد...' : 'Ask the assistant...'} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 12 }} />
          {aiOut ? <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 10 }}>{aiOut}</pre> : null}
          <Table
            columns={[
              { key: 'mode', label: isAr ? 'الوضع' : 'Mode' },
              { key: 'output', label: isAr ? 'الناتج' : 'Output' },
              { key: 'createdAt', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={data?.aiSessions || []}
          />
        </Panel>
      ) : null}

      {tab === 'search' ? (
        <Panel
          title={isAr ? 'بحث شامل' : 'Global search'}
          actions={
            <button type="button" disabled={busy || !searchQ} onClick={() => run('search', { q: searchQ })}>
              {isAr ? 'بحث' : 'Search'}
            </button>
          }
        >
          <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={isAr ? 'رسائل، اجتماعات، تذاكر، ملفات...' : 'Messages, meetings, tickets, files...'} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d1d5db', marginBottom: 12 }} />
          <Table
            columns={[
              { key: 'type', label: isAr ? 'النوع' : 'Type' },
              { key: 'title', label: isAr ? 'العنوان' : 'Title' },
              { key: 'at', label: isAr ? 'التاريخ' : 'At' },
            ]}
            rows={searchResults}
            empty={isAr ? 'لا نتائج بعد' : 'No results yet'}
          />
        </Panel>
      ) : null}

      {tab === 'security' ? (
        <Panel title={isAr ? 'الأمان وسياسات الاحتفاظ' : 'Security & retention'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
            {Object.entries(data?.config || {}).map(([key, value]) => (
              <label key={key} style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4 }}>{key}</div>
                <input
                  defaultValue={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                  disabled={busy || key === 'updatedAt' || key === 'updatedBy' || key === 'slaHours'}
                  onBlur={(e) => {
                    if (key === 'updatedAt' || key === 'updatedBy' || key === 'slaHours') return;
                    const raw = e.target.value;
                    const parsed = raw === 'true' ? true : raw === 'false' ? false : Number.isFinite(Number(raw)) && raw !== '' ? Number(raw) : raw;
                    run('setConfig', { [key]: parsed });
                  }}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </label>
            ))}
          </div>
          <h4 style={{ margin: '0 0 8px' }}>{isAr ? 'إدارة الأجهزة' : 'Device management'}</h4>
          <Table
            columns={[
              { key: 'label', label: isAr ? 'الجهاز' : 'Device' },
              { key: 'userId', label: isAr ? 'المستخدم' : 'User' },
              { key: 'platform', label: isAr ? 'المنصة' : 'Platform' },
              { key: 'status', label: isAr ? 'الحالة' : 'Status' },
              {
                key: 'actions',
                label: isAr ? 'إجراء' : 'Action',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={busy} onClick={() => run('trustDevice', { id: row.id })}>
                      {isAr ? 'ثقة' : 'Trust'}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run('revokeDevice', { id: row.id })}>
                      {isAr ? 'إلغاء' : 'Revoke'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={data?.devices || []}
          />
          <h4 style={{ margin: '16px 0 8px' }}>{isAr ? 'سجل التدقيق' : 'Audit log'}</h4>
          <Table
            columns={[
              { key: 'action', label: isAr ? 'الإجراء' : 'Action' },
              { key: 'user', label: isAr ? 'المستخدم' : 'User' },
              { key: 'at', label: isAr ? 'الوقت' : 'At' },
            ]}
            rows={data?.audit || []}
          />
        </Panel>
      ) : null}
    </div>
  );
}

export default EnterpriseCommunicationCenter;

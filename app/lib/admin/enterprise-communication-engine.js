/**
 * SUCCESS OS — Enterprise Communication, Collaboration & Engagement Engine
 *
 * Secure messaging, meetings, voice, announcements, help desk, notifications,
 * documents, calendar, collaboration, parent comms, AI assistant, search, security.
 * Reuses enterprise users/roles/permissions — no duplicated identity.
 */

import crypto from 'node:crypto';
import path from 'node:path';
import {
  COMM_ANNOUNCEMENT_SCOPES,
  COMM_CHANNEL_TYPES,
  COMM_DEFAULT_CONFIG,
  COMM_MEETING_TYPES,
  COMM_NOTIFICATION_CHANNELS,
  COMM_PARENT_MESSAGE_TYPES,
  COMM_SEED_CHANNELS,
  COMM_SEED_DEVICES,
  COMM_SEED_KB,
  COMM_TICKET_PRIORITIES,
} from '../../data/enterprise-communication-catalog.js';
import {
  erpActiveItems,
  erpAppendAudit,
  erpEnsureDirs,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
  erpWriteJson,
} from './enterprise-erp-store.js';

const COLLECTIONS = Object.freeze({
  channels: 'comm-channels',
  messages: 'comm-messages',
  meetings: 'comm-meetings',
  calls: 'comm-calls',
  announcements: 'comm-announcements',
  tickets: 'comm-tickets',
  ticketNotes: 'comm-ticket-notes',
  knowledge: 'comm-knowledge',
  notifications: 'comm-notifications',
  documents: 'comm-documents',
  folders: 'comm-folders',
  calendar: 'comm-calendar',
  notes: 'comm-notes',
  workspaces: 'comm-workspaces',
  parentMessages: 'comm-parent-messages',
  aiSessions: 'comm-ai-sessions',
  devices: 'comm-devices',
  audit: 'comm-audit',
});

const CONFIG_FILE = () => path.join(erpRoot(), 'config', 'communication-engine.json');

function liveBus() {
  if (!globalThis.__SUCCESS_OS_COMM_BUS__) {
    globalThis.__SUCCESS_OS_COMM_BUS__ = { listeners: new Set(), version: 0, last: null };
  }
  return globalThis.__SUCCESS_OS_COMM_BUS__;
}

export function subscribeCommLive(listener) {
  const bus = liveBus();
  bus.listeners.add(listener);
  return () => bus.listeners.delete(listener);
}

function publishLive(event) {
  const bus = liveBus();
  bus.version += 1;
  bus.last = { ...event, version: bus.version, at: erpNow() };
  for (const listener of bus.listeners) {
    try {
      listener(bus.last);
    } catch {
      /* ignore */
    }
  }
}

function ensureCollection(name, seed = []) {
  erpEnsureDirs();
  const file = path.join(erpRoot(), 'collections', `${name}.json`);
  if (erpReadJson(file)) return erpReadJson(file);
  const doc = { items: seed, updatedAt: erpNow() };
  erpWriteCollection(name, doc);
  return doc;
}

export function getCommConfig() {
  erpEnsureDirs();
  const existing = erpReadJson(CONFIG_FILE());
  if (existing) return { ...COMM_DEFAULT_CONFIG, ...existing };
  const seeded = { ...COMM_DEFAULT_CONFIG, updatedAt: erpNow(), updatedBy: 'system' };
  erpWriteJson(CONFIG_FILE(), seeded);
  return seeded;
}

export function setCommConfig(patch = {}, meta = {}) {
  const before = getCommConfig();
  const next = { ...before, ...patch, updatedAt: erpNow(), updatedBy: meta.user || 'owner' };
  erpWriteJson(CONFIG_FILE(), next);
  erpAppendAudit({
    action: 'comm_config',
    moduleId: 'communication-platform',
    user: meta.user || 'owner',
    oldValue: before,
    newValue: next,
  });
  publishLive({ type: 'config.updated' });
  return { ok: true, config: next };
}

function encKey() {
  return process.env.COMM_ENCRYPTION_KEY || 'success-os-comm-owner-key';
}

/** AES-256-GCM encryption for message bodies at rest. */
export function encryptText(plain) {
  const config = getCommConfig();
  if (!config.encryptionEnabled) {
    return { cipher: String(plain || ''), iv: null, tag: null, encrypted: false };
  }
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(encKey()).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain || ''), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cipher: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    encrypted: true,
  };
}

export function decryptText(payload) {
  if (!payload || payload.encrypted === false) return String(payload?.cipher || payload || '');
  try {
    const key = crypto.createHash('sha256').update(encKey()).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const out = Buffer.concat([
      decipher.update(Buffer.from(payload.cipher, 'base64')),
      decipher.final(),
    ]);
    return out.toString('utf8');
  } catch {
    return '[encrypted]';
  }
}

function pushItem(collection, item) {
  const doc = erpReadCollection(collection);
  const items = [item, ...erpList(doc.items)].slice(0, 20000);
  erpWriteCollection(collection, { items });
  return item;
}

function updateItem(collection, id, patch) {
  const doc = erpReadCollection(collection);
  const items = erpList(doc.items).map((i) => (i.id === id ? { ...i, ...patch, updatedAt: erpNow() } : i));
  erpWriteCollection(collection, { items });
  return items.find((i) => i.id === id) || null;
}

function audit(entry) {
  const row = {
    id: erpId(),
    at: erpNow(),
    ...entry,
  };
  pushItem(COLLECTIONS.audit, row);
  erpAppendAudit({
    action: entry.action || 'comm',
    moduleId: 'communication-platform',
    user: entry.user || 'system',
    newValue: entry,
  });
  return row;
}

function seedChannels() {
  return COMM_SEED_CHANNELS.map((c) => ({
    id: erpId(),
    ...c,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedKb() {
  return COMM_SEED_KB.map((k) => ({
    id: erpId(),
    ...k,
    status: 'active',
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedDevices() {
  return COMM_SEED_DEVICES.map((d) => ({
    id: erpId(),
    ...d,
    lastSeenAt: erpNow(),
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'seed',
  }));
}

function seedFolders() {
  return [
    { id: erpId(), name: 'Shared Root', nameAr: 'الجذر المشترك', parentId: null, status: 'active', createdAt: erpNow(), updatedAt: erpNow() },
    { id: erpId(), name: 'Academic', nameAr: 'أكاديمي', parentId: null, status: 'active', createdAt: erpNow(), updatedAt: erpNow() },
    { id: erpId(), name: 'HR Documents', nameAr: 'وثائق الموارد البشرية', parentId: null, status: 'active', createdAt: erpNow(), updatedAt: erpNow() },
  ];
}

function seedWorkspaces() {
  return [
    { id: erpId(), key: 'ws_owner', name: 'Owner Workspace', nameAr: 'مساحة المالك', type: 'department', members: ['owner', 'admin'], status: 'active', createdAt: erpNow(), updatedAt: erpNow() },
    { id: erpId(), key: 'ws_academic', name: 'Academic Projects', nameAr: 'مشاريع أكاديمية', type: 'project', members: ['owner', 'teacher_manager'], status: 'active', createdAt: erpNow(), updatedAt: erpNow() },
  ];
}

export function ensureCommunicationEngine() {
  getCommConfig();
  ensureCollection(COLLECTIONS.channels, seedChannels());
  ensureCollection(COLLECTIONS.messages, []);
  ensureCollection(COLLECTIONS.meetings, []);
  ensureCollection(COLLECTIONS.calls, []);
  ensureCollection(COLLECTIONS.announcements, []);
  ensureCollection(COLLECTIONS.tickets, []);
  ensureCollection(COLLECTIONS.ticketNotes, []);
  ensureCollection(COLLECTIONS.knowledge, seedKb());
  ensureCollection(COLLECTIONS.notifications, []);
  ensureCollection(COLLECTIONS.documents, []);
  ensureCollection(COLLECTIONS.folders, seedFolders());
  ensureCollection(COLLECTIONS.calendar, []);
  ensureCollection(COLLECTIONS.notes, []);
  ensureCollection(COLLECTIONS.workspaces, seedWorkspaces());
  ensureCollection(COLLECTIONS.parentMessages, []);
  ensureCollection(COLLECTIONS.aiSessions, []);
  ensureCollection(COLLECTIONS.devices, seedDevices());
  ensureCollection(COLLECTIONS.audit, []);
  return { ok: true };
}

function withinRetention(item) {
  const days = getCommConfig().retentionDays || 365;
  if (!item?.createdAt && !item?.at) return true;
  const t = new Date(item.createdAt || item.at).getTime();
  return Date.now() - t <= days * 86400000;
}

function canAccessChannel(channel, user, role) {
  if (!channel) return false;
  if (['owner', 'super_admin', 'admin'].includes(role) || ['owner', 'super_admin', 'admin'].includes(user)) {
    return true;
  }
  const members = channel.members || [];
  return members.includes(user) || members.includes(role);
}

/** Resolve directory of platform identities from existing ERP collections (no duplicated users). */
export function listCommDirectory() {
  ensureCommunicationEngine();
  const pick = (collection, role) =>
    erpActiveItems(erpReadCollection(collection).items).map((u) => ({
      id: u.id,
      name: u.name || u.email || u.id,
      email: u.email || null,
      role,
      country: u.country || null,
      status: u.status || 'active',
    }));
  return {
    students: pick('students', 'student'),
    teachers: pick('teachers', 'teacher'),
    parents: pick('parents', 'parent'),
    employees: pick('employees', 'employee'),
    schools: pick('schools', 'school'),
    universities: pick('universities', 'university'),
    centers: pick('educational-centers', 'educational_center'),
    employers: pick('employers', 'employer'),
    recruitment: pick('recruitment-companies', 'recruitment_company'),
  };
}

export function sendMessage(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const user = meta.user || 'owner';
  const role = meta.role || 'owner';
  let channel = null;
  if (payload.channelId) {
    channel = erpActiveItems(erpReadCollection(COLLECTIONS.channels).items).find((c) => c.id === payload.channelId);
  }
  if (!channel && payload.channelKey) {
    channel = erpActiveItems(erpReadCollection(COLLECTIONS.channels).items).find((c) => c.key === payload.channelKey);
  }
  if (!channel && payload.type === 'private' && payload.toUserId) {
    channel = {
      id: erpId(),
      key: `private_${[user, payload.toUserId].sort().join('_')}`,
      name: `Private · ${payload.toUserId}`,
      type: 'private',
      members: [user, payload.toUserId],
      status: 'active',
      createdAt: erpNow(),
      updatedAt: erpNow(),
    };
    const existing = erpActiveItems(erpReadCollection(COLLECTIONS.channels).items).find((c) => c.key === channel.key);
    if (existing) channel = existing;
    else pushItem(COLLECTIONS.channels, channel);
  }
  if (!channel) return { ok: false, error: 'CHANNEL_REQUIRED' };
  if (!canAccessChannel(channel, user, role)) return { ok: false, error: 'FORBIDDEN' };

  const bodyText = erpText(payload.body);
  const enc = encryptText(bodyText);
  const message = {
    id: erpId(),
    channelId: channel.id,
    channelType: channel.type,
    from: user,
    to: payload.toUserId || null,
    bodyEncrypted: enc,
    preview: bodyText.slice(0, 120),
    attachments: payload.attachments || [],
    mentions: payload.mentions || [],
    translated: payload.translateTo
      ? { lang: payload.translateTo, text: autoTranslate(bodyText, payload.translateTo) }
      : null,
    status: 'sent',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.messages, message);
  updateItem(COLLECTIONS.channels, channel.id, { lastMessageAt: message.createdAt, lastPreview: message.preview });
  audit({ action: 'message.send', user, channelId: channel.id, messageId: message.id });
  publishLive({ type: 'message.created', channelId: channel.id, messageId: message.id });
  queueNotification({
    channel: 'in_app',
    title: `New message in ${channel.name}`,
    body: message.preview,
    audience: channel.members || [],
    source: 'messaging',
  });
  return {
    ok: true,
    message: {
      ...message,
      body: decryptText(message.bodyEncrypted),
    },
    channel,
  };
}

function autoTranslate(text, lang) {
  // Lightweight placeholder translation layer — Owner can swap for real provider via integrations.
  if (lang === 'ar') return `[عربي] ${text}`;
  if (lang === 'en') return `[EN] ${text}`;
  return `[${lang}] ${text}`;
}

function queueNotification(payload) {
  const item = {
    id: erpId(),
    channel: payload.channel || 'in_app',
    title: payload.title || 'Notification',
    body: payload.body || '',
    audience: payload.audience || ['owner'],
    scheduleAt: payload.scheduleAt || null,
    recurring: payload.recurring || null,
    status: payload.scheduleAt ? 'scheduled' : 'queued',
    source: payload.source || 'communication',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.notifications, item);
  // Mirror into existing notification-jobs (ERP) — single notification pipeline.
  pushItem('notification-jobs', {
    id: erpId(),
    name: item.title,
    channel: item.channel,
    subject: item.title,
    body: item.body,
    status: item.status === 'scheduled' ? 'scheduled' : 'queued',
    scheduledAt: item.scheduleAt,
    createdAt: erpNow(),
    updatedAt: erpNow(),
    source: 'communication-platform',
  });
  publishLive({ type: 'notification.queued', id: item.id });
  return item;
}

export function createMeeting(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const config = getCommConfig();
  const meeting = {
    id: erpId(),
    code: `M-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    title: erpText(payload.title) || 'Meeting',
    type: COMM_MEETING_TYPES.includes(payload.type) ? payload.type : 'group',
    host: meta.user || 'owner',
    participants: payload.participants || [meta.user || 'owner'],
    startsAt: payload.startsAt || erpNow(),
    endsAt: payload.endsAt || null,
    waitingRoom: payload.waitingRoom ?? config.waitingRoomDefault,
    recording: payload.recording ?? config.recordingDefault,
    screenSharing: Boolean(payload.screenSharing ?? true),
    attendance: [],
    status: 'scheduled',
    report: null,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.meetings, meeting);
  // Calendar sync
  pushItem(COLLECTIONS.calendar, {
    id: erpId(),
    type: meeting.type === 'live_class' ? 'live_lesson' : 'meeting',
    title: meeting.title,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    refId: meeting.id,
    status: 'scheduled',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  });
  audit({ action: 'meeting.create', user: meta.user || 'owner', meetingId: meeting.id });
  publishLive({ type: 'meeting.created', meetingId: meeting.id });
  return { ok: true, meeting };
}

export function joinMeeting(meetingId, meta = {}) {
  ensureCommunicationEngine();
  const meeting = erpActiveItems(erpReadCollection(COLLECTIONS.meetings).items).find((m) => m.id === meetingId);
  if (!meeting) return { ok: false, error: 'MEETING_NOT_FOUND' };
  const user = meta.user || 'guest';
  const attendance = [...(meeting.attendance || [])];
  if (!attendance.find((a) => a.user === user)) {
    attendance.push({ user, joinedAt: erpNow(), status: meeting.waitingRoom ? 'waiting' : 'joined' });
  }
  const updated = updateItem(COLLECTIONS.meetings, meetingId, {
    attendance,
    status: meeting.status === 'scheduled' ? 'live' : meeting.status,
  });
  publishLive({ type: 'meeting.join', meetingId, user });
  return { ok: true, meeting: updated };
}

export function endMeeting(meetingId, meta = {}) {
  ensureCommunicationEngine();
  const meeting = erpActiveItems(erpReadCollection(COLLECTIONS.meetings).items).find((m) => m.id === meetingId);
  if (!meeting) return { ok: false, error: 'MEETING_NOT_FOUND' };
  const report = {
    participants: (meeting.attendance || []).length,
    joined: (meeting.attendance || []).filter((a) => a.status === 'joined').length,
    waiting: (meeting.attendance || []).filter((a) => a.status === 'waiting').length,
    recording: Boolean(meeting.recording),
    summary: aiMeetingSummary(meeting),
    actionItems: aiActionItems(meeting),
    endedAt: erpNow(),
    endedBy: meta.user || 'owner',
  };
  const updated = updateItem(COLLECTIONS.meetings, meetingId, { status: 'ended', report, endsAt: erpNow() });
  publishLive({ type: 'meeting.ended', meetingId });
  return { ok: true, meeting: updated };
}

function aiMeetingSummary(meeting) {
  return `Meeting "${meeting.title}" with ${(meeting.participants || []).length} invited / ${(meeting.attendance || []).length} attendance records.`;
}

function aiActionItems(meeting) {
  return [
    `Follow up with participants of ${meeting.title}`,
    'Share recording if enabled',
    'Update related tasks',
  ];
}

export function startVoiceCall(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const call = {
    id: erpId(),
    from: meta.user || 'owner',
    to: payload.toUserId || payload.to || null,
    status: 'ringing',
    recording: Boolean(payload.recording),
    startedAt: erpNow(),
    endedAt: null,
    durationSec: 0,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.calls, call);
  publishLive({ type: 'call.started', callId: call.id });
  return { ok: true, call };
}

export function endVoiceCall(callId, meta = {}) {
  ensureCommunicationEngine();
  const call = erpActiveItems(erpReadCollection(COLLECTIONS.calls).items).find((c) => c.id === callId);
  if (!call) return { ok: false, error: 'CALL_NOT_FOUND' };
  const durationSec = Math.max(1, Math.round((Date.now() - new Date(call.startedAt).getTime()) / 1000));
  const updated = updateItem(COLLECTIONS.calls, callId, {
    status: 'completed',
    endedAt: erpNow(),
    durationSec,
    endedBy: meta.user || 'owner',
  });
  publishLive({ type: 'call.ended', callId });
  return { ok: true, call: updated };
}

export function createAnnouncement(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const scope = COMM_ANNOUNCEMENT_SCOPES.includes(payload.scope) ? payload.scope : 'global';
  const item = {
    id: erpId(),
    title: erpText(payload.title) || 'Announcement',
    body: erpText(payload.body) || '',
    scope,
    country: payload.country || null,
    orgId: payload.orgId || null,
    department: payload.department || null,
    emergency: scope === 'emergency' || Boolean(payload.emergency),
    status: 'published',
    createdBy: meta.user || 'owner',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.announcements, item);
  queueNotification({
    channel: item.emergency ? 'push' : 'in_app',
    title: item.title,
    body: item.body.slice(0, 200),
    audience: ['*'],
    source: 'announcement',
  });
  publishLive({ type: 'announcement.created', id: item.id, emergency: item.emergency });
  return { ok: true, announcement: item };
}

export function createTicket(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const priority = COMM_TICKET_PRIORITIES.includes(payload.priority) ? payload.priority : 'normal';
  const slaHours = getCommConfig().slaHours?.[priority] || 48;
  const ticket = {
    id: erpId(),
    subject: erpText(payload.subject) || 'Support request',
    body: erpText(payload.body) || '',
    priority,
    department: payload.department || 'support',
    assignee: payload.assignee || null,
    requester: meta.user || 'owner',
    status: 'open',
    attachments: payload.attachments || [],
    slaDueAt: new Date(Date.now() + slaHours * 3600000).toISOString(),
    escalated: false,
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.tickets, ticket);
  // Sync to support-center collection if present
  pushItem('support-center', {
    id: ticket.id,
    name: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    source: 'communication-platform',
  });
  publishLive({ type: 'ticket.created', ticketId: ticket.id });
  return { ok: true, ticket };
}

export function mutateTicket(ticketId, action, payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const ticket = erpActiveItems(erpReadCollection(COLLECTIONS.tickets).items).find((t) => t.id === ticketId);
  if (!ticket) return { ok: false, error: 'TICKET_NOT_FOUND' };

  if (action === 'assign') {
    const updated = updateItem(COLLECTIONS.tickets, ticketId, { assignee: payload.assignee || meta.user, status: 'assigned' });
    return { ok: true, ticket: updated };
  }
  if (action === 'note') {
    const note = {
      id: erpId(),
      ticketId,
      body: erpText(payload.body),
      internal: payload.internal !== false,
      author: meta.user || 'owner',
      createdAt: erpNow(),
    };
    pushItem(COLLECTIONS.ticketNotes, note);
    return { ok: true, note, ticket };
  }
  if (action === 'escalate') {
    const updated = updateItem(COLLECTIONS.tickets, ticketId, {
      escalated: true,
      priority: 'urgent',
      status: 'escalated',
      assignee: payload.assignee || 'owner',
    });
    queueNotification({
      channel: 'email',
      title: `Escalated ticket: ${ticket.subject}`,
      body: payload.reason || 'SLA / priority escalation',
      audience: ['owner', 'admin'],
      source: 'helpdesk',
    });
    publishLive({ type: 'ticket.escalated', ticketId });
    return { ok: true, ticket: updated };
  }
  if (action === 'resolve' || action === 'close') {
    const updated = updateItem(COLLECTIONS.tickets, ticketId, { status: action === 'resolve' ? 'resolved' : 'closed' });
    return { ok: true, ticket: updated };
  }
  return { ok: false, error: 'UNKNOWN_TICKET_ACTION' };
}

export function uploadDocument(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const doc = {
    id: erpId(),
    name: erpText(payload.name) || 'Document',
    folderId: payload.folderId || null,
    mime: payload.mime || 'application/octet-stream',
    size: Number(payload.size || 0),
    version: 1,
    versions: [{ version: 1, at: erpNow(), by: meta.user || 'owner', note: 'initial' }],
    permissions: payload.permissions || ['owner', 'admin'],
    comments: [],
    approvals: [],
    status: 'active',
    previewUrl: payload.previewUrl || null,
    downloadCount: 0,
    createdBy: meta.user || 'owner',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.documents, doc);
  publishLive({ type: 'document.uploaded', documentId: doc.id });
  return { ok: true, document: doc };
}

export function mutateDocument(documentId, action, payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const doc = erpActiveItems(erpReadCollection(COLLECTIONS.documents).items).find((d) => d.id === documentId);
  if (!doc) return { ok: false, error: 'DOCUMENT_NOT_FOUND' };

  if (action === 'comment') {
    const comments = [...(doc.comments || []), { id: erpId(), body: erpText(payload.body), by: meta.user || 'owner', at: erpNow() }];
    return { ok: true, document: updateItem(COLLECTIONS.documents, documentId, { comments }) };
  }
  if (action === 'approve') {
    const approvals = [...(doc.approvals || []), { by: meta.user || 'owner', at: erpNow(), status: 'approved', note: payload.note || '' }];
    return { ok: true, document: updateItem(COLLECTIONS.documents, documentId, { approvals, status: 'approved' }) };
  }
  if (action === 'version') {
    const version = Number(doc.version || 1) + 1;
    const versions = [...(doc.versions || []), { version, at: erpNow(), by: meta.user || 'owner', note: payload.note || 'update' }];
    return { ok: true, document: updateItem(COLLECTIONS.documents, documentId, { version, versions }) };
  }
  if (action === 'download') {
    return {
      ok: true,
      document: updateItem(COLLECTIONS.documents, documentId, { downloadCount: Number(doc.downloadCount || 0) + 1 }),
    };
  }
  return { ok: false, error: 'UNKNOWN_DOCUMENT_ACTION' };
}

export function createCalendarEvent(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const event = {
    id: erpId(),
    type: payload.type || 'reminder',
    title: erpText(payload.title) || 'Event',
    startsAt: payload.startsAt || erpNow(),
    endsAt: payload.endsAt || null,
    refId: payload.refId || null,
    attendees: payload.attendees || [],
    reminderAt: payload.reminderAt || null,
    status: 'scheduled',
    createdBy: meta.user || 'owner',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.calendar, event);
  if (event.reminderAt) {
    queueNotification({
      channel: 'push',
      title: `Reminder: ${event.title}`,
      body: event.title,
      scheduleAt: event.reminderAt,
      audience: event.attendees.length ? event.attendees : [meta.user || 'owner'],
      source: 'calendar',
    });
  }
  publishLive({ type: 'calendar.created', id: event.id });
  return { ok: true, event };
}

export function createCollaborativeNote(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const note = {
    id: erpId(),
    title: erpText(payload.title) || 'Shared note',
    body: erpText(payload.body) || '',
    workspaceId: payload.workspaceId || null,
    collaborators: payload.collaborators || [meta.user || 'owner'],
    status: 'active',
    createdBy: meta.user || 'owner',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.notes, note);
  publishLive({ type: 'note.created', id: note.id });
  return { ok: true, note };
}

export function sendParentMessage(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const type = COMM_PARENT_MESSAGE_TYPES.includes(payload.type) ? payload.type : 'teacher_parent';
  const item = {
    id: erpId(),
    type,
    from: meta.user || 'teacher',
    toParentId: payload.toParentId || null,
    studentId: payload.studentId || null,
    title: erpText(payload.title) || type,
    body: erpText(payload.body) || '',
    status: 'sent',
    createdAt: erpNow(),
    updatedAt: erpNow(),
  };
  pushItem(COLLECTIONS.parentMessages, item);
  queueNotification({
    channel: type === 'payment_reminder' ? 'sms' : 'push',
    title: item.title,
    body: item.body.slice(0, 160),
    audience: [payload.toParentId || 'parent'].filter(Boolean),
    source: 'parent_comms',
  });
  publishLive({ type: 'parent.message', id: item.id });
  return { ok: true, message: item };
}

export function aiAssist(payload = {}, meta = {}) {
  ensureCommunicationEngine();
  const input = erpText(payload.input || payload.prompt);
  const mode = payload.mode || 'chat';
  let output = '';
  if (mode === 'smart_reply') {
    output = `شكرًا لتواصلك. سأراجع طلبك وأعود إليك قريبًا. / Thanks — I'll review and follow up shortly.`;
  } else if (mode === 'translate') {
    output = autoTranslate(input, payload.lang || getCommConfig().translationDefaultLang || 'ar');
  } else if (mode === 'meeting_summary') {
    output = `Summary: ${input.slice(0, 280) || 'No transcript provided.'}`;
  } else if (mode === 'action_items') {
    output = ['Confirm next meeting', 'Share notes with attendees', 'Update related ticket'].join('\n');
  } else if (mode === 'reminder_suggestion') {
    output = `Suggested reminder in 24h for: ${input || 'follow-up'}`;
  } else {
    output = `AI Assistant: I can help with replies, translation, meeting summaries, and reminders. You said: "${input}"`;
  }
  const session = {
    id: erpId(),
    mode,
    input,
    output,
    user: meta.user || 'owner',
    createdAt: erpNow(),
  };
  pushItem(COLLECTIONS.aiSessions, session);
  publishLive({ type: 'ai.assist', id: session.id, mode });
  return { ok: true, session };
}

export function globalSearch(query = '', options = {}) {
  ensureCommunicationEngine();
  const q = erpText(query).toLowerCase();
  if (!q) return { ok: true, query: '', results: [] };

  const match = (obj) => JSON.stringify(obj).toLowerCase().includes(q);
  const take = (collection, type, mapFn) =>
    erpActiveItems(erpReadCollection(collection).items)
      .filter(withinRetention)
      .filter(match)
      .slice(0, options.limit || 20)
      .map((item) => mapFn(item, type));

  const results = [
    ...take(COLLECTIONS.messages, 'message', (m, type) => ({
      type,
      id: m.id,
      title: m.preview || decryptText(m.bodyEncrypted).slice(0, 80),
      at: m.createdAt,
    })),
    ...take(COLLECTIONS.meetings, 'meeting', (m, type) => ({ type, id: m.id, title: m.title, at: m.startsAt })),
    ...take(COLLECTIONS.tickets, 'ticket', (t, type) => ({ type, id: t.id, title: t.subject, at: t.createdAt })),
    ...take(COLLECTIONS.documents, 'file', (d, type) => ({ type, id: d.id, title: d.name, at: d.createdAt })),
    ...take(COLLECTIONS.announcements, 'announcement', (a, type) => ({ type, id: a.id, title: a.title, at: a.createdAt })),
    ...take('tasks', 'task', (t, type) => ({ type, id: t.id, title: t.title || t.name, at: t.createdAt || t.updatedAt })),
    ...take(COLLECTIONS.notes, 'document', (n, type) => ({ type, id: n.id, title: n.title, at: n.createdAt })),
  ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

  return { ok: true, query: q, total: results.length, results };
}

export function sweepCommSla(meta = {}) {
  ensureCommunicationEngine();
  const now = Date.now();
  const open = erpActiveItems(erpReadCollection(COLLECTIONS.tickets).items).filter((t) =>
    ['open', 'assigned', 'escalated'].includes(t.status),
  );
  const escalated = [];
  for (const ticket of open) {
    if (!ticket.slaDueAt) continue;
    if (new Date(ticket.slaDueAt).getTime() > now) continue;
    if (ticket.escalated) continue;
    const result = mutateTicket(ticket.id, 'escalate', { reason: 'SLA breached' }, meta);
    if (result.ok) escalated.push(result.ticket);
  }
  // Deliver scheduled notifications
  const notes = erpActiveItems(erpReadCollection(COLLECTIONS.notifications).items).filter((n) => n.status === 'scheduled');
  for (const n of notes) {
    if (!n.scheduleAt || new Date(n.scheduleAt).getTime() > now) continue;
    updateItem(COLLECTIONS.notifications, n.id, { status: 'sent', sentAt: erpNow() });
  }
  publishLive({ type: 'sla.sweep', escalated: escalated.length });
  return { ok: true, escalated: escalated.length };
}

export function getCommunicationDashboard() {
  ensureCommunicationEngine();
  const channels = erpActiveItems(erpReadCollection(COLLECTIONS.channels).items);
  const messages = erpActiveItems(erpReadCollection(COLLECTIONS.messages).items).filter(withinRetention);
  const meetings = erpActiveItems(erpReadCollection(COLLECTIONS.meetings).items);
  const calls = erpActiveItems(erpReadCollection(COLLECTIONS.calls).items);
  const announcements = erpActiveItems(erpReadCollection(COLLECTIONS.announcements).items);
  const tickets = erpActiveItems(erpReadCollection(COLLECTIONS.tickets).items);
  const knowledge = erpActiveItems(erpReadCollection(COLLECTIONS.knowledge).items);
  const notifications = erpActiveItems(erpReadCollection(COLLECTIONS.notifications).items);
  const documents = erpActiveItems(erpReadCollection(COLLECTIONS.documents).items);
  const folders = erpActiveItems(erpReadCollection(COLLECTIONS.folders).items);
  const calendar = erpActiveItems(erpReadCollection(COLLECTIONS.calendar).items);
  const notes = erpActiveItems(erpReadCollection(COLLECTIONS.notes).items);
  const workspaces = erpActiveItems(erpReadCollection(COLLECTIONS.workspaces).items);
  const parentMessages = erpActiveItems(erpReadCollection(COLLECTIONS.parentMessages).items);
  const aiSessions = erpActiveItems(erpReadCollection(COLLECTIONS.aiSessions).items);
  const devices = erpActiveItems(erpReadCollection(COLLECTIONS.devices).items);
  const auditLog = erpActiveItems(erpReadCollection(COLLECTIONS.audit).items).slice(0, 100);

  const decryptedMessages = messages.slice(0, 100).map((m) => ({
    ...m,
    body: decryptText(m.bodyEncrypted),
  }));

  const callAnalytics = {
    total: calls.length,
    completed: calls.filter((c) => c.status === 'completed').length,
    avgDurationSec: calls.length
      ? Math.round(calls.reduce((s, c) => s + Number(c.durationSec || 0), 0) / calls.length)
      : 0,
  };

  return {
    ok: true,
    generatedAt: erpNow(),
    config: getCommConfig(),
    catalog: {
      channelTypes: COMM_CHANNEL_TYPES,
      announcementScopes: COMM_ANNOUNCEMENT_SCOPES,
      priorities: COMM_TICKET_PRIORITIES,
      notificationChannels: COMM_NOTIFICATION_CHANNELS,
      meetingTypes: COMM_MEETING_TYPES,
      parentMessageTypes: COMM_PARENT_MESSAGE_TYPES,
    },
    stats: {
      channels: channels.length,
      messages: messages.length,
      meetings: meetings.length,
      liveMeetings: meetings.filter((m) => m.status === 'live').length,
      calls: calls.length,
      announcements: announcements.length,
      openTickets: tickets.filter((t) => ['open', 'assigned', 'escalated'].includes(t.status)).length,
      documents: documents.length,
      calendarEvents: calendar.length,
      parentMessages: parentMessages.length,
      devices: devices.length,
      encrypted: Boolean(getCommConfig().encryptionEnabled),
    },
    directory: listCommDirectory(),
    channels,
    messages: decryptedMessages,
    meetings: meetings.slice(0, 100),
    calls: calls.slice(0, 100),
    callAnalytics,
    announcements: announcements.slice(0, 100),
    tickets: tickets.slice(0, 100),
    knowledge,
    notifications: notifications.slice(0, 100),
    documents: documents.slice(0, 100),
    folders,
    calendar: calendar.slice(0, 150),
    notes: notes.slice(0, 100),
    workspaces,
    parentMessages: parentMessages.slice(0, 100),
    aiSessions: aiSessions.slice(0, 50),
    devices,
    audit: auditLog,
    liveVersion: liveBus().version,
    lastLiveEvent: liveBus().last,
  };
}

export async function mutateCommunicationCenter(action, payload = {}, meta = {}) {
  ensureCommunicationEngine();
  switch (action) {
    case 'sendMessage':
      return sendMessage(payload, meta);
    case 'createChannel': {
      const channel = {
        id: erpId(),
        key: payload.key || `ch_${Date.now()}`,
        name: erpText(payload.name) || 'Channel',
        nameAr: payload.nameAr || payload.name || 'قناة',
        type: payload.type || 'group',
        members: payload.members || [meta.user || 'owner'],
        status: 'active',
        createdAt: erpNow(),
        updatedAt: erpNow(),
      };
      pushItem(COLLECTIONS.channels, channel);
      publishLive({ type: 'channel.created', id: channel.id });
      return { ok: true, channel };
    }
    case 'createMeeting':
      return createMeeting(payload, meta);
    case 'joinMeeting':
      return joinMeeting(payload.id || payload.meetingId, meta);
    case 'endMeeting':
      return endMeeting(payload.id || payload.meetingId, meta);
    case 'startCall':
      return startVoiceCall(payload, meta);
    case 'endCall':
      return endVoiceCall(payload.id || payload.callId, meta);
    case 'announce':
      return createAnnouncement(payload, meta);
    case 'createTicket':
      return createTicket(payload, meta);
    case 'ticketAction':
      return mutateTicket(payload.id || payload.ticketId, payload.ticketAction || payload.op, payload, meta);
    case 'notify':
      return { ok: true, notification: queueNotification(payload) };
    case 'uploadDocument':
      return uploadDocument(payload, meta);
    case 'documentAction':
      return mutateDocument(payload.id || payload.documentId, payload.documentAction || payload.op, payload, meta);
    case 'calendarEvent':
      return createCalendarEvent(payload, meta);
    case 'createNote':
      return createCollaborativeNote(payload, meta);
    case 'parentMessage':
      return sendParentMessage(payload, meta);
    case 'aiAssist':
      return aiAssist(payload, meta);
    case 'search':
      return globalSearch(payload.q || payload.query || '', payload);
    case 'sweepSla':
      return sweepCommSla(meta);
    case 'setConfig':
      return setCommConfig(payload, meta);
    case 'trustDevice': {
      const device = updateItem(COLLECTIONS.devices, payload.id, { status: 'trusted', lastSeenAt: erpNow() });
      return device ? { ok: true, device } : { ok: false, error: 'DEVICE_NOT_FOUND' };
    }
    case 'revokeDevice': {
      const device = updateItem(COLLECTIONS.devices, payload.id, { status: 'revoked' });
      return device ? { ok: true, device } : { ok: false, error: 'DEVICE_NOT_FOUND' };
    }
    default:
      return { ok: false, error: 'UNKNOWN_COMM_ACTION' };
  }
}

export const COMMUNICATION_MODULE_IDS = Object.freeze([
  'communication-platform',
  'comm-messaging',
  'comm-meetings',
  'comm-calls',
  'comm-announcements',
  'comm-helpdesk',
  'comm-notifications',
  'comm-documents',
  'comm-calendar',
  'comm-collaboration',
  'comm-parents',
  'comm-ai',
  'comm-search',
  'comm-security',
]);

/**
 * SUCCESS OS — AI Companion Guide (Living Partner Ledger)
 *
 * Continuously records builder/user journey events, milestones, and
 * verification runs so the platform itself becomes a living user guide.
 * This is NOT the student tutor — it is the OS co-pilot layer.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  erpAppendAudit,
  erpId,
  erpList,
  erpNow,
  erpReadJson,
  erpText,
  erpWriteJson,
} from '../admin/enterprise-erp-store.js';

const MAX_EVENTS = 4000;
const MAX_SESSIONS = 200;
const MAX_VERIFICATIONS = 200;

const SURFACES = Object.freeze([
  {
    id: 'home',
    labelAr: 'الصفحة الرئيسية',
    path: '/',
    tier: 'core',
  },
  {
    id: 'teachers_register',
    labelAr: 'تسجيل المعلم',
    path: '/teachers/register',
    tier: 'teachers',
  },
  {
    id: 'teachers_dashboard',
    labelAr: 'لوحة تحكم المعلم',
    path: '/teachers/dashboard',
    tier: 'teachers',
  },
  {
    id: 'teachers_os',
    labelAr: 'Teachers OS',
    path: '/dashboard/teachers',
    tier: 'teachers',
  },
  {
    id: 'teachers_platform',
    labelAr: 'أدوات المنصة / AI معلمون',
    path: '/teachers/platform',
    tier: 'platform',
  },
  {
    id: 'students_dashboard',
    labelAr: 'غرفة تحكم الطالب',
    path: '/students/dashboard',
    tier: 'students',
  },
  {
    id: 'jobs_dashboard',
    labelAr: 'غرفة قيادة الباحث عن عمل',
    path: '/jobs/dashboard',
    tier: 'careers',
  },
  {
    id: 'super_admin',
    labelAr: 'لوحة المشرف الأعلى',
    path: '/dashboard/super-admin',
    tier: 'platform',
  },
  {
    id: 'employees_os',
    labelAr: 'لوحات الموظفين',
    path: '/dashboard/employees',
    tier: 'platform',
  },
  {
    id: 'ai_guide',
    labelAr: 'دليل الشريك الحي',
    path: '/guide',
    tier: 'platform',
  },
  {
    id: 'partners_dashboard',
    labelAr: 'لوحة تحكم الشريك',
    path: '/partners/dashboard',
    tier: 'partners',
  },
  {
    id: 'partners_discover',
    labelAr: 'اكتشاف الشركاء',
    path: '/partners/discover',
    tier: 'partners',
  },
  {
    id: 'admissions',
    labelAr: 'قبول الجامعات',
    path: '/admissions',
    tier: 'partners',
  },
]);

export const PARTNERSHIP_PROTOCOL = Object.freeze({
  version: '1.0.0',
  nameAr: 'بروتوكول شراكة البناء',
  principles: [
    'نشتغل كشركاء: القرار للمنتج، التنفيذ للمنصة والذكاء معاً.',
    'كل خطوة تُسجَّل في الدليل الحي — لا عمل ضائع ولا ذاكرة مشتتة.',
    'قبل التوسع: نتحقق من اللي انبنى (verify)، بعدين نبني اللي بعده.',
    'الجودة أعلى من السرعة الظاهرية: سطح يعمل 200 أفضل من عشرة وعود.',
    'الخصوصية طبقات: AI المنصة داخلي، دليل الشريك لفريق البناء، بوابات المستخدم منفصلة.',
  ],
  operatingLoop: [
    'افهم القصد بسرعة (هدف واحد واضح).',
    'ابنِ السطح + اربطه بالمنظومة.',
    'سجّل الحدث في الدليل الحي.',
    'تحقق (verify) من المسارات الحرجة.',
    'أعرض الروابط والحالة — جاهزين للدفعة التالية.',
  ],
});

function root() {
  return path.join(process.cwd(), 'library', 'enterprise-admin', 'companion-guide');
}

function ensure() {
  fs.mkdirSync(root(), { recursive: true });
  return root();
}

function file(name) {
  return path.join(ensure(), name);
}

function readList(name) {
  const data = erpReadJson(file(name));
  return erpList(data?.items);
}

function writeList(name, items) {
  erpWriteJson(file(name), { items, updatedAt: erpNow() });
  return items;
}

export function listSurfaces() {
  return SURFACES.map((s) => ({ ...s }));
}

export function getOrCreateSession(input = {}) {
  const sessions = readList('sessions.json');
  const requestedId = erpText(input.sessionId);
  let session = requestedId ? sessions.find((s) => s.id === requestedId) : null;

  if (!session) {
    session = {
      id: erpId(),
      createdAt: erpNow(),
      updatedAt: erpNow(),
      actor: erpText(input.actor) || 'partner',
      role: erpText(input.role) || 'builder',
      label: erpText(input.label) || 'جلسة بناء SUCCESS OS',
      eventCount: 0,
      lastPath: '',
      lastAction: '',
    };
    writeList('sessions.json', [session, ...sessions].slice(0, MAX_SESSIONS));
  }

  return session;
}

export function listEvents(filters = {}) {
  let items = readList('events.json');
  if (filters.sessionId) items = items.filter((e) => e.sessionId === filters.sessionId);
  if (filters.limit) items = items.slice(0, Number(filters.limit) || 100);
  return items;
}

export function recordEvent(input = {}) {
  const session = getOrCreateSession({
    sessionId: input.sessionId,
    actor: input.actor,
    role: input.role,
    label: input.label,
  });

  const event = {
    id: erpId(),
    createdAt: erpNow(),
    sessionId: session.id,
    type: erpText(input.type) || 'note',
    path: erpText(input.path),
    title: erpText(input.title),
    detail: erpText(input.detail),
    meta: input.meta && typeof input.meta === 'object' ? input.meta : {},
    actor: erpText(input.actor) || session.actor,
    source: erpText(input.source) || 'manual',
  };

  const events = [event, ...listEvents()].slice(0, MAX_EVENTS);
  writeList('events.json', events);

  const sessions = readList('sessions.json').map((s) =>
    s.id === session.id
      ? {
          ...s,
          updatedAt: erpNow(),
          eventCount: (s.eventCount || 0) + 1,
          lastPath: event.path || s.lastPath,
          lastAction: event.type,
        }
      : s,
  );
  writeList('sessions.json', sessions);

  erpAppendAudit({
    actor: event.actor,
    action: 'companion.guide.event',
    moduleId: 'ai-companion-guide',
    entityId: event.id,
    meta: { type: event.type, path: event.path, sessionId: session.id },
  });

  return { session: sessions.find((s) => s.id === session.id), event };
}

export function listMilestones() {
  return readList('milestones.json');
}

export function upsertMilestone(input = {}) {
  const items = listMilestones();
  const id = erpText(input.id) || erpId();
  const existing = items.find((m) => m.id === id);
  const row = {
    id,
    createdAt: existing?.createdAt || erpNow(),
    updatedAt: erpNow(),
    title: erpText(input.title) || existing?.title || 'معلم',
    status: erpText(input.status) || existing?.status || 'done',
    path: erpText(input.path) || existing?.path || '',
    note: erpText(input.note) || existing?.note || '',
    tier: erpText(input.tier) || existing?.tier || 'build',
  };
  const next = existing ? items.map((m) => (m.id === id ? row : m)) : [row, ...items];
  writeList('milestones.json', next.slice(0, 500));
  return row;
}

export function seedBuildMilestonesIfEmpty() {
  if (listMilestones().length) return listMilestones();
  const seeds = [
    {
      title: 'Teachers OS — تسجيل ولوحة ومعاينة',
      path: '/teachers/dashboard',
      tier: 'teachers',
      note: 'تسجيل + تحكم + أسعار/عروض + مشرف + AI منصة',
    },
    {
      title: 'Students OS — غرفة تحكم الطالب',
      path: '/students/dashboard',
      tier: 'students',
      note: 'حلم، مهام، مدارات تعلم',
    },
    {
      title: 'Careers OS — غرفة قيادة الباحث',
      path: '/jobs/dashboard',
      tier: 'careers',
      note: 'رادار وظائف + مهارات + خصوصية',
    },
    {
      title: 'Super Admin + Employees OS',
      path: '/dashboard/super-admin',
      tier: 'platform',
      note: 'أعلى طبقات التشغيل',
    },
    {
      title: 'دليل الشريك الحي (هذه الأداة)',
      path: '/guide',
      tier: 'platform',
      note: 'تسجيل مستمر + تحقق + سرد ذكي',
    },
  ];
  return seeds.map((s) => upsertMilestone({ ...s, status: 'done' }));
}

/**
 * Verify critical OS surfaces by HTTP GET against local origin.
 * Used as the "check everything again" gate.
 */
export async function runSurfaceVerification(options = {}) {
  const origin = erpText(options.origin) || 'http://127.0.0.1:3055';
  const actor = erpText(options.actor) || 'companion_ai';
  const results = [];

  for (const surface of SURFACES) {
    const url = `${origin.replace(/\/$/, '')}${surface.path}`;
    const started = Date.now();
    let ok = false;
    let status = 0;
    let error = '';
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { Accept: 'text/html,application/json' },
        cache: 'no-store',
      });
      status = res.status;
      ok = res.status >= 200 && res.status < 400;
    } catch (e) {
      error = String(e?.message || e || 'FETCH_FAILED').slice(0, 160);
    }
    results.push({
      id: surface.id,
      labelAr: surface.labelAr,
      path: surface.path,
      tier: surface.tier,
      ok,
      status,
      ms: Date.now() - started,
      error,
    });
  }

  // API smoke (snapshot only — never call verify here to avoid recursion)
  for (const apiPath of ['/api/teachers-os?view=marketplace', '/api/ai-guide?view=protocol']) {
    const url = `${origin.replace(/\/$/, '')}${apiPath}`;
    const started = Date.now();
    let ok = false;
    let status = 0;
    let error = '';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      status = res.status;
      const json = await res.json().catch(() => null);
      ok = res.ok && (json?.ok !== false);
    } catch (e) {
      error = String(e?.message || e || 'FETCH_FAILED').slice(0, 160);
    }
    results.push({
      id: `api:${apiPath}`,
      labelAr: `API ${apiPath}`,
      path: apiPath,
      tier: 'api',
      ok,
      status,
      ms: Date.now() - started,
      error,
    });
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const report = {
    id: erpId(),
    createdAt: erpNow(),
    actor,
    origin,
    passed,
    failed,
    total: results.length,
    score: results.length ? Math.round((passed / results.length) * 100) : 0,
    results,
  };

  const history = [report, ...readList('verifications.json')].slice(0, MAX_VERIFICATIONS);
  writeList('verifications.json', history);

  recordEvent({
    sessionId: options.sessionId,
    actor,
    type: 'verification',
    path: '/guide',
    title: `تحقق المنصة: ${passed}/${results.length}`,
    detail: failed
      ? `فشل ${failed} سطح — راجع التقرير`
      : 'كل الأسطح الحرجة استجابت بنجاح',
    meta: { reportId: report.id, score: report.score },
    source: 'companion_verify',
  });

  erpAppendAudit({
    actor,
    action: 'companion.guide.verify',
    moduleId: 'ai-companion-guide',
    entityId: report.id,
    meta: { score: report.score, failed },
  });

  return report;
}

export function latestVerification() {
  return readList('verifications.json')[0] || null;
}

export function buildGuideNarrative(input = {}) {
  const session = getOrCreateSession({ sessionId: input.sessionId });
  const events = listEvents({ sessionId: session.id, limit: 12 });
  const milestones = seedBuildMilestonesIfEmpty();
  const verification = latestVerification();
  const failed = (verification?.results || []).filter((r) => !r.ok);

  const lines = [
    'أنا دليل الشريك الحي في SUCCESS OS — أسجّل معك ولا أنسى.',
    `الجلسة: ${session.label} · أحداث: ${session.eventCount || 0}.`,
    `معالم منجزة: ${milestones.filter((m) => m.status === 'done').length}.`,
  ];

  if (verification) {
    lines.push(
      `آخر تحقق: ${verification.score}% (${verification.passed}/${verification.total}) في ${verification.createdAt}.`,
    );
  } else {
    lines.push('لم يُشغَّل تحقق بعد — اضغط «تحقق من كل شيء».');
  }

  if (failed.length) {
    lines.push(`يحتاج انتباه: ${failed.map((f) => f.labelAr || f.path).join(' · ')}`);
  } else if (verification) {
    lines.push('الأسطح الحرجة سليمة — نقدر نوسّع باحتراف.');
  }

  if (events[0]) {
    lines.push(`آخر حركة: ${events[0].title || events[0].type} @ ${events[0].path || '—'}`);
  }

  lines.push('البروتوكول: افهم → ابنِ → سجّل → تحقق → اعرض → كرر.');
  return lines.join('\n');
}

export function getCompanionSnapshot(sessionId) {
  const session = getOrCreateSession({ sessionId });
  return {
    protocol: PARTNERSHIP_PROTOCOL,
    surfaces: listSurfaces(),
    session,
    events: listEvents({ sessionId: session.id, limit: 80 }),
    milestones: seedBuildMilestonesIfEmpty(),
    verification: latestVerification(),
    narrative: buildGuideNarrative({ sessionId: session.id }),
  };
}

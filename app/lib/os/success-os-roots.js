/**
 * SUCCESS OS ROOTS KERNEL
 * =======================
 * The living roots of the Education Operating System.
 * Domains are organs. Arteries are life-flows. Surfaces are leaves.
 * Everything above the soil must drink from these roots.
 *
 * This is not a page catalog — it is the organism map of SUCCESS OS.
 */

import {
  erpAppendAudit,
  erpId,
  erpList,
  erpNow,
  erpReadJson,
  erpText,
  erpWriteJson,
} from '../admin/enterprise-erp-store.js';
import fs from 'node:fs';
import path from 'node:path';

export const ROOTS_VERSION = '1.0.0-living';
export const ROOTS_CODENAME = 'SHARAYEEN · شرايين';

/** Founding doctrine — ahead-of-era operating principles. */
export const ROOTS_DOCTRINE = Object.freeze({
  titleAr: 'عقيدة الجذور',
  titleEn: 'Roots Doctrine',
  manifestoAr: [
    'الإنسان في المركز — الطالب والمعلم والشريك والباحث شرايين لمنظومة واحدة.',
    'الجذر قبل الورقة: لا نبني واجهة بلا مصدر حقيقة، ولا وعد بلا مسار تحقق.',
    'الخصوصية طبقات: ما للمنصة للمنصة، وما للمستخدم للمستخدم، وما للشراكة بعقد واضح.',
    'الذكاء الاصطناعي عصب لا سيّد: يسجّل، يطابق، يستخلص — والإنسان يقرّر.',
    'كل تدفق حياة له أثر قابل للتدقيق: هوية → رحلة → مطابقة → معاملة → جواز → أثر.',
  ],
  operatingLaw: [
    'Identity Root — من أنت في النظام',
    'Journey Artery — أين تسير',
    'Match Artery — من يناسبك',
    'Transaction Artery — ماذا تبادلت',
    'Evidence Root — ماذا أثبتّ (Passport)',
    'Nervous System — دليل الشريك الحي + AI الداخلي',
  ],
});

/**
 * Primary root domains (organs of the OS).
 * depth: 0 = crown human, 1 = primary roots, 2 = feeder roots
 */
export const ROOT_DOMAINS = Object.freeze([
  {
    id: 'human_core',
    depth: 0,
    labelAr: 'نواة الإنسان',
    labelEn: 'Human Core',
    essence: 'كل مسار يبدأ من إنسان حي — مش من مؤسسة.',
    color: '#f2d77c',
    arteries: ['identity', 'passport'],
  },
  {
    id: 'learning',
    depth: 1,
    labelAr: 'جذر التعلم',
    labelEn: 'Learning Root',
    essence: 'طالب، مواد، كتب، معلم ذكي، جواز تعليمي.',
    color: '#9e1722',
    surfaces: ['/students/dashboard', '/student-portal', '/tutor', '/passport'],
    apis: [],
    arteries: ['identity', 'journey', 'evidence'],
  },
  {
    id: 'library',
    depth: 1,
    labelAr: 'جذر المكتبة والمناهج',
    labelEn: 'Library & Curriculum Root',
    essence:
      'مكتبة رقمية عالمية + دروس تفاعلية/3D + مناهج مرفوعة — تُسلَّم عبر معلّم حقيقي.',
    color: '#8a1420',
    surfaces: [
      '/digital-library',
      '/curriculum',
      '/curriculum/jordan',
      '/curriculum/jordan/elementary',
      '/library',
      '/digital-library/international-systems/global/ib/dp/physics/quantum-physics/photoelectric-effect',
    ],
    apis: ['/api/curriculum-os', '/api/curriculum-os?view=jordan'],
    arteries: ['journey', 'match', 'evidence'],
  },
  {
    id: 'teaching',
    depth: 1,
    labelAr: 'جذر التدريس',
    labelEn: 'Teaching Root',
    essence: 'معلمون، عروض، حصص، مبيعات، إشراف.',
    color: '#7f121b',
    surfaces: [
      '/teachers/register',
      '/teachers/dashboard',
      '/dashboard/teachers',
      '/teachers',
    ],
    apis: ['/api/teachers-os'],
    arteries: ['identity', 'match', 'transaction'],
  },
  {
    id: 'partners',
    depth: 1,
    labelAr: 'جذر الشراكة',
    labelEn: 'Partnership Root',
    essence: 'جامعات، مدارس، مراكز، أصحاب عمل — ملف ونشر ومطابقة.',
    color: '#4b0a11',
    surfaces: [
      '/partners/dashboard',
      '/partners/discover',
      '/admissions',
      '/join-us',
    ],
    apis: ['/api/partners-os'],
    arteries: ['identity', 'match', 'journey'],
  },
  {
    id: 'careers',
    depth: 1,
    labelAr: 'جذر المسار المهني',
    labelEn: 'Careers Root',
    essence: 'باحث عن عمل، وظائف، مهارات، فصل خصوصية عن التعلم.',
    color: '#301218',
    surfaces: ['/jobs/dashboard', '/jobs', '/jobseeker-portal'],
    apis: [],
    arteries: ['identity', 'match', 'transaction'],
  },
  {
    id: 'admissions',
    depth: 2,
    labelAr: 'جذر القبول الجامعي',
    labelEn: 'Admissions Root',
    essence: 'قارة → دولة → جنسية → برنامج → تقديم.',
    color: '#c43a45',
    surfaces: ['/admissions', '/application-tracker', '/university-profile'],
    apis: ['/api/v1/admissions/applications'],
    arteries: ['journey', 'match', 'transaction', 'evidence'],
  },
  {
    id: 'operations',
    depth: 1,
    labelAr: 'جذر التشغيل',
    labelEn: 'Operations Root',
    essence: 'مشرف أعلى، موظفين، صلاحيات، تدقيق.',
    color: '#6a4d12',
    surfaces: [
      '/dashboard/super-admin',
      '/dashboard/employees',
      '/admin',
      '/dashboard/admin',
    ],
    apis: [],
    arteries: ['identity', 'audit'],
  },
  {
    id: 'nervous_ai',
    depth: 0,
    labelAr: 'الجهاز العصبي الذكي',
    labelEn: 'AI Nervous System',
    essence: 'دليل الشريك الحي + استخلاص منصة + تحقق مستمر.',
    color: '#d4af37',
    surfaces: ['/guide', '/teachers/platform', '/roots'],
    apis: ['/api/ai-guide', '/api/os-roots'],
    arteries: ['audit', 'evidence'],
  },
]);

/**
 * Life arteries — flows that keep the organism alive.
 */
export const LIFE_ARTERIES = Object.freeze([
  {
    id: 'identity',
    labelAr: 'شريان الهوية',
    labelEn: 'Identity',
    from: 'human_core',
    to: ['learning', 'library', 'teaching', 'partners', 'careers', 'operations'],
    meaning: 'من أنت وما دورك قبل أي خدمة.',
  },
  {
    id: 'journey',
    labelAr: 'شريان الرحلة',
    labelEn: 'Journey',
    from: 'learning',
    to: ['admissions', 'partners', 'careers', 'library'],
    meaning: 'مسار متصل: مدرسة → جامعة → مهنة.',
  },
  {
    id: 'match',
    labelAr: 'شريان المطابقة',
    labelEn: 'Match',
    from: 'partners',
    to: ['learning', 'careers', 'teaching', 'admissions', 'library'],
    meaning: 'الطالب/الباحث يلاقي المعلم أو الجامعة أو الوظيفة المناسبة.',
  },
  {
    id: 'transaction',
    labelAr: 'شريان المعاملة',
    labelEn: 'Transaction',
    from: 'teaching',
    to: ['learning', 'careers', 'admissions', 'operations'],
    meaning: 'حجز، دفع، تقديم، عمولة منصة — أثر مالي واضح.',
  },
  {
    id: 'evidence',
    labelAr: 'شريان الدليل',
    labelEn: 'Evidence',
    from: 'human_core',
    to: ['learning', 'admissions', 'careers', 'nervous_ai'],
    meaning: 'الجواز التعليمي والأثر القابل للإثبات.',
  },
  {
    id: 'audit',
    labelAr: 'شريان التدقيق',
    labelEn: 'Audit',
    from: 'nervous_ai',
    to: ['operations', 'partners', 'teaching'],
    meaning: 'لا حياة بلا ذاكرة — كل فعل يُسجَّل.',
  },
]);

function rootsDir() {
  const dir = path.join(
    process.cwd(),
    'library',
    'enterprise-admin',
    'os-roots',
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function pulseFile() {
  return path.join(rootsDir(), 'pulse-history.json');
}

export function getRootsManifest() {
  return {
    version: ROOTS_VERSION,
    codename: ROOTS_CODENAME,
    doctrine: ROOTS_DOCTRINE,
    domains: ROOT_DOMAINS,
    arteries: LIFE_ARTERIES,
    plantedAt: '2026-07-26',
    steward: 'Waseem · Partner × SUCCESS OS AI',
  };
}

/**
 * Live pulse: probe critical surfaces/APIs that roots depend on.
 */
export async function pulseRoots(options = {}) {
  const origin = erpText(options.origin) || 'http://127.0.0.1:3055';
  const probes = [];

  const critical = [
    { id: 'home', path: '/', domain: 'human_core' },
    { id: 'students', path: '/students/dashboard', domain: 'learning' },
    { id: 'library', path: '/digital-library', domain: 'library' },
    { id: 'curriculum', path: '/curriculum', domain: 'library' },
    { id: 'jordan_wave', path: '/curriculum/jordan', domain: 'library' },
    { id: 'jordan_elementary', path: '/curriculum/jordan/elementary', domain: 'library' },
    { id: 'jordan_elementary_api', path: '/api/curriculum-os?view=jordan-elementary', domain: 'library' },
    { id: 'curriculum_api', path: '/api/curriculum-os?view=snapshot', domain: 'library' },
    { id: 'jordan_api', path: '/api/curriculum-os?view=jordan', domain: 'library' },
    {
      id: 'jordan_g1_lesson',
      path: '/digital-library/middle-east/jordan/national/grade-1/%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA/%D8%A7%D9%84%D8%AC%D9%85%D8%B9/%D8%A7%D9%84%D8%AC%D9%85%D8%B9-%D8%A8%D8%AE%D8%B7-%D8%A7%D9%84%D8%A3%D8%B9%D8%AF%D8%A7%D8%AF',
      domain: 'library',
    },
    { id: 'teachers', path: '/teachers/dashboard', domain: 'teaching' },
    { id: 'teachers_api', path: '/api/teachers-os?view=marketplace', domain: 'teaching' },
    { id: 'partners', path: '/partners/dashboard', domain: 'partners' },
    { id: 'discover', path: '/partners/discover', domain: 'partners' },
    { id: 'partners_api', path: '/api/partners-os?view=marketplace', domain: 'partners' },
    { id: 'careers', path: '/jobs/dashboard', domain: 'careers' },
    { id: 'admissions', path: '/admissions', domain: 'admissions' },
    { id: 'guide', path: '/guide', domain: 'nervous_ai' },
    { id: 'guide_api', path: '/api/ai-guide?view=protocol', domain: 'nervous_ai' },
    { id: 'roots', path: '/roots', domain: 'nervous_ai' },
    { id: 'super_admin', path: '/dashboard/super-admin', domain: 'operations' },
  ];

  for (const probe of critical) {
    const url = `${origin.replace(/\/$/, '')}${probe.path}`;
    const started = Date.now();
    let ok = false;
    let status = 0;
    let error = '';
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        redirect: 'follow',
        headers: { Accept: 'text/html,application/json' },
      });
      status = res.status;
      if (probe.path.startsWith('/api/')) {
        const json = await res.json().catch(() => null);
        ok = res.ok && json?.ok !== false;
      } else {
        ok = res.status >= 200 && res.status < 400;
      }
    } catch (e) {
      error = String(e?.message || e).slice(0, 120);
    }
    probes.push({
      ...probe,
      ok,
      status,
      ms: Date.now() - started,
      error,
    });
  }

  const alive = probes.filter((p) => p.ok).length;
  const report = {
    id: erpId(),
    createdAt: erpNow(),
    origin,
    version: ROOTS_VERSION,
    codename: ROOTS_CODENAME,
    alive,
    total: probes.length,
    vitality: probes.length ? Math.round((alive / probes.length) * 100) : 0,
    probes,
    domains: ROOT_DOMAINS.map((d) => {
      const related = probes.filter((p) => p.domain === d.id);
      const up = related.filter((p) => p.ok).length;
      return {
        id: d.id,
        labelAr: d.labelAr,
        probed: related.length,
        alive: up,
        vitality: related.length ? Math.round((up / related.length) * 100) : null,
      };
    }),
  };

  const history = erpList(erpReadJson(pulseFile())?.items);
  erpWriteJson(pulseFile(), {
    items: [report, ...history].slice(0, 100),
    updatedAt: erpNow(),
  });

  erpAppendAudit({
    actor: options.actor || 'roots_kernel',
    action: 'os.roots.pulse',
    moduleId: 'success-os-roots',
    entityId: report.id,
    meta: { vitality: report.vitality, alive, total: report.total },
  });

  return report;
}

export function latestPulse() {
  return erpList(erpReadJson(pulseFile())?.items)[0] || null;
}

export function getRootsSnapshot() {
  const pulse = latestPulse();
  return {
    manifest: getRootsManifest(),
    pulse,
    nextGrowth: [
      {
        id: 'admissions_inbox',
        labelAr: 'صندوق طلبات القبول داخل لوحة الجامعة',
        feeds: ['admissions', 'partners'],
      },
      {
        id: 'employer_posts',
        labelAr: 'نشر وظائف حية من ملف صاحب العمل',
        feeds: ['careers', 'partners'],
      },
      {
        id: 'passport_bridge',
        labelAr: 'جسر الجواز التعليمي مع القبول والعمل',
        feeds: ['learning', 'admissions', 'careers'],
      },
      {
        id: 'money_artery',
        labelAr: 'شريان مالي موحّد (عمولة، اشتراكات، $5 قبول)',
        feeds: ['transaction', 'operations'],
      },
    ],
  };
}

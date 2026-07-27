/**
 * Partners OS — universities, colleges, schools, centers, employers.
 * Partner fills profile → publishes preview → students/job seekers match & discover.
 */

import {
  erpAppendAudit,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpText,
  erpWriteCollection,
} from '../admin/enterprise-erp-store.js';

export const PARTNER_TYPES = Object.freeze({
  UNIVERSITY: 'university',
  COLLEGE: 'college',
  SCHOOL: 'school',
  CENTER: 'center',
  EMPLOYER: 'employer',
});

export const PARTNER_TYPE_LABELS = Object.freeze({
  university: 'جامعة',
  college: 'كلية',
  school: 'مدرسة',
  center: 'مركز تعليمي',
  employer: 'شركة توظيف / صاحب عمل',
});

function collection(name) {
  return erpReadCollection(name);
}

function writeCollection(name, items) {
  return erpWriteCollection(name, { items, updatedAt: erpNow() });
}

function splitList(v) {
  if (Array.isArray(v)) return v.map(erpText).filter(Boolean);
  return String(v || '')
    .split(/[,،\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function listPartners(filters = {}) {
  let items = erpList(collection('partner-profiles').items);
  if (filters.type) items = items.filter((p) => p.type === filters.type);
  if (filters.status) items = items.filter((p) => p.status === filters.status);
  if (filters.publishedOnly) {
    items = items.filter((p) => p.status === 'published' || p.status === 'approved');
  }
  if (filters.country) {
    const c = String(filters.country).toLowerCase();
    items = items.filter((p) => String(p.country || '').toLowerCase().includes(c));
  }
  if (filters.query) {
    const q = String(filters.query).toLowerCase();
    items = items.filter((p) =>
      `${p.orgName} ${p.about} ${(p.programs || []).join(' ')} ${(p.openRoles || []).join(' ')} ${(p.tags || []).join(' ')}`
        .toLowerCase()
        .includes(q),
    );
  }
  return items;
}

export function getPartner(partnerId) {
  return listPartners().find((p) => p.id === partnerId) || null;
}

export function profileCompleteness(partner) {
  if (!partner) return 0;
  const base = [
    partner.orgName,
    partner.email,
    partner.phone,
    partner.country,
    partner.city,
    partner.about,
    partner.website,
  ];
  const typed =
    partner.type === 'employer'
      ? [partner.industry, (partner.openRoles || []).length, partner.jobRequirements]
      : partner.type === 'university' || partner.type === 'college'
        ? [
            partner.admissionsRequirements,
            (partner.programs || []).length,
            partner.applicationChannel,
          ]
        : partner.type === 'school'
          ? [(partner.gradesOffered || []).length, partner.annualFee]
          : [(partner.courses || []).length, partner.accreditationBody];

  const checks = [...base, ...typed];
  const filled = checks.filter((x) => {
    if (typeof x === 'number') return x > 0;
    return Boolean(erpText(x));
  }).length;
  return Math.round((filled / checks.length) * 100);
}

export function upsertPartnerProfile(input = {}) {
  const items = listPartners();
  const now = erpNow();
  const id = erpText(input.id) || erpId();
  const existing = items.find((p) => p.id === id);
  const type = erpText(input.type) || existing?.type || PARTNER_TYPES.UNIVERSITY;

  const partner = {
    id,
    type,
    status: erpText(input.status) || existing?.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    registeredBy: erpText(input.registeredBy) || existing?.registeredBy || 'self',
    orgName: erpText(input.orgName) || existing?.orgName || '',
    contactName: erpText(input.contactName) || existing?.contactName || '',
    email: erpText(input.email) || existing?.email || '',
    phone: erpText(input.phone) || existing?.phone || '',
    country: erpText(input.country) || existing?.country || '',
    city: erpText(input.city) || existing?.city || '',
    website: erpText(input.website) || existing?.website || '',
    about: erpText(input.about) || existing?.about || '',
    logoDataUrl:
      erpText(input.logoDataUrl).length > 900000
        ? existing?.logoDataUrl || ''
        : erpText(input.logoDataUrl) || existing?.logoDataUrl || '',
    tags: splitList(input.tags?.length ? input.tags : existing?.tags),
    // University / college
    admissionsRequirements:
      erpText(input.admissionsRequirements) || existing?.admissionsRequirements || '',
    programs: splitList(input.programs?.length ? input.programs : existing?.programs),
    degrees: splitList(input.degrees?.length ? input.degrees : existing?.degrees),
    languages: splitList(input.languages?.length ? input.languages : existing?.languages),
    tuitionRange: erpText(input.tuitionRange) || existing?.tuitionRange || '',
    applicationChannel:
      erpText(input.applicationChannel) || existing?.applicationChannel || '',
    seats: Number(input.seats ?? existing?.seats) || 0,
    deadline: erpText(input.deadline) || existing?.deadline || '',
    // School
    educationSystems: splitList(
      input.educationSystems?.length ? input.educationSystems : existing?.educationSystems,
    ),
    gradesOffered: splitList(
      input.gradesOffered?.length ? input.gradesOffered : existing?.gradesOffered,
    ),
    annualFee: erpText(input.annualFee) || existing?.annualFee || '',
    // Center
    courses: splitList(input.courses?.length ? input.courses : existing?.courses),
    certificateTypes: splitList(
      input.certificateTypes?.length ? input.certificateTypes : existing?.certificateTypes,
    ),
    accreditationBody:
      erpText(input.accreditationBody) || existing?.accreditationBody || '',
    licenseNumber: erpText(input.licenseNumber) || existing?.licenseNumber || '',
    coursePrice: erpText(input.coursePrice) || existing?.coursePrice || '',
    // Employer
    industry: erpText(input.industry) || existing?.industry || '',
    openRoles: splitList(input.openRoles?.length ? input.openRoles : existing?.openRoles),
    jobRequirements: erpText(input.jobRequirements) || existing?.jobRequirements || '',
    workLocations: splitList(
      input.workLocations?.length ? input.workLocations : existing?.workLocations,
    ),
    // Visibility
    visibleToStudents: input.visibleToStudents !== false,
    visibleToJobSeekers:
      input.visibleToJobSeekers !== undefined
        ? Boolean(input.visibleToJobSeekers)
        : type === 'employer' || existing?.visibleToJobSeekers !== false,
    isPlatformPartner: input.isPlatformPartner !== false,
  };

  if (!partner.orgName) throw new Error('ORG_NAME_REQUIRED');
  if (!partner.email && !partner.phone) throw new Error('CONTACT_REQUIRED');

  partner.completeness = profileCompleteness(partner);

  const next = existing
    ? items.map((p) => (p.id === id ? partner : p))
    : [partner, ...items];
  writeCollection('partner-profiles', next);
  erpAppendAudit({
    actor: partner.email || partner.orgName,
    action: existing ? 'partner.profile.update' : 'partner.profile.register',
    moduleId: 'partners-os',
    entityId: id,
    meta: { type: partner.type, status: partner.status },
  });
  return partner;
}

export function publishPartner(partnerId, actor = 'partner') {
  const items = listPartners();
  const idx = items.findIndex((p) => p.id === partnerId);
  if (idx < 0) throw new Error('PARTNER_NOT_FOUND');
  const updated = {
    ...items[idx],
    status: 'published',
    publishedAt: erpNow(),
    updatedAt: erpNow(),
    publishedBy: actor,
  };
  updated.completeness = profileCompleteness(updated);
  items[idx] = updated;
  writeCollection('partner-profiles', items);
  erpAppendAudit({
    actor,
    action: 'partner.profile.publish',
    moduleId: 'partners-os',
    entityId: partnerId,
  });
  return updated;
}

export function getPublicPartnerCard(partnerId) {
  const p = getPartner(partnerId);
  if (!p) return null;
  if (!['published', 'approved'].includes(p.status)) {
    // Draft still viewable with ?preview=1 from dashboard; public API filters published
  }
  return {
    id: p.id,
    type: p.type,
    typeLabel: PARTNER_TYPE_LABELS[p.type] || p.type,
    status: p.status,
    orgName: p.orgName,
    country: p.country,
    city: p.city,
    about: p.about,
    website: p.website,
    logoDataUrl: p.logoDataUrl || '',
    tags: p.tags || [],
    programs: p.programs || [],
    degrees: p.degrees || [],
    languages: p.languages || [],
    admissionsRequirements: p.admissionsRequirements || '',
    tuitionRange: p.tuitionRange || '',
    applicationChannel: p.applicationChannel || '',
    seats: p.seats || 0,
    deadline: p.deadline || '',
    educationSystems: p.educationSystems || [],
    gradesOffered: p.gradesOffered || [],
    annualFee: p.annualFee || '',
    courses: p.courses || [],
    certificateTypes: p.certificateTypes || [],
    accreditationBody: p.accreditationBody || '',
    industry: p.industry || '',
    openRoles: p.openRoles || [],
    jobRequirements: p.jobRequirements || '',
    workLocations: p.workLocations || [],
    visibleToStudents: p.visibleToStudents,
    visibleToJobSeekers: p.visibleToJobSeekers,
    isPlatformPartner: p.isPlatformPartner,
    completeness: p.completeness || profileCompleteness(p),
  };
}

/**
 * Match partners for a student or job seeker search intent.
 */
export function matchPartners(input = {}) {
  const audience = erpText(input.audience) || 'student'; // student | jobseeker
  const query = erpText(input.query);
  const country = erpText(input.country);
  const type = erpText(input.type);
  const need = erpText(input.need); // program / role / grade

  let items = listPartners({ publishedOnly: true });
  if (audience === 'jobseeker') {
    items = items.filter((p) => p.visibleToJobSeekers !== false && p.type === 'employer');
  } else {
    items = items.filter((p) => p.visibleToStudents !== false && p.type !== 'employer');
  }
  if (type) items = items.filter((p) => p.type === type);
  if (country) {
    const c = country.toLowerCase();
    items = items.filter((p) => String(p.country || '').toLowerCase().includes(c));
  }

  const scored = items.map((p) => {
    let score = 40;
    const hay =
      `${p.orgName} ${(p.programs || []).join(' ')} ${(p.courses || []).join(' ')} ${(p.openRoles || []).join(' ')} ${(p.tags || []).join(' ')} ${p.about} ${p.industry}`.toLowerCase();
    if (query && hay.includes(query.toLowerCase())) score += 25;
    if (need) {
      const n = need.toLowerCase();
      if (hay.includes(n)) score += 20;
      if ((p.programs || []).some((x) => x.toLowerCase().includes(n))) score += 10;
      if ((p.openRoles || []).some((x) => x.toLowerCase().includes(n))) score += 10;
    }
    if (country && String(p.country || '').includes(country)) score += 10;
    if (p.isPlatformPartner) score += 5;
    if ((p.completeness || 0) >= 70) score += 5;
    return {
      partner: getPublicPartnerCard(p.id),
      score: Math.min(99, score),
      reasons: [
        p.isPlatformPartner ? 'شريك منصة' : null,
        country && String(p.country || '').includes(country) ? `في ${p.country}` : null,
        need ? `قرب من احتياجك: ${need}` : null,
      ].filter(Boolean),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function requiredFieldsForType(type) {
  const common = [
    { key: 'orgName', labelAr: 'اسم الجهة', required: true },
    { key: 'contactName', labelAr: 'اسم المسؤول', required: true },
    { key: 'email', labelAr: 'البريد الرسمي', required: true },
    { key: 'phone', labelAr: 'هاتف التواصل', required: true },
    { key: 'country', labelAr: 'الدولة', required: true },
    { key: 'city', labelAr: 'المدينة', required: true },
    { key: 'about', labelAr: 'تعريف يظهر للطالب/الباحث', required: true },
    { key: 'website', labelAr: 'الموقع الإلكتروني', required: false },
  ];

  if (type === 'university' || type === 'college') {
    return [
      ...common,
      { key: 'admissionsRequirements', labelAr: 'شروط القبول', required: true },
      { key: 'programs', labelAr: 'البرامج / التخصصات', required: true },
      { key: 'degrees', labelAr: 'الدرجات (بكالوريوس/ماجستير…)', required: false },
      { key: 'languages', labelAr: 'لغات التدريس', required: false },
      { key: 'tuitionRange', labelAr: 'نطاق الرسوم', required: false },
      { key: 'applicationChannel', labelAr: 'قناة التقديم', required: true },
      { key: 'deadline', labelAr: 'آخر موعد للتقديم', required: false },
      { key: 'seats', labelAr: 'مقاعد تقريبية', required: false },
    ];
  }
  if (type === 'school') {
    return [
      ...common,
      { key: 'educationSystems', labelAr: 'الأنظمة التعليمية', required: true },
      { key: 'gradesOffered', labelAr: 'الصفوف المتاحة', required: true },
      { key: 'annualFee', labelAr: 'الرسوم السنوية', required: true },
    ];
  }
  if (type === 'center') {
    return [
      ...common,
      { key: 'courses', labelAr: 'الدورات / البرامج', required: true },
      { key: 'certificateTypes', labelAr: 'أنواع الشهادات', required: false },
      { key: 'accreditationBody', labelAr: 'جهة الاعتماد', required: false },
      { key: 'licenseNumber', labelAr: 'رقم الترخيص', required: false },
      { key: 'coursePrice', labelAr: 'أسعار الدورات', required: false },
    ];
  }
  if (type === 'employer') {
    return [
      ...common,
      { key: 'industry', labelAr: 'القطاع', required: true },
      { key: 'openRoles', labelAr: 'الوظائف المتاحة', required: true },
      { key: 'jobRequirements', labelAr: 'شروط التوظيف', required: true },
      { key: 'workLocations', labelAr: 'مواقع العمل', required: false },
    ];
  }
  return common;
}

export function whatPartnerSees() {
  return [
    'اكتمال الملف ونسبة الجاهزية للنشر',
    'معاينة الصفحة العامة كما يراها الطالب/الباحث',
    'طلبات الاستفسار / التقديم الواردة (عند الربط)',
    'حالة النشر: مسودة أو منشور كشريك منصة',
    'روابط القبول والوظائف المرتبطة بملفك',
  ];
}

export function whatAudienceSees(type) {
  if (type === 'employer') {
    return [
      'اسم الشركة والقطاع والدولة',
      'الوظائف المفتوحة وشروطها',
      'تعريف مختصر — بدون بيانات داخلية',
      'زر تقديم / تواصل عبر المنصة',
    ];
  }
  return [
    'اسم الجهة والدولة والمدينة',
    'البرامج أو الصفوف أو الدورات',
    'شروط القبول أو الرسوم الظاهرة',
    'قناة التقديم وموعده إن وُجد',
    'شارة «شريك منصة» عند النشر',
  ];
}

export function seedDemoPartnersIfEmpty() {
  if (listPartners().length) return listPartners();
  const seeds = [
    {
      type: 'university',
      status: 'published',
      orgName: 'جامعة النجاح التجريبية',
      contactName: 'مكتب القبول',
      email: 'admissions@demo-uni.success',
      phone: '+962700000010',
      country: 'الأردن',
      city: 'عمّان',
      about: 'جامعة شريكة على SUCCESS OS — برامج علوم وهندسة وإدارة مع مسار قبول واضح للطالب.',
      website: 'https://success4sureacademy.com',
      admissionsRequirements: 'شهادة ثانوية، معدل تنافسي، إثبات لغة عند الحاجة',
      programs: ['هندسة حاسوب', 'إدارة أعمال', 'صيدلة'],
      degrees: ['بكالوريوس', 'ماجستير'],
      languages: ['العربية', 'English'],
      tuitionRange: '2500–6000 JOD / سنة',
      applicationChannel: 'تقديم عبر SUCCESS OS + بوابة الجامعة',
      deadline: '2026-09-01',
      seats: 120,
      tags: ['شريك منصة', 'هندسة', 'إدارة'],
    },
    {
      type: 'school',
      status: 'published',
      orgName: 'مدرسة الأفق الدولية',
      contactName: 'إدارة القبول',
      email: 'info@horizon-school.success',
      phone: '+962700000011',
      country: 'الأردن',
      city: 'عمّان',
      about: 'مدرسة دولية بأنظمة متعددة ورسوم سنوية شفافة.',
      educationSystems: ['الوطني الأردني', 'IGCSE / A Level', 'IB'],
      gradesOffered: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      annualFee: '3500–8000 JOD',
      tags: ['مدرسة', 'IB', 'IGCSE'],
    },
    {
      type: 'center',
      status: 'published',
      orgName: 'مركز Success للتدريب',
      contactName: 'منسق البرامج',
      email: 'center@success.demo',
      phone: '+962700000012',
      country: 'الأردن',
      city: 'الزرقاء',
      about: 'دورات SAT / EST / لغات مع شهادات قابلة للتحقق.',
      courses: ['SAT Prep', 'EST Physics', 'IELTS'],
      certificateTypes: ['إتمام دورة', 'تحضير اختبار'],
      accreditationBody: 'Success 4 Sure Academy',
      coursePrice: 'من 80 JOD',
      tags: ['تدريب', 'SAT', 'EST'],
    },
    {
      type: 'employer',
      status: 'published',
      orgName: 'شركة مسار للتوظيف',
      contactName: 'موارد بشرية',
      email: 'hr@masar.jobs',
      phone: '+962700000013',
      country: 'الأردن',
      city: 'عمّان',
      about: 'نستقطب خريجين وباحثين عن عمل في التقنية وخدمة العملاء.',
      industry: 'توظيف وتقنية',
      openRoles: ['محلل بيانات مبتدئ', 'دعم عملاء', 'منسق عمليات'],
      jobRequirements: 'لغة إنجليزية، تواصل، استعداد للتعلم',
      workLocations: ['عمّان', 'عن بُعد'],
      visibleToJobSeekers: true,
      visibleToStudents: false,
      tags: ['وظائف', 'تقنية'],
    },
  ];
  return seeds.map((s) => upsertPartnerProfile(s));
}

export function getPartnersOsSnapshot(partnerId) {
  seedDemoPartnersIfEmpty();
  const partner = partnerId ? getPartner(partnerId) : null;
  return {
    partner,
    partners: listPartners(),
    published: listPartners({ publishedOnly: true }),
    requiredFields: requiredFieldsForType(partner?.type || 'university'),
    whatPartnerSees: whatPartnerSees(),
    whatAudienceSees: whatAudienceSees(partner?.type || 'university'),
    typeLabels: PARTNER_TYPE_LABELS,
  };
}

/**
 * Admission funnel — domain model & client helpers.
 *
 * Flow:
 *  1) Onboarding profile (name, nationality, GPA, degree, major)
 *  2) Smart filter → matching universities / colleges / schools + nationality criteria
 *  3) Apply Now → $5 payment (blocks Step 4 until paid)
 *  4) Unified multi-step application → dual-route submit
 *       A) is_partner → platform DB + in-app notifications
 *       B) !is_partner → official HTML email (+ attachments) to admissions inbox
 *
 * Schema (logical collections):
 *  - admission_profiles
 *  - admission_payments
 *  - admission_applications
 *  - admission_notifications
 */

import {
  CONTACT_FEE_USD,
  INQUIRY_NOTIFICATIONS_KEY,
  institutionKind,
  isPlatformInstitution,
  kindLabelAr,
  notificationRoleForKind,
  officialContactEmail,
} from './university-inquiry';
import {
  globalInstitutions,
  requirementsForApplicant,
} from './university-registry';
import { resolveNationalityTrack } from './nationality-admission-tracks';
import { MAJOR_CLUSTERS, clusterForField } from './admissions-knowledge';

export { CONTACT_FEE_USD };

export const FUNNEL_PROFILE_KEY = 'success-os-admission-profile';
export const FUNNEL_PAYMENT_KEY = 'success-os-admission-payments';
export const FUNNEL_APPLICATION_KEY = 'success-os-admission-applications';
export const FUNNEL_DRAFT_KEY = 'success-os-admission-funnel-draft';

export const DEGREE_OPTIONS = Object.freeze([
  { id: 'bachelor', labelAr: 'بكالوريوس', labelEn: 'Bachelor' },
  { id: 'master', labelAr: 'ماجستير', labelEn: 'Master' },
  { id: 'phd', labelAr: 'دكتوراه', labelEn: 'PhD' },
  { id: 'diploma', labelAr: 'دبلوم / كلية', labelEn: 'Diploma / College' },
  { id: 'school', labelAr: 'تعليم مدرسي K-12', labelEn: 'K-12 School' },
]);

export const MAJOR_OPTIONS = Object.freeze(
  MAJOR_CLUSTERS.map((c) => ({
    id: c.id,
    labelAr: c.labelAr,
    labelEn: c.labelEn,
  })),
);

/** @typedef {{
 *  id?: string,
 *  studentName: string,
 *  nationality: string,
 *  gpa: string|number,
 *  targetDegree: string,
 *  major: string,
 *  email?: string,
 *  phone?: string,
 *  studyCountry?: string,
 * }} AdmissionProfile */

/** Normalize institution with is_partner alias for funnel contracts. */
export function toFunnelInstitution(institution, { nationality, studyCountry, applicantType } = {}) {
  if (!institution) return null;
  const country = studyCountry || institution.country;
  const type =
    applicantType ||
    (nationality && nationality === country ? 'local' : 'international');
  const track = resolveNationalityTrack({
    studyCountry: country,
    nationality,
    applicantType: type,
  });
  const req = requirementsForApplicant(institution, type === 'local' ? 'local' : 'international');
  const kind = institutionKind(institution);
  const isPartner = isPlatformInstitution(institution);

  return {
    id: institution.id,
    name: institution.name,
    country: institution.country,
    city: institution.city,
    type: institution.type,
    kind,
    kindLabelAr: kindLabelAr(kind),
    modes: institution.modes || [],
    fields: institution.fields || [],
    degree: institution.degree,
    admissionUrl: institution.admission,
    is_partner: isPartner,
    platformMember: isPartner,
    contactEmail: officialContactEmail(institution),
    nationalityTrack: track
      ? {
          id: track.id,
          titleAr: track.titleAr,
          channelAr: track.channelAr,
          whenAr: track.whenAr,
          feesAr: track.feesAr,
          visaAr: track.visaAr,
          docs: track.docs || [],
        }
      : null,
    admissionCriteria: {
      type: req.type,
      channel: req.channel,
      note: req.note,
      docs: req.docs || [],
    },
  };
}

/**
 * Filter institutions by nationality-aware destination + major/degree fit.
 */
export function filterInstitutionsForProfile(profile = {}, opts = {}) {
  const nationality = profile.nationality || opts.nationality || '';
  const studyCountry = profile.studyCountry || opts.studyCountry || '';
  const major = profile.major || opts.major || '';
  const degree = profile.targetDegree || opts.targetDegree || '';
  const gpa = Number(profile.gpa);
  const cluster = major ? clusterForField(major) : null;

  let list = globalInstitutions.slice();

  if (studyCountry) {
    list = list.filter((u) => u.country === studyCountry);
  } else if (nationality) {
    // Prefer institutions in destinations that have a researched nationality track
    // when no explicit study country is chosen — keep global list but rank later.
  }

  if (major) {
    const needle = String(major).toLowerCase();
    const clusterLabels = [cluster?.labelAr, cluster?.labelEn]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());

    list = list.filter((u) => {
      const fields = (u.fields || []).map((f) => String(f).toLowerCase());
      if (fields.some((f) => f.includes(needle) || needle.includes(f))) return true;
      if (clusterLabels.some((c) => fields.some((f) => f.includes(c) || c.includes(f)))) {
        return true;
      }
      if (degree === 'school') {
        return institutionKind(u) === 'school';
      }
      // Soft keep when cluster label doesn't map cleanly onto fields
      return !cluster;
    });
  }

  if (degree === 'school') {
    list = list.filter((u) => institutionKind(u) === 'school');
  } else if (degree === 'diploma') {
    list = list.filter((u) => {
      const k = institutionKind(u);
      return k === 'college' || k === 'university';
    });
  } else if (degree) {
    list = list.filter((u) => institutionKind(u) !== 'school');
  }

  const applicantType =
    nationality && studyCountry && nationality === studyCountry
      ? 'local'
      : 'international';

  const matches = list.map((u) =>
    toFunnelInstitution(u, { nationality, studyCountry: studyCountry || u.country, applicantType }),
  );

  // Rank: partner first, then same-country as nationality, then name
  matches.sort((a, b) => {
    if (a.is_partner !== b.is_partner) return a.is_partner ? -1 : 1;
    if (nationality) {
      const aHome = a.country === nationality ? 0 : 1;
      const bHome = b.country === nationality ? 0 : 1;
      if (aHome !== bHome) return aHome - bHome;
    }
    return String(a.name).localeCompare(String(b.name), 'en');
  });

  return {
    profile: {
      ...profile,
      gpa: Number.isFinite(gpa) ? gpa : profile.gpa,
      applicantType,
    },
    count: matches.length,
    feeUsd: CONTACT_FEE_USD,
    matches,
  };
}

export function readFunnelProfile() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem(FUNNEL_PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveFunnelProfile(profile) {
  if (typeof window === 'undefined') return profile;
  const next = {
    id: profile.id || `prof_${Date.now()}`,
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(FUNNEL_PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function readPaymentReceipts() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FUNNEL_PAYMENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePaymentReceipt(receipt) {
  if (typeof window === 'undefined') return receipt;
  const list = readPaymentReceipts();
  localStorage.setItem(FUNNEL_PAYMENT_KEY, JSON.stringify([receipt, ...list]));
  return receipt;
}

export function isInstitutionPaid(institutionId, paymentId) {
  if (!institutionId) return false;
  const list = readPaymentReceipts();
  return list.some(
    (p) =>
      p.status === 'paid' &&
      p.institutionId === institutionId &&
      (!paymentId || p.id === paymentId),
  );
}

export function readApplications() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FUNNEL_APPLICATION_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveApplicationLocal(application) {
  if (typeof window === 'undefined') return application;
  const list = readApplications();
  localStorage.setItem(FUNNEL_APPLICATION_KEY, JSON.stringify([application, ...list]));
  return application;
}

export function pushApplicationNotifications({ application, institution }) {
  if (typeof window === 'undefined') return [];
  const now = new Date().toISOString();
  const kind = application.institutionKind || institutionKind(institution);
  const label = kindLabelAr(kind);
  const name = institution?.name || application.institutionName || label;
  const role = notificationRoleForKind(kind);
  const notes = [
    {
      id: `app-org-${application.id}`,
      to: role,
      from: 'الطالب',
      title: `طلب قبول ${label} — ${application.personal?.fullName || application.studentName || 'طالب'}`,
      body: `تخصص: ${application.major || '—'}\nالدرجة: ${application.targetDegree || '—'}\nالجنسية: ${application.nationality || '—'}\nGPA: ${application.gpa || '—'}`,
      time: 'الآن',
      read: false,
      universityId: application.institutionId,
      institutionId: application.institutionId,
      institutionKind: kind,
      applicationId: application.id,
      created: now,
      channel: 'platform',
      type: 'admission_application',
    },
    {
      id: `app-stu-${application.id}`,
      to: 'student',
      from: name,
      title: `تم استلام طلبك لدى ${name}`,
      body: `هذه ${label} مشتركة في المنصة — ستصلك تحديثات الحالة عبر الإشعارات.`,
      time: 'الآن',
      read: false,
      universityId: application.institutionId,
      institutionId: application.institutionId,
      institutionKind: kind,
      applicationId: application.id,
      created: now,
      channel: 'platform',
      type: 'admission_application',
    },
  ];
  try {
    const existing = JSON.parse(localStorage.getItem(INQUIRY_NOTIFICATIONS_KEY) || '[]');
    localStorage.setItem(INQUIRY_NOTIFICATIONS_KEY, JSON.stringify([...notes, ...existing]));
  } catch {
    localStorage.setItem(INQUIRY_NOTIFICATIONS_KEY, JSON.stringify(notes));
  }
  return notes;
}

/** Official HTML email for non-partner institutions. */
export function buildOfficialApplicationHtml({
  institution,
  application,
  nationality,
}) {
  const kind = institutionKind(institution);
  const label = kindLabelAr(kind);
  const to = officialContactEmail(institution);
  const student = application.personal || {};
  const subject = `Official Application via SUCCESS OS — ${student.fullName || 'Student'} — ${institution?.name || label}`;

  const docs = [];
  if (application.documents?.transcript?.name) {
    docs.push(`Academic transcript: ${application.documents.transcript.name}`);
  }
  if (application.documents?.passport?.name) {
    docs.push(`Passport: ${application.documents.passport.name}`);
  }

  const rows = [
    ['Full name', student.fullName || ''],
    ['Email', student.email || ''],
    ['Phone', student.phone || ''],
    ['Date of birth', student.dateOfBirth || ''],
    ['Nationality', nationality || application.nationality || ''],
    ['GPA', application.gpa || ''],
    ['Target degree', application.targetDegree || ''],
    ['Major / field', application.major || ''],
    ['Study country', application.studyCountry || institution?.country || ''],
    ['Institution', institution?.name || ''],
    ['Institution type', label],
  ];

  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;width:180px">${escapeHtml(k)}</td><td style="padding:8px 12px;border:1px solid #e5e7eb">${escapeHtml(String(v || '—'))}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;color:#1f2937;line-height:1.55;max-width:680px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 8px">Official admissions application</h1>
  <p style="margin:0 0 16px;color:#4b5563">Submitted via <strong>SUCCESS OS</strong> for <strong>${escapeHtml(institution?.name || label)}</strong>.</p>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">${table}</table>
  ${
    application.message
      ? `<p><strong>Student message</strong><br/>${escapeHtml(application.message)}</p>`
      : ''
  }
  ${
    docs.length
      ? `<p><strong>Attached documents</strong></p><ul>${docs.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
      : '<p><em>No binary attachments were available on the server; document filenames are listed for verification.</em></p>'
  }
  <p style="margin-top:24px">Please reply with the next official admission steps for this nationality.</p>
  <p>Kind regards,<br/>${escapeHtml(student.fullName || 'Prospective student')}<br/>SUCCESS OS Application Desk</p>
</body>
</html>`;

  const text = [
    `Dear Admissions Office at ${institution?.name || label},`,
    '',
    'Official application via SUCCESS OS.',
    ...rows.map(([k, v]) => `${k}: ${v || '—'}`),
    '',
    application.message ? `Message: ${application.message}` : '',
    docs.length ? `Documents: ${docs.join('; ')}` : '',
    '',
    'Kind regards,',
    student.fullName || '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    to,
    subject,
    html,
    text,
    mailto: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function validateOnboarding(profile) {
  const errors = {};
  if (!String(profile.studentName || '').trim()) errors.studentName = 'Required';
  if (!String(profile.nationality || '').trim()) errors.nationality = 'Required';
  const gpa = Number(profile.gpa);
  if (!Number.isFinite(gpa) || gpa < 0 || gpa > 4.5) {
    errors.gpa = 'Enter GPA between 0 and 4.5 (or equivalent scale normalized)';
  }
  if (!String(profile.targetDegree || '').trim()) errors.targetDegree = 'Required';
  if (!String(profile.major || '').trim()) errors.major = 'Required';
  return errors;
}

export function validateApplicationStep(step, data) {
  const errors = {};
  if (step === 'personal') {
    if (!String(data.fullName || '').trim()) errors.fullName = 'Required';
    if (!String(data.email || '').includes('@')) errors.email = 'Valid email required';
    if (!String(data.phone || '').trim()) errors.phone = 'Required';
    if (!String(data.dateOfBirth || '').trim()) errors.dateOfBirth = 'Required';
  }
  if (step === 'documents') {
    if (!data.transcript?.name) errors.transcript = 'Upload academic transcript (PDF)';
    if (!data.passport?.name) errors.passport = 'Upload passport (PDF)';
  }
  return errors;
}

export function buildApplyHref({ institutionId, nationality, studyCountry, paymentId }) {
  const q = new URLSearchParams({
    institution: institutionId || '',
    nationality: nationality || '',
    studyCountry: studyCountry || '',
    paymentId: paymentId || '',
    step: 'apply',
  });
  return `/admission-funnel?${q.toString()}`;
}

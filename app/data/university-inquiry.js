/**
 * Institution contact inquiry flow (university / college / school).
 *
 * Fee: fixed USD 5 platform service fee to open an official contact channel.
 * After payment:
 *  - platform member → in-app notifications (role: university|school)
 *  - non-member → official email draft the student completes and sends
 *
 * Applies to جامعة، كلية، مدرسة alike.
 */

export const UNIVERSITY_INQUIRY_FEE_USD = 5;
export const CONTACT_FEE_USD = UNIVERSITY_INQUIRY_FEE_USD;

export const INQUIRY_STORAGE_KEY = 'success-os-university-inquiries';
export const INQUIRY_DRAFT_KEY = 'success-os-inquiry-draft';
export const INQUIRY_NOTIFICATIONS_KEY = 'success-os-notifications';

/** @returns {'university'|'college'|'school'} */
export function institutionKind(institution) {
  const t = String(institution?.type || institution?.kind || '').toLowerCase();
  const name = String(institution?.name || '').toLowerCase();
  if (
    t.includes('مدرسة') ||
    t.includes('school') ||
    name.includes('school') ||
    name.includes('مدرسة')
  ) {
    return 'school';
  }
  if (
    t.includes('كلية') ||
    t.includes('college') ||
    t.includes('polytechnic') ||
    name.includes('college') ||
    name.includes('كلية')
  ) {
    return 'college';
  }
  return 'university';
}

export function kindLabelAr(kind) {
  return (
    {
      university: 'جامعة',
      college: 'كلية',
      school: 'مدرسة',
    }[kind] || 'مؤسسة تعليمية'
  );
}

export function notificationRoleForKind(kind) {
  return kind === 'school' ? 'school' : 'university';
}

export function isPlatformUniversity(institution) {
  return Boolean(institution?.platformMember);
}

export function isPlatformInstitution(institution) {
  return isPlatformUniversity(institution);
}

export function officialContactEmail(institution) {
  if (!institution) return '';
  if (institution.contactEmail) return institution.contactEmail;
  const kind = institutionKind(institution);
  const local = kind === 'school' ? 'admissions' : 'admissions';
  const slug = String(institution.id || local)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return `${local}@${slug || 'institution'}.edu`;
}

export function buildInquiryCheckoutHref({
  universityId,
  universityName,
  nationality,
  studyCountry,
  applicantType,
  inquiryId,
  institutionKind: kind,
}) {
  const label = kindLabelAr(kind || 'university');
  const q = new URLSearchParams({
    item: `رسوم تواصل مع ${label}`,
    service: `تواصل قبول — ${label}`,
    subject: universityName || universityId || label,
    duration: 'طلب تواصل واحد',
    schedule: 'بعد الدفع: إشعار أو إيميل رسمي',
    kind: 'university_inquiry',
    institutionKind: kind || 'university',
    base: String(CONTACT_FEE_USD),
    fee: '0',
    total: String(CONTACT_FEE_USD),
    university: universityId || '',
    country: studyCountry || '',
    inquiryId: inquiryId || '',
    nationality: nationality || '',
    applicantType: applicantType || '',
  });
  return `/checkout?${q.toString()}`;
}

export function buildOfficialEmailDraft({
  institution,
  student,
  nationality,
  studyCountry,
  applicantType,
  programInterest,
  message,
}) {
  const kind = institutionKind(institution);
  const label = kindLabelAr(kind);
  const to = officialContactEmail(institution);
  const office =
    kind === 'school' ? 'Admissions / Registrar' : 'Admissions Office';
  const subject = `Inquiry from SUCCESS OS — ${student?.name || 'Prospective student'} — ${institution?.name || label}`;
  const body = [
    `Dear ${office} at ${institution?.name || `the ${label}`},`,
    '',
    `I am contacting you via the SUCCESS OS ${label} inquiry channel.`,
    '',
    `Institution type: ${label}`,
    `Full name: ${student?.name || ''}`,
    `Email: ${student?.email || ''}`,
    `Phone: ${student?.phone || ''}`,
    `Nationality: ${nationality || ''}`,
    `Intended study / enrolment country: ${studyCountry || institution?.country || ''}`,
    `Applicant path: ${applicantType === 'local' ? 'Domestic / local track' : 'International track'}`,
    `Programme / grade / field of interest: ${programInterest || '—'}`,
    '',
    'Message:',
    message || '—',
    '',
    'Please reply with the official admission requirements and next steps for my nationality.',
    '',
    'Kind regards,',
    student?.name || '',
  ].join('\n');

  return {
    to,
    subject,
    body,
    mailto: `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}

export function readInquiries() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(INQUIRY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveInquiry(inquiry) {
  if (typeof window === 'undefined') return inquiry;
  const list = readInquiries();
  localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify([inquiry, ...list]));
  return inquiry;
}

export function pushInquiryNotifications({ inquiry, institution }) {
  if (typeof window === 'undefined') return [];
  const now = new Date().toISOString();
  const kind = inquiry.institutionKind || institutionKind(institution);
  const label = kindLabelAr(kind);
  const name = institution?.name || inquiry.universityName || label;
  const role = notificationRoleForKind(kind);
  const notes = [
    {
      id: `inq-org-${inquiry.id}`,
      to: role,
      from: 'الطالب',
      title: `طلب تواصل ${label} — ${inquiry.student?.name || 'طالب'}`,
      body: `${inquiry.message || 'طلب استفسار قبول'}\nالجنسية: ${inquiry.nationality || '—'}\nالاهتمام: ${inquiry.programInterest || '—'}\nالنوع: ${label}`,
      time: 'الآن',
      read: false,
      universityId: inquiry.universityId,
      institutionId: inquiry.universityId,
      institutionKind: kind,
      inquiryId: inquiry.id,
      created: now,
      channel: 'platform',
    },
    {
      id: `inq-stu-${inquiry.id}`,
      to: 'student',
      from: name,
      title: `تم إرسال طلبك إلى ${name}`,
      body: `هذه ${label} مشتركة في المنصة — تابع الردود من مركز الإشعارات (مساحة ${label === 'مدرسة' ? 'المدرسة' : 'الجامعة/الكلية'}).`,
      time: 'الآن',
      read: false,
      universityId: inquiry.universityId,
      institutionId: inquiry.universityId,
      institutionKind: kind,
      inquiryId: inquiry.id,
      created: now,
      channel: 'platform',
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

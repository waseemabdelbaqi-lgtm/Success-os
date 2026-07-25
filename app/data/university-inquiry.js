/**
 * University contact inquiry flow after nationality-aware admissions matching.
 *
 * Fee: fixed USD 5 platform service fee to open an official contact channel.
 * After payment:
 *  - platform member university → in-app notifications both ways
 *  - non-member → official email draft the student completes and sends
 */

export const UNIVERSITY_INQUIRY_FEE_USD = 5;

export const INQUIRY_STORAGE_KEY = 'success-os-university-inquiries';
export const INQUIRY_DRAFT_KEY = 'success-os-inquiry-draft';
export const INQUIRY_NOTIFICATIONS_KEY = 'success-os-notifications';

export function isPlatformUniversity(institution) {
  return Boolean(institution?.platformMember);
}

export function officialContactEmail(institution) {
  if (!institution) return '';
  if (institution.contactEmail) return institution.contactEmail;
  // Fallback placeholder — student must confirm on the university site before sending.
  const slug = String(institution.id || 'admissions')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return `admissions@${slug || 'university'}.edu`;
}

export function buildInquiryCheckoutHref({
  universityId,
  universityName,
  nationality,
  studyCountry,
  applicantType,
  inquiryId,
}) {
  const q = new URLSearchParams({
    item: 'رسوم تواصل مع الجامعة',
    service: 'تواصل قبول جامعي',
    subject: universityName || universityId || 'جامعة',
    duration: 'طلب تواصل واحد',
    schedule: 'بعد الدفع: إشعار أو إيميل رسمي',
    kind: 'university_inquiry',
    base: String(UNIVERSITY_INQUIRY_FEE_USD),
    fee: '0',
    total: String(UNIVERSITY_INQUIRY_FEE_USD),
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
  const to = officialContactEmail(institution);
  const subject = `Inquiry from SUCCESS OS — ${student?.name || 'Prospective student'} — ${institution?.name || ''}`;
  const body = [
    `Dear Admissions Office at ${institution?.name || 'the university'},`,
    '',
    'I am contacting you via the SUCCESS OS university inquiry channel.',
    '',
    `Full name: ${student?.name || ''}`,
    `Email: ${student?.email || ''}`,
    `Phone: ${student?.phone || ''}`,
    `Nationality: ${nationality || ''}`,
    `Intended study country: ${studyCountry || institution?.country || ''}`,
    `Applicant path: ${applicantType === 'local' ? 'Domestic / local track' : 'International track'}`,
    `Programme / field of interest: ${programInterest || '—'}`,
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
  const uniName = institution?.name || inquiry.universityName || 'الجامعة';
  const notes = [
    {
      id: `inq-uni-${inquiry.id}`,
      to: 'university',
      from: 'الطالب',
      title: `طلب تواصل قبول — ${inquiry.student?.name || 'طالب'}`,
      body: `${inquiry.message || 'طلب استفسار قبول'}\nالجنسية: ${inquiry.nationality || '—'}\nالبرنامج: ${inquiry.programInterest || '—'}`,
      time: 'الآن',
      read: false,
      universityId: inquiry.universityId,
      inquiryId: inquiry.id,
      created: now,
      channel: 'platform',
    },
    {
      id: `inq-stu-${inquiry.id}`,
      to: 'student',
      from: uniName,
      title: `تم إرسال طلبك إلى ${uniName}`,
      body: 'الجامعة مشتركة في المنصة — يمكنك متابعة الردود من مركز الإشعارات.',
      time: 'الآن',
      read: false,
      universityId: inquiry.universityId,
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

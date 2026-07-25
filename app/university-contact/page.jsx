'use client';

import { useEffect, useMemo, useState } from 'react';
import { InnerNav } from '../components';
import { globalInstitutions } from '../data/university-registry';
import {
  CONTACT_FEE_USD,
  INQUIRY_DRAFT_KEY,
  buildInquiryCheckoutHref,
  buildOfficialEmailDraft,
  institutionKind,
  isPlatformInstitution,
  kindLabelAr,
  officialContactEmail,
  pushInquiryNotifications,
  saveInquiry,
} from '../data/university-inquiry';

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(INQUIRY_DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function UniversityContactPage() {
  const [params, setParams] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    programInterest: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [inquiry, setInquiry] = useState(null);
  const [emailDraft, setEmailDraft] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [editableEmail, setEditableEmail] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const next = {
      id: p.get('id') || '',
      paid: p.get('paid') === '1',
      nationality: p.get('nationality') || 'الأردن',
      studyCountry: p.get('studyCountry') || '',
      applicantType: p.get('applicantType') || 'international',
      inquiryId: p.get('inquiry') || '',
    };
    setParams(next);

    const draft = loadDraft();
    if (draft?.student) {
      setForm((f) => ({
        ...f,
        name: draft.student.name || f.name,
        email: draft.student.email || f.email,
        phone: draft.student.phone || f.phone,
        programInterest: draft.programInterest || f.programInterest,
        message: draft.message || f.message,
      }));
    }

    if (next.paid && draft) {
      finalizeAfterPayment(draft, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const institution = useMemo(
    () => globalInstitutions.find((u) => u.id === params.id) || null,
    [params.id],
  );

  const kind = institutionKind(institution || { type: inquiry?.institutionKind });
  const label = kindLabelAr(inquiry?.institutionKind || kind);
  const partner = isPlatformInstitution(institution) || Boolean(inquiry?.platformMember);

  function finalizeAfterPayment(draft, nextParams) {
    const uni =
      globalInstitutions.find((u) => u.id === (draft.universityId || nextParams.id)) || null;
    const k = draft.institutionKind || institutionKind(uni);
    const record = {
      id: draft.id || nextParams.inquiryId || `INQ-${Date.now()}`,
      universityId: uni?.id || draft.universityId || nextParams.id,
      universityName: uni?.name || draft.universityName || kindLabelAr(k),
      institutionKind: k,
      platformMember: Boolean(uni?.platformMember),
      nationality: draft.nationality || nextParams.nationality,
      studyCountry: draft.studyCountry || nextParams.studyCountry || uni?.country,
      applicantType: draft.applicantType || nextParams.applicantType,
      programInterest: draft.programInterest || '',
      message: draft.message || '',
      student: draft.student || {},
      feeUsd: CONTACT_FEE_USD,
      paidAt: new Date().toISOString(),
      status: uni?.platformMember ? 'notified' : 'email_pending',
      channel: uni?.platformMember ? 'notifications' : 'official_email',
    };
    saveInquiry(record);
    setInquiry(record);

    if (record.platformMember) {
      pushInquiryNotifications({ inquiry: record, institution: uni });
    } else {
      const mail = buildOfficialEmailDraft({
        institution: uni,
        student: record.student,
        nationality: record.nationality,
        studyCountry: record.studyCountry,
        applicantType: record.applicantType,
        programInterest: record.programInterest,
        message: record.message,
      });
      setEmailDraft(mail);
      setEditableEmail({ to: mail.to, subject: mail.subject, body: mail.body });
    }
    try {
      sessionStorage.removeItem(INQUIRY_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  function onChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goPay(e) {
    e.preventDefault();
    const eMap = {};
    if (!form.name.trim()) eMap.name = 'اكتب اسمك الكامل';
    if (!form.email.includes('@')) eMap.email = 'أدخل بريداً صحيحاً';
    if (!form.phone.trim()) eMap.phone = 'أدخل رقم هاتف';
    if (!form.message.trim()) eMap.message = 'اكتب نص الاستفسار';
    if (!institution) eMap.submit = 'اختر جامعة أو كلية أو مدرسة من النتائج أولاً';
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    const k = institutionKind(institution);
    const inquiryId = `INQ-${Date.now()}`;
    const draft = {
      id: inquiryId,
      universityId: institution.id,
      universityName: institution.name,
      institutionKind: k,
      nationality: params.nationality,
      studyCountry: params.studyCountry || institution.country,
      applicantType: params.applicantType,
      programInterest: form.programInterest.trim(),
      message: form.message.trim(),
      student: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(INQUIRY_DRAFT_KEY, JSON.stringify(draft));
    window.location.href = buildInquiryCheckoutHref({
      universityId: institution.id,
      universityName: institution.name,
      nationality: params.nationality,
      studyCountry: params.studyCountry || institution.country,
      applicantType: params.applicantType,
      inquiryId,
      institutionKind: k,
    });
  }

  function sendOfficialEmail() {
    if (!editableEmail.to.includes('@')) return;
    const mailto = `mailto:${encodeURIComponent(editableEmail.to)}?subject=${encodeURIComponent(
      editableEmail.subject,
    )}&body=${encodeURIComponent(editableEmail.body)}`;
    window.location.href = mailto;
    setEmailSent(true);
    if (inquiry) {
      saveInquiry({ ...inquiry, status: 'email_opened', emailTo: editableEmail.to });
    }
  }

  const interestPlaceholder =
    kind === 'school'
      ? 'مثال: الصف 10 — منهج IB / أمريكي'
      : kind === 'college'
        ? 'مثال: دبلوم تقنية معلومات'
        : 'مثال: هندسة حاسوب — بكالوريوس';

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="admissions" />
      <main className="os-page-content university-contact-page">
        <header className="university-contact-hero">
          <div>
            <small>INSTITUTION CONTACT — UNIVERSITY · COLLEGE · SCHOOL</small>
            <h1>تواصل مع {institution ? label : 'المؤسسة التعليمية'}</h1>
            <p>
              ينطبق على <b>الجامعة والكلية والمدرسة</b>. بعد مطابقة جنسيتك: عبّئ البيانات → ادفع{' '}
              <b>${CONTACT_FEE_USD}</b> → ثم{' '}
              {partner
                ? `تخاطب مباشر عبر الإشعارات لأن ال${label} مشتركة`
                : `إيميل رسمي تعبّئه وترسله إن لم تكن ال${label} مشتركة`}
              .
            </p>
          </div>
          <aside>
            <b>${CONTACT_FEE_USD}</b>
            <small>رسوم تواصل ثابتة</small>
          </aside>
        </header>

        {!institution && !inquiry && (
          <section className="university-contact-empty">
            <h2>لم تُحدَّد مؤسسة</h2>
            <p>ارجع إلى نتائج القبول واضغط «تواصل» على بطاقة جامعة أو كلية أو مدرسة.</p>
            <a href="/admissions">فتح مساعد القبول ←</a>
          </section>
        )}

        {institution && !params.paid && !inquiry && (
          <section className="university-contact-layout">
            <form className="university-contact-form" onSubmit={goPay}>
              <header>
                <small>01 — بيانات الطالب الضرورية</small>
                <h2>{institution.name}</h2>
                <p>
                  {label} • {institution.city} • {institution.country} •{' '}
                  {partner ? (
                    <em className="partner-pill">مشتركة — بعد الدفع عبر الإشعارات</em>
                  ) : (
                    <em className="external-pill">غير مشتركة — بعد الدفع عبر إيميل رسمي</em>
                  )}
                </p>
              </header>
              <label>
                الاسم الكامل
                <input value={form.name} onChange={(e) => onChange('name', e.target.value)} />
                {errors.name && <em>{errors.name}</em>}
              </label>
              <label>
                البريد الإلكتروني
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange('email', e.target.value)}
                />
                {errors.email && <em>{errors.email}</em>}
              </label>
              <label>
                رقم الهاتف / واتساب
                <input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
                {errors.phone && <em>{errors.phone}</em>}
              </label>
              <label>
                {kind === 'school' ? 'الصف / المنهج المرغوب' : 'التخصص / البرنامج المرغوب'}
                <input
                  value={form.programInterest}
                  onChange={(e) => onChange('programInterest', e.target.value)}
                  placeholder={interestPlaceholder}
                />
              </label>
              <label>
                نص الاستفسار (يُرسل لل{label})
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => onChange('message', e.target.value)}
                  placeholder="اذكر جنسيتك ومؤهلك وما تريد معرفته عن شروط القبول…"
                />
                {errors.message && <em>{errors.message}</em>}
              </label>
              {errors.submit && <em>{errors.submit}</em>}
              <button type="submit" className="primary">
                المتابعة إلى بوابة الدفع ${CONTACT_FEE_USD} ←
              </button>
            </form>

            <aside className="university-contact-aside">
              <small>مسار ما بعد الدفع — جامعة / كلية / مدرسة</small>
              <h3>
                {partner ? `الحالة 1 — ${label} مشتركة` : `الحالة 2 — ${label} غير مشتركة`}
              </h3>
              {partner ? (
                <ol>
                  <li>تدفع ${CONTACT_FEE_USD} عبر بوابة الدفع</li>
                  <li>يُنشأ إشعار فوري لمكتب القبول داخل المنصة</li>
                  <li>تتابع الرد من مركز الإشعارات مباشرة</li>
                </ol>
              ) : (
                <ol>
                  <li>تدفع ${CONTACT_FEE_USD} عبر بوابة الدفع</li>
                  <li>تُفتح مسودة إيميل رسمي إلى {officialContactEmail(institution)}</li>
                  <li>تراجع البيانات الضرورية ثم ترسل الإيميل بنفسك</li>
                </ol>
              )}
              <a href={institution.admission} target="_blank" rel="noreferrer">
                صفحة القبول الرسمية ↗
              </a>
              <a href="/admissions">رجوع للنتائج</a>
            </aside>
          </section>
        )}

        {(params.paid || inquiry) && inquiry && (
          <section className="university-contact-result">
            <header>
              <span>✓</span>
              <div>
                <small>
                  تم استلام رسوم التواصل ${CONTACT_FEE_USD} — {kindLabelAr(inquiry.institutionKind)}
                </small>
                <h2>
                  {inquiry.platformMember
                    ? `تم فتح قناة الإشعارات مع ال${kindLabelAr(inquiry.institutionKind)} الشريكة`
                    : `جهّز الإيميل الرسمي وأرسله لل${kindLabelAr(inquiry.institutionKind)}`}
                </h2>
                <p>
                  {inquiry.universityName} — جنسية الطالب: {inquiry.nationality} — رقم الطلب{' '}
                  {inquiry.id}
                </p>
              </div>
            </header>

            {inquiry.platformMember ? (
              <div className="university-contact-partner-ok">
                <p>
                  هذه ال{kindLabelAr(inquiry.institutionKind)} <b>مشتركة في SUCCESS OS</b>. أُرسل
                  إشعار إلى مساحة المؤسسة وإشعار تأكيد للطالب. لا حاجة لإيميل خارجي الآن.
                </p>
                <div className="university-contact-actions">
                  <a className="primary" href="/notifications">
                    فتح مركز الإشعارات ←
                  </a>
                  <a href="/admissions">العودة للقبول</a>
                </div>
              </div>
            ) : (
              <div className="university-contact-email-panel">
                <p>
                  ال{kindLabelAr(inquiry.institutionKind)} <b>غير مشتركة</b> في المنصة. عبّئ/راجع
                  البيانات ثم أرسل الإيميل الرسمي من جهازك.
                </p>
                <label>
                  إلى (إيميل القبول الرسمي)
                  <input
                    value={editableEmail.to}
                    onChange={(e) => setEditableEmail((x) => ({ ...x, to: e.target.value }))}
                  />
                </label>
                <label>
                  الموضوع
                  <input
                    value={editableEmail.subject}
                    onChange={(e) => setEditableEmail((x) => ({ ...x, subject: e.target.value }))}
                  />
                </label>
                <label>
                  نص الرسالة
                  <textarea
                    rows={12}
                    value={editableEmail.body}
                    onChange={(e) => setEditableEmail((x) => ({ ...x, body: e.target.value }))}
                  />
                </label>
                <div className="university-contact-actions">
                  <button type="button" className="primary" onClick={sendOfficialEmail}>
                    إرسال الإيميل الرسمي ←
                  </button>
                  <a href={institution?.admission || '/admissions'} target="_blank" rel="noreferrer">
                    التحقق من إيميل القبول على الموقع ↗
                  </a>
                </div>
                {emailSent && (
                  <p className="email-sent-note">
                    فُتح عميل البريد لديك. أكمل الإرسال هناك. تحقّق دائماً من صحة عنوان القبول على
                    موقع المؤسسة.
                  </p>
                )}
                {emailDraft && (
                  <small>
                    المسودة الأولية أُعدّت لـ {emailDraft.to}. يمكنك تعديل الحقول قبل الإرسال.
                  </small>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

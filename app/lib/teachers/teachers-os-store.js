/**
 * Teachers OS — profiles, offers, bookings, absences.
 * Platform commission is read from enterprise-admin config (default 10%).
 */

import {
  erpAppendAudit,
  erpId,
  erpList,
  erpNow,
  erpReadCollection,
  erpReadJson,
  erpRoot,
  erpText,
  erpWriteCollection,
} from '../admin/enterprise-erp-store.js';
import path from 'node:path';

const PLATFORM_FEE_FALLBACK = 10;

export const OFFER_TYPES = Object.freeze({
  RECORDED: 'recorded',
  ONLINE: 'online',
  IN_PERSON: 'in_person',
});

export const TRAVEL_MODES = Object.freeze({
  TEACHER_TO_STUDENT: 'teacher_to_student',
  STUDENT_TO_TEACHER: 'student_to_teacher',
  BOTH: 'both',
});

function collection(name) {
  return erpReadCollection(name);
}

function writeCollection(name, items) {
  return erpWriteCollection(name, { items, updatedAt: erpNow() });
}

export function getPlatformCommissionPercent() {
  const file = path.join(erpRoot(), 'config', 'commission-defaults.json');
  const cfg = erpReadJson(file);
  const pct = Number(cfg?.defaultCommissionPercent);
  return Number.isFinite(pct) ? pct : PLATFORM_FEE_FALLBACK;
}

export function netAfterPlatform(gross, percent = getPlatformCommissionPercent()) {
  const g = Math.max(0, Number(gross) || 0);
  const fee = Math.round(g * (percent / 100) * 100) / 100;
  return {
    gross: g,
    platformPercent: percent,
    platformFee: fee,
    teacherNet: Math.round((g - fee) * 100) / 100,
  };
}

export function listTeachers() {
  return erpList(collection('teacher-profiles').items);
}

export function getTeacher(teacherId) {
  return listTeachers().find((t) => t.id === teacherId) || null;
}

export function upsertTeacherProfile(input = {}) {
  const items = listTeachers();
  const now = erpNow();
  const id = erpText(input.id) || erpId();
  const existing = items.find((t) => t.id === id);
  const registeredBy = erpText(input.registeredBy) || existing?.registeredBy || 'self';
  const autoApprove = registeredBy === 'supervisor' && input.autoApprove !== false;

  const profile = {
    id,
    status: autoApprove
      ? 'approved'
      : existing?.status || 'pending_review',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    registeredBy,
    registeredByActor: erpText(input.registeredByActor) || existing?.registeredByActor || '',
    fullName: erpText(input.fullName),
    email: erpText(input.email),
    phone: erpText(input.phone),
    nationality: erpText(input.nationality),
    city: erpText(input.city),
    country: erpText(input.country),
    bio: erpText(input.bio),
    aboutStudent: erpText(input.aboutStudent) || erpText(input.bio),
    subjects: erpList(input.subjects).map(erpText).filter(Boolean),
    curricula: erpList(input.curricula).length
      ? erpList(input.curricula).map(erpText).filter(Boolean)
      : existing?.curricula || [],
    languages: erpList(input.languages).map(erpText).filter(Boolean),
    experienceYears: Number(input.experienceYears) || 0,
    photoName: erpText(input.photoName) || existing?.photoName || '',
    photoDataUrl:
      erpText(input.photoDataUrl).length > 900000
        ? existing?.photoDataUrl || ''
        : erpText(input.photoDataUrl) || existing?.photoDataUrl || '',
    introVideoName: erpText(input.introVideoName) || existing?.introVideoName || '',
    introVideoUrl: erpText(input.introVideoUrl) || existing?.introVideoUrl || '',
    introVideoDataUrl:
      erpText(input.introVideoDataUrl).length > 250000
        ? ''
        : erpText(input.introVideoDataUrl) || existing?.introVideoDataUrl || '',
    certificateName: erpText(input.certificateName) || existing?.certificateName || '',
    certificateDataUrl: erpText(input.certificateDataUrl) || existing?.certificateDataUrl || '',
    idDocumentType: erpText(input.idDocumentType) || existing?.idDocumentType || 'passport',
    idDocumentName: erpText(input.idDocumentName) || existing?.idDocumentName || '',
    idDocumentDataUrl: erpText(input.idDocumentDataUrl) || existing?.idDocumentDataUrl || '',
    workAreas: erpList(input.workAreas).length
      ? erpList(input.workAreas).map(erpText).filter(Boolean)
      : existing?.workAreas || [],
    acceptsOnline: input.acceptsOnline !== false,
    acceptsInPerson: input.acceptsInPerson !== false,
    acceptsRecorded: input.acceptsRecorded !== false,
  };

  if (autoApprove && !existing?.approvedAt) {
    profile.approvedBy = erpText(input.registeredByActor) || 'super_admin';
    profile.approvedAt = now;
  }

  if (!profile.fullName || !profile.email || !profile.phone) {
    throw new Error('FULL_PROFILE_REQUIRED');
  }
  if (!profile.certificateName && !profile.certificateDataUrl) {
    throw new Error('CERTIFICATE_REQUIRED');
  }
  if (!profile.idDocumentName && !profile.idDocumentDataUrl) {
    throw new Error('ID_DOCUMENT_REQUIRED');
  }

  const next = existing
    ? items.map((t) => (t.id === id ? profile : t))
    : [profile, ...items];
  writeCollection('teacher-profiles', next);
  erpAppendAudit({
    actor: profile.email,
    action: existing ? 'teacher.profile.update' : 'teacher.profile.register',
    moduleId: 'teachers-os',
    entityId: id,
  });
  return profile;
}

export function listOffers(filters = {}) {
  let items = erpList(collection('teacher-offers').items);
  if (filters.teacherId) items = items.filter((o) => o.teacherId === filters.teacherId);
  if (filters.status) items = items.filter((o) => o.status === filters.status);
  if (filters.publishedOnly) items = items.filter((o) => o.status === 'published');
  return items;
}

export function getOffer(offerId) {
  return listOffers().find((o) => o.id === offerId) || null;
}

export function upsertOffer(input = {}) {
  const items = listOffers();
  const now = erpNow();
  const id = erpText(input.id) || erpId();
  const existing = items.find((o) => o.id === id);
  const type = erpText(input.type) || OFFER_TYPES.ONLINE;
  const price = Math.max(0, Number(input.price) || 0);
  const durationMinutes = Math.max(15, Number(input.durationMinutes) || 60);

  if (!erpText(input.teacherId)) throw new Error('TEACHER_REQUIRED');
  if (!erpText(input.title)) throw new Error('TITLE_REQUIRED');
  if (price <= 0) throw new Error('PRICE_REQUIRED');

  if (type === OFFER_TYPES.IN_PERSON && !erpText(input.area)) {
    throw new Error('AREA_REQUIRED');
  }
  if (type === OFFER_TYPES.IN_PERSON && !erpText(input.travelMode)) {
    throw new Error('TRAVEL_MODE_REQUIRED');
  }
  if (type === OFFER_TYPES.ONLINE && !erpText(input.meetingProvider)) {
    input.meetingProvider = 'platform_zoom';
  }
  if (type === OFFER_TYPES.RECORDED && !erpText(input.recordingName) && !erpText(input.recordingUrl)) {
    throw new Error('RECORDING_REQUIRED');
  }

  const offer = {
    id,
    teacherId: erpText(input.teacherId),
    status: erpText(input.status) || existing?.status || 'draft',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    type,
    title: erpText(input.title),
    subject: erpText(input.subject),
    curriculum: erpText(input.curriculum),
    description: erpText(input.description),
    price,
    currency: erpText(input.currency) || 'JOD',
    durationMinutes,
    area: erpText(input.area),
    exactLocationNote: erpText(input.exactLocationNote),
    travelMode: erpText(input.travelMode) || '',
    meetingProvider: erpText(input.meetingProvider) || '',
    meetingUrl: erpText(input.meetingUrl),
    recordingName: erpText(input.recordingName),
    recordingUrl: erpText(input.recordingUrl) || existing?.recordingUrl || '',
    // Keep only small previews in JSON store; large videos store filename + optional URL.
    recordingDataUrl:
      erpText(input.recordingDataUrl).length > 250000
        ? ''
        : erpText(input.recordingDataUrl) || existing?.recordingDataUrl || '',
    scheduleSlots: erpList(input.scheduleSlots).map((slot) => ({
      id: slot.id || erpId(),
      day: erpText(slot.day),
      startTime: erpText(slot.startTime),
      endTime: erpText(slot.endTime),
      timezone: erpText(slot.timezone) || 'Asia/Amman',
    })),
  };

  const next = existing
    ? items.map((o) => (o.id === id ? offer : o))
    : [offer, ...items];
  writeCollection('teacher-offers', next);
  erpAppendAudit({
    actor: offer.teacherId,
    action: existing ? 'teacher.offer.update' : 'teacher.offer.create',
    moduleId: 'teachers-os',
    entityId: id,
    meta: { type: offer.type, price: offer.price },
  });
  return offer;
}

export function listBookings(filters = {}) {
  let items = erpList(collection('teacher-bookings').items);
  if (filters.teacherId) items = items.filter((b) => b.teacherId === filters.teacherId);
  if (filters.offerId) items = items.filter((b) => b.offerId === filters.offerId);
  return items;
}

export function createBooking(input = {}) {
  const offer = getOffer(input.offerId);
  if (!offer || offer.status !== 'published') throw new Error('OFFER_NOT_AVAILABLE');
  const teacher = getTeacher(offer.teacherId);
  if (!teacher || teacher.status !== 'approved') throw new Error('TEACHER_NOT_APPROVED');

  const money = netAfterPlatform(offer.price);
  const booking = {
    id: erpId(),
    createdAt: erpNow(),
    status: 'confirmed',
    offerId: offer.id,
    teacherId: offer.teacherId,
    studentName: erpText(input.studentName) || 'طالب',
    studentEmail: erpText(input.studentEmail),
    scheduledAt: erpText(input.scheduledAt),
    slotId: erpText(input.slotId),
    notes: erpText(input.notes),
    offerSnapshot: {
      title: offer.title,
      type: offer.type,
      price: offer.price,
      durationMinutes: offer.durationMinutes,
      area: offer.area,
      travelMode: offer.travelMode,
      meetingProvider: offer.meetingProvider,
      meetingUrl: offer.meetingUrl,
    },
    ...money,
  };

  const items = [booking, ...listBookings()];
  writeCollection('teacher-bookings', items);
  erpAppendAudit({
    actor: booking.studentEmail || 'student',
    action: 'teacher.booking.create',
    moduleId: 'teachers-os',
    entityId: booking.id,
  });
  return booking;
}

export function teacherSalesSummary(teacherId) {
  const bookings = listBookings({ teacherId }).filter((b) => b.status !== 'cancelled');
  const percent = getPlatformCommissionPercent();
  const gross = bookings.reduce((sum, b) => sum + (Number(b.gross) || 0), 0);
  const platformFee = bookings.reduce((sum, b) => sum + (Number(b.platformFee) || 0), 0);
  const teacherNet = bookings.reduce((sum, b) => sum + (Number(b.teacherNet) || 0), 0);
  return {
    platformPercent: percent,
    bookingsCount: bookings.length,
    gross: Math.round(gross * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    teacherNet: Math.round(teacherNet * 100) / 100,
    bookings,
  };
}

export function listAbsences(filters = {}) {
  let items = erpList(collection('teacher-absences').items);
  if (filters.teacherId) items = items.filter((a) => a.teacherId === filters.teacherId);
  if (filters.status) items = items.filter((a) => a.status === filters.status);
  return items;
}

export function reportAbsence(input = {}) {
  const booking = listBookings().find((b) => b.id === input.bookingId);
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  const report = {
    id: erpId(),
    createdAt: erpNow(),
    status: 'pending_supervisor',
    bookingId: booking.id,
    teacherId: booking.teacherId,
    offerId: booking.offerId,
    reportedBy: erpText(input.reportedBy) || 'student', // student | teacher
    reporterName: erpText(input.reporterName),
    reason: erpText(input.reason),
    decision: '',
    decidedBy: '',
    decidedAt: '',
  };
  writeCollection('teacher-absences', [report, ...listAbsences()]);
  erpAppendAudit({
    actor: report.reporterName || report.reportedBy,
    action: 'teacher.absence.report',
    moduleId: 'teachers-os',
    entityId: report.id,
  });
  return report;
}

export function decideAbsence(input = {}) {
  const items = listAbsences();
  const idx = items.findIndex((a) => a.id === input.absenceId);
  if (idx < 0) throw new Error('ABSENCE_NOT_FOUND');
  const decision = erpText(input.decision); // refund | reschedule | warn | dismiss
  if (!decision) throw new Error('DECISION_REQUIRED');
  const updated = {
    ...items[idx],
    status: 'decided',
    decision,
    decisionNote: erpText(input.decisionNote),
    decidedBy: erpText(input.decidedBy) || 'super_admin',
    decidedAt: erpNow(),
  };
  items[idx] = updated;
  writeCollection('teacher-absences', items);
  erpAppendAudit({
    actor: updated.decidedBy,
    action: 'teacher.absence.decide',
    moduleId: 'teachers-os',
    entityId: updated.id,
    meta: { decision },
  });
  return updated;
}

export function approveTeacher(teacherId, actor = 'super_admin') {
  const items = listTeachers();
  const next = items.map((t) =>
    t.id === teacherId
      ? { ...t, status: 'approved', updatedAt: erpNow(), approvedBy: actor, approvedAt: erpNow() }
      : t,
  );
  writeCollection('teacher-profiles', next);
  erpAppendAudit({
    actor,
    action: 'teacher.profile.approve',
    moduleId: 'teachers-os',
    entityId: teacherId,
  });
  return next.find((t) => t.id === teacherId);
}

export function getPublicTeacherCard(teacherId) {
  const teacher = getTeacher(teacherId);
  if (!teacher) return null;
  return {
    id: teacher.id,
    status: teacher.status,
    fullName: teacher.fullName,
    city: teacher.city,
    country: teacher.country,
    aboutStudent: teacher.aboutStudent || teacher.bio || '',
    subjects: teacher.subjects || [],
    curricula: teacher.curricula || [],
    languages: teacher.languages || [],
    experienceYears: teacher.experienceYears || 0,
    workAreas: teacher.workAreas || [],
    photoDataUrl: teacher.photoDataUrl || '',
    introVideoName: teacher.introVideoName || '',
    introVideoUrl: teacher.introVideoUrl || '',
    // Never expose ID/certificate blobs publicly.
  };
}

export function getTeacherPreview(teacherId) {
  const teacher = getPublicTeacherCard(teacherId);
  if (!teacher) return null;
  const offers = listOffers({ teacherId, publishedOnly: true });
  return {
    teacher,
    offers,
    platformPercent: getPlatformCommissionPercent(),
  };
}

/**
 * Platform-only AI extraction archive.
 * Teachers cannot read this collection from public/student surfaces.
 */
export function savePlatformAiExtraction(input = {}) {
  const platformOnly = input.platformOnly !== false;
  if (!platformOnly) throw new Error('PLATFORM_ONLY_FEATURE');

  const row = {
    id: erpId(),
    createdAt: erpNow(),
    platformOnly: true,
    teacherId: erpText(input.teacherId),
    sourceType: erpText(input.sourceType) || 'video',
    sourceName: erpText(input.sourceName),
    curriculum: erpText(input.curriculum),
    subject: erpText(input.subject),
    summary: erpText(input.summary),
    extracted: input.extracted || {},
    actor: erpText(input.actor) || 'platform_ai',
    visibility: 'platform_internal',
  };

  const items = [row, ...erpList(collection('platform-ai-video-extractions').items)].slice(
    0,
    2000,
  );
  writeCollection('platform-ai-video-extractions', items);
  erpAppendAudit({
    actor: row.actor,
    action: 'platform.ai.video.extract',
    moduleId: 'teachers-os-platform',
    entityId: row.id,
    meta: { teacherId: row.teacherId, curriculum: row.curriculum },
  });
  return row;
}

export function listPlatformAiExtractions(filters = {}) {
  let items = erpList(collection('platform-ai-video-extractions').items).filter(
    (x) => x.platformOnly && x.visibility === 'platform_internal',
  );
  if (filters.teacherId) items = items.filter((x) => x.teacherId === filters.teacherId);
  return items;
}

export function getTeachersOsSnapshot(teacherId, options = {}) {
  const teacher = teacherId ? getTeacher(teacherId) : null;
  const includePlatformAi = options.includePlatformAi === true;
  return {
    platformPercent: getPlatformCommissionPercent(),
    teacher,
    teachers: listTeachers(),
    offers: teacherId ? listOffers({ teacherId }) : listOffers({ publishedOnly: true }),
    allOffers: listOffers(),
    sales: teacherId ? teacherSalesSummary(teacherId) : null,
    absences: teacherId ? listAbsences({ teacherId }) : listAbsences({ status: 'pending_supervisor' }),
    pendingAbsences: listAbsences({ status: 'pending_supervisor' }),
    // Platform-only archive — never attach unless explicitly requested by a platform actor.
    platformAiExtractions: includePlatformAi
      ? listPlatformAiExtractions(teacherId ? { teacherId } : undefined)
      : [],
  };
}

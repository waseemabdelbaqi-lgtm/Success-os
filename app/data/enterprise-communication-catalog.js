/**
 * SUCCESS OS — Enterprise Communication Platform catalog.
 * Configurable from Owner Dashboard; reuses enterprise roles/permissions (no duplicated users).
 */

export const COMM_CHANNEL_TYPES = Object.freeze([
  { key: 'private', label: 'Private Chat', labelAr: 'محادثة خاصة' },
  { key: 'group', label: 'Group Chat', labelAr: 'محادثة جماعية' },
  { key: 'department', label: 'Department', labelAr: 'قسم' },
  { key: 'academic', label: 'Academic Group', labelAr: 'مجموعة أكاديمية' },
  { key: 'teachers', label: 'Teacher Group', labelAr: 'مجموعة معلمين' },
  { key: 'students', label: 'Student Group', labelAr: 'مجموعة طلاب' },
  { key: 'parents', label: 'Parents', labelAr: 'أولياء الأمور' },
  { key: 'schools', label: 'Schools', labelAr: 'مدارس' },
  { key: 'universities', label: 'Universities', labelAr: 'جامعات' },
  { key: 'educational_centers', label: 'Educational Centers', labelAr: 'مراكز تعليمية' },
  { key: 'employers', label: 'Employers', labelAr: 'جهات عمل' },
  { key: 'recruitment', label: 'Recruitment Companies', labelAr: 'شركات توظيف' },
  { key: 'support', label: 'Support Team', labelAr: 'فريق الدعم' },
]);

export const COMM_ANNOUNCEMENT_SCOPES = Object.freeze([
  'global',
  'country',
  'school',
  'university',
  'teacher',
  'student',
  'department',
  'emergency',
]);

export const COMM_TICKET_PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent', 'critical']);

export const COMM_NOTIFICATION_CHANNELS = Object.freeze([
  'push',
  'email',
  'sms',
  'whatsapp',
  'in_app',
]);

export const COMM_MEETING_TYPES = Object.freeze([
  'one_to_one',
  'group',
  'live_class',
  'office_hours',
]);

export const COMM_PARENT_MESSAGE_TYPES = Object.freeze([
  'teacher_parent',
  'school_parent',
  'university_parent',
  'attendance_alert',
  'academic_report',
  'behavior_report',
  'homework_update',
  'payment_reminder',
]);

export const COMM_DEFAULT_CONFIG = Object.freeze({
  encryptionEnabled: true,
  retentionDays: 365,
  waitingRoomDefault: true,
  recordingDefault: false,
  slaHours: { low: 72, normal: 48, high: 24, urgent: 8, critical: 2 },
  defaultTimezone: 'Asia/Amman',
  translationDefaultLang: 'ar',
  realtimeEnabled: true,
  maxAttachmentMb: 50,
  updatedAt: null,
  updatedBy: 'system',
});

export const COMM_SEED_CHANNELS = Object.freeze([
  { key: 'ch_support', name: 'Support Team', nameAr: 'فريق الدعم', type: 'support', members: ['owner', 'admin', 'support'] },
  { key: 'ch_teachers', name: 'Teachers Lounge', nameAr: 'ملتقى المعلمين', type: 'teachers', members: ['owner', 'teacher_manager', 'teacher'] },
  { key: 'ch_academic', name: 'Academic Board', nameAr: 'المجلس الأكاديمي', type: 'academic', members: ['owner', 'admin', 'teacher_manager'] },
  { key: 'ch_parents', name: 'Parent Bridge', nameAr: 'جسر أولياء الأمور', type: 'parents', members: ['owner', 'admin', 'teacher', 'parent'] },
  { key: 'ch_hr', name: 'HR Department', nameAr: 'قسم الموارد البشرية', type: 'department', members: ['owner', 'admin', 'hr'] },
]);

export const COMM_SEED_KB = Object.freeze([
  {
    key: 'kb_reset_password',
    title: 'Reset password',
    titleAr: 'إعادة تعيين كلمة المرور',
    body: 'Go to Settings → Security → Reset password, or ask Support.',
    bodyAr: 'من الإعدادات → الأمان → إعادة تعيين كلمة المرور، أو تواصل مع الدعم.',
    tags: ['account', 'security'],
  },
  {
    key: 'kb_join_meeting',
    title: 'Join a video meeting',
    titleAr: 'الانضمام لاجتماع فيديو',
    body: 'Open Communication → Meetings → Join with meeting code.',
    bodyAr: 'افتح التواصل → الاجتماعات → انضم برمز الاجتماع.',
    tags: ['meetings', 'video'],
  },
  {
    key: 'kb_parent_alerts',
    title: 'Parent attendance alerts',
    titleAr: 'تنبيهات حضور أولياء الأمور',
    body: 'Parents receive automatic attendance and homework updates when enabled.',
    bodyAr: 'يستلم أولياء الأمور تنبيهات الحضور والواجبات تلقائيًا عند التفعيل.',
    tags: ['parents', 'attendance'],
  },
]);

export const COMM_SEED_DEVICES = Object.freeze([
  { key: 'device_owner_web', userId: 'owner', label: 'Owner Web', platform: 'web', status: 'trusted' },
  { key: 'device_admin_web', userId: 'admin', label: 'Admin Web', platform: 'web', status: 'trusted' },
]);

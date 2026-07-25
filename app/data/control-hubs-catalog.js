/**
 * Control hubs catalogue — Company / Partners / Users
 * Agreed SUCCESS OS operating classification.
 */

export const CONTROL_HUB_SECTIONS = [
  {
    id: 'company',
    titleAr: 'الشركة',
    titleEn: 'Company',
    blurbAr:
      'تشغيل SUCCESS OS داخلياً: المالك، المهندسون، المحتوى، الأكاديميا، السوشيال، الدعم، والأمان.',
    icon: '◆',
  },
  {
    id: 'partners',
    titleAr: 'الشركاء',
    titleEn: 'Partners',
    blurbAr:
      'من يقدّم الخدمة على المنصة: معلم شريك، مدرسة، جامعة/كلية، مركز تعليمي، وشركة توظيف.',
    icon: '🤝',
  },
  {
    id: 'users',
    titleAr: 'المستخدمون',
    titleEn: 'Users',
    blurbAr: 'من يستهلك الخدمة: طالب، ولي أمر، وباحث عن عمل — رحلات التعلم والقبول والوظائف.',
    icon: '◉',
  },
];

/** Shared control actions reusable across hubs */
const A = {
  open: (href, label = 'افتح اللوحة') => ({ href, label, kind: 'primary' }),
  admin: (href, label = 'إدارة') => ({ href, label, kind: 'admin' }),
  join: (href, label = 'انضم') => ({ href, label, kind: 'join' }),
  work: (href, label) => ({ href, label, kind: 'work' }),
  data: (href, label) => ({ href, label, kind: 'data' }),
};

export const CONTROL_HUBS = [
  // ── الشركة ──────────────────────────────────────────────
  {
    id: 'owner',
    section: 'company',
    role: 'owner',
    title: 'لوحة المالك',
    subtitle: 'Founder & CEO',
    note: 'النظرة الشاملة، الإيرادات، الاعتمادات الاستراتيجية',
    href: '/control-center?role=owner',
    tags: ['شركة', 'قيادة'],
    actions: [
      A.open('/control-center?role=owner'),
      A.admin('/dashboard/owner', 'لوحة المالك'),
      A.admin('/dashboard/super-admin', 'Super Admin'),
      A.admin('/dashboard/admin', 'ERP Admin'),
      A.work('/control-hubs', 'كل اللوحات'),
      A.data('/qa-dashboard', 'QA'),
    ],
  },
  {
    id: 'super-admin',
    section: 'company',
    title: 'Super Admin',
    subtitle: 'أعلى صلاحية تشغيل',
    note: 'تكوين النظام والصلاحيات وسجلات التدقيق',
    href: '/dashboard/super-admin',
    tags: ['شركة', 'نظام'],
    actions: [
      A.open('/dashboard/super-admin'),
      A.admin('/dashboard/admin/permissions', 'الصلاحيات'),
      A.admin('/dashboard/admin/system-configuration', 'إعدادات النظام'),
      A.admin('/dashboard/admin/audit-logs', 'سجلات التدقيق'),
    ],
  },
  {
    id: 'admin-erp',
    section: 'company',
    title: 'إدارة ERP',
    subtitle: 'Enterprise Admin',
    note: 'الطلاب، الشركاء، المالية، الموارد البشرية، التقارير',
    href: '/dashboard/admin',
    tags: ['شركة', 'عمليات'],
    actions: [
      A.open('/dashboard/admin'),
      A.admin('/dashboard/admin/students', 'الطلاب'),
      A.admin('/dashboard/admin/partners', 'الشركاء'),
      A.admin('/dashboard/admin/finance', 'المالية'),
      A.admin('/dashboard/admin/human-resources', 'الموارد البشرية'),
      A.admin('/dashboard/admin/reports', 'التقارير'),
    ],
  },
  {
    id: 'engineer',
    section: 'company',
    role: 'engineer',
    title: 'مهندس المنصة',
    subtitle: 'Engineering',
    note: 'الصحة، الأخطاء، الإصدارات، التكاملات',
    href: '/control-center?role=engineer',
    tags: ['شركة', 'تقنية'],
    actions: [
      A.open('/control-center?role=engineer'),
      A.work('/security-center', 'الأمان'),
      A.work('/qa-dashboard', 'QA'),
      A.data('/api/v1/portals', 'API البوابات'),
      A.admin('/dashboard/admin/system-configuration', 'التكوين'),
    ],
  },
  {
    id: 'content',
    section: 'company',
    role: 'content',
    title: 'صانع المحتوى',
    subtitle: 'Content Studio',
    note: 'الإنتاج، الفيديو، خريطة المعرفة، الحقوق',
    href: '/control-center?role=content',
    tags: ['شركة', 'محتوى'],
    actions: [
      A.open('/control-center?role=content'),
      A.work('/content-studio', 'الاستوديو'),
      A.work('/study-content-generator', 'مولد المحتوى'),
      A.admin('/dashboard/admin/ai-content', 'AI Content'),
      A.admin('/dashboard/admin/books', 'الكتب'),
      A.admin('/dashboard/content-creator', 'لوحة المنشئ'),
    ],
  },
  {
    id: 'social',
    section: 'company',
    role: 'social',
    title: 'السوشيال ميديا',
    subtitle: 'Social & Leads',
    note: 'التقاويم، الحملات، التحقق قبل النشر',
    href: '/control-center?role=social',
    tags: ['شركة', 'تسويق'],
    actions: [
      A.open('/control-center?role=social'),
      A.admin('/dashboard/admin/social-media', 'إدارة السوشيال'),
      A.admin('/dashboard/admin/marketing', 'التسويق'),
      A.admin('/dashboard/social-media-manager', 'لوحة المدير'),
      A.work('/scholarships', 'تحقق المنح'),
    ],
  },
  {
    id: 'academic',
    section: 'company',
    role: 'academic',
    title: 'المدير الأكاديمي',
    subtitle: 'Academic Quality',
    note: 'الجودة، الاعتراف، المناهج، القبول',
    href: '/control-center?role=academic',
    tags: ['شركة', 'أكاديمي'],
    actions: [
      A.open('/control-center?role=academic'),
      A.admin('/dashboard/academic-director', 'لوحة المدير'),
      A.admin('/dashboard/admin/admissions', 'قبول Admin'),
      A.work('/admissions', 'معالج القبول'),
      A.work('/global-sources', 'المصادر الرسمية'),
      A.admin('/dashboard/admin/subjects', 'المواد'),
      A.admin('/dashboard/admin/study-abroad', 'الدراسة بالخارج'),
    ],
  },
  {
    id: 'house-teacher',
    section: 'company',
    role: 'houseTeacher',
    title: 'معلم الشركة',
    subtitle: 'In-house Teacher',
    note: 'معلمون داخليون لـ Success 4 Sure / الإنتاج',
    href: '/control-center?role=houseTeacher',
    tags: ['شركة', 'تعليم'],
    actions: [
      A.open('/control-center?role=houseTeacher'),
      A.work('/teacher-portal', 'بوابة المعلم'),
      A.work('/content-studio', 'الاستوديو'),
      A.admin('/dashboard/admin/teachers', 'إدارة المعلمين'),
    ],
  },
  {
    id: 'support',
    section: 'company',
    title: 'دعم العملاء',
    subtitle: 'Customer Support',
    note: 'التذاكر، الإشعارات، متابعة المستخدمين',
    href: '/dashboard/customer-support',
    tags: ['شركة', 'دعم'],
    actions: [
      A.open('/dashboard/customer-support'),
      A.admin('/dashboard/admin/support-center', 'مركز الدعم'),
      A.admin('/dashboard/admin/notifications', 'الإشعارات'),
    ],
  },
  {
    id: 'security-qa',
    section: 'company',
    title: 'الأمان و QA',
    subtitle: 'Security & Quality',
    note: 'حماية الملفات وفحوص الجودة',
    href: '/security-center',
    tags: ['شركة', 'أمان'],
    actions: [
      A.open('/security-center', 'مركز الأمان'),
      A.work('/qa-dashboard', 'لوحة QA'),
      A.work('/trust', 'الثقة'),
      A.work('/source-registry', 'سجل المصادر'),
    ],
  },

  // ── الشركاء ─────────────────────────────────────────────
  {
    id: 'partner-teacher',
    section: 'partners',
    role: 'teacher',
    title: 'المعلم الشريك',
    subtitle: 'Partner Teacher',
    note: 'حصص مباشرة ومسجلة ومنتجات تعليمية',
    href: '/control-center?role=teacher',
    tags: ['شركاء', 'معلم'],
    actions: [
      A.open('/control-center?role=teacher'),
      A.work('/teacher-portal', 'بوابة المعلم'),
      A.join('/access?portal=teacher&intent=join', 'انضم كمعلم'),
      A.work('/class-booking', 'الحجز'),
      A.admin('/dashboard/teacher', 'لوحة المعلم'),
      A.work('/teachers', 'دليل المعلمين'),
    ],
  },
  {
    id: 'partner-school',
    section: 'partners',
    title: 'المدرسة الشريكة',
    subtitle: 'Partner School',
    note: 'صفوف، معلمون، قبول مدرسي',
    href: '/dashboard/school',
    tags: ['شركاء', 'مدرسة'],
    actions: [
      A.open('/dashboard/school'),
      A.open('/control-center?role=institution&portal=school', 'Control Center'),
      A.join('/access?portal=school&intent=join', 'انضم كمدرسة'),
      A.work('/school-finder', 'دليل المدارس'),
      A.admin('/dashboard/admin/schools', 'إدارة المدارس'),
    ],
  },
  {
    id: 'partner-university',
    section: 'partners',
    title: 'الجامعة / الكلية الشريكة',
    subtitle: 'Partner University & College',
    note: 'برامج، قبول، منح، ملف مؤسسي',
    href: '/dashboard/university',
    tags: ['شركاء', 'جامعة'],
    actions: [
      A.open('/dashboard/university'),
      A.open('/control-center?role=institution&portal=university', 'Control Center'),
      A.join('/access?portal=university&intent=join', 'انضم كجامعة'),
      A.work('/admissions', 'معالج القبول'),
      A.work('/degree-finder', 'دليل الدرجات'),
      A.admin('/dashboard/admin/universities', 'إدارة الجامعات'),
      A.admin('/dashboard/admin/admissions', 'قبول Admin'),
      A.admin('/dashboard/admin/scholarships', 'المنح'),
    ],
  },
  {
    id: 'partner-center',
    section: 'partners',
    title: 'المركز التعليمي الشريك',
    subtitle: 'Educational Center',
    note: 'دورات، شهادات، تدريب مهني',
    href: '/dashboard/educational-center',
    tags: ['شركاء', 'مركز'],
    actions: [
      A.open('/dashboard/educational-center'),
      A.open('/control-center?role=institution&portal=center', 'Control Center'),
      A.join('/access?portal=center&intent=join', 'انضم كمركز'),
      A.work('/centers', 'دليل المراكز'),
      A.admin('/dashboard/admin/educational-centers', 'إدارة المراكز'),
      A.admin('/dashboard/admin/courses', 'الدورات'),
      A.admin('/dashboard/admin/certificates', 'الشهادات'),
    ],
  },
  {
    id: 'partner-employer',
    section: 'partners',
    role: 'employer',
    title: 'شركة التوظيف الشريكة',
    subtitle: 'Employer / Recruiter',
    note: 'وظائف، مرشحون، مقابلات، تحقق شهادات',
    href: '/control-center?role=employer',
    tags: ['شركاء', 'توظيف'],
    actions: [
      A.open('/control-center?role=employer'),
      A.admin('/dashboard/employer', 'لوحة صاحب العمل'),
      A.join('/access?portal=employer&intent=join', 'انضم كشركة'),
      A.work('/jobs', 'الوظائف'),
      A.admin('/dashboard/admin/employers', 'إدارة أصحاب العمل'),
      A.admin('/dashboard/admin/recruitment-companies', 'شركات التوظيف'),
    ],
  },
  {
    id: 'partners-admin',
    section: 'partners',
    title: 'إدارة الشركاء',
    subtitle: 'Partners Ops',
    note: 'التحقق، العقود، العمولات، الظهور في البحث',
    href: '/dashboard/admin/partners',
    tags: ['شركاء', 'عمليات'],
    actions: [
      A.open('/dashboard/admin/partners', 'شركاء Admin'),
      A.work('/join-us', 'بوابة الانضمام'),
      A.work('/partner-search', 'بحث الشركاء'),
      A.admin('/dashboard/admin/sales', 'المبيعات'),
    ],
  },

  // ── المستخدمون ──────────────────────────────────────────
  {
    id: 'user-student',
    section: 'users',
    role: 'student',
    title: 'الطالب',
    subtitle: 'Student',
    note: 'تعلم، قبول جامعي، كتب، حصص، جواز تعليمي',
    href: '/control-center?role=student',
    tags: ['مستخدمون', 'طالب'],
    actions: [
      A.open('/control-center?role=student'),
      A.work('/student-portal', 'بوابة الطالب'),
      A.work('/student/dashboard', 'لوحة الكتب'),
      A.work('/start-journey?portal=student', 'ابدأ الرحلة'),
      A.work('/admissions', 'القبول الجامعي'),
      A.work('/degree-finder', 'الدرجات'),
      A.work('/passport', 'الجواز'),
      A.admin('/dashboard/admin/students', 'إدارة الطلاب'),
    ],
  },
  {
    id: 'user-parent',
    section: 'users',
    title: 'ولي الأمر',
    subtitle: 'Parent',
    note: 'متابعة الأبناء، الحجوزات، التنبيهات',
    href: '/parent',
    tags: ['مستخدمون', 'أسرة'],
    actions: [
      A.open('/parent'),
      A.admin('/dashboard/parent', 'لوحة ولي الأمر'),
      A.work('/class-booking', 'الحجز'),
      A.work('/notifications', 'التنبيهات'),
      A.admin('/dashboard/admin/parents', 'إدارة أولياء الأمور'),
    ],
  },
  {
    id: 'user-jobseeker',
    section: 'users',
    title: 'الباحث عن عمل',
    subtitle: 'Job Seeker',
    note: 'وظائف، مهارات، طلبات، خطة مهنية',
    href: '/jobseeker-portal',
    tags: ['مستخدمون', 'وظائف'],
    actions: [
      A.open('/jobseeker-portal'),
      A.admin('/dashboard/job-seeker', 'لوحة الباحث'),
      A.work('/start-journey?portal=jobseeker', 'رحلة التوظيف'),
      A.work('/jobs', 'البحث عن وظائف'),
      A.work('/jobs/companies', 'الشركات'),
      A.admin('/dashboard/admin/job-seekers', 'إدارة الباحثين'),
    ],
  },
  {
    id: 'user-learning-surface',
    section: 'users',
    title: 'أسطح التعلم السريعة',
    subtitle: 'Learning Surfaces',
    note: 'لوحة التعلم، المواد، المكتبة، المعلم الذكي',
    href: '/dashboard',
    tags: ['مستخدمون', 'تعلم'],
    actions: [
      A.open('/dashboard', 'لوحة التعلم'),
      A.work('/subject-catalog', 'المواد المدرسية'),
      A.work('/university-subjects', 'المواد الجامعية'),
      A.work('/library', 'المكتبة'),
      A.work('/tutor', 'المعلم الذكي'),
      A.work('/programs', 'البرامج'),
    ],
  },
];

/** Role → control actions for Control Center 2050 buttons */
export const ROLE_CONTROL_ACTIONS = {
  owner: CONTROL_HUBS.find((h) => h.id === 'owner').actions,
  engineer: CONTROL_HUBS.find((h) => h.id === 'engineer').actions,
  content: CONTROL_HUBS.find((h) => h.id === 'content').actions,
  social: CONTROL_HUBS.find((h) => h.id === 'social').actions,
  academic: CONTROL_HUBS.find((h) => h.id === 'academic').actions,
  houseTeacher: CONTROL_HUBS.find((h) => h.id === 'house-teacher').actions,
  teacher: CONTROL_HUBS.find((h) => h.id === 'partner-teacher').actions,
  institution: CONTROL_HUBS.find((h) => h.id === 'partner-university').actions,
  employer: CONTROL_HUBS.find((h) => h.id === 'partner-employer').actions,
  student: CONTROL_HUBS.find((h) => h.id === 'user-student').actions,
};

export function hubsForSection(sectionId) {
  return CONTROL_HUBS.filter((h) => h.section === sectionId);
}

export function filterHubs({ section = 'all', query = '', tag = 'all' } = {}) {
  const q = query.trim().toLowerCase();
  return CONTROL_HUBS.filter((h) => {
    if (section !== 'all' && h.section !== section) return false;
    if (tag !== 'all' && !(h.tags || []).includes(tag)) return false;
    if (!q) return true;
    const hay = `${h.title} ${h.subtitle} ${h.note} ${(h.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}

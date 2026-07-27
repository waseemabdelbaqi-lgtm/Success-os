/**
 * Control hubs — شركة / شركاء / مستخدمون
 * المستخدمون = الطلاب + الباحثون عن عمل فقط.
 */

export const CONTROL_HUB_SECTIONS = [
  {
    id: 'company',
    titleAr: 'الشركة',
    titleEn: 'Company',
    blurbAr:
      'دوائر SUCCESS OS الداخلية: القيادة، التقنية، الموارد البشرية، القانونية، المالية، التسويق، المحتوى، الأكاديميا، والدعم.',
    icon: '◆',
  },
  {
    id: 'partners',
    titleAr: 'الشركاء',
    titleEn: 'Partners',
    blurbAr: 'مقدم الخدمة: معلم، مدرسة، جامعة/كلية، مركز تعليمي، وشركة توظيف.',
    icon: '🤝',
  },
  {
    id: 'users',
    titleAr: 'المستخدمون',
    titleEn: 'Users',
    blurbAr: 'مستهلكو الخدمة فقط: الطلاب والباحثون عن عمل.',
    icon: '◉',
  },
];

const A = {
  open: (href, label = 'افتح اللوحة') => ({ href, label, kind: 'primary' }),
  admin: (href, label = 'إدارة') => ({ href, label, kind: 'admin' }),
  join: (href, label = 'انضم') => ({ href, label, kind: 'join' }),
  work: (href, label) => ({ href, label, kind: 'work' }),
  data: (href, label) => ({ href, label, kind: 'data' }),
};

export const CONTROL_HUBS = [
  // ── الشركة · قيادة وتشغيل ───────────────────────────────
  {
    id: 'owner',
    section: 'company',
    dept: 'قيادة',
    role: 'owner',
    title: 'لوحة المالك',
    subtitle: 'Founder & CEO',
    note: 'القرارات الاستراتيجية والاعتمادات العليا',
    href: '/control-center?role=owner',
    actions: [
      A.open('/control-center?role=owner'),
      A.admin('/dashboard/owner', 'لوحة المالك'),
      A.admin('/dashboard/super-admin', 'Super Admin'),
      A.work('/control-hubs', 'كل اللوحات'),
    ],
  },
  {
    id: 'super-admin',
    section: 'company',
    dept: 'قيادة',
    title: 'Super Admin',
    subtitle: 'System Control',
    note: 'الصلاحيات، التكوين، وسجلات التدقيق',
    href: '/dashboard/super-admin',
    actions: [
      A.open('/dashboard/super-admin'),
      A.admin('/dashboard/admin/permissions', 'الصلاحيات'),
      A.admin('/dashboard/admin/system-configuration', 'التكوين'),
      A.admin('/dashboard/admin/audit-logs', 'التدقيق'),
    ],
  },
  {
    id: 'admin-erp',
    section: 'company',
    dept: 'قيادة',
    title: 'إدارة ERP',
    subtitle: 'Enterprise Admin',
    note: 'غرفة عمليات الإدارة الموحدة',
    href: '/dashboard/admin',
    actions: [
      A.open('/dashboard/admin'),
      A.admin('/dashboard/admin/reports', 'التقارير'),
      A.admin('/dashboard/admin/notifications', 'الإشعارات'),
      A.admin('/dashboard/admin/settings', 'الإعدادات'),
    ],
  },

  // ── الشركة · التقنية ────────────────────────────────────
  {
    id: 'engineer',
    section: 'company',
    dept: 'تقنية',
    role: 'engineer',
    title: 'دائرة الهندسة والتقنية',
    subtitle: 'Engineering',
    note: 'الاستقرار، الإصدارات، التكاملات، والأمان التقني',
    href: '/control-center?role=engineer',
    actions: [
      A.open('/control-center?role=engineer'),
      A.work('/security-center', 'الأمان'),
      A.work('/qa-dashboard', 'QA'),
      A.data('/api/v1/portals', 'API البوابات'),
      A.admin('/dashboard/admin/system-configuration', 'التكوين'),
    ],
  },

  // ── الشركة · موارد بشرية ────────────────────────────────
  {
    id: 'hr',
    section: 'company',
    dept: 'موارد بشرية',
    title: 'دائرة الموارد البشرية',
    subtitle: 'Human Resources',
    note: 'الموظفون، العقود، الرواتب، الإجازات، والأداء',
    href: '/dashboard/admin/human-resources',
    actions: [
      A.open('/dashboard/admin/human-resources', 'الموارد البشرية'),
      A.admin('/dashboard/admin/employees', 'الموظفون'),
      A.admin('/dashboard/admin/hr-departments', 'الأقسام'),
      A.admin('/dashboard/admin/hr-positions', 'المناصب'),
      A.admin('/dashboard/admin/hr-contracts', 'عقود العمل'),
      A.admin('/dashboard/admin/hr-payroll', 'الرواتب'),
      A.admin('/dashboard/admin/hr-attendance', 'الحضور'),
      A.admin('/dashboard/admin/hr-leave', 'الإجازات'),
      A.admin('/dashboard/admin/hr-performance', 'تقييم الأداء'),
    ],
  },

  // ── الشركة · قانونية ────────────────────────────────────
  {
    id: 'legal',
    section: 'company',
    dept: 'قانونية',
    title: 'الدائرة القانونية',
    subtitle: 'Legal & Compliance',
    note: 'عقود الشركاء، الامتثال، الصلاحيات، وسجلات التدقيق',
    href: '/dashboard/admin/partner-contracts',
    actions: [
      A.open('/dashboard/admin/partner-contracts', 'عقود الشركاء'),
      A.admin('/dashboard/admin/hr-contracts', 'عقود الموظفين'),
      A.admin('/dashboard/admin/hr-signatures', 'التوقيع الرقمي'),
      A.admin('/dashboard/admin/permissions', 'الصلاحيات'),
      A.admin('/dashboard/admin/audit-logs', 'التدقيق'),
      A.work('/trust', 'معايير الثقة'),
      A.work('/security-center', 'الحماية'),
    ],
  },

  // ── الشركة · مالية ──────────────────────────────────────
  {
    id: 'finance',
    section: 'company',
    dept: 'مالية',
    title: 'الدائرة المالية',
    subtitle: 'Finance & Accounting',
    note: 'المحاسبة، العمولات، المدفوعات، والحسابات البنكية',
    href: '/dashboard/admin/finance',
    actions: [
      A.open('/dashboard/admin/finance', 'المالية'),
      A.admin('/dashboard/admin/commission-rules', 'محرك العمولات'),
      A.admin('/dashboard/admin/hr-payroll', 'الرواتب'),
      A.admin('/dashboard/admin/hr-bank-accounts', 'الحسابات البنكية'),
      A.admin('/dashboard/admin/hr-bonuses', 'المكافآت'),
      A.admin('/dashboard/admin/sales', 'المبيعات'),
      A.admin('/dashboard/admin/reports', 'التقارير'),
    ],
  },

  // ── الشركة · تسويق ومبيعات ──────────────────────────────
  {
    id: 'marketing-sales',
    section: 'company',
    dept: 'تسويق',
    title: 'التسويق والمبيعات',
    subtitle: 'Marketing & Sales',
    note: 'الحملات، العملاء المحتملون، والتحقق قبل النشر',
    href: '/control-center?role=social',
    actions: [
      A.open('/control-center?role=social', 'السوشيال'),
      A.admin('/dashboard/admin/marketing', 'التسويق'),
      A.admin('/dashboard/admin/sales', 'المبيعات'),
      A.admin('/dashboard/admin/social-media', 'السوشيال Admin'),
      A.admin('/dashboard/social-media-manager', 'لوحة المدير'),
      A.work('/scholarships', 'تحقق المنح'),
    ],
  },

  // ── الشركة · محتوى ──────────────────────────────────────
  {
    id: 'content',
    section: 'company',
    dept: 'محتوى',
    role: 'content',
    title: 'دائرة المحتوى',
    subtitle: 'Content Studio',
    note: 'الإنتاج، الفيديو، الكتب، وخريطة المعرفة',
    href: '/control-center?role=content',
    actions: [
      A.open('/control-center?role=content'),
      A.work('/content-studio', 'الاستوديو'),
      A.work('/study-content-generator', 'مولد المحتوى'),
      A.admin('/dashboard/admin/ai-content', 'AI Content'),
      A.admin('/dashboard/admin/books', 'الكتب'),
      A.admin('/dashboard/admin/recorded-lessons', 'حصص مسجلة'),
    ],
  },

  // ── الشركة · أكاديمي ────────────────────────────────────
  {
    id: 'academic',
    section: 'company',
    dept: 'أكاديمي',
    role: 'academic',
    title: 'الدائرة الأكاديمية',
    subtitle: 'Academic Quality',
    note: 'الجودة، الاعتراف، القبول، والمناهج',
    href: '/control-center?role=academic',
    actions: [
      A.open('/control-center?role=academic'),
      A.admin('/dashboard/academic-director', 'المدير الأكاديمي'),
      A.work('/admissions', 'معالج القبول'),
      A.work('/global-sources', 'المصادر الرسمية'),
      A.admin('/dashboard/admin/admissions', 'قبول Admin'),
      A.admin('/dashboard/admin/study-abroad', 'الدراسة بالخارج'),
      A.admin('/dashboard/admin/subjects', 'المواد'),
    ],
  },
  {
    id: 'house-teacher',
    section: 'company',
    dept: 'أكاديمي',
    role: 'houseTeacher',
    title: 'معلم الشركة',
    subtitle: 'In-house Teacher',
    note: 'معلمون داخليون للإنتاج والجودة',
    href: '/control-center?role=houseTeacher',
    actions: [
      A.open('/control-center?role=houseTeacher'),
      A.work('/teacher-portal', 'بوابة المعلم'),
      A.work('/content-studio', 'الاستوديو'),
      A.admin('/dashboard/admin/teachers', 'إدارة المعلمين'),
    ],
  },

  // ── الشركة · دعم وأمان ──────────────────────────────────
  {
    id: 'support',
    section: 'company',
    dept: 'دعم',
    title: 'دعم العملاء',
    subtitle: 'Customer Support',
    note: 'التذاكر، الإشعارات، ومتابعة المستخدمين',
    href: '/dashboard/customer-support',
    actions: [
      A.open('/dashboard/customer-support'),
      A.admin('/dashboard/admin/support-center', 'مركز الدعم'),
      A.admin('/dashboard/admin/notifications', 'الإشعارات'),
      A.work('/parent', 'ولي الأمر (متابعة)'),
    ],
  },
  {
    id: 'security-qa',
    section: 'company',
    dept: 'دعم',
    title: 'الأمان و QA',
    subtitle: 'Security & Quality',
    note: 'حماية الملفات وفحوص الجودة',
    href: '/security-center',
    actions: [
      A.open('/security-center', 'مركز الأمان'),
      A.work('/qa-dashboard', 'لوحة QA'),
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
    actions: [
      A.open('/control-center?role=teacher'),
      A.work('/teacher-portal', 'بوابة المعلم'),
      A.join('/access?portal=teacher&intent=join', 'انضم كمعلم'),
      A.work('/class-booking', 'الحجز'),
      A.admin('/dashboard/teacher', 'لوحة المعلم'),
    ],
  },
  {
    id: 'partner-school',
    section: 'partners',
    title: 'المدرسة الشريكة',
    subtitle: 'Partner School',
    note: 'صفوف، معلمون، عمليات مدرسية',
    href: '/dashboard/school',
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
    actions: [
      A.open('/dashboard/university'),
      A.open('/control-center?role=institution&portal=university', 'Control Center'),
      A.join('/access?portal=university&intent=join', 'انضم كجامعة'),
      A.work('/admissions', 'معالج القبول'),
      A.work('/degree-finder', 'دليل الدرجات'),
      A.admin('/dashboard/admin/universities', 'إدارة الجامعات'),
    ],
  },
  {
    id: 'partner-center',
    section: 'partners',
    title: 'المركز التعليمي الشريك',
    subtitle: 'Educational Center',
    note: 'دورات، شهادات، تدريب مهني',
    href: '/dashboard/educational-center',
    actions: [
      A.open('/dashboard/educational-center'),
      A.open('/control-center?role=institution&portal=center', 'Control Center'),
      A.join('/access?portal=center&intent=join', 'انضم كمركز'),
      A.work('/centers', 'دليل المراكز'),
      A.admin('/dashboard/admin/educational-centers', 'إدارة المراكز'),
    ],
  },
  {
    id: 'partner-employer',
    section: 'partners',
    role: 'employer',
    title: 'شركة التوظيف الشريكة',
    subtitle: 'Employer / Recruiter',
    note: 'وظائف، مرشحون، مقابلات',
    href: '/control-center?role=employer',
    actions: [
      A.open('/control-center?role=employer'),
      A.admin('/dashboard/employer', 'لوحة صاحب العمل'),
      A.join('/access?portal=employer&intent=join', 'انضم كشركة'),
      A.work('/jobs', 'الوظائف'),
      A.admin('/dashboard/admin/employers', 'إدارة أصحاب العمل'),
    ],
  },
  {
    id: 'partners-admin',
    section: 'partners',
    title: 'إدارة الشركاء',
    subtitle: 'Partners Ops',
    note: 'التحقق، العقود، والظهور في البحث',
    href: '/dashboard/admin/partners',
    actions: [
      A.open('/dashboard/admin/partners', 'شركاء Admin'),
      A.work('/join-us', 'بوابة الانضمام'),
      A.work('/partner-search', 'بحث الشركاء'),
      A.admin('/dashboard/admin/partner-contracts', 'عقود الشركاء'),
    ],
  },

  // ── المستخدمون: طلاب + باحثون عن عمل فقط ────────────────
  {
    id: 'user-student',
    section: 'users',
    role: 'student',
    title: 'الطالب',
    subtitle: 'Student',
    note: 'تعلم، قبول جامعي، كتب، حصص، جواز تعليمي',
    href: '/control-center?role=student',
    actions: [
      A.open('/control-center?role=student'),
      A.work('/student-portal', 'بوابة الطالب'),
      A.work('/student/dashboard', 'لوحة الكتب'),
      A.work('/start-journey?portal=student', 'ابدأ الرحلة'),
      A.work('/admissions', 'القبول الجامعي'),
      A.work('/degree-finder', 'الدرجات'),
      A.work('/dashboard', 'لوحة التعلم'),
      A.work('/passport', 'الجواز'),
      A.admin('/dashboard/admin/students', 'إدارة الطلاب'),
    ],
  },
  {
    id: 'user-jobseeker',
    section: 'users',
    title: 'الباحث عن عمل',
    subtitle: 'Job Seeker',
    note: 'وظائف، مهارات، طلبات، خطة مهنية',
    href: '/jobseeker-portal',
    actions: [
      A.open('/jobseeker-portal'),
      A.admin('/dashboard/job-seeker', 'لوحة الباحث'),
      A.work('/start-journey?portal=jobseeker', 'رحلة التوظيف'),
      A.work('/jobs', 'البحث عن وظائف'),
      A.work('/jobs/companies', 'الشركات'),
      A.admin('/dashboard/admin/job-seekers', 'إدارة الباحثين'),
    ],
  },
];

export const COMPANY_DEPTS = [
  'الكل',
  ...new Set(CONTROL_HUBS.filter((h) => h.section === 'company').map((h) => h.dept).filter(Boolean)),
];

export const ROLE_CONTROL_ACTIONS = {
  owner: CONTROL_HUBS.find((h) => h.id === 'owner').actions,
  engineer: CONTROL_HUBS.find((h) => h.id === 'engineer').actions,
  content: CONTROL_HUBS.find((h) => h.id === 'content').actions,
  social: CONTROL_HUBS.find((h) => h.id === 'marketing-sales').actions,
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

/** Simple filter: section tab + optional company dept + free text */
export function filterHubs({ section = 'all', dept = 'الكل', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return CONTROL_HUBS.filter((h) => {
    if (section !== 'all' && h.section !== section) return false;
    if (section === 'company' && dept !== 'الكل' && h.dept !== dept) return false;
    if (!q) return true;
    const hay = `${h.title} ${h.subtitle} ${h.note} ${h.dept || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

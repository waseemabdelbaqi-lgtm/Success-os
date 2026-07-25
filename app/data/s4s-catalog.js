/**
 * Catalog content sourced from Success 4 Sure Academy public offerings.
 * Used to fill books / courses / marketplace / programs surfaces.
 * Source: https://www.success4sureacademy.com/
 */

export const S4S_PROGRAMS = [
  {
    id: 'american-diploma',
    group: 'American Diploma',
    groupAr: 'الدبلوم الأمريكي',
    items: [
      { id: 'sat', name: 'SAT', blurb: 'College Board SAT prep with practice and score-building plans.', blurbAr: 'تحضير SAT مع خطط تدريب ورفع الدرجة.' },
      { id: 'est', name: 'EST', blurb: 'Egyptian Scholastic Test prep for American Diploma tracks.', blurbAr: 'تحضير EST لمسارات الدبلوم الأمريكي.' },
      { id: 'act', name: 'ACT', blurb: 'ACT subject and composite preparation with expert teachers.', blurbAr: 'تحضير ACT مع معلمين خبراء.' },
      { id: 'ap', name: 'AP', blurb: 'Advanced Placement courses across sciences and humanities.', blurbAr: 'مساقات AP في العلوم والإنسانيات.' },
    ],
  },
  {
    id: 'british',
    group: 'British Programs',
    groupAr: 'البرامج البريطانية',
    items: [
      { id: 'igcse', name: 'IGCSE', blurb: 'Cambridge / Edexcel IGCSE pathways.', blurbAr: 'مسارات IGCSE من Cambridge وEdexcel.' },
      { id: 'o-level', name: 'O Level', blurb: 'O Level subject mastery and exam readiness.', blurbAr: 'إتقان مواد O Level والاستعداد للامتحان.' },
      { id: 'a-level', name: 'A Level', blurb: 'A Level specialization for university entry.', blurbAr: 'تخصص A Level للقبول الجامعي.' },
    ],
  },
  {
    id: 'ib',
    group: 'International Baccalaureate',
    groupAr: 'البكالوريا الدولية',
    items: [
      { id: 'ib', name: 'IB', blurb: 'IB Diploma subject support and exam coaching.', blurbAr: 'دعم مواد IB والتدريب على الامتحانات.' },
    ],
  },
  {
    id: 'languages',
    group: 'Languages',
    groupAr: 'اللغات',
    items: [
      { id: 'toefl', name: 'TOEFL', blurb: 'Academic English for university admissions.', blurbAr: 'الإنجليزية الأكاديمية للقبول الجامعي.' },
      { id: 'ielts', name: 'IELTS', blurb: 'IELTS Academic / General preparation.', blurbAr: 'تحضير IELTS الأكاديمي والعام.' },
    ],
  },
];

export const S4S_COURSES = [
  { id: 'est-math-1', title: 'EST II Math 1', titleAr: 'EST II رياضيات 1', kind: 'recorded', kindAr: 'حصة مسجلة', subject: 'Math', href: '/start-journey?portal=student&studentType=courses&subject=Math&course=est-math-1' },
  { id: 'ap-biology', title: 'AP Biology', titleAr: 'AP Biology', kind: 'recorded', kindAr: 'حصة مسجلة', subject: 'Biology', href: '/start-journey?portal=student&studentType=courses&subject=Biology&course=ap-biology' },
  { id: 'ap-physics-1', title: 'AP Physics 1', titleAr: 'AP Physics 1', kind: 'recorded', kindAr: 'حصة مسجلة', subject: 'Physics', href: '/start-journey?portal=student&studentType=courses&subject=Physics&course=ap-physics-1' },
  { id: 'est-us-history', title: 'EST U.S. History', titleAr: 'EST تاريخ الولايات المتحدة', kind: 'recorded', kindAr: 'حصة مسجلة', subject: 'History', href: '/start-journey?portal=student&studentType=courses&subject=History&course=est-us-history' },
];

export const S4S_BOOKS = [
  { id: 'physics-foundations', title: 'Physics Foundations', titleAr: 'أساسيات الفيزياء', track: 'AP / EST', href: '/student/books?book=physics-foundations' },
  { id: 'chemistry-mastery', title: 'Chemistry Mastery Workbook', titleAr: 'كتاب إتقان الكيمياء', track: 'IGCSE / A Level', href: '/student/books?book=chemistry-mastery' },
  { id: 'sat-math-practice', title: 'SAT Math Practice Pack', titleAr: 'حقيبة تدريب SAT Math', track: 'SAT', href: '/student/books?book=sat-math-practice' },
  { id: 'est-science-pack', title: 'EST Science Pack', titleAr: 'حقيبة علوم EST', track: 'EST', href: '/student/books?book=est-science-pack' },
];

export const S4S_CONTACT = {
  email: 'info@success4sureacademy.com',
  website: 'https://www.success4sureacademy.com/',
  instagram: 'https://www.instagram.com/success4surejo/',
  locations: ['Amman', 'Dubai', 'Online Worldwide'],
  whatsappHint: 'WhatsApp available via Success 4 Sure Academy site',
};

export const MARKETPLACE_CATEGORIES = [
  { id: 'teachers', title: 'Teachers', titleAr: 'المعلمون', href: '/teachers', desc: 'Book verified experts by curriculum and subject.', descAr: 'احجز معلمين موثقين حسب المنهاج والمادة.' },
  { id: 'courses', title: 'Courses', titleAr: 'الدورات', href: '/courses', desc: 'Recorded and live prep for SAT, EST, ACT, AP, IGCSE.', descAr: 'دورات مسجلة ومباشرة لـ SAT وEST وACT وAP وIGCSE.' },
  { id: 'books', title: 'Books', titleAr: 'الكتب', href: '/books', desc: 'Learning packs and workbooks from Success 4 Sure.', descAr: 'حقائب تعلم وكتب من Success 4 Sure.' },
  { id: 'centers', title: 'Learning centers', titleAr: 'المراكز', href: '/centers', desc: 'Partner centers offering classes and certificates.', descAr: 'مراكز شريكة تقدم حصصًا وشهادات.' },
  { id: 'jobs', title: 'Jobs', titleAr: 'الوظائف', href: '/jobs', desc: 'Matched roles for job seekers and employers.', descAr: 'وظائف مطابقة للباحثين وأصحاب العمل.' },
  { id: 'admissions', title: 'Admissions', titleAr: 'القبول الجامعي', href: '/admissions', desc: 'Programs, requirements, and applications.', descAr: 'برامج وشروط وطلبات قبول.' },
];

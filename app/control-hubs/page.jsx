'use client';

import { InnerNav } from '../components';

const HUBS = [
  {
    group: 'لوحات التشغيل المركزية',
    items: [
      { href: '/control-center?role=owner', title: 'Control Center — المالك', note: 'تشغيل المنصة والصلاحيات' },
      { href: '/control-center?role=engineer', title: 'Control Center — المهندس', note: 'التقنية والاستقرار' },
      { href: '/control-center?role=content', title: 'Control Center — المحتوى', note: 'المناهج والكتب' },
      { href: '/control-center?role=social', title: 'Control Center — السوشيال', note: 'التسويق والتحقق' },
      { href: '/control-center?role=academic', title: 'Control Center — الأكاديمي', note: 'الجودة والاعتراف' },
      { href: '/control-center?role=institution', title: 'Control Center — المؤسسة', note: 'جامعة / كلية / مركز / مدرسة' },
      { href: '/control-center?role=student', title: 'Control Center — الطالب', note: 'متابعة الرحلة التعليمية' },
      { href: '/control-center?role=teacher', title: 'Control Center — المعلم', note: 'الحصص والمنتجات' },
      { href: '/control-center?role=employer', title: 'Control Center — صاحب العمل', note: 'التوظيف والشراكات' },
    ],
  },
  {
    group: 'لوحات الأدوار',
    items: [
      { href: '/dashboard', title: 'لوحة التعلم العامة', note: 'واجهة الطالب السريعة' },
      { href: '/student-portal', title: 'بوابة الطالب', note: 'الكتب والحصص والنتائج' },
      { href: '/student/dashboard', title: 'لوحة كتب الطالب', note: 'مكتبة وكتب حية' },
      { href: '/teacher-portal', title: 'بوابة المعلم', note: 'الحصص والمنهج' },
      { href: '/jobseeker-portal', title: 'بوابة الباحث عن عمل', note: 'الوظائف والمهارات' },
      { href: '/parent', title: 'لوحة ولي الأمر', note: 'متابعة الأبناء' },
      { href: '/dashboard/university', title: 'لوحة الجامعة', note: 'قبول وبرامج' },
      { href: '/dashboard/school', title: 'لوحة المدرسة', note: 'الصفوف والمعلمون' },
      { href: '/dashboard/educational-center', title: 'لوحة المركز التعليمي', note: 'الدورات والشهادات' },
      { href: '/dashboard/employer', title: 'لوحة صاحب العمل', note: 'الوظائف والمرشحون' },
      { href: '/dashboard/admin', title: 'لوحة الإدارة', note: 'ERP والوحدات' },
      { href: '/dashboard/super-admin', title: 'Super Admin', note: 'أعلى صلاحية تشغيل' },
    ],
  },
  {
    group: 'القبول والجامعات والدرجات',
    items: [
      { href: '/admissions', title: 'معالج القبول', note: 'قارة → دولة → محلي/دولي' },
      { href: '/start-journey?portal=university', title: 'رحلة الجامعة', note: 'فلاتر البحث المرتبطة بالقبول' },
      { href: '/degree-finder', title: 'مكتشف الدرجات', note: 'جامعات وكليات وأونلاين' },
      { href: '/global-sources', title: 'المصادر والبوابات', note: '58+ بوابة قبول وتدريب' },
      { href: '/university-compare', title: 'مقارنة الجامعات', note: 'القائمة المحفوظة' },
      { href: '/application-tracker', title: 'متتبع الطلبات', note: 'متابعة التقديم' },
      { href: '/eligibility-check', title: 'فحص الأهلية', note: 'متطلبات البرنامج' },
      { href: '/scholarships', title: 'المنح', note: 'فرص التمويل' },
      { href: '/rankings', title: 'التصنيفات', note: 'مراجع الترتيب' },
      { href: '/api/v1/portals', title: 'API البوابات', note: 'JSON إنتاجي A–Z' },
    ],
  },
  {
    group: 'الشراكات والوصول',
    items: [
      { href: '/join-us', title: 'انضم كشريك', note: 'اختيار نوع الشراكة' },
      { href: '/access?portal=university&intent=join', title: 'انضمام جامعة/كلية', note: 'نموذج الوصول' },
      { href: '/access?portal=center&intent=join', title: 'انضمام مركز', note: 'نموذج الوصول' },
      { href: '/access?portal=school&intent=join', title: 'انضمام مدرسة', note: 'نموذج الوصول' },
      { href: '/access?portal=teacher&intent=join', title: 'انضمام معلم', note: 'نموذج الوصول' },
      { href: '/login', title: 'تسجيل الدخول', note: 'حسابات الأدوار' },
      { href: '/security-center', title: 'مركز الأمان', note: 'حماية الملفات' },
      { href: '/qa-dashboard', title: 'لوحة QA', note: 'فحوص الجودة' },
    ],
  },
];

export default function ControlHubsPage() {
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="access" />
      <main className="os-page-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <small style={{ letterSpacing: '0.08em', opacity: 0.7 }}>SUCCESS OS · CONTROL HUBS</small>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', margin: '0.4rem 0' }}>
            جميع لوحات التحكم للعمل عليها
          </h1>
          <p style={{ maxWidth: 640, lineHeight: 1.7, opacity: 0.85 }}>
            روابط مباشرة لكل لوحة تشغيل وبوابة دور ومسار قبول. استخدمها للتجربة والربط دون البحث في القوائم.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            <a className="os-primary" href="/control-center?role=owner">
              افتح Control Center ←
            </a>
            <a className="os-secondary" href="/admissions">
              معالج القبول
            </a>
            <a className="os-secondary" href="/start-journey?portal=university">
              رحلة الجامعة
            </a>
          </div>
        </header>

        {HUBS.map((group) => (
          <section key={group.group} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid rgba(127,29,29,0.25)', paddingBottom: '0.5rem' }}>
              {group.group}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {group.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '1rem 1.1rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(160deg, rgba(127,29,29,0.08), rgba(255,255,255,0.5))',
                    border: '1px solid rgba(127,29,29,0.18)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <b style={{ display: 'block', marginBottom: '0.35rem' }}>{item.title}</b>
                  <small style={{ opacity: 0.75, lineHeight: 1.5 }}>{item.note}</small>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

import Link from 'next/link';
import { InnerNav } from '../components';

const ADMIN_LINKS = [
  {
    tag: 'ENTERPRISE',
    title: 'لوحة الأدمن المؤسسية',
    desc: 'المستخدمون، المالية، الوحدات الأكاديمية، والصلاحيات من قاعدة البيانات.',
    href: '/dashboard/admin',
  },
  {
    tag: 'JO',
    title: 'تغطية المنهاج الأردني',
    desc: 'الصفوف والمواد والوحدات والدروس ونسبة التحقق.',
    href: '/admin/jordan-curriculum',
  },
  {
    tag: 'JO-GRAPH',
    title: 'Knowledge Graph — الصف الأول',
    desc: 'العلاقات التعليمية لبناء مسار تعلم واضح.',
    href: '/admin/jordan-grade1-knowledge-graph',
  },
  {
    tag: 'JO-ECO',
    title: 'نظام تعلم الصف الأول',
    desc: 'حالة إنتاج النظام التعليمي الكامل للصف الأول.',
    href: '/admin/jordan-grade1-learning-ecosystem',
  },
  {
    tag: 'REGISTRY',
    title: 'السجل الوطني للتعليم',
    desc: 'Jordan National Education Registry.',
    href: '/admin/jordan-national-education-registry',
  },
  {
    tag: 'BOOKS',
    title: 'مراجعة كتب الشرق الأوسط',
    desc: 'مراجعة وإدارة محتوى الكتب الرقمية.',
    href: '/admin/middle-east-book-review',
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#fff8f8]" dir="rtl">
      <InnerNav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="rounded-3xl bg-gradient-to-br from-[#4b0a11] via-[#7f121b] to-[#9e1722] px-6 py-10 text-white shadow-xl sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2dadd]">
            SUCCESS OS · Admin
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-sos-display)] text-3xl font-semibold sm:text-4xl">
            مركز التشغيل والأمان
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#f2dadd]">
            كل أدوات الأدمن من مكان واحد — بلا روابط ميتة. ابدأ بالمركز المؤسسي أو لوحات الأردن.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#9e1722]"
            >
              افتح Enterprise Admin
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white"
            >
              ← الصفحة الرئيسية
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[#ead9db] bg-white p-5 shadow-sm transition hover:border-[#9e1722] hover:shadow-md"
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a711a]">
                {item.tag}
              </span>
              <h2 className="mt-2 text-lg font-bold text-[#301218]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#73636a]">{item.desc}</p>
              <span className="mt-4 inline-block text-sm font-bold text-[#9e1722]">افتح ←</span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

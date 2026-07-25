import { InnerNav } from '../components';
import { S4S_BOOKS, S4S_COURSES } from '../data/s4s-catalog';

const materials = [
  {
    color: 'red',
    label: 'SUCCESS 4 SURE',
    title: 'AP Chemistry Master Book',
    meta: '101 صفحة',
    body: 'كتاب باسم الأكاديمية والأستاذ وسيم، يغطي البنية الذرية والروابط والطاقة والحركية والاتزان وغيرها.',
    href: '/student/books',
  },
  {
    color: 'blue',
    label: 'AP CHEMISTRY',
    title: 'Unit 2: Compound Structure',
    meta: '49 صفحة',
    body: 'وحدة منظمة تشمل أنواع الروابط والبنية الأيونية والمعادن ولويس والرنين وVSEPR والتهجين.',
    href: '/lesson',
  },
  {
    color: '',
    label: 'EDEXCEL AS PHYSICS',
    title: 'Kinematics & Measurement',
    meta: 'دليل بصري + خريطة',
    body: 'دليل مرئي وخريطة مفاهيم للقياس والمتجهات والحركة والمعادلات والرسوم البيانية.',
    href: '/subject-learning-hub?subject=Physics&view=book',
  },
  {
    color: 'blue',
    label: 'AP CHEMISTRY UNIT 1',
    title: 'Atomic Structure Series',
    meta: '7 عروض',
    body: 'المول، الطيف الكتلي، تركيب المادة، المخاليط، التوزيع الإلكتروني، PES والاتجاهات الدورية.',
    href: '/content-studio',
  },
  {
    color: 'red',
    label: 'INTERACTIVE CHEMISTRY',
    title: 'Molar Mass Presentations',
    meta: '3 نماذج',
    body: 'ثلاثة تصاميم لشرح الكتلة المولية قابلة للتحويل إلى درس تفاعلي ومساحة تدريب.',
    href: '/lesson',
  },
  {
    color: '',
    label: 'ASSESSMENT BANK',
    title: 'Physics & Biology Practice',
    meta: 'قيد مراجعة الحقوق',
    body: 'عينات واختبارات تدريبية منظمة حسب المنهاج والمهارة؛ لا تنشر حتى يكتمل التحقق من الحقوق.',
    href: '/assessment',
  },
];

export default function LibraryPage(){
  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="library"/>
      <main className="os-page-content">
        <section className="library-hero">
          <div>
            <span className="academy-tag">SUCCESS 4 SURE CONTENT ENGINE</span>
            <h1>مكتبة تتحول إلى تعلم تفاعلي</h1>
            <p>لا نرفع الكتب كما هي. نقسم المحتوى إلى مفاهيم ومهارات ودروس وأسئلة وأدلة إتقان، ثم نربطه بخطة الطالب والمعلم الذكي.</p>
          </div>
          <div className="library-count">
            <div><b>{materials.length + S4S_BOOKS.length}+</b><small>أصل تعليمي قيد التنظيم</small></div>
          </div>
        </section>

        <div className="material-grid">
          {materials.map((m)=>(
            <Material key={m.title} {...m}/>
          ))}
        </div>

        <section className="library-s4s-band">
          <header>
            <small>FROM SUCCESS4SUREACADEMY.COM</small>
            <h2>كتب ودورات جاهزة للتصفح</h2>
          </header>
          <div className="library-s4s-grid">
            {S4S_BOOKS.map((b)=>(
              <article key={b.id}>
                <small>{b.track}</small>
                <h3>{b.titleAr}</h3>
                <p>{b.title}</p>
                <a href={b.href}>فتح في مكتبتي ←</a>
              </article>
            ))}
            {S4S_COURSES.map((c)=>(
              <article key={c.id}>
                <small>{c.kindAr} • {c.subject}</small>
                <h3>{c.titleAr}</h3>
                <p>{c.title}</p>
                <a href={c.href}>ابدأ الرحلة ←</a>
              </article>
            ))}
          </div>
        </section>

        <div className="rights-note">
          <b>سياسة الحقوق:</b> كتب Pearson وPrinceton وTutorPacks وBarron’s والاختبارات الرسمية تستخدم كمرجع داخلي فقط ولا تنشر أو تعاد تعبئتها داخل SUCCESS OS بدون ترخيص. المحتوى الذي يحمل اسم معلم آخر يحتاج موافقة موثقة قبل إدخاله.
        </div>
        <div className="full-idea-banner">
          <div>
            <h3>أول نموذج إنتاجي: وحدة كيمياء كاملة</h3>
            <p>نحوّل محتوى الروابط أو الكتلة المولية إلى تشخيص، درس تفاعلي، تدريب، معلم ذكي، اختبار وإثبات إتقان.</p>
          </div>
          <a href="/lesson">شاهد نموذج الدرس</a>
        </div>
        <div className="full-idea-banner" style={{ marginTop: 16 }}>
          <div>
            <h3>Global Digital Library</h3>
            <p>
              مكتبة منهجية عالمية تفاعلية — IB Physics Photoelectric Effect مع معرفة عميقة،
              مجسّم ثلاثي الأبعاد، مساحة رسم، آلة حاسبة، أمثلة واختبار فوري.
            </p>
          </div>
          <a href="/digital-library">افتح المكتبة العالمية</a>
        </div>
      </main>
    </div>
  );
}

function Material({color,label,title,meta,body,href}){
  return (
    <article className="os-card material-card">
      <div className={`material-cover ${color}`}>
        <small>{label}</small>
        <h3>{title}</h3>
      </div>
      <div className="material-body">
        <div className="material-meta">
          <span>مملوك / قيد التحقق</span>
          <b>{meta}</b>
        </div>
        <p>{body}</p>
        <a href={href}>فتح المحتوى ←</a>
      </div>
    </article>
  );
}

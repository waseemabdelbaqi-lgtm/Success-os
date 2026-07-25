'use client';
import {useEffect,useState} from 'react';

export function Brand() {
  return <a className="os-brand brand-image" href="/" aria-label="SUCCESS 4 SURE"><span className="success-wordmark"><i>⌁</i><b>SUCCESS</b><small>4SURE</small></span></a>;
}

const links = [
  ['/student-portal','⌂','الرئيسية'], ['/student-journey','◎','ابدأ طلباً'], ['/programs','▦','تعلمي'], ['/subject-catalog','▤','المواد'],
  ['/teachers','♙','المعلمون'], ['/school-finder','⌂','المدارس'], ['/admissions','🎓','الجامعات والقبول'], ['/scholarships','◇','المنح'],
  ['/exam-calendar','◫','الاختبارات'], ['/student-requests','✓','طلباتي'], ['/notifications','🔔','الإشعارات'], ['/profile','◉','حسابي']
];

export function Sidebar({ active='dashboard', open=false, onNavigate }) {
  return <aside className={`os-sidebar phase11-private-side${open?' is-open':''}`}><Brand/><div className="os-side-label">مساحتي التعليمية</div><nav className="os-nav">{links.map(([href,icon,label])=><a key={label} href={href} className={href.includes(active)?'active':''} onClick={onNavigate}><span>{icon}</span>{label}</a>)}</nav><div className="os-side-label">الحساب</div><nav className="os-nav"><a href="/notifications" onClick={onNavigate}><span>◎</span>الإشعارات</a><a href="/profile" onClick={onNavigate}><span>⚙</span>إعدادات الحساب</a><a href="/settings" onClick={onNavigate}><span>◌</span>إعدادات المنصة</a></nav><div className="os-support"><strong>تحتاج مساعدة؟</strong><p>فريق Success 4 Sure جاهز لمساعدتك في التعلم أو الحجز.</p><a href="/contact">تواصل معنا ←</a></div></aside>;
}

/** Shared private-shell wrapper — Phase 11 styling, unchanged structure. */
export function PrivateShell({ active='dashboard', children }) {
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{
    document.body.classList.toggle('os-nav-open', menuOpen);
    return ()=>document.body.classList.remove('os-nav-open');
  },[menuOpen]);
  return <div className={`os-shell phase11-private-shell${menuOpen?' sidebar-open':''}`}><Sidebar active={active} open={menuOpen} onNavigate={()=>setMenuOpen(false)}/>{menuOpen&&<button type="button" className="os-sidebar-backdrop" aria-label="إغلاق القائمة" onClick={()=>setMenuOpen(false)}/>}<main className="os-main"><Topbar menuOpen={menuOpen} onMenuToggle={()=>setMenuOpen(o=>!o)}/>{children}</main></div>;
}

/** Shared legacy-page marker class for Phase 11 adapters. */
export function LegacyPage({ active, children }) {
  return <div className="os-page phase11-legacy-page"><InnerNav active={active}/>{children}</div>;
}

export function Topbar({ menuOpen=false, onMenuToggle }) {
  const [query,setQuery]=useState('');
  const [theme,setTheme]=useState('light');
  useEffect(()=>{
    try{
      const saved=localStorage.getItem('success-os-theme')||'light';
      setTheme(saved);
      document.documentElement.dataset.osTheme=saved;
    }catch{}
  },[]);
  function toggleTheme(){
    const next=theme==='light'?'dark':'light';
    setTheme(next);
    try{localStorage.setItem('success-os-theme',next)}catch{}
    document.documentElement.dataset.osTheme=next;
  }
  function toggleMenu(){
    if(onMenuToggle){onMenuToggle();return}
    const shell=document.querySelector('.os-shell');
    shell?.classList.toggle('sidebar-open');
    document.body.classList.toggle('os-nav-open');
  }
  function search(e){
    e.preventDefault();
    const q=query.trim();
    location.href=q?`/subject-catalog?q=${encodeURIComponent(q)}`:'/teachers?query='+encodeURIComponent(q);
  }
  return <header className="os-topbar">
    <button type="button" className="os-icon-button os-mobile-menu" aria-label={menuOpen?'إغلاق القائمة':'فتح القائمة'} aria-expanded={menuOpen} onClick={toggleMenu}>☰</button>
    <form className="os-search" onSubmit={search}>
      <span>⌕</span>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن درس أو مهارة أو معلم..." aria-label="بحث"/>
    </form>
    <div className="os-top-actions">
      <button type="button" className="os-icon-button" aria-label="تبديل المظهر" onClick={toggleTheme}>{theme==='dark'?'☀':'◌'}</button>
      <a className="os-icon-button" href="/notifications" aria-label="الإشعارات">🔔</a>
      <a className="os-user" href="/profile" aria-label="حسابي">
        <span className="os-user-avatar">WA</span>
        <div><strong>وسيم</strong><small>طالب • برامج دولية</small></div>
      </a>
    </div>
    <PageGuide/>
  </header>;
}

export function InnerNav({active}) {
  const groups={
    access:[['/access','البوابات'],['/control-hubs','لوحات التحكم'],['/partner-search','البحث'],['/join-us','انضم إلينا']],
    join:[['/join-us','طلب الشراكة'],['/control-hubs','لوحات التحكم'],['/partner-search','ابحث عن شريك'],['/notifications','الإشعارات']],
    admissions:[['/admissions','البحث والقبول'],['/degree-finder','دليل الدرجات'],['/global-sources','البوابات'],['/control-hubs','لوحات التحكم'],['/scholarships','المنح'],['/application-tracker','متابعة التقديم']],
    degrees:[['/degree-finder','دليل الدرجات'],['/admissions','شروط القبول'],['/university-compare','المقارنة'],['/global-sources','البوابات']],
    jobs:[['/jobs','الوظائف'],['/jobseeker-portal','ملفي المهني'],['/application-tracker','طلباتي']],
    subjects:[['/subject-catalog','المواد المدرسية'],['/curriculum-lab','المناهج'],['/study-content-generator','إنشاء محتوى']],
    'university-subjects':[['/university-subjects','المواد الجامعية'],['/study-content-generator','إنشاء محتوى']],
    studio:[['/content-studio','الاستوديو'],['/video-intelligence','الفيديو'],['/security-center','الحماية']],
    calendar:[['/exam-calendar','رزنامة الاختبارات'],['/notifications','تنبيهاتي']],
    world:[['/world','الدول والأنظمة'],['/global-knowledge-system','نظام المعرفة'],['/global-sources','المصادر الرسمية']],
    security:[['/security-center','الحماية'],['/source-registry','سجل المصادر'],['/trust','الثقة']],
    profile:[['/profile','حسابي'],['/settings','الإعدادات'],['/notifications','الإشعارات']],
    teachers:[['/teachers','المعلمون'],['/class-booking','الحجز'],['/teacher-portal','بوابة المعلم'],['/join-us?role=teacher','انضم كمعلم']],
    library:[['/library','المكتبة'],['/books','الكتب'],['/student/books','مكتبتي'],['/lesson','نموذج درس']],
    tutor:[['/tutor','المعلم الذكي'],['/lesson','الدرس'],['/diagnostic','التشخيص'],['/assessment','الإتقان']],
    parent:[['/parent','ولي الأمر'],['/notifications','التنبيهات'],['/class-booking','الحجز'],['/passport','الجواز']],
    passport:[['/passport','الجواز'],['/assessment','الإتقان'],['/diagnostic','التشخيص'],['/dashboard','لوحتي']],
    notifications:[['/notifications','التنبيهات'],['/student-requests','طلباتي'],['/profile','حسابي']],
    programs:[['/programs','البرامج'],['/courses','الدورات'],['/books','الكتب'],['/marketplace','السوق']],
    curriculum:[['/curriculum-lab','المناهج'],['/subject-catalog','المواد'],['/global-sources','المصادر']],
    sources:[['/global-sources','المصادر الرسمية'],['/source-registry','سجل المصادر'],['/trust','الثقة']],
    rankings:[['/rankings','التصنيفات'],['/admissions','القبول'],['/degree-finder','الدرجات']],
    ecosystem:[['/ecosystem','النظام'],['/marketplace','السوق'],['/join-us','الشراكة']],
    'teacher-portal':[['/teacher-portal','بوابة المعلم'],['/content-studio','الاستوديو'],['/class-booking','الجلسات'],['/notifications','الرسائل']]
  };
  const items=groups[active]||[['/start-journey','ابدأ طلبك'],['/notifications','الإشعارات']];
  const studentScopes=['admissions','degrees','subjects','university-subjects','calendar','world','teachers','library','tutor','parent','passport','programs','notifications','curriculum','rankings'];
  const destination=active==='jobs'?['/jobseeker-portal','بوابة الباحث عن عمل']:active==='studio'||active==='security'||active==='teacher-portal'?['/control-center','لوحة العمل']:active==='join'?['/join-us','بوابة الشراكة']:studentScopes.includes(active)?['/student-portal','بوابة الطالب']:['/start-journey','ابدأ الرحلة'];
  return <nav className="os-inner-nav"><Brand/><div className="os-inner-nav-links"><a href="/">الرئيسية</a>{items.map(([href,label],i)=><a className={i===0?'active':''} href={href} key={`${href}-${label}`}>{label}</a>)}</div><a className="os-primary" href={destination[0]}>{destination[1]}</a><PageGuide/></nav>;
}

export function PageGuide(){const [open,setOpen]=useState(false),[step,setStep]=useState(0);const scenes=[['01','اعرف مكانك','تعرّف على الهدف الرئيسي لهذه الصفحة قبل إدخال البيانات.'],['02','استخدم الفلاتر','ابدأ بالدولة ثم المدينة، وبعدها التخصص وطريقة الخدمة.'],['03','راجع ثم تابع','تحقق من الحالة والاعتماد، ثم افتح الملف أو أرسل الطلب.']];return <><button className="page-guide-launch" onClick={()=>setOpen(true)} aria-label="فتح دليل الصفحة"><span>▶</span><b>دليل الصفحة</b></button>{open&&<div className="page-guide-overlay" onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><section><button onClick={()=>setOpen(false)}>×</button><div className="future-guide-stage"><img src="/media/success-future-gateways.webp" alt="رحلة مستقبلية داخل SUCCESS OS"/><i></i><span>{scenes[step][0]}</span></div><small>FUTURE WALKTHROUGH</small><h2>{scenes[step][1]}</h2><p>{scenes[step][2]}</p><footer>{scenes.map((x,i)=><button className={i===step?'active':''} onClick={()=>setStep(i)} key={x[0]}>{x[0]}</button>)}<a href="/start-journey">ابدأ الرحلة</a></footer></section></div>}</>}

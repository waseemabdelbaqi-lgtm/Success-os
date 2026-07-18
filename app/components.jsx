'use client';
import {useState} from 'react';

export function Brand() {
  return <a className="os-brand brand-image" href="/" aria-label="SUCCESS 4 SURE"><span className="success-wordmark"><i>⌁</i><b>SUCCESS</b><small>4SURE</small></span></a>;
}

const links = [
  ['/student-portal','⌂','الرئيسية'], ['/student-journey','◎','ابدأ طلباً'], ['/programs','▦','تعلمي'], ['/subject-catalog','▤','المواد'],
  ['/teachers','♙','المعلمون'], ['/school-finder','⌂','المدارس'], ['/admissions','🎓','الجامعات والقبول'], ['/scholarships','◇','المنح'],
  ['/exam-calendar','◫','الاختبارات'], ['/student-requests','✓','طلباتي'], ['/notifications','🔔','الإشعارات'], ['/profile','◉','حسابي']
];

export function Sidebar({ active='dashboard' }) {
  return <aside className="os-sidebar phase11-private-side"><Brand/><div className="os-side-label">مساحتي التعليمية</div><nav className="os-nav">{links.map(([href,icon,label])=><a key={label} href={href} className={href.includes(active)?'active':''}><span>{icon}</span>{label}</a>)}</nav><div className="os-side-label">الحساب</div><nav className="os-nav"><a href="/notifications"><span>◎</span>الإشعارات</a><a href="/profile"><span>⚙</span>إعدادات الحساب</a></nav><div className="os-support"><strong>تحتاج مساعدة؟</strong><p>فريق Success 4 Sure جاهز لمساعدتك في التعلم أو الحجز.</p><a href="mailto:info@success4sureacademy.com">تواصل معنا ←</a></div></aside>;
}

/** Shared private-shell wrapper — Phase 11 styling, unchanged structure. */
export function PrivateShell({ active='dashboard', children }) {
  return <div className="os-shell phase11-private-shell"><Sidebar active={active}/><main className="os-main"><Topbar/>{children}</main></div>;
}

/** Shared legacy-page marker class for Phase 11 adapters. */
export function LegacyPage({ active, children }) {
  return <div className="os-page phase11-legacy-page"><InnerNav active={active}/>{children}</div>;
}

export function Topbar() {
  return <header className="os-topbar"><button className="os-icon-button os-mobile-menu">☰</button><label className="os-search"><span>⌕</span><input placeholder="ابحث عن درس أو مهارة أو معلم..."/></label><div className="os-top-actions"><button className="os-icon-button">◌</button><a className="os-icon-button" href="/notifications" aria-label="الإشعارات">🔔</a><div className="os-user"><span className="os-user-avatar">WA</span><div><strong>وسيم</strong><small>طالب • برامج دولية</small></div></div></div><PageGuide/></header>;
}

export function InnerNav({active}) {
  const groups={
    access:[['/access','البوابات'],['/partner-search','البحث'],['/join-us','انضم إلينا']],
    join:[['/join-us','طلب الشراكة'],['/partner-search','ابحث عن شريك'],['/notifications','الإشعارات']],
    admissions:[['/admissions','البحث والقبول'],['/degree-finder','دليل الدرجات'],['/scholarships','المنح'],['/application-tracker','متابعة التقديم']],
    degrees:[['/degree-finder','دليل الدرجات'],['/admissions','شروط القبول'],['/university-compare','المقارنة']],
    jobs:[['/jobs','الوظائف'],['/jobseeker-portal','ملفي المهني'],['/application-tracker','طلباتي']],
    subjects:[['/subject-catalog','المواد المدرسية'],['/curriculum-lab','المناهج'],['/study-content-generator','إنشاء محتوى']],
    'university-subjects':[['/university-subjects','المواد الجامعية'],['/study-content-generator','إنشاء محتوى']],
    studio:[['/content-studio','الاستوديو'],['/video-intelligence','الفيديو'],['/security-center','الحماية']],
    calendar:[['/exam-calendar','رزنامة الاختبارات'],['/notifications','تنبيهاتي']],
    world:[['/world','الدول والأنظمة'],['/global-knowledge-system','نظام المعرفة'],['/global-sources','المصادر الرسمية']],
    security:[['/security-center','الحماية'],['/source-registry','سجل المصادر'],['/trust','الثقة']],
    profile:[['/profile','حسابي'],['/notifications','الإشعارات']],
    teachers:[['/teachers','المعلمون'],['/class-booking','الحجز'],['/join-us?role=teacher','انضم كمعلم']]
  };
  const items=groups[active]||[['/start-journey','ابدأ طلبك'],['/notifications','الإشعارات']];
  const studentScopes=['admissions','degrees','subjects','university-subjects','calendar','world','teachers'];
  const destination=active==='jobs'?['/jobseeker-portal','بوابة الباحث عن عمل']:active==='studio'||active==='security'?['/control-center','لوحة العمل']:active==='join'?['/join-us','بوابة الشراكة']:studentScopes.includes(active)?['/student-portal','بوابة الطالب']:['/start-journey','ابدأ الرحلة'];
  return <nav className="os-inner-nav"><Brand/><div className="os-inner-nav-links"><a href="/">الرئيسية</a>{items.map(([href,label],i)=><a className={i===0?'active':''} href={href} key={`${href}-${label}`}>{label}</a>)}</div><a className="os-primary" href={destination[0]}>{destination[1]}</a><PageGuide/></nav>;
}

export function PageGuide(){const [open,setOpen]=useState(false),[step,setStep]=useState(0);const scenes=[['01','اعرف مكانك','تعرّف على الهدف الرئيسي لهذه الصفحة قبل إدخال البيانات.'],['02','استخدم الفلاتر','ابدأ بالدولة ثم المدينة، وبعدها التخصص وطريقة الخدمة.'],['03','راجع ثم تابع','تحقق من الحالة والاعتماد، ثم افتح الملف أو أرسل الطلب.']];return <><button className="page-guide-launch" onClick={()=>setOpen(true)} aria-label="فتح دليل الصفحة"><span>▶</span><b>دليل الصفحة</b></button>{open&&<div className="page-guide-overlay" onMouseDown={e=>e.target===e.currentTarget&&setOpen(false)}><section><button onClick={()=>setOpen(false)}>×</button><div className="future-guide-stage"><img src="/media/success-future-gateways.webp" alt="رحلة مستقبلية داخل SUCCESS OS"/><i></i><span>{scenes[step][0]}</span></div><small>FUTURE WALKTHROUGH</small><h2>{scenes[step][1]}</h2><p>{scenes[step][2]}</p><footer>{scenes.map((x,i)=><button className={i===step?'active':''} onClick={()=>setStep(i)} key={x[0]}>{x[0]}</button>)}<a href="/start-journey">ابدأ الرحلة</a></footer></section></div>}</>}

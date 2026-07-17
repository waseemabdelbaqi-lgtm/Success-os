'use client';
import {useEffect,useState} from 'react';
import {Sidebar,Topbar} from '../components';
const goals=[
 ['learn','▦','أتعلم مادة','اختيار المنهاج والصف والمادة ثم التشخيص والخطة','/study-planner'],
 ['teacher','♙','أبحث عن معلم','مقارنة المعلمين ثم اختيار نوع الحصة والموعد','/teachers'],
 ['live','◉','أحجز حصة مباشرة','أونلاين أو وجاهي، خاصة أو مجموعة','/class-booking'],
 ['recorded','▶','أطلب حصة مسجلة','البحث في المكتبة أو إنشاء طلب إنتاج محمي','/recorded-class-request'],
 ['school','⌂','أبحث عن مدرسة','الدولة والمدينة والنظام والصف والرسوم','/school-finder'],
 ['university','🎓','أبحث عن جامعة أو كلية','مطابقة الجنسية والشهادة والاعتراف','/admissions'],
 ['scholarship','◇','أبحث عن منحة','المرحلة والدولة والتمويل والأهلية','/scholarships'],
 ['exam','◷','أستعد لاختبار','التقويم وخطة المراجعة والتنبيهات','/exam-calendar'],
 ['visa','◎','أحتاج مسار تأشيرة','وثائق الدراسة والتمويل والمواعيد','/visa-advisor'],
 ['requests','✓','أتابع طلباتي','الحصص والمحتوى والقبول والمنح','/student-requests']
];
export default function StudentJourney(){const [selected,setSelected]=useState('');useEffect(()=>setSelected(new URLSearchParams(location.search).get('goal')||''),[]);const current=goals.find(x=>x[0]===selected);return <div className="os-shell"><Sidebar active="student-portal"/><main className="os-main"><Topbar/><div className="os-content student-flow-page"><header className="student-flow-hero"><small>AI STUDENT ROUTER</small><h1>ماذا تريد أن تنجز اليوم؟</h1><p>اختر هدفاً واحداً، وسنفتح لك الخطوة التالية ونحفظها داخل رحلة الطالب.</p></header><section className="student-flow-grid">{goals.map(([id,icon,title,text])=><button className={selected===id?'active':''} onClick={()=>setSelected(id)} key={id}><span>{icon}</span><div><b>{title}</b><p>{text}</p></div><i>←</i></button>)}</section>{current&&<section className="student-next-step"><div><small>الخطوة التالية</small><h2>{current[2]}</h2><p>{current[3]}</p></div><a href={current[4]}>تابع الرحلة ←</a></section>}</div></main></div>}

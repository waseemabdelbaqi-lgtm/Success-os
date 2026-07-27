'use client';
import {useState} from 'react';
import {InnerNav} from '../components';

export default function JobseekerPortal(){
  const [scope,setScope]=useState('داخل الدولة');
  return <div className="os-page phase11-legacy-page"><InnerNav active="jobs"/><main className="os-page-content jobseeker-only-page">
    <header><div><small>CAREER-ONLY EXPERIENCE</small><h1>بوابة الباحث عن عمل</h1><p>مساحة مهنية مستقلة للسيرة والمهارات والوظائف والتقديم والمقابلات. لا تعرض بيانات الدراسة أو القبول للجهات الموظفة دون موافقة صريحة.</p><div><a href="/jobs/dashboard">غرفة القيادة ←</a><a href="/access?portal=jobseeker">ابنِ ملفك المهني</a><a href="/jobs">استكشف الوظائف</a></div></div><aside><span>◇</span><b>مساعد المسار المهني</b><p>يطابق مهاراتك بالوظائف ويقترح التحسينات دون مشاركة بياناتك تلقائيًا.</p></aside></header>
    <section className="career-scope"><b>أين تبحث عن وظيفة؟</b><button className={scope==='داخل الدولة'?'active':''} onClick={()=>setScope('داخل الدولة')}>داخل الدولة</button><button className={scope==='خارج الدولة'?'active':''} onClick={()=>setScope('خارج الدولة')}>خارج الدولة</button><span>النطاق الحالي: {scope}</span></section>
    <section className="career-steps">{[['01','ملف مهني','سيرة، مهارات، خبرة وتفضيلات'],['02','مطابقة الوظائف','حسب الدولة والمجال والشروط'],['03','التقديم','طلبات منفصلة مع حالة واضحة'],['04','المقابلات','مواعيد وتنبيهات وتحضير ذكي']].map(([n,t,p])=><article key={n}><b>{n}</b><h2>{t}</h2><p>{p}</p></article>)}</section>
    <section className="career-separation"><div><small>PRIVACY BOUNDARY</small><h2>فصل كامل عن بوابة الطالب</h2><p>السجل الأكاديمي التفصيلي وخطة التعلم والحصص تبقى داخل بوابة الطالب. لا يصل صاحب العمل إلا إلى المهارات أو المؤهلات التي يختار الباحث مشاركتها.</p></div><a href="/profile?role=jobseeker">فتح صفحتي المهنية</a></section>
    <section className="career-quick-links">
      <a href="/jobs/dashboard">غرفة قيادة الباحث</a>
      <a href="/jobs">تصفح الوظائف</a>
      <a href="/jobs?view=companies">شركات التوظيف</a>
      <a href="/application-tracker">متابعة طلباتي</a>
      <a href="/passport">الجواز التعليمي</a>
      <a href="/access?portal=jobseeker&intent=join">تحديث الملف المهني</a>
    </section>
  </main></div>
}

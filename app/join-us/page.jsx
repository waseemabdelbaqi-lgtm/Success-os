'use client';
import {useEffect,useState} from 'react';
import {InnerNav} from '../components';

const roles=[
  ['teacher','♙','المعلمون','قدّم الحصص المباشرة والمسجلة، وحدد المناهج والأسعار والتوفر.','/access?portal=teacher&intent=join'],
  ['center','▦','المراكز التعليمية','أضف الدورات والمعلمين والشهادات واربط برامج المركز بالطلاب.','/access?portal=center&intent=join'],
  ['school','⌂','المدارس','اعرض النظام والصفوف والرسوم واستقبل طلبات الالتحاق المؤهلة.','/access?portal=school&intent=join'],
  ['university','🎓','الجامعات','انشر البرامج وشروط القبول والاعتراف ومسارات التقديم.','/access?portal=university&intent=join&type=university'],
  ['college','◫','الكليات','أضف الدرجات والدبلومات وأنماط الدراسة ومتطلبات الطالب الدولي.','/access?portal=university&intent=join&type=college'],
  ['employer','↗','شركات التوظيف','انشر الوظائف وتواصل مع المرشحين بعد موافقتهم الصريحة.','/access?portal=employer&intent=join']
];

export default function JoinUsPage(){
 const [role,setRole]=useState('');
 useEffect(()=>{const r=new URLSearchParams(window.location.search).get('role');if(roles.some(x=>x[0]===r))setRole(r)},[]);
 return <div className="os-page phase11-legacy-page"><InnerNav active="join"/><main className="os-page-content join-us-page">
  <header className="join-us-hero"><div><small>SUCCESS OS PARTNERSHIP GATEWAY</small><h1>انضم إلينا كشريك في رحلة الإنسان</h1><p>بوابة واحدة للمعلمين والمراكز والمدارس والجامعات والكليات وشركات التوظيف. اختر صفتك، أرسل بيانات التحقق، ثم افتح لوحة تحكم تناسب عملك.</p><div><a href="#roles">اختر نوع الشراكة ↓</a><a href="/partner-search">أبحث عن شريك</a></div></div><aside><span>✦</span><b>شراكة موثّقة</b><p>هوية وصلاحيات وعقود ومحتوى وتواصل في مسار واضح قابل للمراجعة.</p></aside></header>
  <section className="join-us-steps"><article><b>01</b><div><h2>اختر الصفة</h2><p>معلم، مركز، مدرسة، جامعة، كلية أو شركة توظيف.</p></div></article><article><b>02</b><div><h2>أرسل التحقق</h2><p>الهوية والترخيص والتخصص وبيانات التواصل الرسمية.</p></div></article><article><b>03</b><div><h2>راجع الشراكة</h2><p>تدقيق بشري للصلاحيات والمحتوى والخدمات والأسعار.</p></div></article><article><b>04</b><div><h2>ابدأ العمل</h2><p>لوحة خاصة وإشعارات وطلبات ومؤشرات أداء حسب الدور.</p></div></article></section>
  <section className="join-role-section" id="roles"><header><small>CHOOSE YOUR PARTNERSHIP</small><h2>بأي صفة ترغب في الانضمام؟</h2><p>يمكنك الاطلاع على التفاصيل أولاً، ولن تُنشر بياناتك قبل اكتمال التحقق والموافقة.</p></header><div>{roles.map(([id,icon,title,text,href])=><article className={role===id?'selected':''} key={id}><span>{icon}</span><small>{id.toUpperCase()} PARTNER</small><h3>{title}</h3><p>{text}</p><div><a href={`/partner-search?portal=${id}`}>ابحث في {title}</a><a href={href}>انضم كـ {title}</a></div></article>)}</div></section>
  <section className="partner-trust-band"><span>⬡</span><div><small>SUCCESS PARTNER STANDARD</small><h2>الثقة قبل الظهور في نتائج البحث</h2><p>تظهر حالة التحقق بوضوح، وتبقى بيانات الطلاب والباحثين عن عمل منفصلة ولا تُشارك إلا بموافقتهم.</p></div><a href="/security-center">معايير الحماية ←</a></section>
 </main></div>
}

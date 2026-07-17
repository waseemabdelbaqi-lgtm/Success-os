'use client';
import {useEffect,useState} from 'react';
import {Sidebar,Topbar} from '../components';

export default function StudentPortal(){
 const [purchases,setPurchases]=useState([]),[wallet,setWallet]=useState({balance:0,history:[]});
 useEffect(()=>{try{setPurchases(JSON.parse(localStorage.getItem('success-os-purchases')||'[]'));setWallet(JSON.parse(localStorage.getItem('success-os-points')||'{"balance":0,"history":[]}'))}catch{}},[]);
 function redeem(){if(wallet.balance<30)return;sessionStorage.setItem('success-os-reward','three-month-subject');location.href='/start-journey?portal=student'}
 return <div className="os-shell"><Sidebar active="student-portal"/><main className="os-main"><Topbar/><div className="os-content student-dashboard-simple">
  <header className="student-simple-hero"><div><small>لوحة الطالب</small><h1>مرحبًا، واصل من حيث توقفت</h1><p>موادك وتقدمك وأدواتك الأساسية في مكان واحد.</p></div><a href="/start-journey?portal=student">+ شراء مادة جديدة</a></header>
  <section className="student-overview"><article><small>المواد المفعلة</small><b>{purchases.filter(x=>x.service==='حصص مسجلة'||x.kind==='assistant').length}</b><span>مادة</span></article><article><small>نقاط SUCCESS</small><b>{wallet.balance}</b><span>كل 30 نقطة = مادة 3 أشهر</span></article><article><small>متابعة التعلم</small><b>{purchases.length?'ابدأ':'—'}</b><span>{purchases.length?'افتح أحدث مادة':'اشترِ مادة لتبدأ'}</span></article></section>
  <section className="student-active-materials"><header><div><small>موادي</small><h2>المواد والحصص المفعلة</h2></div></header>{purchases.length?<div>{purchases.map(x=><article key={x.id}><span>{x.kind==='assistant'?'✦':'▶'}</span><div><small>{x.kind==='assistant'?'المعلم المساعد':x.item}</small><h3>{x.subject||x.item}</h3><p>{x.duration} • {x.status}</p></div><a href={(x.service==='حصص مسجلة'||x.kind==='assistant')?`/student/material?id=${encodeURIComponent(x.id)}`:'/class-booking'}>{(x.service==='حصص مسجلة'||x.kind==='assistant')?'فتح المادة':'عرض الحجز'}</a></article>)}</div>:<div className="student-empty-materials"><h3>لا توجد مادة مفعلة بعد</h3><p>ابدأ رحلة الشراء واختر النظام والصف والمادة.</p><a href="/start-journey?portal=student">ابدأ الآن</a></div>}</section>
  <section className="student-simple-actions"><a href="/start-journey?portal=student"><span>＋</span><b>مادة جديدة</b><small>اختر الصف والمادة لتظهر مواردها</small></a><a href="/class-booking"><span>◷</span><b>حصصي المباشرة</b><small>المواعيد والحجوزات</small></a><a href="/notifications"><span>🔔</span><b>الإشعارات</b><small>تحديثات المواد والحصص</small></a><button disabled={wallet.balance<30} onClick={redeem}><span>★</span><b>تفعيل بالنقاط</b><small>{wallet.balance>=30?'اختر مادة 3 أشهر':`تحتاج ${30-wallet.balance} نقطة`}</small></button></section>
  <aside className="student-simple-bot"><span>✦</span><div><b>مساعد الطالب</b><p>اختر مادة أولًا، ثم سأساعدك في الدرس التالي أو الاختبار أو الملخص.</p></div>{purchases[0]?<a href={`/student/material?id=${encodeURIComponent(purchases[0].id)}`}>افتح أحدث مادة</a>:<a href="/start-journey?portal=student">ابدأ الرحلة</a>}</aside>
 </div></main></div>
}

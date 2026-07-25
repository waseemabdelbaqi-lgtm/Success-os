'use client';
import { useEffect, useState } from 'react';
import { InnerNav } from '../components';

const PERMISSIONS = [
  'تقارير التقدم الأسبوعية',
  'حجز المعلمين والمدفوعات',
  'مشاركة الشهادات الموثقة',
  'تنبيهات السلامة المهمة',
];

export default function ParentPage(){
  const [flags,setFlags]=useState(()=>Object.fromEntries(PERMISSIONS.map(x=>[x,true])));

  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem('success-os-parent-permissions')||'null');
      if(saved)setFlags(prev=>({...prev,...saved}));
    }catch{}
  },[]);

  function toggle(key){
    setFlags(prev=>{
      const next={...prev,[key]:!prev[key]};
      try{localStorage.setItem('success-os-parent-permissions',JSON.stringify(next))}catch{}
      return next;
    });
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav/>
      <main className="os-page-content">
        <div className="os-page-head">
          <span className="tag">PARENT EXPERIENCE</span>
          <h1>رؤية مفيدة لولي الأمر، بحدود تحترم عمر الطالب</h1>
          <p>تقدم، حضور، أهداف وتنبيهات سلامة مناسبة—بدون مراقبة زائدة أو كشف محادثات الطالب الخاصة.</p>
        </div>
        <div className="parent-grid">
          <section className="os-card parent-summary">
            <header>
              <div className="os-user-avatar">SA</div>
              <div><small>هذا الأسبوع</small><h2>سارة تسير بثبات</h2></div>
              <b>+8%</b>
            </header>
            <div className="parent-metrics">
              <Metric n="4" t="جلسات تعلم"/>
              <Metric n="92%" t="الحضور"/>
              <Metric n="2" t="مهارات أتقنت"/>
              <Metric n="6" t="أيام متتالية"/>
            </div>
            <div className="parent-insight">
              <span>✦</span>
              <div>
                <b>ملاحظة قابلة للتنفيذ</b>
                <p>سارة تفهم قانون أوم، لكنها تحتاج تدريبًا إضافيًا على قراءة منحنيات I–V قبل اختبار الجمعة.</p>
              </div>
            </div>
            <div className="parent-cta-row">
              <a href="/class-booking">حجز حصة دعم</a>
              <a href="/notifications">فتح التنبيهات</a>
              <a href="/passport">الجواز التعليمي</a>
            </div>
          </section>
          <aside className="os-card parent-controls">
            <h2>الصلاحيات والموافقة</h2>
            {PERMISSIONS.map(x=>(
              <label key={x}>
                <span>{x}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!flags[x]}
                  className={flags[x]?'on':''}
                  onClick={()=>toggle(x)}
                >
                  <i></i>
                </button>
              </label>
            ))}
            <p>محادثات الطالب التعليمية لا تظهر كاملة لولي الأمر. تعرض المنصة مؤشرات مناسبة للعمر فقط.</p>
            <a href="/settings">إدارة إعدادات الحساب ←</a>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Metric({n,t}){return <div><b>{n}</b><span>{t}</span></div>}

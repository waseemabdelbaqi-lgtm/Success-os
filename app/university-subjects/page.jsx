'use client';
import {useMemo,useState} from 'react';
import {InnerNav} from '../components';
import {universityFields} from '../data/education-data';

export default function UniversitySubjects(){
  const [degree,setDegree]=useState('الكل'),[query,setQuery]=useState(''),[selected,setSelected]=useState(null);
  const rows=useMemo(()=>universityFields.filter(f=>(degree==='الكل'||f.degrees.includes(degree))&&(!query||`${f.name} ${f.subjects.join(' ')}`.includes(query))),[degree,query]);
  return <div className="os-page"><InnerNav active="university-subjects"/><main className="os-page-content university-subjects-page">
    <header className="university-subjects-hero"><div><span>UNIVERSITY LEARNING ATLAS</span><h1>المواد الجامعية والكليات</h1><p>اختر الدرجة والتخصص، ثم افتح مسار المادة داخل بوابة الطالب. إذا لم يوجد معلم، يبدأ طلب إنتاج تعليمي بالذكاء الاصطناعي ويُراجع بشريًا قبل النشر.</p></div><div className="uni-orbit"><i>⚛</i><b>9</b><small>عائلات أكاديمية</small></div></header>
    <section className="university-filter"><label>الدرجة<select value={degree} onChange={e=>setDegree(e.target.value)}>{['الكل','دبلوم','بكالوريوس','دكتور مهني','MBA','ماجستير','دكتوراه'].map(x=><option key={x}>{x}</option>)}</select></label><label>بحث في التخصصات<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="مثال: الذكاء الاصطناعي أو التشريح"/></label><a href="/content-studio">ارفع مادة لبناء مسار</a></section>
    <section className="university-field-grid">{rows.map(f=><article key={f.id}><header><span>{f.icon}</span><div><small>{f.degrees.join(' • ')}</small><h2>{f.name}</h2></div></header><div className="university-subject-chips">{f.subjects.map(s=><button onClick={()=>setSelected({field:f.name,subject:s})} key={s}>{s}</button>)}</div><footer><span>{f.subjects.length} مسارات إطلاق</span><button onClick={()=>setSelected({field:f.name,subject:f.subjects[0]})}>ابدأ من هنا ←</button></footer></article>)}</section>
    <section className="uni-production-callout"><div><small>في حال عدم وجود معلم</small><h2>المادة لا تتوقف؛ تدخل مسار الإنتاج والمراجعة</h2><p>يرفع الطالب أو المعلم أو الأكاديمية المصادر المسموح بها، ثم ينتج النظام خريطة تعلم وملخصًا وسيناريو فيديو وأسئلة، ويعتمدها معلم أو مدير أكاديمي.</p></div><a href="/content-studio">افتح استوديو المحتوى</a></section>
  </main>{selected&&<div className="subject-modal" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div><button onClick={()=>setSelected(null)}>×</button><small>{selected.field}</small><h2>{selected.subject}</h2><p>اختر طريقة البدء داخل SUCCESS OS.</p><a href="/content-studio">ارفع ملفات المادة</a><a href="/profile?role=human">أضفها إلى خطة الطالب</a><a href="/teachers">ابحث عن معلم</a></div></div>}</div>
}

'use client';
import {useEffect,useState} from 'react';
import {InnerNav} from '../components';
import {countryAuthorities,globalInstitutions,qualificationSystems,recognitionFor} from '../data/university-registry';

export default function UniversityProfile(){
  const [id,setId]=useState('uj');const [home,setHome]=useState('الأردن');
  useEffect(()=>{setId(new URLSearchParams(location.search).get('id')||'uj')},[]);
  const u=globalInstitutions.find(x=>x.id===id)||globalInstitutions[0];const rec=recognitionFor(u,home);
  return <div className="os-page"><InnerNav active="admissions"/><main className="os-page-content university-profile-page">
    <header className="university-profile-hero"><div><small>{u.country} • {u.city}</small><h1>{u.name}</h1><p>{u.type} • {u.degree} • {u.modes.join(' / ')}</p><div>{u.fields.map(x=><span key={x}>{x}</span>)}</div></div><aside><b>🎓</b><span>ملف مؤسسة موثق بالمصادر</span></aside></header>
    <section className="profile-recognition-switch"><label>دولة استخدام الدرجة<select value={home} onChange={e=>setHome(e.target.value)}>{Object.keys(countryAuthorities).map(x=><option key={x}>{x}</option>)}</select></label><div className={rec.level}><b>{rec.title}</b><p>{rec.text}</p>{rec.authority&&<a href={rec.authority.url} target="_blank" rel="noreferrer">الجهة المختصة ↗</a>}</div></section>
    <div className="university-profile-layout"><section><header><small>ADMISSION ROUTES</small><h2>مسارات المؤهلات المقبولة للفحص</h2></header><div className="qualification-route-grid">{qualificationSystems.filter(x=>u.systems.includes(x.id)).map(x=><article key={x.id}><b>{x.credential}</b><h3>{x.label}</h3><p>{x.route}</p></article>)}</div></section><aside><small>متطلبات أساسية</small><h2>قبل فتح الطلب</h2><p>✓ {u.entry}</p><p>✓ {u.language}</p>{u.international.map(x=><p key={x}>✓ {x}</p>)}<a href={u.admission} target="_blank" rel="noreferrer">المصدر الرسمي للقبول ↗</a><a href={`/eligibility-check?id=${u.id}`}>ابدأ فحص الأهلية ←</a></aside></div>
    <section className="institution-proof-grid">{[['01','المؤسسة','الاسم القانوني والحرم'],['02','البرنامج','الدرجة والتخصص'],['03','نمط الدراسة',u.modes.join(' / ')],['04','المعادلة',`القرار النهائي في ${home}`]].map(([n,t,p])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{p}</p></article>)}</section>
  </main></div>;
}

'use client';
import {useEffect,useMemo,useState} from 'react';
import {InnerNav} from '../components';
import {countryAuthorities,globalInstitutions,qualificationSystems,recognitionFor,studentCountries} from '../data/university-registry';

const fields=['الكل',...new Set(globalInstitutions.flatMap(x=>x.fields))];
const studyCountries=['الكل',...new Set(globalInstitutions.map(x=>x.country))].sort((a,b)=>a==='الكل'?-1:a.localeCompare(b,'ar'));

function Status({recognition}){return <div className={`admission-recognition ${recognition.level}`}><span>{recognition.level==='verified'?'✓':recognition.level==='review'?'!':'?'}</span><div><b>{recognition.title}</b><p>{recognition.text}</p>{recognition.authority&&<a href={recognition.authority.url} target="_blank" rel="noreferrer">تحقق لدى {recognition.authority.authority} ↗</a>}</div></div>}

export default function AdmissionsPage(){
  const [nationality,setNationality]=useState('الأردن');
  const [qualificationCountry,setQualificationCountry]=useState('الأردن');
  const [system,setSystem]=useState('jordan');
  const [studyCountry,setStudyCountry]=useState('الكل');
  const [city,setCity]=useState('الكل');
  const [field,setField]=useState('الكل');
  const [mode,setMode]=useState('الكل');
  const [degree,setDegree]=useState('بكالوريوس');
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState(null);
  const [saved,setSaved]=useState([]);
  const [globalName,setGlobalName]=useState('');
  const qSystem=qualificationSystems.find(x=>x.id===system)||qualificationSystems.at(-1);
  const cities=useMemo(()=>['الكل',...new Set(globalInstitutions.filter(x=>studyCountry==='الكل'||x.country===studyCountry).map(x=>x.city))],[studyCountry]);
  const results=useMemo(()=>globalInstitutions.filter(x=>(studyCountry==='الكل'||x.country===studyCountry)&&(city==='الكل'||x.city===city)&&(field==='الكل'||x.fields.includes(field))&&(mode==='الكل'||x.modes.includes(mode))&&x.systems.includes(system)&&(!degree||!x.degree||String(x.degree).includes(degree)||degree==='الكل')&&(!query||`${x.name} ${x.country} ${x.city} ${x.fields.join(' ')}`.toLowerCase().includes(query.toLowerCase()))),[studyCountry,city,field,mode,system,degree,query]);
  useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('success-os-university-compare')||'[]'))}catch{}},[]);
  useEffect(()=>{const q=new URLSearchParams(location.search),country=q.get('country'),cityValue=q.get('city'),service=q.get('mode')||'';if(country&&studyCountries.includes(country))setStudyCountry(country);if(cityValue&&globalInstitutions.some(x=>x.city===cityValue))setCity(cityValue);if(service.includes('أونلاين'))setMode('أونلاين');else if(service.includes('داخل')||service.includes('خارج'))setMode('وجاهي')},[]);
  const toggleSave=id=>setSaved(s=>{const next=s.includes(id)?s.filter(x=>x!==id):[...s,id];localStorage.setItem('success-os-university-compare',JSON.stringify(next));return next});
  const chooseStudyCountry=v=>{setStudyCountry(v);setCity('الكل')};

  return <div className="os-page phase11-legacy-page"><InnerNav active="admissions"/><main className="os-page-content admission-match-page">
    <header className="admissions-hero admission-premium-hero"><div><span>GLOBAL ADMISSION & RECOGNITION MATCH</span><h1>قبول جامعي مرتبط بجنسيتك ومؤهلك</h1><p>نطابق دولة الطالب وشهادته ونظامه التعليمي مع متطلبات المؤسسة، ثم نفصل بوضوح بين أهلية القبول وترخيص المؤسسة والاعتراف بالدرجة في دولة الطالب.</p></div><div className="admission-orbit"><b>21K</b><small>مرجع WHED عالمي</small><i>{globalInstitutions.length}</i><em>مؤسسة مفصلة في فهرس الإطلاق</em></div></header>

    <section className="admission-safety"><span>◎</span><div><b>تنبيه الاعتراف حسب دولتك</b><p>هذه النتائج مخصصة لحالتك، لكنها ليست قرار معادلة. كلمة «مؤسسة معترف بها في بلدها» لا تعني أن كل برنامج أو فرع أو دراسة أونلاين معترف بها في {nationality}.</p></div><a href={countryAuthorities[nationality]?.url||'https://www.whed.net/home.php'} target="_blank" rel="noreferrer">الجهة المختصة ↗</a></section>

    <section className="student-admission-profile"><header><div><small>01 — ملف الطالب</small><h2>من أنت وما الشهادة التي تحملها؟</h2></div><b>النتائج تتغير فوراً</b></header><div>
      <label>جنسية الطالب<select value={nationality} onChange={e=>setNationality(e.target.value)}>{studentCountries.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>دولة إصدار الشهادة<select value={qualificationCountry} onChange={e=>setQualificationCountry(e.target.value)}>{studentCountries.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>النظام التعليمي / الشهادة<select value={system} onChange={e=>setSystem(e.target.value)}>{qualificationSystems.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
      <label>الدرجة المطلوبة<select value={degree} onChange={e=>setDegree(e.target.value)}><option>الكل</option><option>بكالوريوس</option><option>دبلوم</option><option>ماجستير</option><option>دكتوراه</option></select></label>
    </div><aside><span>مسار مؤهلك</span><b>{qSystem.credential}</b><p>{qSystem.route}</p><small>دولة الشهادة: {qualificationCountry} • جنسية الطالب: {nationality}</small></aside></section>

    <section className="university-match-filter"><header><div><small>02 — وجهة الدراسة</small><h2>أين وماذا تريد أن تدرس؟</h2></div><a className="compare-counter" href="/university-compare">{saved.length} محفوظة للمقارنة ←</a></header><div>
      <label>دولة الدراسة<select value={studyCountry} onChange={e=>chooseStudyCountry(e.target.value)}>{studyCountries.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>المدينة<select value={city} onChange={e=>setCity(e.target.value)}>{cities.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>المجال<select value={field} onChange={e=>setField(e.target.value)}>{fields.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>طريقة الدراسة<select value={mode} onChange={e=>setMode(e.target.value)}>{['الكل','وجاهي','أونلاين'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="wide">اسم الجامعة أو التخصص<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="مثال: هندسة، Manchester، الإمارات"/></label>
    </div></section>

    <section className="admission-source-band"><div><b>مصادر التحقق</b><span>WHED للمؤسسة • الجهة الوطنية للاعتماد • صفحة القبول الرسمية • جهة المعادلة في دولة الطالب</span></div><aside><a href="https://www.whed.net/home.php" target="_blank" rel="noreferrer">WHED ↗</a><a href="https://www.cambridgeinternational.org/recognition-search/" target="_blank" rel="noreferrer">Cambridge ↗</a><a href="https://www.ibo.org/university-admission/" target="_blank" rel="noreferrer">IB ↗</a></aside></section>

    <section className="matched-universities"><header><div><small>03 — المطابقة</small><h2>{results.length} جامعة وكلية مطابقة للفلاتر الحالية</h2><p>يعرض الفهرس مؤسسات مفصلة، مع بوابة بحث عالمية لأي مؤسسة أخرى دون الادعاء بنسخ قاعدة WHED.</p></div><span>تحديث الفهرس: 14 يوليو 2026</span></header><div>{results.map(u=>{const recognition=recognitionFor(u,nationality);return <article className="matched-university-card" key={u.id}><header><span>🎓</span><div><small>{u.country} • {u.city} • {u.modes.join(' / ')}</small><h2>{u.name}</h2><p>{u.type} • {u.degree}</p></div><button className={saved.includes(u.id)?'saved':''} onClick={()=>toggleSave(u.id)}>{saved.includes(u.id)?'✓ محفوظة':'＋ مقارنة'}</button></header><div className="match-score"><span><i style={{width:u.systems.includes(system)?'88%':'45%'}}></i></span><b>{u.systems.includes(system)?'مسار مؤهل قابل للفحص':'يتطلب مساراً بديلاً'}</b></div><div className="program-chips">{u.fields.map(x=><span key={x}>{x}</span>)}</div><section className="entry-snapshot"><div><small>مؤهل الطالب</small><b>{qSystem.credential}</b><p>{u.entry}</p></div><div><small>نوع المتقدم</small><b>{nationality===u.country?'طالب محلي':'طالب دولي'}</b><p>{nationality===u.country?'تطبق المواعيد والوثائق المحلية.':'تطبق وثائق الطالب الدولي واللغة والتأشيرة.'}</p></div></section><Status recognition={recognition}/><footer><a href={`/university-profile?id=${u.id}`}>الملف الكامل</a><a href={`/eligibility-check?id=${u.id}`}>فحص الأهلية</a><button onClick={()=>setSelected({...u,recognition})}>الشروط</button></footer></article>})}</div></section>

    <section className="global-coverage-request"><div><small>لم تجد الجامعة؟</small><h2>افحص أي جامعة أو كلية في العالم</h2><p>أدخل الاسم. سننشئ بطاقة تحقق تربط المؤسسة ببلدها والجهة الوطنية وWHED ومتطلبات مؤهلك قبل إضافتها إلى الفهرس.</p></div><form onSubmit={e=>{e.preventDefault();if(globalName.trim())setSelected({name:globalName.trim(),country:'غير محدد بعد',city:'—',type:'طلب تحقق عالمي',modes:['بحاجة تحقق'],fields:[],degree:'—',entry:'يجب تحديد المؤسسة والبرنامج والحرم أولاً.',international:['اسم البرنامج والدرجة','رابط الجامعة الرسمي','الحرم وطريقة الدراسة','وثائق الطالب'],admission:'https://www.whed.net/home.php',recognition:{level:'unknown',title:'طلب تحقق جديد',text:`لم تُحسم حالة ${globalName.trim()} بعد. يبدأ الفحص من WHED والجهة الوطنية وصفحة البرنامج الرسمية.`,authority:countryAuthorities[nationality]||null}})}}><input value={globalName} onChange={e=>setGlobalName(e.target.value)} placeholder="اكتب الاسم الكامل للمؤسسة"/><button>ابدأ التحقق داخل SUCCESS OS</button></form></section>

    <section className="admission-verification-flow"><h2>كيف تُصدر المنصة النتيجة؟</h2><div>{[['1','هوية المؤسسة','الاسم القانوني والحرم'],['2','الترخيص الوطني','السجل الرسمي في بلدها'],['3','أهلية المؤهل','الشهادة والمواد والدرجات'],['4','تفاصيل البرنامج','الدرجة والتخصص ونمط الدراسة'],['5','اعتراف دولة الطالب','المعادلة والجهة المهنية'],['6','قرار موثق','المصدر والتاريخ والملاحظات']].map(([n,t,p])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{p}</p></article>)}</div></section>
  </main>{selected&&<div className="admission-modal detailed" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><div><button className="close" onClick={()=>setSelected(null)}>×</button><small>{selected.country} • {selected.city}</small><h2>{selected.name}</h2><Status recognition={selected.recognition}/><section className="modal-student-context"><span>الجنسية: <b>{nationality}</b></span><span>دولة الشهادة: <b>{qualificationCountry}</b></span><span>النظام: <b>{qSystem.label}</b></span></section><div className="admission-audiences"><section><h3>مطابقة المؤهل</h3><p><span>✓</span>{qSystem.route}</p><p><span>✓</span>{selected.entry}</p><p><span>✓</span>اللغة: {selected.language||'حسب لغة البرنامج'}</p></section><section><h3>{nationality===selected.country?'متطلبات الطالب المحلي':'متطلبات الطالب الدولي'}</h3>{(selected.international||[]).map(x=><p key={x}><span>✓</span>{x}</p>)}</section></div><div className="decision-warning"><b>قبل دفع أي رسوم</b><p>احصل على تأكيد رسمي للبرنامج والفرع ونمط الدراسة، ثم إفادة الاعتراف من جهة {nationality}. التصنيف العالمي لا يساوي الاعتماد أو المعادلة.</p></div><a href={selected.admission} target="_blank" rel="noreferrer">فتح مصدر القبول/التحقق الرسمي ↗</a><button className="apply-button" onClick={()=>location.href=`/application-tracker?id=${encodeURIComponent(selected.id||selected.name||'')}`}>أضفها إلى رحلة القبول</button></div></div>}</div>;
}

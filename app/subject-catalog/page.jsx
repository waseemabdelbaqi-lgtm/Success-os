'use client';
import {useEffect,useMemo,useState} from 'react';
import {InnerNav} from '../components';
import {countries,currencies,curriculumStatus,gradesForSystem,ratingOptions,semestersForSystem,serviceTypes,stagesForSystem,subjectsForSystem,systemsForCountry} from '../data/school-systems';

export default function SubjectCatalog(){
 const [country,setCountry]=useState('JO'),[system,setSystem]=useState('النظام الوطني'),[stage,setStage]=useState(''),[grade,setGrade]=useState(''),[semester,setSemester]=useState(''),[subject,setSubject]=useState(''),[service,setService]=useState(''),[providerCountry,setProviderCountry]=useState('JO'),[city,setCity]=useState(''),[currency,setCurrency]=useState('JOD — دينار أردني'),[maxPrice,setMaxPrice]=useState(''),[rating,setRating]=useState('4+ نجوم'),[q,setQ]=useState('');
 const systemOptions=systemsForCountry(country),stageOptions=stagesForSystem(system,country),gradeOptions=gradesForSystem(system,stage,country),semesterOptions=semestersForSystem(system,stage,country),subjectOptions=subjectsForSystem(system,stage,country),status=curriculumStatus(country,system);
 const shownSubjects=useMemo(()=>subjectOptions.filter(name=>(!subject||name===subject)&&(!q||name.toLowerCase().includes(q.toLowerCase()))),[subjectOptions,subject,q]);
 const countryName=countries.find(x=>x.code===country)?.name||country;
 useEffect(()=>{
  const params=new URLSearchParams(location.search);
  const query=params.get('q');
  if(query)setQ(query);
  // Default Jordan browse path so the catalog is not empty on first visit.
  if(!stage&&stageOptions.length){
   const preferred=stageOptions.find(x=>/ثانوي|Secondary/i.test(x))||stageOptions[0];
   setStage(preferred);
  }
 },[]);
 useEffect(()=>{
  if(!stage||grade||!gradeOptions.length)return;
  setGrade(gradeOptions.find(x=>/10|الصف 10/i.test(x))||gradeOptions[0]);
 },[stage,grade,gradeOptions.length]);
 useEffect(()=>{
  if(!grade||semester||!semesterOptions.length)return;
  setSemester(semesterOptions[0]);
 },[grade,semester,semesterOptions.length]);
 const reset=()=>{setCountry('JO');setSystem('النظام الوطني');setStage('');setGrade('');setSemester('');setSubject('');setService('');setProviderCountry('JO');setCity('');setMaxPrice('');setQ('')};
 const selectCountry=value=>{setCountry(value);setSystem('');setStage('');setGrade('');setSemester('');setSubject('');setService('')};
 const selectSystem=value=>{setSystem(value);setStage('');setGrade('');setSemester('');setSubject('');setService('')};
 const selectStage=value=>{setStage(value);setGrade('');setSemester('');setSubject('');setService('')};
 const selectGrade=value=>{setGrade(value);setSemester('');setSubject('');setService('')};
 const selectSubject=value=>{setSubject(value);setService('')};
 const recorded=service==='حصص مسجلة',live=service&& !recorded;
 const complete=country&&system&&stage&&grade&&semester&&subject&&service&&(recorded||(providerCountry&&city&&currency&&maxPrice&&rating));
 return <div className="os-page phase11-legacy-page"><InnerNav active="subjects"/><main className="os-page-content subject-page">
  <header className="subject-hero"><span>COUNTRY → SYSTEM → STAGE → GRADE → SUBJECT → LESSON TYPE</span><h1>اختر المادة ثم نوع الحصة</h1><p>تظهر الحصص البشرية أولًا، وتظهر فلاتر المعلم والمركز تلقائيًا عند اختيار الحصص المباشرة.</p></header>
  <section className="directory-filter subject-filter"><header><div><small>DEPENDENT CURRICULUM FILTERS</small><h2>حدد المسار بالترتيب</h2></div><button onClick={reset}>مسح الفلاتر</button></header><div>
   <label>1. الدولة<select value={country} onChange={e=>selectCountry(e.target.value)}>{countries.map(x=><option value={x.code} key={x.code}>{x.name}</option>)}</select></label>
   <label>2. النظام التعليمي<select value={system} onChange={e=>selectSystem(e.target.value)}><option value="">اختر النظام</option>{systemOptions.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select></label>
   <label>3. المرحلة التعليمية<select value={stage} disabled={!system||!status.ready} onChange={e=>selectStage(e.target.value)}><option value="">{!system?'اختر النظام أولًا':status.ready?'اختر المرحلة':'قيد المطابقة الرسمية'}</option>{stageOptions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>4. الصف أو السنة<select value={grade} disabled={!stage} onChange={e=>selectGrade(e.target.value)}><option value="">{stage?'اختر الصف أو السنة':'اختر المرحلة أولًا'}</option>{gradeOptions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>5. الفصل الدراسي<select value={semester} disabled={!grade} onChange={e=>{setSemester(e.target.value);setSubject('');setService('')}}><option value="">{grade?'اختر الفصل':'اختر الصف أو السنة أولًا'}</option>{semesterOptions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>6. المادة<select value={subject} disabled={!semester} onChange={e=>selectSubject(e.target.value)}><option value="">{semester?'اختر المادة':'اختر الفصل أولًا'}</option>{subjectOptions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label>7. نوع الحصة<select value={service} disabled={!subject} onChange={e=>{setService(e.target.value);setCity('');setMaxPrice('')}}><option value="">{subject?'اختر نوع الحصة':'اختر المادة أولًا'}</option>{serviceTypes.map(x=><option key={x}>{x}</option>)}</select></label>
   {live&&<><label>8. دولة مقدم الخدمة<select value={providerCountry} onChange={e=>setProviderCountry(e.target.value)}>{countries.map(x=><option value={x.code} key={x.code}>{x.name}</option>)}</select></label><label>9. المدينة<input value={city} onChange={e=>setCity(e.target.value)} placeholder="اكتب المدينة"/></label><label>10. العملة<select value={currency} onChange={e=>setCurrency(e.target.value)}>{currencies.map(x=><option key={x}>{x}</option>)}</select></label><label>11. الحد الأعلى للسعر<input type="number" min="0" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="أقصى سعر للحصة"/></label><label>12. الحد الأدنى للتقييم<select value={rating} onChange={e=>setRating(e.target.value)}>{ratingOptions.map(x=><option key={x}>{x}</option>)}</select></label></>}
   <label className="filter-search">بحث داخل مواد المرحلة<input value={q} disabled={!grade} onChange={e=>setQ(e.target.value)} placeholder={grade?'اكتب اسم المادة':'أكمل الصف أو السنة أولًا'}/></label>
  </div>{system&&<aside className={`curriculum-verification ${status.ready?'is-ready':'is-review'}`}><b>{status.ready?'✓ منهاج محدد للدولة':'◷ المنهاج قيد المطابقة الرسمية'}</b><p>{status.ready?`${status.label} • الجهة المرجعية: ${status.authority}${status.jurisdictionRequired?' • يلزم اختيار الولاية أو المقاطعة في المرحلة التالية':''}`:'لن نعرض مواد عامة أو غير موثقة لهذه الدولة. يجري ربط الصفوف والمواد بالمصدر الرسمي قبل إتاحتها.'}</p>{status.source&&<a href={status.source} target="_blank" rel="noreferrer">فتح المرجع الرسمي ↗</a>}</aside>}{recorded&&<aside className="recorded-ai-note"><b>التسجيل البشري أولًا</b><p>إذا لم تتوفر حصص بشرية للمادة، يمكنك طلب إنتاج حصص كاملة بلغة المنهاج ولهجة قريبة من دولة الطالب، وتخضع للمراجعة قبل الشراء.</p></aside>}<footer><b>{grade?`${shownSubjects.length} مادة مطابقة`:status.ready?'أكمل النظام والمرحلة والصف':'المحتوى غير متاح حتى اكتمال التحقق'}</b><span>{live?'مركز النجاح الأكيد أولًا ثم الأعلى تقييمًا':'أي تغيير يعيد فقط الاختيارات التابعة له'}</span></footer></section>
  <div className="subject-context"><b>{countryName}</b><span>{systemOptions.find(x=>x.value===system)?.label||'لم يحدد النظام'}</span><span>{stage||'لم تحدد المرحلة'}</span><i>{grade||'لم يحدد الصف'} • {semester||'لم يحدد الفصل'}</i></div>
  {grade&&<section className="subject-grid">{shownSubjects.map(name=><article key={`${system}-${stage}-${grade}-${semester}-${name}`}><small>{stage} • {grade} • {semester}</small><h2>{name}</h2><p>{service||'اختر نوع الحصة'}{live?' • نجاح أكيد أولًا • حسب التقييم والسعر':''}</p><div>{complete?<><a href={`/subject-learning-hub?system=${encodeURIComponent(system)}&stage=${encodeURIComponent(stage)}&grade=${encodeURIComponent(grade)}&semester=${encodeURIComponent(semester)}&subject=${encodeURIComponent(name)}&service=${encodeURIComponent(service)}&country=${country}&providerCountry=${providerCountry}&city=${encodeURIComponent(city)}&currency=${encodeURIComponent(currency)}&maxPrice=${maxPrice}&rating=${encodeURIComponent(rating)}&view=classes`}>{recorded?'عرض التسجيل البشري أو طلب التوليد':'عرض المعلمين والمراكز'}</a><a href={`/subject-learning-hub?system=${encodeURIComponent(system)}&stage=${encodeURIComponent(stage)}&grade=${encodeURIComponent(grade)}&semester=${encodeURIComponent(semester)}&subject=${encodeURIComponent(name)}&service=${encodeURIComponent(service)}&country=${country}&view=book`}>تفاصيل المادة</a></>:<span>{live?'أكمل الموقع والسعر والتقييم':'اختر الفصل والمادة ونوع الحصة'}</span>}</div></article>)}</section>}
  {grade&&!shownSubjects.length&&<section className="directory-empty"><span>▦</span><h2>لا توجد مادة مطابقة</h2><p>لا توجد مادة بهذا الاسم ضمن النظام والمرحلة والصف المختار.</p><button onClick={()=>{setSubject('');setQ('')}}>عرض مواد هذا الصف</button></section>}
 </main></div>
}

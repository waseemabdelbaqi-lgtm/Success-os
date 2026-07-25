'use client';
import {useEffect,useMemo,useState} from 'react';
import {InnerNav} from '../components';

const COMPARE_KEY='success-os-university-compare';

const programs=[
{institution:'Arizona State University',country:'الولايات المتحدة',mode:'وجاهي',degree:'بكالوريوس',field:'الهندسة وعلوم الحاسوب',status:'مؤسسة معترف بها — تحقق من معادلة البرنامج',source:'https://admission.asu.edu/apply/international/first-year'},
{institution:'Arizona State University Online',country:'الولايات المتحدة',mode:'أونلاين',degree:'بكالوريوس',field:'Business / IT / Social Sciences',status:'تعليم عن بعد — يلزم فحص اعتماد بلد الطالب',source:'https://asuonline.asu.edu/'},
{institution:'University of Manchester',country:'المملكة المتحدة',mode:'وجاهي',degree:'بكالوريوس',field:'الهندسة والعلوم والأعمال',status:'مؤسسة معترف بها — قرار المعادلة للدولة المستقبلة',source:'https://www.manchester.ac.uk/study/international/admissions/undergraduate-application-process/'},
{institution:'University of London',country:'المملكة المتحدة',mode:'أونلاين',degree:'بكالوريوس',field:'Computer Science / Business / Law',status:'برنامج أونلاين — تحقق من اعتراف بلدك بالبرنامج المحدد',source:'https://www.london.ac.uk/study/courses/undergraduate'},
{institution:'The Open University',country:'المملكة المتحدة',mode:'أونلاين',degree:'بكالوريوس',field:'علوم وأعمال وتعليم',status:'تعليم عن بعد — يلزم التحقق الوطني قبل التسجيل',source:'https://www.open.ac.uk/courses/'},
{institution:'University of Jordan',country:'الأردن',mode:'وجاهي',degree:'بكالوريوس',field:'طب وهندسة وعلوم إنسانية',status:'مؤسسة وطنية — شروط التخصص تطبق',source:'https://ipmd.ju.edu.jo/Pages/Undergraduate_Entry_requirements.aspx'},
{institution:'Bahçeşehir University',country:'تركيا',mode:'وجاهي',degree:'بكالوريوس',field:'طب وهندسة وتصميم',status:'تحقق من الاعتراف بالتخصص في بلد الطالب',source:'https://int.bau.edu.tr/admission/undergraduate-applicants/'}
];

const studentCountries=['الأردن','الإمارات','السعودية','مصر','الجزائر','المغرب','تركيا','الولايات المتحدة','المملكة المتحدة','كندا','أستراليا','دولة أخرى'];

function rowKey(x){return `${x.institution}|${x.mode}|${x.field}`}

export default function DegreeFinder(){
  const [home,setHome]=useState('الأردن');
  const [mode,setMode]=useState('الكل');
  const [degree,setDegree]=useState('الكل');
  const [query,setQuery]=useState('');
  const [saved,setSaved]=useState([]);
  const [toast,setToast]=useState('');

  useEffect(()=>{
    const q=new URLSearchParams(location.search).get('q');
    if(q)setQuery(q);
    try{setSaved(JSON.parse(localStorage.getItem(COMPARE_KEY)||'[]'))}catch{}
  },[]);

  const rows=useMemo(
    ()=>programs.filter(x=>(mode==='الكل'||x.mode===mode)&&(degree==='الكل'||x.degree===degree)&&(!query||`${x.institution} ${x.field}`.toLowerCase().includes(query.toLowerCase()))),
    [mode,degree,query]
  );

  function saveForCompare(item){
    try{
      const list=JSON.parse(localStorage.getItem(COMPARE_KEY)||'[]');
      const next=[{...item,home,savedAt:new Date().toISOString()},...list.filter(x=>rowKey(x)!==rowKey(item))].slice(0,8);
      localStorage.setItem(COMPARE_KEY,JSON.stringify(next));
      setSaved(next);
      setToast(`تم حفظ ${item.institution} للمقارنة`);
      window.setTimeout(()=>setToast(''),2200);
    }catch{
      setToast('تعذر الحفظ محليًا');
    }
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="degrees"/>
      <main className="os-page-content degree-page">
        <header className="degree-hero">
          <div>
            <span>DEGREE & RECOGNITION FINDER</span>
            <h1>الجامعة المناسبة، حسب ما تعتمده دولتك</h1>
            <p>ابحث عن برامج وجاهية أو أونلاين، ثم افحص اعتراف المؤسسة والبرنامج وطريقة الدراسة في الدولة التي ستستخدم فيها الدرجة.</p>
          </div>
          <div><b>✓</b><small>فلترة الاعتراف قبل التقديم</small></div>
        </header>
        <section className="country-alert">
          <span>!</span>
          <div>
            <b>هذه القائمة تظهر حسب دولتك</b>
            <p>الاعتماد ليس للمؤسسة فقط؛ قد يختلف حسب الدرجة والتخصص والحرم وطريقة الدراسة. القرار النهائي للجهة المختصة في {home}.</p>
          </div>
        </section>
        <section className="degree-filter">
          <label>دولة استخدام الدرجة<select value={home} onChange={e=>setHome(e.target.value)}>{studentCountries.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>طريقة الدراسة<select value={mode} onChange={e=>setMode(e.target.value)}>{['الكل','وجاهي','أونلاين'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>الدرجة<select value={degree} onChange={e=>setDegree(e.target.value)}>{['الكل','بكالوريوس','ماجستير','دكتوراه','دبلوم'].map(x=><option key={x}>{x}</option>)}</select></label>
          <label>التخصص أو الجامعة<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث داخل الموقع"/></label>
        </section>
        <section className="degree-results">
          <header>
            <div>
              <small>نتائج داخل SUCCESS OS</small>
              <h2>{rows.length} برامج إطلاق مطابقة</h2>
            </div>
            <div className="degree-result-links">
              <a href="/university-compare">المقارنة ({saved.length})</a>
              <a href="/global-sources">مصادر التحقق الرسمية</a>
            </div>
          </header>
          {toast&&<p className="degree-toast">{toast}</p>}
          <div>
            {rows.map(x=>(
              <article key={`${x.institution}-${x.mode}`}>
                <header>
                  <span>{x.mode==='أونلاين'?'⌁':'⌂'}</span>
                  <div>
                    <small>{x.country} • {x.mode}</small>
                    <h2>{x.institution}</h2>
                  </div>
                </header>
                <p>{x.degree} • {x.field}</p>
                <div className="recognition-note">
                  <b>حالة الاعتراف في {home}</b>
                  <span>{x.status}</span>
                </div>
                <footer>
                  <button type="button" onClick={()=>saveForCompare(x)}>
                    {saved.some(s=>rowKey(s)===rowKey(x))?'محفوظ للمقارنة ✓':'احفظ للمقارنة'}
                  </button>
                  <button type="button" onClick={()=>location.href=`/admissions?q=${encodeURIComponent(x.institution)}`}>افحص الشروط والتقديم</button>
                  <a href={x.source} target="_blank" rel="noreferrer">المصدر الرسمي ↗</a>
                </footer>
              </article>
            ))}
          </div>
        </section>
        <section className="degree-checklist">
          <h2>فحص الاعتراف من داخل المنصة</h2>
          <div>
            {['المؤسسة مدرجة رسميًا','البرنامج والدرجة معتمدان','الحرم أو الفرع صحيح','طريقة الدراسة مقبولة','شروط المعادلة واضحة','تاريخ التحقق محفوظ'].map((x,i)=>(
              <article key={x}><b>{i+1}</b><span>{x}</span></article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

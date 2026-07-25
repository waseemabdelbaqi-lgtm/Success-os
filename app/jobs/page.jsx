'use client';
import {useEffect,useMemo,useState} from 'react';
import {InnerNav} from '../components';

const jobs=[
  {title:'معلم فيزياء AP / EST',company:'Success 4 Sure Partner',country:'الأردن',mode:'عن بعد',type:'تعليم',skills:['خبرة في المنهج','شرح عربي وإنجليزي','تقييم طلاب'],verified:true},
  {title:'صانع محتوى تعليمي',company:'SUCCESS OS',country:'عالمي',mode:'عن بعد',type:'محتوى',skills:['كتابة تعليمية','Storyboard','مراجعة مصادر'],verified:true},
  {title:'مهندس منصة تعليمية',company:'SUCCESS OS',country:'عالمي',mode:'عن بعد',type:'تقنية',skills:['Web Apps','Data & Security','AI integrations'],verified:true},
  {title:'مسؤول منصات التواصل',company:'Educational Partner',country:'الإمارات',mode:'حضوري',type:'تسويق',skills:['Campaigns','Arabic content','Lead verification'],verified:false},
  {title:'مدير أكاديمي',company:'Learning Center',country:'السعودية',mode:'هجين',type:'إدارة أكاديمية',skills:['Curriculum QA','Teacher coaching','Assessment'],verified:false},
];

const companies=[
  {name:'Success 4 Sure Academy',country:'الأردن / دبي / أونلاين',focus:'SAT • EST • ACT • AP • IGCSE',verified:true,href:'https://www.success4sureacademy.com/'},
  {name:'SUCCESS OS',country:'عالمي',focus:'منصة التعلم والشراكات',verified:true,href:'/join-us?role=employer'},
  {name:'Educational Partner',country:'الإمارات',focus:'تسويق تعليمي ومحتوى',verified:false,href:'/partner-search?portal=employer'},
  {name:'Learning Center',country:'السعودية',focus:'إدارة أكاديمية ومعلمون',verified:false,href:'/centers'},
];

const initial={type:'الكل',country:'الكل',mode:'الكل',verified:'الكل',query:''};

export default function JobsPage(){
  const [f,setF]=useState(initial);
  const [selected,setSelected]=useState(null);
  const [sent,setSent]=useState(false);
  const [view,setView]=useState('jobs');

  useEffect(()=>{
    const q=new URLSearchParams(location.search);
    const country=q.get('country');
    const mode=q.get('mode')||'';
    const v=q.get('view');
    if(v==='companies')setView('companies');
    setF(x=>({
      ...x,
      country:jobs.some(j=>j.country===country)?country:x.country,
      mode:mode.includes('عن بعد')?'عن بعد':mode.includes('هجين')?'هجين':mode.includes('المكتب')||mode.includes('حضوري')?'حضوري':x.mode,
    }));
  },[]);

  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const rows=useMemo(
    ()=>jobs.filter(x=>(f.type==='الكل'||x.type===f.type)&&(f.country==='الكل'||x.country===f.country)&&(f.mode==='الكل'||x.mode===f.mode)&&(f.verified==='الكل'||(f.verified==='موثقة'?x.verified:!x.verified))&&(!f.query||`${x.title} ${x.company} ${x.skills.join(' ')}`.toLowerCase().includes(f.query.toLowerCase()))),
    [f]
  );

  function applyJob(e){
    e.preventDefault();
    const form=new FormData(e.currentTarget);
    const application={
      id:`JOB-${Date.now().toString().slice(-6)}`,
      title:selected.title,
      company:selected.company,
      country:selected.country,
      mode:selected.mode,
      name:String(form.get('name')||''),
      skillsLink:String(form.get('skills')||''),
      status:'بانتظار مراجعة الجهة',
      createdAt:new Date().toISOString(),
    };
    try{
      const saved=JSON.parse(localStorage.getItem('success-os-job-applications')||'[]');
      localStorage.setItem('success-os-job-applications',JSON.stringify([application,...saved].slice(0,40)));
      const tracker=JSON.parse(localStorage.getItem('success-os-student-requests')||'[]');
      localStorage.setItem('success-os-student-requests',JSON.stringify([{
        id:application.id,
        type:'تقديم وظيفة',
        title:`${application.title} • ${application.company}`,
        status:application.status,
        created:new Date().toLocaleDateString('ar-JO'),
      },...tracker].slice(0,40)));
    }catch{}
    setSent(true);
  }

  return (
    <div className="os-page phase11-legacy-page">
      <InnerNav active="jobs"/>
      <main className="os-page-content jobs-page">
        <header className="jobs-hero">
          <div>
            <span>SKILLS TO JOBS</span>
            <h1>وظائف مرتبطة بملف مهارات موثّق</h1>
            <p>فلترة حسب المجال والدولة وطريقة العمل وحالة الشركة، مع تقديم لا يكشف بيانات الباحث إلا بموافقته.</p>
          </div>
          <a href="/join-us?role=employer">انضم كشركة توظيف</a>
        </header>

        <section className="jobs-view-switch">
          <button type="button" className={view==='jobs'?'active':''} onClick={()=>setView('jobs')}>الوظائف</button>
          <button type="button" className={view==='companies'?'active':''} onClick={()=>setView('companies')}>الشركات</button>
          <a href="/application-tracker">طلباتي</a>
          <a href="/jobseeker-portal">ملفي المهني</a>
        </section>

        {view==='companies'?(
          <section className="job-grid companies-grid">
            {companies.map(c=>(
              <article key={c.name}>
                <header>
                  <span>↗</span>
                  <div>
                    <small>{c.country}</small>
                    <h2>{c.name}</h2>
                  </div>
                  <b className={c.verified?'verified':'pending'}>{c.verified?'موثقة':'قيد التحقق'}</b>
                </header>
                <p>{c.focus}</p>
                <div className="company-actions">
                  <a href={`/jobs?query=${encodeURIComponent(c.name)}`} onClick={(e)=>{e.preventDefault();setView('jobs');setF(x=>({...x,query:c.name}))}}>عرض وظائف الشركة</a>
                  <a href={c.href} {...(c.href.startsWith('http')?{target:'_blank',rel:'noreferrer'}:{})}>الملف / الموقع</a>
                </div>
              </article>
            ))}
          </section>
        ):(
          <>
            <section className="directory-filter jobs-directory-filter">
              <header>
                <div><small>JOB FILTERS</small><h2>خصص فرصك المهنية</h2></div>
                <button type="button" onClick={()=>setF(initial)}>مسح الفلاتر</button>
              </header>
              <div>
                <label>مجال الوظيفة<select value={f.type} onChange={e=>set('type',e.target.value)}>{['الكل',...new Set(jobs.map(x=>x.type))].map(x=><option key={x}>{x}</option>)}</select></label>
                <label>الدولة<select value={f.country} onChange={e=>set('country',e.target.value)}>{['الكل',...new Set(jobs.map(x=>x.country))].map(x=><option key={x}>{x}</option>)}</select></label>
                <label>طريقة العمل<select value={f.mode} onChange={e=>set('mode',e.target.value)}><option>الكل</option><option>عن بعد</option><option>حضوري</option><option>هجين</option></select></label>
                <label>حالة الشركة<select value={f.verified} onChange={e=>set('verified',e.target.value)}><option>الكل</option><option>موثقة</option><option>قيد التحقق</option></select></label>
                <label className="filter-search">المسمى أو المهارة<input value={f.query} onChange={e=>set('query',e.target.value)} placeholder="ابحث بوظيفة، شركة أو مهارة"/></label>
              </div>
              <footer><b>{rows.length} وظائف مطابقة</b><span>الفلاتر تعمل مباشرة</span></footer>
            </section>
            {rows.length?(
              <section className="job-grid">
                {rows.map(j=>(
                  <article key={j.title}>
                    <header>
                      <span>{j.type[0]}</span>
                      <div><small>{j.company}</small><h2>{j.title}</h2></div>
                      <b className={j.verified?'verified':'pending'}>{j.verified?'موثقة':'قيد التحقق'}</b>
                    </header>
                    <p>⌖ {j.country} • {j.mode}</p>
                    <div>{j.skills.map(x=><span key={x}>{x}</span>)}</div>
                    <button type="button" onClick={()=>{setSelected(j);setSent(false)}}>عرض الشروط والتقديم</button>
                  </article>
                ))}
              </section>
            ):(
              <section className="directory-empty">
                <span>↗</span>
                <h2>لا توجد وظيفة مطابقة</h2>
                <p>وسّع الدولة أو المجال أو طريقة العمل.</p>
                <button type="button" onClick={()=>setF(initial)}>مسح الفلاتر</button>
              </section>
            )}
          </>
        )}

        {selected&&(
          <div className="job-modal" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}>
            <form onSubmit={applyJob}>
              <button type="button" onClick={()=>setSelected(null)}>×</button>
              <small>{selected.company} • {selected.country} • {selected.mode}</small>
              <h2>{selected.title}</h2>
              <h3>شروط الوظيفة</h3>
              {selected.skills.map(x=><p key={x}>✓ {x}</p>)}
              <label>الاسم<input name="name" required placeholder="الاسم الكامل"/></label>
              <label>رابط ملف المهارات<input name="skills" placeholder="رابط جواز SUCCESS OS"/></label>
              <label>السيرة الذاتية<input type="file" accept=".pdf,.doc,.docx"/></label>
              <button className="apply-job" type="submit">{sent?'تم إرسال الطلب ✓':'التقديم على الوظيفة'}</button>
              {sent&&(
                <div className="job-apply-done">
                  <a href="/application-tracker">متابعة الطلب في المتتبع</a>
                  <a href="/profile?role=jobseeker">ملفي كباحث عن عمل</a>
                </div>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

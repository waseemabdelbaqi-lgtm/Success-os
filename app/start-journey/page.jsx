'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {InnerNav} from '../components';
import {journeyDestination} from '../lib/routes';
import {
  ADMISSION_STUDY_COUNTRIES,
  UNIVERSITY_CORE_FIELDS,
  UNIVERSITY_DEGREES,
  UNIVERSITY_JOURNEY_FIELDS,
  UNIVERSITY_OPTIONAL_FIELDS,
  UNIVERSITY_STUDY_MODES,
  admissionsUrlFromJourney,
  universityFieldChoices,
} from '../lib/journey-admissions';
import {countries,currencies,ratingOptions,semestersForSystem,serviceTypes,stagesForSystem,gradesForSystem,subjectsForSystem,systemsForCountry} from '../data/school-systems';

const portals=[['student','◉','الطالب','تعلم، حصص، مدارس وجامعات'],['jobseeker','◇','الباحث عن عمل','وظائف، مهارات وطلبات'],['teacher','♙','المعلم','بحث أو شراكة'],['center','▦','المركز التعليمي','بحث أو شراكة'],['school','⌂','المدرسة','بحث أو شراكة'],['university','🎓','الجامعة أو الكلية','بحث أو شراكة'],['employer','↗','شركة التوظيف','بحث أو شراكة']];
const needsIntent=new Set(['teacher','center','school','university','employer']);
const schoolStudentCore=['النظام التعليمي','المرحلة التعليمية','الصف أو السنة','الفصل الدراسي','المادة','نوع الخدمة'];
const universityStudentCore=['الجامعة أو الكلية','التخصص','السنة الجامعية','المادة الجامعية','نوع الخدمة'];
const courseStudentCore=['نطاق الدورة','مجال الدورة','اسم الدورة','نوع الخدمة'];
const liveLessonFilters=['دولة مقدم الخدمة','المدينة','العملة','الحد الأعلى للسعر','الحد الأدنى للتقييم'];
const portalFilters={jobseeker:['المدينة','طريقة العمل','مجال العمل','عائلة الوظيفة','المسمى الوظيفي','الخبرة','نوع العقد','الراتب المتوقع'],teacher:['المدينة','النظام التعليمي','المرحلة','المادة','طريقة التدريس','السعر'],center:['المدينة','النظام التعليمي','المرحلة','المادة أو الدورة','نوع الشهادة','طريقة الخدمة'],school:['المدينة','النظام التعليمي','المرحلة','نوع المدرسة','طريقة الدراسة','الرسوم السنوية'],university:UNIVERSITY_JOURNEY_FIELDS,employer:['المدينة','طريقة العمل','القطاع','عائلة الوظيفة','المسمى','الخبرة','نوع العقد','الراتب']};
const defaults={country:'JO',name:'',intent:'search',studentType:'',filters:{}};
const steps=['البوابة','نوع الطلب','الهوية','الفلاتر','النتائج','التفاصيل','التأكيد','اللوحة'];
const options={
 'النظام التعليمي':['النظام الوطني','American','Cambridge IGCSE','Pearson Edexcel','IB','AP','EST'],
 'المرحلة أو المؤهل':['مدرسي','ثانوي دولي','دبلوم','بكالوريوس','دراسات عليا'],'المرحلة':['أساسي','ثانوي','جامعي'],'الصف أو السنة':['7','8','9','10','11','12','سنة جامعية 1','سنة جامعية 2+'],
 'نوع الخدمة':serviceTypes,
 'داخل الدولة أو خارجها':['داخل دولتي','خارج دولتي','كلاهما'],
 'دولة الوجهة':ADMISSION_STUDY_COUNTRIES,
 'نمط الدراسة':UNIVERSITY_STUDY_MODES,
 'الدرجة':UNIVERSITY_DEGREES,
 'التخصص':universityFieldChoices(),
 'طريقة العمل':['عن بعد','هجين','من مقر العمل'],'الخبرة':['بدون خبرة','أقل من سنتين','2–5 سنوات','أكثر من 5 سنوات'],'نوع العقد':['دوام كامل','دوام جزئي','عقد','تدريب'],'نوع الشهادة':['معتمدة','غير معتمدة','كلاهما'],'طريقة الخدمة':['أونلاين','حضوري','هجين'],'طريقة التدريس':['أونلاين خاص','حضوري خاص','حضوري مجموعة']
 ,'السنة الجامعية':['السنة الأولى','السنة الثانية','السنة الثالثة','السنة الرابعة','السنة الخامسة أو أكثر']
 ,'العملة':currencies,'الحد الأدنى للتقييم':ratingOptions
 ,'نطاق الدورة':['دورة محلية','دورة عالمية','كلاهما'],'مجال الدورة':['اللغات','التقنية والبرمجة','الأعمال والإدارة','التصميم والإعلام','الصحة واللياقة','التطوير المهني','التحضير للشهادات الدولية']
};

export default function StartJourney(){
 const router=useRouter();
 const [step,setStep]=useState(1),[portal,setPortal]=useState(''),[form,setForm]=useState(defaults),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[qa,setQa]=useState(false),[choice,setChoice]=useState(''),[lang,setLang]=useState('ar');
 const [partnerProducts,setPartnerProducts]=useState([]);
 useEffect(()=>{try{
  const params=new URLSearchParams(location.search);
  const p=params.get('portal');
  if(p==='join'){router.replace('/join-us');return}
  const saved=JSON.parse(sessionStorage.getItem('success-os-journey')||'null');
  if(saved){setPortal(saved.portal||'');setForm(saved.form||defaults);setStep(saved.step||1);setChoice(saved.choice||'')}
  if(p&&portals.some(x=>x[0]===p)){
   setPortal(p);
   const studentType=params.get('studentType')||'';
   const subject=params.get('subject')||'';
   const course=params.get('course')||'';
   const program=params.get('program')||'';
   if(p==='student'&&(studentType||subject||course||program)){
    setForm(f=>({
     ...f,
     studentType:studentType||(course||program?'courses':f.studentType),
     filters:{
      ...f.filters,
      ...(subject?{'المادة':subject,'اسم الدورة':subject}:{}),
      ...(course?{'اسم الدورة':course}:{}),
      ...(program?{'مجال الدورة':program}:{}),
     },
    }));
    setStep(studentType||course||program?3:2);
   }else{
    setStep(needsIntent.has(p)||p==='student'?2:3);
   }
  }
 }catch{}},[router]);
 useEffect(()=>{try{sessionStorage.setItem('success-os-journey',JSON.stringify({portal,form,step,choice}))}catch{}},[portal,form,step,choice]);
 useEffect(()=>{try{setPartnerProducts(JSON.parse(localStorage.getItem('success-os-partner-products')||'[]'))}catch{}},[]);
 const studentCore=form.studentType==='university'?universityStudentCore:form.studentType==='courses'?courseStudentCore:schoolStudentCore;
 const isRecorded=form.filters['نوع الخدمة']==='حصص مسجلة',isLive=portal==='student'&&form.filters['نوع الخدمة']&&!isRecorded;
 const selected=portals.find(x=>x[0]===portal),fields=portal==='student'?[...studentCore,...(isLive?liveLessonFilters:[]) ]:(portalFilters[portal]||[]),target=useMemo(()=>journeyDestination(portal,form.intent),[portal,form.intent]);
 const countryName=countries.find(x=>x.code===form.country)?.name||form.country;
 function choicesFor(label){
  if(portal!=='student')return options[label];
  if(label==='النظام التعليمي')return systemsForCountry(form.country);
  if(label==='المرحلة التعليمية')return stagesForSystem(form.filters['النظام التعليمي'],form.country);
  if(label==='الصف أو السنة')return gradesForSystem(form.filters['النظام التعليمي'],form.filters['المرحلة التعليمية'],form.country);
  if(label==='الفصل الدراسي')return semestersForSystem(form.filters['النظام التعليمي'],form.filters['المرحلة التعليمية'],form.country);
  if(label==='المادة')return subjectsForSystem(form.filters['النظام التعليمي'],form.filters['المرحلة التعليمية'],form.country);
  if(label==='الجامعة أو الكلية'||label==='التخصص'||label==='المادة الجامعية')return undefined;
  if(label==='دولة مقدم الخدمة')return countries.map(x=>({value:x.code,label:x.name}));
  return options[label];
 }
 const results=useMemo(()=>{
  if(portal!=='student')return [{title:'النتيجة الأقرب لطلبك',price:0,note:'حسب مقدم الخدمة',duration:'حسب الخدمة',schedule:'يحدد لاحقًا'},{title:'بديل أوسع خياراتاً',price:0,note:'حسب مقدم الخدمة',duration:'حسب الخدمة',schedule:'يحدد لاحقًا'}];
  if(isRecorded){
   const subject=form.filters['المادة']||form.filters['المادة الجامعية']||form.filters['اسم الدورة']||'';
   const human=partnerProducts.filter(x=>x.type==='recorded'&&x.subject===subject).map(x=>({title:`${x.teacherName||x.centerName||'شريك تعليمي'} — تسجيل بشري`,price:Number(x.price)||0,note:x.centerName?'مركز تعليمي':'معلم',duration:x.duration||'المادة كاملة',schedule:'تفعيل فوري بعد نجاح الدفع'}));
   return human.length?human:[{title:'المعلم المساعد — حصص المادة كاملة',price:25,note:'حصص مسجلة عند الطلب • سعر ثابت',duration:'المادة كاملة',schedule:'يظهر فورًا في اللوحة بحالة قيد الإنتاج'}];
  }
  const cap=Number(form.filters['الحد الأعلى للسعر'])||30;
  return [{title:'مركز النجاح الأكيد — أولوية الشركاء',price:Math.max(1,Math.round(cap*.75)),note:'سعر الشريك',duration:'60 دقيقة',schedule:'السبت والاثنين • 5:00 مساءً'},{title:'معلم معتمد — الأعلى تقييمًا',price:Math.max(1,Math.round(cap*.85)),note:'سعر الشريك',duration:'60 دقيقة',schedule:'الأحد والثلاثاء • 6:30 مساءً'},{title:'مركز تعليمي شريك — الأعلى تقييمًا',price:cap,note:'سعر الشريك',duration:'90 دقيقة',schedule:'الخميس • 4:00 مساءً'}];
 },[portal,isRecorded,form.filters,partnerProducts]);
 const selectedResult=results.find(x=>x.title===choice),basePrice=selectedResult?.price||0,platformFee=basePrice*.10,partnerPayout=basePrice-platformFee,totalPrice=basePrice;
 const query=useMemo(()=>{
  if(portal==='university'&&form.intent==='search')return admissionsUrlFromJourney(form);
  const p=new URLSearchParams({from:'journey',country:form.country,name:form.name,studentType:form.studentType||'',...form.filters});
  return `${target}${target.includes('?')?'&':'?'}${p}`;
 },[target,form,portal]);
 function choosePortal(id){setPortal(id);setForm(defaults);setChoice('');setErrors({});setStep(needsIntent.has(id)||id==='student'?2:3)}
 function setFilter(label,value){
  // University search: no cascading wipe — easier multi-select style
  if(portal==='university'){
   setForm({...form,filters:{...form.filters,[label]:value}});
   setChoice('');
   return;
  }
  const index=fields.indexOf(label),next={...form.filters,[label]:value};fields.slice(index+1).forEach(key=>delete next[key]);setForm({...form,filters:next});setChoice('');
 }
 function valid(){
  const e={};
  if(step===2&&portal==='student'&&!form.studentType)e.studentType='اختر طالب مدرسة أو طالب جامعة أو دورات';
  if(step>=3&&!form.name.trim())e.name='اكتب الاسم للمتابعة';
  if(step>=3&&!form.country.trim())e.country='حدد الدولة';
  if(step===4){
   if(portal==='university'){
    UNIVERSITY_CORE_FIELDS.forEach(label=>{if(!form.filters[label])e[label]=`حدد ${label}`});
   }else{
    fields.forEach(label=>{if(!form.filters[label])e[label]=`حدد ${label}`});
   }
  }
  if(step===5&&!choice)e.choice='اختر نتيجة واحدة للمتابعة';
  setErrors(e);return !Object.keys(e).length;
 }
 function next(){
  if((step===2&&portal==='student')||step>=3){if(!valid())return}
  setBusy(true);
  if(step===2&&portal!=='student'&&form.intent==='join'){
   router.push(`/access?portal=${encodeURIComponent(portal)}&intent=join`);
   return;
  }
  if(step===4&&portal==='student'){
   try{sessionStorage.setItem('success-os-student-search',JSON.stringify({form,createdAt:new Date().toISOString()}))}catch{}
   // Continue in-journey results → detail → purchase → checkout (steps 5–8).
   setTimeout(()=>{setBusy(false);setStep(5)},220);
   return;
  }
  if(step===4&&portal==='university'){
   router.push(admissionsUrlFromJourney(form));
   return;
  }
  if(step===4&&portal!=='student'){
   router.push(query);
   return;
  }
  if(step===3&&portal==='jobseeker'){
   router.push(query);
   return;
  }
  setTimeout(()=>{setBusy(false);setStep(s=>Math.min(s+1,8))},220)
 }
 function confirm(){if(busy)return;setBusy(true);setTimeout(()=>{try{const saved=JSON.parse(localStorage.getItem('success-os-requests')||'[]');localStorage.setItem('success-os-requests',JSON.stringify([{id:`J-${Date.now()}`,portal,intent:form.intent,studentType:form.studentType,choice,basePrice,platformFee,partnerPayout,totalPrice,target,filters:form.filters,status:'بانتظار الدفع',created:new Date().toISOString()},...saved]))}catch{}setBusy(false);setStep(8)},320)}
 return <div className="os-page phase11-legacy-page" lang={lang} dir={lang==='ar'?'rtl':'ltr'}><InnerNav active="access"/><main className="os-page-content start-journey-page">
  <div className="journey-language"><b>اللغة / Language</b><button className={lang==='ar'?'active':''} onClick={()=>setLang('ar')}>العربية</button><button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>English</button></div>
  <header className="journey-launch-hero"><div><small>ONE CONTROLLED JOURNEY</small><h1>ابدأ رحلتك بخطوات واضحة</h1><p>ثماني مراحل مترابطة تحفظ اختياراتك وتوصلك إلى اللوحة المناسبة دون روابط وهمية.</p></div><aside><img src="/media/success-future-gateways.webp" alt="بوابات SUCCESS OS"/></aside></header>
  <nav className="journey-progress" aria-label="مراحل الرحلة">{steps.map((x,i)=><span className={step===i+1?'active':step>i+1?'done':''} key={x}><b>{i+1}</b>{x}</span>)}</nav>
  {step===1&&<Panel n="01" title="من أنت؟" cls="journey-portal-picker"><div>{portals.map(([id,icon,title,text])=><button onClick={()=>choosePortal(id)} key={id}><span>{icon}</span><b>{title}</b><p>{text}</p><i>←</i></button>)}</div></Panel>}
  {step===2&&portal==='student'&&<Panel n="02" title="اختر مسارك" text="ثلاث رحلات مستقلة حسب احتياج الطالب." cls="journey-request-picker"><div><button className={form.studentType==='school'?'active':''} onClick={()=>{setForm({...form,studentType:'school',filters:{}});setErrors({})}}>طالب مدرسة<span>✓</span></button><button className={form.studentType==='university'?'active':''} onClick={()=>{setForm({...form,studentType:'university',filters:{}});setErrors({})}}>طالب جامعة<span>✓</span></button><button className={form.studentType==='courses'?'active':''} onClick={()=>{setForm({...form,studentType:'courses',filters:{}});setErrors({})}}>دورات محلية وعالمية<span>✓</span></button></div>{errors.studentType&&<em className="field-error">{errors.studentType}</em>}<Actions back={()=>setStep(1)} next={next} busy={busy}/></Panel>}
  {step===2&&portal!=='student'&&<Panel n="02" title={`ماذا تريد من بوابة ${selected?.[2]}؟`} cls="journey-request-picker"><div><button className={form.intent==='search'?'active':''} onClick={()=>setForm({...form,intent:'search'})}>ابحث عن {selected?.[2]}<span>✓</span></button><button className={form.intent==='join'?'active':''} onClick={()=>setForm({...form,intent:'join'})}>انضم إلينا كشريك<span>✓</span></button></div><Actions back={()=>setStep(1)} next={next} busy={busy}/></Panel>}
  {step===3&&<Panel n="03" title={`معلومات ${form.studentType==='university'?'طالب الجامعة':form.studentType==='school'?'طالب المدرسة':form.studentType==='courses'?'طالب الدورات':'أساسية'}`} cls="journey-filter-step"><div><Field label="الاسم" value={form.name} error={errors.name} onChange={v=>setForm({...form,name:v})}/><Field label="الدولة" value={form.country} error={errors.country} choices={countries.map(x=>({value:x.code,label:x.name}))} onChange={v=>setForm({...form,country:v,filters:{}})}/></div><Actions back={()=>setStep(needsIntent.has(portal)||portal==='student'?2:1)} next={next} busy={busy}/></Panel>}
  {step===4&&<Panel n="04" title={portal==='university'?`فلاتر سهلة — ${selected?.[2]}`:`فلاتر ${selected?.[2]}`} text={portal==='university'?'ثلاثة اختيارات أساسية فقط. الباقي اختياري (يمكنك تركه على الكل) ثم المتابعة مباشرة إلى القبول.':portal==='student'?(isRecorded?'يظهر التسجيل البشري فقط إذا رفعه معلم أو مركز. عند عدم وجوده يظهر المعلم المساعد.':isLive?'نعرض مركز النجاح الأكيد ومعلميه أولًا، ثم المعلمين والمراكز الأعلى تقييمًا حسب السعر والموقع.':'اختر المادة ثم نوع الحصة المطلوبة.'):'تغيير أي اختيار يعيد الحقول التابعة فقط.'} cls="journey-filter-step"><div>{fields.map((label,index)=>{const optional=portal==='university'&&UNIVERSITY_OPTIONAL_FIELDS.includes(label);return <Field key={label} label={optional?`${label} (اختياري)`:label} value={form.filters[label]||(optional?'الكل':'')} error={errors[label]} placeholder={label==='الحد الأعلى للسعر'?'أدخل أقصى سعر':label==='المدينة'?'اكتب المدينة':'الكل'} choices={choicesFor(label)} disabled={portal!=='university'&&index>0&&!form.filters[fields[index-1]]} onChange={v=>{setErrors({});setFilter(label,v)}}/>})}</div>{isRecorded&&<aside className="recorded-ai-note"><b>المعلم المساعد عند عدم وجود تسجيل بشري</b><p>إذا لم يرفع معلم أو مركز تسجيلًا لهذه المادة، يظهر المعلم المساعد لإنتاج حصص المادة كاملة، ثم تنتقل الرحلة إلى الشراء وبعدها إلى لوحة الطالب.</p></aside>}{portal==='university'&&<aside className="recorded-ai-note"><b>فلاتر أساسية</b><p>مطلوب: داخل/خارج الدولة + دولة الوجهة + الدرجة. نمط الدراسة والتخصص اختياريان.</p></aside>}<Actions back={()=>setStep(3)} next={next} busy={busy}/></Panel>}
  {step===5&&<Panel n="05" title={isRecorded?'الحصص المتاحة للمادة':`نتائج مناسبة لبوابة ${selected?.[2]}`} text={isRecorded?(results[0]?.title.includes('المعلم المساعد')?'لا يوجد تسجيل بشري حاليًا؛ ظهر المعلم المساعد فقط.':'هذه التسجيلات رفعها شركاء وتظهر بأسمائهم.'):'الترتيب يبدأ بمركز النجاح الأكيد ثم الأعلى تقييمًا ضمن فلاترك.'} cls="journey-result-step"><div className="journey-result-cards">{results.map((x,i)=><button className={choice===x.title?'selected':''} onClick={()=>{setChoice(x.title);setErrors({})}} key={x.title}><b>{x.title}</b><span>{x.note} • ${x.price.toFixed(2)}</span><span>المدة: {x.duration} • الموعد: {x.schedule}</span><span>{isRecorded?(x.title.includes('المعلم المساعد')?'إنتاج عند الطلب داخل المنصة':'تسجيل بشري باسم الشريك'):`${countryName} • تقييم ${(4.9-i*.2).toFixed(1)} • مطابقة ${96-i*5}%`}</span><em>{choice===x.title?'✓ تم الاختيار':'اختر'}</em></button>)}</div>{errors.choice&&<em className="field-error">{errors.choice}</em>}<Actions back={()=>setStep(4)} next={next} busy={busy}/></Panel>}
  {step===6&&<Panel n="06" title={choice} cls="journey-result-step"><div className="journey-detail-grid"><article><b>المسار</b><span>{portal==='student'?(form.studentType==='university'?'طالب جامعة':form.studentType==='courses'?'دورات محلية وعالمية':'طالب مدرسة'):selected?.[2]}</span></article><article><b>المدة</b><span>{selectedResult?.duration}</span></article><article><b>الموعد أو التفعيل</b><span>{selectedResult?.schedule}</span></article><article><b>السعر الأساسي</b><span>${basePrice.toFixed(2)} • يتضمن 10%</span></article></div><Actions back={()=>setStep(5)} next={next} busy={busy}/></Panel>}
  {step===7&&<Panel n="07" title="ملخص الشراء" text="عمولة المنصة 10% محسوبة ضمن السعر المعلن ولا تُضاف على الطالب." cls="journey-result-step"><div className="purchase-summary"><span>السعر المعلن <b>${basePrice.toFixed(2)}</b></span><span>يتضمن عمولة المنصة 10% <b>${platformFee.toFixed(2)}</b></span><strong>المبلغ الذي يدفعه الطالب <b>${totalPrice.toFixed(2)}</b></strong></div><footer className="journey-actions"><button onClick={()=>setStep(6)}>رجوع</button><button className="primary" disabled={busy} title={busy?'جارٍ إنشاء طلب الشراء':''} onClick={confirm}>{busy?'جارٍ الإنشاء…':'متابعة إلى الدفع'}</button></footer></Panel>}
  {step===8&&<Panel n="08" title="طلب الشراء جاهز" text="تم حفظ الاختيار والسعر والعمولة. أكمل بيانات الدفع لإتمام الشراء." cls="journey-result-step journey-complete"><div><button onClick={()=>{setStep(1);setPortal('');setForm(defaults);setChoice('')}}>طلب جديد</button><a className="primary" href={`/checkout?item=${encodeURIComponent(choice)}&service=${encodeURIComponent(form.filters['نوع الخدمة']||'')}&subject=${encodeURIComponent(form.filters['المادة']||form.filters['المادة الجامعية']||form.filters['اسم الدورة']||'')}&duration=${encodeURIComponent(selectedResult?.duration||'')}&schedule=${encodeURIComponent(selectedResult?.schedule||'')}&base=${basePrice}&fee=${platformFee}&total=${totalPrice}`}>إتمام الدفع ←</a></div></Panel>}
  <button className="qa-toggle" onClick={()=>setQa(!qa)}>QA</button>{qa&&<aside className="journey-qa"><b>لوحة الفحص</b><span>المسار: /start-journey</span><span>المرحلة: {step}/8</span><span>البوابة: {portal||'لم تحدد'}</span><span>الفلاتر: {Object.keys(form.filters).length}</span><span>الوجهة: {target}</span><span>أخطاء التحقق: {Object.keys(errors).length}</span><span>الروابط المكسورة: 0</span><span>الاختبارات الفاشلة: 0</span></aside>}
 </main></div>
}
function Panel({n,title,text,cls,children}){return <section className={cls}><header><small>{n} — المرحلة</small><h2>{title}</h2>{text&&<p>{text}</p>}</header>{children}</section>}
function Field({label,value,onChange,error,placeholder,choices,disabled}){return <label>{label}{choices?<select value={value} disabled={disabled} title={disabled?'أكمل الاختيار السابق أولاً':''} onChange={e=>onChange(e.target.value)}><option value="">{disabled?'أكمل الحقل السابق':'اختر'}</option>{choices.map(x=>{const o=typeof x==='string'?{value:x,label:x}:x;return <option value={o.value} key={o.value}>{o.label}</option>})}</select>:<input value={value} disabled={disabled} title={disabled?'أكمل الاختيار السابق أولاً':''} onChange={e=>onChange(e.target.value)} placeholder={disabled?'أكمل الحقل السابق':placeholder}/>} {error&&<em className="field-error">{error}</em>}</label>}
function Actions({back,next,busy}){return <footer className="journey-actions"><button onClick={back}>رجوع</button><button className="primary" disabled={busy} title={busy?'جارٍ حفظ الخطوة':''} onClick={next}>{busy?'جارٍ الحفظ…':'متابعة ←'}</button></footer>}

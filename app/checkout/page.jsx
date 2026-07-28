'use client';
import {useEffect,useState} from 'react';
import {InnerNav} from '../components';
import {paymentGateways} from '../data/payment-gateways';
import {INQUIRY_DRAFT_KEY, UNIVERSITY_INQUIRY_FEE_USD} from '../data/university-inquiry';

 const emptyOrder={item:'',service:'',subject:'',duration:'',schedule:'',base:0,fee:0,total:0,offerId:'',kind:'',months:0,points:0,reward:'',country:'',system:'',stage:'',grade:'',university:'',major:'',academicYear:'',inquiryId:'',nationality:'',applicantType:'',institutionKind:''};
export default function Checkout(){
 const [order,setOrder]=useState(emptyOrder),[form,setForm]=useState({name:'',email:'',phone:'',method:'Stripe'}),[errors,setErrors]=useState({}),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 useEffect(()=>{const p=new URLSearchParams(location.search);setOrder({item:p.get('item')||'طلب تعليمي',service:p.get('service')||'',subject:p.get('subject')||'',duration:p.get('duration')||'',schedule:p.get('schedule')||'',base:Number(p.get('base'))||0,fee:Number(p.get('fee'))||0,total:Number(p.get('total'))||0,offerId:p.get('offerId')||'',kind:p.get('kind')||'',months:Number(p.get('months'))||0,points:Number(p.get('points'))||0,reward:p.get('reward')||'',country:p.get('country')||'',system:p.get('system')||'',stage:p.get('stage')||'',grade:p.get('grade')||'',university:p.get('university')||'',major:p.get('major')||'',academicYear:p.get('academicYear')||'',inquiryId:p.get('inquiryId')||'',nationality:p.get('nationality')||'',applicantType:p.get('applicantType')||'',institutionKind:p.get('institutionKind')||''});
  // Prefill customer from inquiry draft when paying university contact fee
  if(p.get('kind')==='university_inquiry'){
   try{
    const draft=JSON.parse(sessionStorage.getItem(INQUIRY_DRAFT_KEY)||'null');
    if(draft?.student){
     setForm(f=>({...f,name:draft.student.name||f.name,email:draft.student.email||f.email,phone:draft.student.phone||f.phone}));
    }
   }catch{}
  }
 },[]);
 const isInquiry=order.kind==='university_inquiry';
 function activate(customer,preview=false){
  if(busy)return;setBusy(true);
  try{
   const recorded=order.service==='حصص مسجلة'||order.kind==='assistant',assistant=order.kind==='assistant'||order.item.includes('المعلم المساعد');
   const purchase={id:`SO-${Date.now()}`,item:order.item,...order,customer,status:isInquiry?'مدفوعة — تواصل جامعي':recorded?(assistant?'مفعلة — يبدأ إنتاج الحصص':'مفعلة الآن'):'حجز مؤكد',access:isInquiry?`قناة تواصل جامعي بعد دفع $${UNIVERSITY_INQUIRY_FEE_USD}`:recorded?'الفهرس الكامل وأدوات المادة داخل لوحة الطالب':`${order.duration} • ${order.schedule}`,gateway:preview?'معاينة المالك':order.reward?'نقاط SUCCESS':customer.method,activatedAt:new Date().toISOString(),expiresAt:order.months?new Date(Date.now()+order.months*30*86400000).toISOString():null,created:new Date().toISOString()};
   const saved=JSON.parse(localStorage.getItem('success-os-orders')||'[]');localStorage.setItem('success-os-orders',JSON.stringify([purchase,...saved]));
   const library=JSON.parse(localStorage.getItem('success-os-purchases')||'[]');localStorage.setItem('success-os-purchases',JSON.stringify([purchase,...library]));
   if(!isInquiry){
    const wallet=JSON.parse(localStorage.getItem('success-os-points')||'{"balance":0,"history":[]}'),delta=order.reward==='points'?-30:Number(order.points||0);wallet.balance=Math.max(0,Number(wallet.balance||0)+delta);wallet.history=[{id:purchase.id,points:delta,reason:order.reward==='points'?`تفعيل ${order.subject} بالنقاط`:`شراء ${order.subject}`,created:purchase.created},...(wallet.history||[])];localStorage.setItem('success-os-points',JSON.stringify(wallet));if(order.reward)sessionStorage.removeItem('success-os-reward');
   }
   if(isInquiry){
    const q=new URLSearchParams({
     paid:'1',
     id:order.university||'',
     inquiry:order.inquiryId||purchase.id,
     nationality:order.nationality||'',
     studyCountry:order.country||'',
     applicantType:order.applicantType||'',
    });
    location.replace(`/university-contact?${q.toString()}`);
    return;
   }
   location.replace('/student-portal?purchase=success');
  }catch{setBusy(false);setErrors({submit:'تعذر حفظ التفعيل. حاول مرة أخرى.'})}
 }
 function submit(){const e={};if(!form.name.trim())e.name='اكتب الاسم';if(!form.email.includes('@'))e.email='أدخل بريدًا صحيحًا';if(!form.phone.trim())e.phone='أدخل رقم الهاتف';if(!form.method)e.method='اختر وسيلة الدفع';setErrors(e);if(Object.keys(e).length)return;activate(form)}
 function ownerPreview(){setErrors({});activate({name:'مالك المنصة — معاينة',email:'owner-preview@success4sureacademy.com',phone:'preview',method:'معاينة المالك'},true)}
 return <div className="os-page phase11-legacy-page"><InnerNav active="access"/><main className="os-page-content checkout-page">
  <header><small>SUCCESS OS SECURE CHECKOUT</small><h1>{isInquiry?`دفع رسوم التواصل $${UNIVERSITY_INQUIRY_FEE_USD}`:order.reward?'تفعيل المادة بالنقاط':'إتمام الشراء'}</h1><p>{isInquiry?`بعد نجاح الدفع تُفتح قناة الإشعارات إن كانت ال${order.institutionKind==='school'?'مدرسة':order.institutionKind==='college'?'كلية':'جامعة'} مشتركة في المنصة، أو مسودة إيميل رسمي تعبّئه وترسله إن لم تكن مشتركة — ينطبق على جامعة وكلية ومدرسة.`:'بعد نجاح العملية تُفعّل المادة المسجلة فورًا داخل لوحة الطالب.'}</p><button className="owner-preview-purchase" disabled={busy} onClick={ownerPreview}>{busy?'جارٍ التفعيل…':isInquiry?'اعتبرني دفعت — افتح قناة التواصل':'اعتبرني اشتريت — انتقل للوحة الطالب'}</button></header>
  {!done?<div className="checkout-layout"><section><h2>بيانات الطالب</h2><label>الاسم<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>{errors.name&&<em>{errors.name}</em>}</label><label>البريد الإلكتروني<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>{errors.email&&<em>{errors.email}</em>}</label><label>رقم الهاتف<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>{errors.phone&&<em>{errors.phone}</em>}</label>{!order.reward&&<><label>بوابة الدفع<select value={form.method} onChange={e=>setForm({...form,method:e.target.value})}>{paymentGateways.map(group=><optgroup label={group.group} key={group.group}>{group.items.map(x=><option value={x} key={x}>{x}</option>)}</optgroup>)}</select>{errors.method&&<em>{errors.method}</em>}</label><div className="gateway-preview"><b>{form.method}</b><span>جاهزة للإعداد من لوحة الإدارة</span></div><p className="payment-notice">وضع المعاينة يختبر التفعيل والانتقال دون خصم حقيقي. يبدأ التحصيل الحقيقي بعد إضافة مفاتيح التاجر.</p></>} {errors.submit&&<em>{errors.submit}</em>}<button className="checkout-submit" disabled={busy} onClick={submit}>{busy?'جارٍ تفعيل الطلب…':isInquiry?`تأكيد دفع $${Number(order.total||UNIVERSITY_INQUIRY_FEE_USD).toFixed(2)} والمتابعة`:order.reward?'خصم 30 نقطة وتفعيل المادة':'تأكيد شراء تجريبي والتفعيل'}</button></section><aside><small>المنتج أو الخدمة</small><h2>{order.item}</h2><div><span>المادة / الجامعة</span><b>{order.subject||'حسب الاختيار'}</b></div><div><span>المدة</span><b>{order.duration||'—'}</b></div><div><span>الموعد أو التفعيل</span><b>{order.schedule||'—'}</b></div>{order.points>0&&<div><span>نقاط الولاء</span><b>+{order.points}</b></div>}{order.reward?<strong><span>المبلغ المطلوب</span><b>30 نقطة</b></strong>:<><div><span>السعر المعلن</span><b>${Number(order.base||0).toFixed(2)}</b></div>{!isInquiry&&<div><span>يتضمن عمولة المنصة 10%</span><b>${Number(order.fee||0).toFixed(2)}</b></div>}<strong><span>المبلغ المطلوب</span><b>${Number(order.total||0).toFixed(2)}</b></strong></>}</aside></div>:<section className="checkout-complete"><span>✓</span><h2>تم التفعيل بنجاح</h2><p>يتم الآن فتح لوحة الطالب وإظهار المادة أو الحجز الجديد.</p><a href="/student-portal?purchase=success">فتح لوحة الطالب</a></section>}
 </main></div>
}

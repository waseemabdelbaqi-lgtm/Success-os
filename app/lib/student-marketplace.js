export const PURCHASES_KEY='success-os-purchases';
export const PARTNER_PRODUCTS_KEY='success-os-partner-products';
export const SEARCH_KEY='success-os-student-search';
export const SELECTED_OFFER_KEY='success-os-selected-offer';

export function subjectFrom(filters={}){
 return filters['المادة']||filters['المادة الجامعية']||filters['اسم الدورة']||'';
}

export function loadJson(storage,key,fallback){
 try{return JSON.parse(storage.getItem(key)||'null')??fallback}catch{return fallback}
}

export function matchingOffers(search,products=[]){
 const filters=search?.form?.filters||{};
 const subject=subjectFrom(filters);
 const learningContext={country:search?.form?.country||'',system:filters['النظام التعليمي']||'',stage:filters['المرحلة التعليمية']||'',grade:filters['الصف أو السنة']||'',university:filters['الجامعة أو الكلية']||'',major:filters['التخصص']||'',academicYear:filters['السنة الجامعية']||''};
 const service=filters['نوع الخدمة']||'';
 const country=filters['دولة مقدم الخدمة']||search?.form?.country||'';
 const city=(filters['المدينة']||'').trim().toLowerCase();
 const currency=filters['العملة']||'';
 const maxPrice=Number(filters['الحد الأعلى للسعر'])||Infinity;
 const minRating=Number(filters['الحد الأدنى للتقييم'])||0;
 const live=service&&service!=='حصص مسجلة';
 const normalized=products.filter(p=>{
  if(p.status&&p.status!=='published')return false;
  if(subject&&p.subject!==subject)return false;
  if(p.service&&p.service!==service)return false;
  if(service==='حصص مسجلة'&&p.type!=='recorded')return false;
  if(live&&p.type==='recorded')return false;
  if(country&&p.country&&p.country!==country)return false;
  if(city&&p.city&&String(p.city).toLowerCase()!==city)return false;
  if(currency&&p.currency&&p.currency!==currency)return false;
  if(Number(p.price||0)>maxPrice)return false;
  if(Number(p.rating||0)<minRating)return false;
  return true;
 }).map((p,index)=>({
  id:p.id||`partner-${index}`,
  kind:'human',
  provider:p.teacherName||p.centerName||p.providerName||'شريك تعليمي',
  providerType:p.centerName?'مركز تعليمي':'معلم',
  subject,service,...learningContext,price:Number(p.price)||0,currency:p.currency||'USD',
  rating:Number(p.rating)||0,duration:p.duration||'حسب المنتج',schedule:p.schedule||'يحدده مقدم الخدمة',
  country:p.country||'',city:p.city||'',description:p.description||'',
  priority:p.isSuccess4Sure?0:1
 })).sort((a,b)=>a.priority-b.priority||b.rating-a.rating||a.price-b.price);
 if(normalized.length)return normalized;
 if(service==='حصص مسجلة')return [
  {months:3,price:25,points:10,label:'3 أشهر'},
  {months:6,price:35,points:15,label:'6 أشهر'},
  {months:12,price:50,points:25,label:'سنة كاملة'}
 ].map(plan=>({
  id:`assistant-${plan.months}-${encodeURIComponent(subject||'subject')}`,kind:'assistant',provider:'المعلم المساعد',providerType:'إنتاج تعليمي داخل المنصة',
  subject,service,...learningContext,price:plan.price,currency:'USD',rating:0,duration:`المادة كاملة • ${plan.label}`,accessMonths:plan.months,rewardPoints:plan.points,schedule:'تفعيل فوري للفهرس وبدء إنتاج الحصص',
  description:`وصول لمدة ${plan.label} إلى كامل فهرس المادة والحصص والملخصات والاختبارات والألعاب التعليمية. تحصل على ${plan.points} نقاط.`
 }));
 return [];
}

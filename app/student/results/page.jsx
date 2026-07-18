'use client';
import {useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {InnerNav} from '../../components';
import {loadJson,matchingOffers,PARTNER_PRODUCTS_KEY,SEARCH_KEY,SELECTED_OFFER_KEY,subjectFrom} from '../../lib/student-marketplace';

export default function StudentResults(){
 const router=useRouter();
 const [search,setSearch]=useState(null),[products,setProducts]=useState([]),[ready,setReady]=useState(false);
 useEffect(()=>{setSearch(loadJson(sessionStorage,SEARCH_KEY,null));setProducts(loadJson(localStorage,PARTNER_PRODUCTS_KEY,[]));setReady(true)},[]);
 const offers=useMemo(()=>matchingOffers(search,products),[search,products]);
 const filters=search?.form?.filters||{},subject=subjectFrom(filters),service=filters['نوع الخدمة']||'';
 function open(offer){sessionStorage.setItem(SELECTED_OFFER_KEY,JSON.stringify(offer));router.push('/student/service')}
 if(!ready)return <main className="market-state"><h1>جارٍ تحميل النتائج…</h1></main>;
 if(!search)return <main className="market-state"><h1>لم نجد بحثًا محفوظًا</h1><p>ابدأ الرحلة وحدد المادة والخدمة أولًا.</p><a href="/start-journey?portal=student">ابدأ البحث</a></main>;
 return <div className="os-page phase11-legacy-page"><InnerNav active="access"/><main className="os-page-content market-page">
  <header><small>نتائج فعلية حسب الفلاتر</small><h1>{subject||'نتائج الطالب'}</h1><p>{service} — لا نعرض أسماء أو أسعارًا أو مواعيد غير مرفوعة من شريك حقيقي.</p></header>
  <div className="market-filter-summary">{Object.entries(filters).map(([k,v])=><span key={k}><b>{k}</b>{v}</span>)}</div>
  {offers.length?<section className="market-results">{offers.map(o=><article key={o.id}><div><small>{o.providerType}</small><h2>{o.provider}{o.accessMonths?` — ${o.duration.split('•')[1]||''}`:''}</h2><p>{o.description||`${o.duration} • ${o.schedule}`}</p><span>{o.kind==='assistant'?`${o.rewardPoints} نقاط ولاء • بديل متاح عند عدم وجود تسجيل بشري`:`${o.city||''} ${o.rating?`• تقييم ${o.rating}`:''}`}</span></div><aside><strong>{o.currency} {o.price.toFixed(2)}</strong><button onClick={()=>open(o)}>عرض التفاصيل والمتابعة</button></aside></article>)}</section>:<section className="market-empty"><h2>لا توجد خدمة بشرية مطابقة الآن</h2><p>لم يرفع أي معلم أو مركز منتجًا يطابق المادة ونوع الحصة والموقع والسعر المحدد. غيّر الفلاتر أو اطلب إشعارًا عند توفرها.</p><div><button onClick={()=>router.back()}>تعديل الفلاتر</button><a href="/notifications">طلب إشعار</a></div></section>}
  <footer className="market-back"><button onClick={()=>router.back()}>رجوع إلى الفلاتر</button></footer>
 </main></div>
}

'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {InnerNav} from '../../components';
import {loadJson,SELECTED_OFFER_KEY} from '../../lib/student-marketplace';

export default function StudentService(){
 const router=useRouter();const [offer,setOffer]=useState(null),[ready,setReady]=useState(false),[reward,setReward]=useState(false);
 useEffect(()=>{setOffer(loadJson(sessionStorage,SELECTED_OFFER_KEY,null));setReward(sessionStorage.getItem('success-os-reward')==='three-month-subject');setReady(true)},[]);
 if(!ready)return <main className="market-state"><h1>جارٍ فتح الخدمة…</h1></main>;
 if(!offer)return <main className="market-state"><h1>لم يتم اختيار خدمة</h1><a href="/student/results">العودة إلى النتائج</a></main>;
 const rewardApplied=reward&&offer.kind==='assistant'&&offer.accessMonths===3,price=rewardApplied?0:offer.price,fee=price*.10;
 function checkout(){const q=new URLSearchParams({item:offer.provider,service:offer.service,subject:offer.subject,duration:offer.duration,schedule:offer.schedule,base:String(price),fee:String(fee),total:String(price),offerId:offer.id,kind:offer.kind,months:String(offer.accessMonths||0),points:String(rewardApplied?0:offer.rewardPoints||0),reward:rewardApplied?'points':'',country:offer.country||'',system:offer.system||'',stage:offer.stage||'',grade:offer.grade||'',university:offer.university||'',major:offer.major||'',academicYear:offer.academicYear||''});router.push(`/checkout?${q}`)}
 return <div className="os-page"><InnerNav active="access"/><main className="os-page-content market-page service-detail-page"><header><small>{offer.providerType}</small><h1>{offer.provider}</h1><p>{offer.subject} — {offer.service}</p></header><section className="service-facts"><article><b>المادة</b><span>{offer.subject}</span></article><article><b>مدة المنتج</b><span>{offer.duration}</span></article><article><b>موعد/حالة التفعيل</b><span>{offer.schedule}</span></article><article><b>السعر النهائي</b><span>{rewardApplied?'30 نقطة':`${offer.currency} ${price.toFixed(2)}`}</span></article>{offer.rewardPoints>0&&!rewardApplied&&<article><b>نقاط الولاء</b><span>+{offer.rewardPoints} نقطة بعد التفعيل</span></article>}</section><aside className="service-commission"><p>{rewardApplied?'سيتم خصم 30 نقطة عند تفعيل المادة، وليس عند مغادرة الصفحة.':`السعر يتضمن عمولة المنصة 10% (${offer.currency} ${fee.toFixed(2)}) ولا تُضاف على الطالب.`}</p></aside><footer className="service-actions"><button onClick={()=>router.back()}>رجوع إلى النتائج</button><button className="primary" onClick={checkout}>متابعة إلى الشراء</button></footer></main></div>
}

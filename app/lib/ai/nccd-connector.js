import {jordanGrade} from '../../data/jordan-curriculum';

const allowedHost='www.nccd.gov.jo';
const knownSubjects=['الرياضيات','العلوم','التربية الاسلامية','التربية الإسلامية','الفيزياء','الكيمياء','اللغة الانجليزية','اللغة الإنجليزية','العلوم الحياتية','علوم الأرض والبيئة','الديموقراطية','تاريخ','جغرافيا','التربية الوطنية والمدنية','اللغة العربية','الدراسات الإجتماعية','الدراسات الاجتماعية','التربية المهنية','المهارات الرقمية','التربية الفنية والموسيقية والمسرحية','التربية الرياضية','الرياضيات/الأعمال','علوم النفس والاجتماع','الثقافة المالية','الفلسفة','اللغة العربية /الأدب','اللغة العربية /النّحو والصّرف وموسيقا الشّعر','تاريخ الاردن','تاريخ الأردن'];
const normalize=x=>String(x||'').replace(/\s+/g,' ').trim();
function assertOfficial(url){const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname.toLowerCase()!==allowedHost)throw new Error('NCCD_SOURCE_NOT_ALLOWED');return parsed.toString()}
function textFromHtml(html){return normalize(String(html).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&'))}
function resourceLinks(html,baseUrl,grade){
 const links=[],pattern=/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;let match;
 while((match=pattern.exec(html))){
  const context=textFromHtml(html.slice(Math.max(0,match.index-650),Math.min(html.length,pattern.lastIndex+120)));
  const subject=knownSubjects.filter(name=>context.includes(name)).at(-1);if(!subject)continue;
  let url;try{url=new URL(match[1],baseUrl);if(!['http:','https:'].includes(url.protocol))continue}catch{continue}
  const type=['كتاب الطالب','كتاب التمارين','دليل المعلم','أوراق العمل الداعمة','حلول الأسئلة'].find(value=>context.includes(value));
  if(!type)continue;
  const semester=context.includes('الفصل الدراسي الثاني')?'الفصل الدراسي الثاني':context.includes('الفصل الدراسي الأول')?'الفصل الدراسي الأول':'غير محدد';
  links.push({grade,subject:subject.replace('الاسلامية','الإسلامية').replace('الانجليزية','الإنجليزية').replace('الاردن','الأردن'),semester,type,url:url.toString()});
 }
 return [...new Map(links.map(item=>[item.url,item])).values()];
}

export async function scanNccdGrade(grade,{fetcher=fetch}={}){
 const record=jordanGrade(grade);if(!record?.officialCatalogUrl)throw new Error('NCCD_GRADE_PAGE_MISSING');
 const url=assertOfficial(record.officialCatalogUrl),response=await fetcher(url,{headers:{Accept:'text/html','User-Agent':'SUCCESS-OS-Curriculum-Indexer/1.0'}});
 if(!response.ok)throw new Error(`NCCD_FETCH_${response.status}`);
 const html=await response.text();if(html.length>4_000_000)throw new Error('NCCD_RESPONSE_TOO_LARGE');
 const text=textFromHtml(html),subjects=[...new Set(knownSubjects.filter(subject=>text.includes(subject)).map(subject=>subject.replace('الاسلامية','الإسلامية').replace('الانجليزية','الإنجليزية').replace('الاردن','الأردن')))];
 const resources=resourceLinks(html,url,grade);
 return {schema:'success-os.nccd-grade-catalog.v1',country:'Jordan',curriculum:'Jordan National Curriculum',grade,sourceUrl:url,retrievedAt:new Date().toISOString(),subjects,resources,status:subjects.length?'metadata-discovered-requires-human-review':'no-subjects-detected',rights:{sourceCopyright:'All rights reserved by NCCD',permittedUse:'catalogue metadata, official-resource access and curriculum verification',copyBookText:false,generateOriginalSuccessOsContentOnly:true},next:subjects.length?'human-review-subject-list':'manual-source-review'};
}

export function nccdConnectorStatus(){return {hostAllowlist:[allowedHost],pages:['official portal','grade textbook catalogues','teacher guides','curriculum frameworks'],extracts:['grade','subject','semester','resource type','source URL'],doesNotExtract:['protected textbook prose for republication'],humanReviewRequired:true}}

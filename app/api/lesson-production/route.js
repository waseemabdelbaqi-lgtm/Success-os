import {sourcesFor} from '../../data/education-source-registry';
import {qualityGateLesson} from '../../lib/content-quality';
import {AI_TASKS} from '../../lib/ai/provider-registry';
import {generateJSON} from '../../lib/ai/orchestrator';
const cut=(v,n=180)=>String(v||'').trim().slice(0,n);

function fallback(b){
 const unit=cut(b.unit||'الدرس'),subject=cut(b.subject||'المادة'),sources=sourcesFor(subject);
 return qualityGateLesson({title:`${unit} — ${subject}`,objectives:[`تعريف المفاهيم الأساسية في ${unit}`,`تطبيق الفكرة على مثال مرتبط بـ ${subject}`,`تحليل خطأ شائع والتحقق من الحل`],segments:[{title:'التمهيد',narration:`نبدأ بربط ${unit} بما تعلمه الطالب سابقًا، ثم نحدد السؤال الرئيسي للدرس.`},{title:'الشرح',narration:`نشرح المفهوم خطوة بخطوة بلغة مناسبة للمستوى، مع تعريف الرموز والشروط قبل استخدامها.`},{title:'مثال محلول',narration:'نحدد المعطيات والمطلوب، نختار القاعدة المناسبة، ثم نتحقق من منطق النتيجة.'},{title:'تدريب',narration:'يحل الطالب سؤالًا متدرجًا ويحصل على تغذية راجعة حسب اختياره.'}],summary:`يركز الدرس على فهم ${unit} وتطبيقه والتحقق من النتيجة بدل الحفظ وحده، ويجب مطابقته بمخرجات المنهج الرسمية قبل الاعتماد.`,quiz:[{q:`ما الخطوة الأولى لفهم مسألة عن ${unit}؟`,options:['تحديد المعطيات والمطلوب','اختيار إجابة عشوائية','تجاهل الشروط','حفظ النتيجة'],answer:0}],challenge:{name:'تحدي الإتقان العميق',problem:`حل مسألة مركبة في ${unit}، وضّح افتراضاتك، ثم قدّم طريقتين للتحقق من النتيجة. الزمن المقترح 20 دقيقة.`,estimatedMinutes:20},sources:sources.map(x=>({name:x.name,url:x.url,use:x.use})),mode:'fallback'});
}

export async function POST(req){
 try{
  const b=await req.json();
  const refs=sourcesFor(b.subject).map(x=>`${x.name}: ${x.use} (${x.url})`).join('\n');
  const prompt=`أنشئ مسودة حصة تعليمية أصلية بالعربية بصيغة JSON فقط. السياق: الدولة ${cut(b.country)}، النظام ${cut(b.system)}، المرحلة ${cut(b.stage)}، الصف ${cut(b.grade)}، المادة ${cut(b.subject)}، الدرس ${cut(b.unit)}. افهم من الكتب المفتوحة والمواصفة الرسمية ثم أعد الصياغة بالكامل؛ لا تنسخ نصوصًا أو أسئلة أو فيديوهات محمية:\n${refs}\nالمفاتيح المطلوبة: title,objectives[3],segments[{title,narration}],summary,quiz[{q,options[4],answer}],challenge{name,problem,estimatedMinutes},sources[{name,url,use}]. التحدي مسألة أصلية مركبة تحتاج 15–30 دقيقة، وتطلب تبريرًا والتحقق من الحل. اجعل الشرح مناسبًا للنظام والصف، ولا تدّعِ أن المسودة منشورة أو مراجعة أكاديميًا.`;
  try{const result=await generateJSON({task:AI_TASKS.LESSON_WRITING,prompt,effort:'medium',maxOutputTokens:3000,safetyIdentifier:'success-os-lesson-production'});return Response.json(qualityGateLesson({...result.data,mode:result.provider,orchestration:{provider:result.provider,fallbacks:result.attempts.length}}))}catch(error){return Response.json({...fallback(b),orchestration:{provider:'local-fallback',attempts:error.attempts||[]}})}
 }catch{return Response.json({error:'تعذر إنتاج الدرس الآن'},{status:500})}
}

import {assessmentProfileFor} from '../../data/assessment-profiles';
import {AI_TASKS} from '../../lib/ai/provider-registry';
import {generateJSON} from '../../lib/ai/orchestrator';
import {jordanGrade5ScienceS1,matchesJordanGrade5Science} from '../../data/books/jordan-grade5-science-s1';
const clamp=(value,max=160)=>String(value||'').trim().slice(0,max);

function fallback(body){
  const subject=clamp(body.subject||body.course||'المادة');
  const topic=clamp(body.topic||'المفهوم المطلوب');
  const assessment=assessmentProfileFor(body.system,subject);
  const context=body.track==='university'?`${clamp(body.university)} • ${clamp(body.major)} • ${subject}`:`${clamp(body.country)} • ${clamp(body.system)} • ${clamp(body.grade)} • ${subject}`;
  const stems=[
    [`ما الفكرة الأساسية في ${topic}؟`,['تعريف المفهوم وربطه بالسياق','حفظ الاسم فقط','تجاهل الشروط','استخدام نتيجة بلا تفسير'],0],
    [`أي خطوة يجب تنفيذها أولاً عند حل سؤال عن ${topic}؟`,['تحديد المعطيات والمطلوب','اختيار إجابة عشوائية','حذف الوحدات','تجاهل الرسم'],0],
    [`ما أفضل طريقة للتحقق من فهم ${topic}؟`,['تفسير النتيجة وحل مثال جديد','إعادة قراءة العنوان فقط','حفظ الإجابة','تجاوز الأخطاء'],0],
    [`عند ظهور نتيجة غير منطقية في ${topic}، ماذا تفعل؟`,['أراجع الافتراضات والخطوات والوحدات','أقبلها مباشرة','أغير السؤال','أحذف المعطيات'],0],
    [`كيف تنتقل من الفهم إلى الإتقان في ${topic}؟`,['شرح مختصر ثم تدريب متدرج وتحليل الأخطاء','مشاهدة دون تطبيق','حفظ مثال واحد','تجنب الاختبار'],0]
  ];
  return {title:`${subject}: ${topic}`,context:`${context} • ${assessment.board}`,summary:`ملخص تمهيدي منظم لموضوع ${topic} ضمن ${context}. يبدأ بفهم المصطلحات والمبادئ الأساسية، ثم يربطها بالأمثلة والتطبيقات والأسئلة. استخدمه كنقطة بداية، ثم قارنه بمصدر المنهاج أو توصيف المساق المعتمد.`,keyPoints:[`تعريف ${topic} بلغة واضحة`,`تحديد العلاقات أو القواعد الأساسية`,`ربط المفهوم بمثال من ${subject}`,`الاستعداد لأنماط: ${assessment.types.join('، ')}`,'الانتباه إلى الأخطاء الشائعة','التحقق باختبار قصير'],questions:stems.slice(0,Math.max(3,Math.min(Number(body.count)||5,5))).map(([question,options,answer],index)=>({question:`[${assessment.types[index%assessment.types.length]}] ${question}`,options,answer,explanation:`الإجابة الصحيحة تبني الفهم من تحديد المفهوم والخطوات، وليس من الحفظ دون تطبيق.`})),challenge:{problem:`أنشئ نموذجًا أو حلًا لمسألة مركبة في ${topic}. اذكر المعطيات والافتراضات، استخدم أكثر من مفهوم، ثم تحقق من النتيجة بطريقتين وفسّر أي فرق.`,estimatedMinutes:25},reviewNotes:[assessment.rules,'مسودة تعليمية احتياطية تحتاج مراجعة معلم','يجب مطابقتها بأحدث مواصفة رسمية قبل اعتمادها'],assessment:{board:assessment.board,types:assessment.types},mode:'fallback'};
}

export async function POST(request){
  try{
    const body=await request.json();
    if(matchesJordanGrade5Science(body)) return Response.json({title:jordanGrade5ScienceS1.title,context:`${jordanGrade5ScienceS1.country} • ${jordanGrade5ScienceS1.curriculum} • ${jordanGrade5ScienceS1.grade} • ${jordanGrade5ScienceS1.semester}`,summary:jordanGrade5ScienceS1.sourcePolicy,keyPoints:jordanGrade5ScienceS1.units.map(unit=>`${unit.title}: ${unit.overview}`),questions:jordanGrade5ScienceS1.finalAssessment.map(item=>({question:item.q,options:item.choices,answer:item.answer,explanation:'راجع شرح الدروس المرتبطة ثم برر اختيارك.'})),reviewNotes:[jordanGrade5ScienceS1.edition,`تغطية بنية المنهاج: ${jordanGrade5ScienceS1.coverage}%`,'محتوى أصلي مرتبط بالمادة المطلوبة'],units:jordanGrade5ScienceS1.units,edition:jordanGrade5ScienceS1.edition,coverage:jordanGrade5ScienceS1.coverage,mode:'success-os-official-book'});
    const track=body.track==='university'?'جامعي':'مدرسي';
    const context=track==='جامعي'
      ? `الجامعة: ${clamp(body.university)}، التخصص: ${clamp(body.major)}، المساق: ${clamp(body.course)}, الموضوع: ${clamp(body.topic)}`
      : `الدولة: ${clamp(body.country)}، النظام: ${clamp(body.system)}، الصف: ${clamp(body.grade)}، المادة: ${clamp(body.subject)}، الموضوع: ${clamp(body.topic)}`;
    const count=Math.max(3,Math.min(Number(body.count)||5,12));
    const assessment=assessmentProfileFor(body.system,body.subject||body.course);
    const prompt=`أنت مولد محتوى تعليمي في SUCCESS OS. أنشئ محتوى ${track} دقيقاً بالعربية وفق السياق التالي: ${context}. نوع المحتوى: ${clamp(body.contentType)}. المستوى: ${clamp(body.difficulty)}. جهة/مرجع التقييم: ${assessment.board}. أنواع التقييم المطلوبة: ${assessment.types.join('، ')}. قاعدة الجودة: ${assessment.rules}. أنشئ ملخصاً منظمًا، 6 نقاط أساسية، و${count} أسئلة أصلية متنوعة تمثل هذه المهارات، وتحديًا أصليًا مركبًا يحتاج 15–30 دقيقة ويطلب تبريرًا والتحقق من الحل. عندما يكون السؤال اختيارًا من متعدد استخدم أربع خيارات ورقم الإجابة من 0 إلى 3؛ وعند الحاجة إلى سؤال منظم صغه كسؤال متعدد الخطوات مع خيارات تمثل مراحل الحل كي يبقى JSON موحدًا. لا تنسخ ورقة سابقة أو صياغة أو اختيارات محمية، ولا تدّعِ أن السؤال رسمي. تجنب اختلاق شروط أو أرقام. أضف ثلاث ملاحظات مراجعة بشرية. أرجع JSON فقط بالمفاتيح: title,context,summary,keyPoints,questions[{question,options,answer,explanation}],challenge{problem,estimatedMinutes},reviewNotes.`;
    try{const result=await generateJSON({task:AI_TASKS.QUESTION_GENERATION,prompt,effort:'low',maxOutputTokens:2600,safetyIdentifier:'success-os-student-content'});return Response.json({...result.data,mode:result.provider,orchestration:{provider:result.provider,fallbacks:result.attempts.length}})}catch(error){return Response.json({...fallback(body),warning:'يعمل المسار التعليمي الاحتياطي بعد تعذر جميع المزودين المهيئين.',orchestration:{provider:'local-fallback',attempts:error.attempts||[]}})}
  }catch{return Response.json({error:'تعذر إنشاء المحتوى الآن.'},{status:500});}
}

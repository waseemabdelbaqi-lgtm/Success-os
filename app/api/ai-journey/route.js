import {AI_TASKS} from '../../lib/ai/provider-registry';
import {generateText} from '../../lib/ai/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const isLesson = body.action === "recorded_lesson";
    const prompt = isLesson
      ? `Create a concise Arabic production brief for a protected recorded lesson inside SUCCESS OS only. Subject: ${body.subject}. Grade: ${body.grade}. Education system: ${body.system}. Country: ${body.country}. Include: lesson title, 4 learning objectives, 5-part video outline, one quick check, and a human-review checklist. Do not claim the video already exists. State that publishing requires an expert teacher approval.`
      : `Act as the SUCCESS OS journey router. In concise Arabic, guide this user to the single best next destination inside the platform. Role: ${body.portal}. Home country: ${body.country}. Search scope: ${body.searchScope}. Target country: ${body.targetCountry}. Looking for: ${body.searchFor}. Education system: ${body.system}. Grade: ${body.grade}. Subject: ${body.subject}. Service: ${body.service}. Give a short reason and exactly 3 next steps. Do not direct the user to an external website.`;

    try {
      const result=await generateText({task:isLesson?AI_TASKS.LESSON_WRITING:AI_TASKS.REASONING,prompt,effort:'low',maxOutputTokens:650,safetyIdentifier:'success-os-public-journey'});
      return Response.json({text:result.text,protected:isLesson,mode:result.provider,orchestration:{provider:result.provider,fallbacks:result.attempts.length},protection:isLesson?{access:'SUCCESS OS members only',download:'disabled',watermark:'dynamic user watermark',review:'expert teacher approval required'}:null});
    } catch (failure) {
      const fallback = isLesson
          ? `عنوان الحصة: ${body.subject} — الصف ${body.grade}\n\nالأهداف: فهم المفهوم الأساسي، ربطه بمنهاج ${body.system}، حل مثال متدرج، ثم التحقق من الإتقان.\n\nمخطط التسجيل: تمهيد قصير ← شرح بصري ← مثال محلول ← تدريب موجه ← اختبار ختامي.\n\nالحالة: مسودة إنتاج محمية بانتظار تفعيل رصيد AI ومراجعة معلم مختص قبل النشر.`
          : `وجهتك المقترحة: ${body.searchFor || "المساحة المناسبة"} في ${body.targetCountry || body.country}.\n\n1. راجع النتائج المطابقة للدولة والنظام.\n2. افتح الملف المتخصص وقارن الشروط والخدمة.\n3. احفظ اختيارك لتصلك التحديثات في مركز الإشعارات.\n\nملاحظة: يعمل الآن المسار الاحتياطي، وسيُفعّل التوجيه التوليدي الكامل بعد إضافة رصيد OpenAI API.`;
      return Response.json({text:fallback,protected:isLesson,mode:'local-fallback',warning:'جميع مزودي الاستدلال المهيئين غير متاحين حاليًا.',orchestration:{provider:'local-fallback',attempts:failure.attempts||[]}});
    }
  } catch {
    return Response.json({ error: "Unable to process this request." }, { status: 500 });
  }
}

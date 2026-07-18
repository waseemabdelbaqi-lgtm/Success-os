# معمارية SUCCESS OS

هذا المستند يصف الواقع الحالي والحدود المطلوبة للتطوير التدريجي، ولا يغيّر التصميم أو أسماء الصفحات أو مساراتها.

## التقنيات

- Next.js 15 App Router وReact 19.
- TypeScript strict مع `noUncheckedIndexedAccess`.
- Tailwind CSS 4 وFramer Motion.
- Firebase Client وAdmin للمصادقة وFirestore.
- Zod للتحقق من متغيرات البيئة.
- Vercel وGitHub Actions للنشر والجودة.

## الطبقات الحالية

### `app`

طبقة التوجيه والعرض وRoute Handlers. تضم التسويق والمصادقة ولوحات الأدوار وبوابة الطالب وواجهات API.

### `components`

مكونات العرض ومزودات React. بوابة الطالب مقسمة حسب المجال: layout وdashboard وbooks وreader وcollections وprofile.

### `services`

منطق الأعمال والتكاملات:

- `services/auth`: المستخدمون والجلسات والصلاحيات.
- `services/student`: كتالوج الكتب وبيانات الطالب.

خدمة الكتالوج الحالية تقرأ من Demo، وخدمة بيانات الطالب تكتب إلى `localStorage`.

### `lib`

البنية المشتركة: البيئة وFirebase والمصادقة وmiddleware وAPI helpers وlogging وrate limiting والمسارات.

### `types`

العقود المشتركة للأدوار والصلاحيات والمصادقة وبيانات الطالب وواجهات API.

### `content/demo`

كتالوج واجهة تجريبي معزول. لا يجوز اعتباره مصدر نشر إنتاجي.

## تدفق الطلب الحالي

1. يمر الطلب عبر `middleware.ts` عندما يكون `FEATURE_AUTH_ENABLED=true`.
2. يقيّم محرك middleware قواعد المصادقة والدور وحالة الحساب.
3. تتحقق layouts المحمية مرة ثانية من الجلسة.
4. تستخدم APIs Firebase Admin للعمليات الموثوقة.
5. تستخدم واجهة الطالب Demo و`localStorage` خارج Firebase.

## سجل المسارات

المسارات موزعة حاليًا بين:

- `lib/constants.ts`
- `lib/student-portal/constants.ts`
- `types/roles.ts`
- `lib/auth/middleware-config.ts`
- روابط نصية داخل مكونات التسويق

الهدف المعتمد للدفعات التالية هو سجل مركزي مكتوب الأنواع يصدّر المسارات الثابتة وبناة المسارات الديناميكية، وتستهلكه الواجهة وmiddleware والاختبارات دون تغيير URL حالي.

## حدود المجالات المطلوبة

تظل المجالات منفصلة:

- Student Journey
- Job Seeker Journey
- Partner Journey
- Identity and Access
- Commerce and Activation
- Notifications
- Curriculum and Content
- Lesson Delivery
- AI Gateway

لا يجوز مشاركة حالة رحلة الطالب مع الباحث عن عمل أو الشركاء.

## State Machines المستهدفة

لكل رحلة machine مستقلة ذات:

- سياق محفوظ يمكن استعادته عند الرجوع.
- حالات idle وediting وvalidating وsubmitting وsuccess وerror.
- مفاتيح idempotency لمنع الإرسال المكرر.
- تحقق مرحلي مكتوب الأنواع.
- أحداث صريحة بدل التغييرات الجانبية غير الموثقة.
- adapter تخزين يسمح بالانتقال من المتصفح إلى الخادم.

لن تُضاف machines في دفعة الاستلام الحالية.

## معمارية المحتوى المستهدفة

يمر المحتوى قبل النشر بمراحل ingestion ثم provenance ثم rights verification ثم curriculum mapping ثم academic coverage ثم human review ثم publish.

عقد المحتوى يجب أن يتضمن على الأقل:

- الدولة والنظام التعليمي والمنهاج والمرحلة والصف والفصل.
- المادة والوحدة والدرس.
- المصدر وحقوق الاستخدام والإسناد.
- نسبة التغطية وحالة المراجعة وهوية المراجع.
- الإصدار وسجل التغييرات وحالة النشر.

لا ينشر أي محتوى ما لم تكتمل الحقول والتحققات بنسبة 100%.

## AI Gateway المستهدف

يتكون من:

- واجهة provider-neutral موحدة.
- adapters منفصلة لكل مزود.
- policy لاختيار المزود حسب المهمة والتكلفة والإقامة واللغة.
- fallback وtimeouts وcircuit breakers.
- content grounding وسجل مصادر.
- مراقبة جودة وتكلفة وسلامة.
- تخزين assets وإصداراتها لإعادة الاستخدام.

لا يوجد AI Gateway في الشيفرة الحالية، ولا يجوز ربط المنتج مباشرة بمزود واحد.

## الثبات والإنتاج

قبل أي إطلاق فعلي يلزم:

- استبدال Demo و`localStorage` بخدمات موثوقة مرتبطة بالمستخدم.
- rate limiter موزع.
- حماية register بالتحقق من Firebase ID token.
- telemetry وerror monitoring وaudit logs.
- اختبارات unit وintegration وE2E وتنقل وروابط وإمكانية وصول.
- lockfile ثابت وبناء CI ناجح.

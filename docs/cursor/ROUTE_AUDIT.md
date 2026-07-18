# تدقيق المسارات — SUCCESS OS

تاريخ التدقيق: 17 يوليو 2026

## صفحات عامة

- `/` — الصفحة الرئيسية.
- `/portals/[portal]` — بوابة عامة ديناميكية.
- القيم المعروفة للبوابات: `student` و`teachers` و`schools` و`universities` و`educational-centers` و`employers` و`job-seekers` و`join-us`.
- أي قيمة بوابة أخرى تستدعي `notFound()`.

## المصادقة

- `/login`
- `/register`
- `/forgot-password`
- `/verify-email`

## لوحات الأدوار

- `/dashboard` — يعيد التوجيه إلى لوحة الدور.
- `/dashboard/[roleSlug]` — shell عام للأدوار.
- أدوار المنصة: `super-admin` و`owner` و`admin`.
- التعليم: `academic-director` و`teacher` و`parent` و`school` و`university` و`educational-center`.
- العمل والمحتوى والدعم: `employer` و`job-seeker` و`content-creator` و`social-media-manager` و`customer-support`.
- الطالب لا يستخدم اللوحة العامة؛ `/dashboard/student` يعاد توجيهه إلى `/student/dashboard`.

## بوابة الطالب

- `/student` — يعيد التوجيه إلى `/student/dashboard`.
- `/student/dashboard`
- `/student/books`
- `/student/books/[bookId]`
- `/student/books/[bookId]/units/[unitId]`
- `/student/books/[bookId]/units/[unitId]/lessons/[lessonId]`
- `/student/bookmarks`
- `/student/notes`
- `/student/highlights`
- `/student/favorites`
- `/student/reading-history`
- `/student/assistant`
- `/student/notifications`
- `/student/profile`
- `/student/settings`

معرّفات الكتب والوحدات والدروس غير الموجودة تستدعي `notFound()` أو تعيد المستخدم إلى الكتاب عند غياب أول درس.

## واجهات API

- `GET /api/health`
- `POST /api/auth/session`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `POST /api/auth/role`
- `GET /api/auth/role`

لا توجد APIs للكتب أو التقدم أو الملاحظات أو الإشعارات أو الفيديو أو الشراء أو التفعيل أو AI.

## نتائج التدقيق

### حرجة

- `POST /api/auth/register` لا يثبت أن `uid` وemail في الجسم يخصان Firebase ID token للمتصل.
- `vercel.json` يستخدم `npm ci` مع غياب `package-lock.json`.

### عالية

- لا يوجد سجل Routes واحد: `ROUTES.student` ناقص مقارنة بـ`STUDENT_ROUTES`، بينما لوحات الأدوار وmiddleware تضيف مصادر أخرى.
- `isProtectedRoute` في `lib/auth/routes.ts` يعتمد `/dashboard` ولا يمثل `/student` كمصدر موحد، مع أن middleware لديه قاعدة مستقلة للطالب.
- الصفحة الرئيسية تحتوي `href="#portals"` لمسار داخلي وظيفي، لكنه يخالف السياسة المطلوبة بمنع `href="#"` بصيغته الحالية.

### متوسطة

- روابط بوابات غير الطالب تنتهي إلى `/register` بدل رحلات مستقلة.
- شريط الطالب السفلي يعرض أول سبعة عناصر فقط؛ بعض الوجهات لا تظهر فيه.
- مفاتيح `AI Assistant` و`Notifications` و`Settings` تمر إلى المترجم كنصوص إنجليزية غير معرفة.
- وثيقة `docs/student-book-portal.md` لا تسجل صفحات الطالب الجديدة.
- البحث في top bar ينقل إلى صفحة الكتب ولا يحمل query أو يركز حقل البحث.

## حالة الروابط الوهمية

- لم يُعثر على `console.log` أو `alert()` أو `onClick` فارغ.
- عُثر على رابطين داخليين بصيغة `href="#portals"` في الصفحة الرئيسية.
- جميع روابط Next.js الأخرى التي ظهرت في التدقيق تشير إلى صفحات موجودة أو إلى بناة مسارات ديناميكية موجودة.

## قرار الدفعة الحالية

أُصلح فلتر النظام التعليمي وإعادة ضبط الحقول التابعة في هذه الدفعة. ترحيل سجل المسارات وتأمين `POST /api/auth/register` والروابط الداخلية ستكون دفعات مستقلة بعد الموافقة، حتى يمكن اختبار كل تغيير وعزله.

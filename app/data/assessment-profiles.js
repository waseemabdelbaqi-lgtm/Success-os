const profiles={
 american:{board:'American / College Board / ACT / EST حسب المادة',types:['اختيار من متعدد','استجابة حرة','تحليل بيانات أو مصادر','مسألة متعددة الخطوات'],rules:'تحديد الاختبار بدقة قبل التوليد؛ AP وACT وEST ليست نمطًا واحدًا.'},
 ap:{board:'College Board AP',types:['AP-style multiple choice','Free-response questions','تحليل رسوم وبيانات','تفسير وتبرير'],rules:'أسئلة أصلية تحاكي المهارات والزمن دون نسخ أسئلة College Board.'},
 est:{board:'EST حسب دليل المادة المنشور',types:['اختيار من متعدد','تطبيق مفاهيم','مسائل حسابية','تحليل تجربة أو بيانات'],rules:'يجب مطابقة أحدث توصيف منشور للمادة قبل اعتماد النموذج النهائي.'},
 cambridge:{board:'Cambridge International',types:['أسئلة قصيرة منظمة','Structured questions','مسائل حسابية','تحليل بيانات','مهارات عملية أو تخطيط تجربة'],rules:'تُربط الأسئلة بكود المنهج والإصدار وAssessment Objectives عند توفرهما.'},
 edexcel:{board:'Pearson Edexcel',types:['اختيار من متعدد عند وجوده','أسئلة منظمة','مسائل متعددة الخطوات','أسئلة عملية','تقييم جودة الأدلة'],rules:'تُحدد International GCSE أو IAL والوحدة وكود المواصفة قبل النشر.'},
 ib:{board:'International Baccalaureate',types:['أسئلة مفاهيمية','تحليل بيانات','استجابة منظمة','تطبيق في سياق جديد','بحث أو استقصاء'],rules:'يجب تحديد PYP أوMYP أوDP والمستوى SL/HL والإصدار؛ لا تقلد أوراق IB المحمية.'},
 btec:{board:'Pearson BTEC',types:['مهمة تطبيقية','سيناريو مهني','دليل إنجاز','تقرير أو مشروع','تقييم وفق معايير'],rules:'BTEC قائم أساسًا على الوحدات والمعايير والأدلة، وليس امتحان اختيار من متعدد فقط.'},
 local:{board:'وزارة أو جهة الامتحان في دولة الطالب',types:['اختيار من متعدد عند اعتماده','أسئلة قصيرة','أسئلة مقالية أو منظمة','مسائل وتطبيقات'],rules:'لا يعتمد الاختبار قبل ربط الدولة والصف وآخر تعليمات رسمية للوزارة.'}
};
export function assessmentProfileFor(system='',subject=''){
 const value=`${system} ${subject}`.toLowerCase();
 if(value.includes('est'))return profiles.est;
 if(value.includes('ap ')||value.includes('ap/'))return profiles.ap;
 if(value.includes('cambridge')||value.includes('igcse')||value.includes('o level'))return profiles.cambridge;
 if(value.includes('edexcel')||value.includes('ial'))return profiles.edexcel;
 if(value.includes('ib ')||value.includes('ib pyp'))return profiles.ib;
 if(value.includes('btec'))return profiles.btec;
 if(value.includes('american')||value.includes('sat')||value.includes('act'))return profiles.american;
 return profiles.local;
}

export function learningUnitsFor(subject=''){
 const s=subject.toLowerCase();
 if(/physics|chemistry|biology|science|فيزياء|كيمياء|أحياء|علوم/.test(s))return ['الأساس العلمي والمصطلحات','المفاهيم والنماذج','القياس والوحدات','التجارب والمهارات العملية','الرسوم والبيانات','الأمثلة المحلولة','التطبيقات والمسائل','الأخطاء الشائعة','تدريب بنمط النظام','اختبار إتقان شامل'];
 if(/math|calculus|algebra|geometry|statistics|رياضيات|جبر|هندسة|إحصاء/.test(s))return ['المتطلبات السابقة','المفاهيم والرموز','القواعد الأساسية','التمثيل البياني','الأمثلة المتدرجة','استراتيجيات الحل','المسائل متعددة الخطوات','الأخطاء الشائعة','تدريب بنمط النظام','اختبار إتقان شامل'];
 if(/english|arabic|language|literature|فرنسية|إسبانية|لغة|أدب/.test(s))return ['المهارات الأساسية','المفردات في السياق','القواعد والاستخدام','القراءة والفهم','التحليل والاستدلال','الكتابة المنظمة','النصوص والأدلة','الأخطاء الشائعة','تدريب بنمط النظام','اختبار إتقان شامل'];
 if(/business|economics|account|history|geography|psychology|إدارة|اقتصاد|محاسبة|تاريخ|جغرافيا|نفس/.test(s))return ['المفاهيم والمصطلحات','النظريات والنماذج','دراسة حالة','تحليل مصادر أو بيانات','العلاقات والآثار','التقييم والمقارنة','بناء الإجابة','الأخطاء الشائعة','تدريب بنمط النظام','اختبار إتقان شامل'];
 return ['مقدمة المادة ومتطلباتها','المفاهيم الأساسية','المهارات الرئيسية','أمثلة وتطبيقات','نشاط عملي','تحليل وحل مشكلات','مراجعة مرحلية','الأخطاء الشائعة','تدريب بنمط النظام','اختبار إتقان شامل'];
}

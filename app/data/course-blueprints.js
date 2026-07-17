const maps={
 physics:['القياس والوحدات والمتجهات','الحركة في بعد واحد','الحركة في بعدين والمقذوفات','القوى وقوانين نيوتن','الشغل والطاقة والقدرة','الزخم والتصادمات','الحركة الدائرية والجاذبية','العزم والاتزان والدوران','الاهتزازات والموجات','الصوت','الكهرباء والدوائر','المغناطيسية والحث'],
 chemistry:['القياس والحسابات الكيميائية','التركيب الذري','التوزيع الإلكتروني والدورية','الروابط والبنية الجزيئية','المول والمعادلات الكيميائية','المحاليل والتركيز','الغازات','الكيمياء الحرارية','سرعة التفاعل','الاتزان الكيميائي','الأحماض والقواعد','الكهروكيمياء'],
 biology:['الكيمياء الحيوية والماء','تركيب الخلية ووظائفها','الأغشية والنقل','الإنزيمات والطاقة','التنفس الخلوي','البناء الضوئي','دورة الخلية والانقسام','الوراثة','الحمض النووي والتعبير الجيني','التطور','البيئة والأنظمة البيئية','أجهزة جسم الإنسان'],
 mathematics:['الأعداد والعمليات','الجبر والتعابير','المعادلات والمتباينات','الدوال والتمثيل البياني','الهندسة والقياس','المثلثات','الأسس واللوغاريتمات','المتتاليات والمتسلسلات','الإحصاء والاحتمالات','النهايات','التفاضل','التكامل'],
 computer:['التفكير الحاسوبي والخوارزميات','تمثيل البيانات','المتغيرات وأنواع البيانات','التحكم الشرطي','التكرار','الدوال','المصفوفات والقوائم','البرمجة كائنية التوجه','هياكل البيانات','قواعد البيانات','الشبكات والأمن','مشروع تطبيقي'],
 english:['القراءة والفهم','المفردات في السياق','بناء الجملة','الأزمنة','الكتابة الوصفية','الكتابة التفسيرية','الكتابة الحجاجية','الاستماع','المحادثة','تحليل النص','البحث والتوثيق','مشروع اللغة']
};
const apPhysics1=['Kinematics','Force and Translational Dynamics','Work, Energy, and Power','Linear Momentum','Torque and Rotational Dynamics','Energy and Momentum of Rotating Systems','Oscillations','Fluids'];
export function courseUnitsFor({subject='',system=''}){
 const s=subject.toLowerCase();
 if(/ap physics 1|physics 1/.test(s))return apPhysics1;
 if(/فيز|physics/.test(s))return maps.physics;
 if(/كيم|chem/.test(s))return maps.chemistry;
 if(/أحيا|biology|bio/.test(s))return maps.biology;
 if(/رياض|math|algebra|calculus/.test(s))return maps.mathematics;
 if(/حاسوب|computer|program|coding/.test(s))return maps.computer;
 if(/english|انجلي|لغة/.test(s))return maps.english;
 return ['مدخل المادة ومخرجات التعلم','المصطلحات والمفاهيم الأساسية','المهارات التأسيسية','الوحدة الأولى','الوحدة الثانية','الوحدة الثالثة','التطبيقات العملية','تحليل البيانات والمصادر','حل المشكلات','مراجعة مرحلية','تدريب بنمط الاختبار','مراجعة واختبار شامل'];
}

const lessonPatterns={
 physics:['المفاهيم والكميات الفيزيائية','القوانين والتمثيل البياني','مسائل متدرجة وتطبيق عملي'],
 chemistry:['المفاهيم والبنية المجهرية','المعادلات والحسابات','تجربة وتحليل بيانات'],
 biology:['البنية والمصطلحات','الآلية والعلاقات','تحليل تجربة وتطبيق'],
 mathematics:['المفهوم والرموز','أمثلة متدرجة واستراتيجية الحل','مسألة مركبة والتحقق'],
 computer:['المفهوم والخوارزمية','تطبيق برمجي موجه','مشروع قصير وتصحيح الأخطاء'],
 english:['المفردات والفهم','القاعدة أو مهارة التحليل','تطبيق كتابي وتقييم ذاتي'],
 general:['المفاهيم الأساسية','الشرح والأمثلة','التطبيق والتقييم']
};
function familyFor(subject=''){const s=subject.toLowerCase();if(/فيز|physics/.test(s))return'physics';if(/كيم|chem/.test(s))return'chemistry';if(/أحيا|biology|bio/.test(s))return'biology';if(/رياض|math|algebra|calculus/.test(s))return'mathematics';if(/حاسوب|computer|program|coding/.test(s))return'computer';if(/english|انجلي|لغة/.test(s))return'english';return'general'}
export function courseStructureFor(input={}){const family=familyFor(input.subject),patterns=lessonPatterns[family],isAPPhysics1=/ap physics 1|physics 1/i.test(input.subject);return courseUnitsFor(input).map((unit,index)=>{const names=isAPPhysics1&&unit==='Kinematics'?['Position and Velocity','Acceleration','Representations of Motion']:patterns;return{id:`u${index+1}`,title:unit,lessons:names.map((name,i)=>({id:`u${index+1}l${i+1}`,title:`${unit}: ${name}`}))}})}

const books={
 physics:{title:'OpenStax Physics',publisher:'OpenStax, Rice University',url:'https://openstax.org/subjects/science',license:'Open textbook — verify the edition license before publication'},
 chemistry:{title:'OpenStax Chemistry',publisher:'OpenStax, Rice University',url:'https://openstax.org/subjects/science',license:'Open textbook — verify the edition license before publication'},
 biology:{title:'OpenStax Biology',publisher:'OpenStax, Rice University',url:'https://openstax.org/subjects/science',license:'Open textbook — verify the edition license before publication'},
 mathematics:{title:'OpenStax Mathematics',publisher:'OpenStax, Rice University',url:'https://openstax.org/subjects/math',license:'Open textbook — verify the edition license before publication'},
 computer:{title:'Open educational computing references',publisher:'MDN + approved OER',url:'https://developer.mozilla.org',license:'Open/reference material — verify each page license'},
 english:{title:'Open language and literature references',publisher:'OER Commons + Open Library',url:'https://www.oercommons.org',license:'Only openly licensed works are rewritten'},
 general:{title:'Approved open educational reference',publisher:'SUCCESS OS Source Registry',url:'https://www.oercommons.org',license:'The source and license must be verified per subject'}
};
export function bookProfileFor({subject='',system=''}){const book=books[familyFor(subject)];const official=/cambridge|igcse/i.test(system)?'Cambridge syllabus':/edexcel|ial/i.test(system)?'Pearson Edexcel specification':/american|ap |sat|act|est/i.test(system)?'Official American/AP/ACT/EST specification':/ib /i.test(system)?'IB programme guide':'Official national curriculum';return {...book,alignment:official,method:'Understand, verify and rewrite originally; never copy protected text or questions.'}}

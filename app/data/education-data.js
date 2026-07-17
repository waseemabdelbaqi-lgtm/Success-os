// Human-editable launch data. Keep records small and verified before publishing.
export const universityFields = [
  {id:'medicine',icon:'✚',name:'الطب والعلوم الصحية',degrees:['بكالوريوس','دكتور مهني','ماجستير'],subjects:['التشريح','علم وظائف الأعضاء','الكيمياء الحيوية','علم الأدوية','التمريض','الصحة العامة']},
  {id:'engineering',icon:'⌁',name:'الهندسة',degrees:['دبلوم','بكالوريوس','ماجستير','دكتوراه'],subjects:['هندسة مدنية','هندسة كهربائية','هندسة ميكانيكية','هندسة كيميائية','هندسة معمارية','هندسة صناعية']},
  {id:'computing',icon:'⌘',name:'الحاسوب والذكاء الاصطناعي',degrees:['دبلوم','بكالوريوس','ماجستير','دكتوراه'],subjects:['علوم الحاسوب','هندسة البرمجيات','الذكاء الاصطناعي','الأمن السيبراني','علم البيانات','نظم المعلومات']},
  {id:'business',icon:'▥',name:'الأعمال والاقتصاد',degrees:['دبلوم','بكالوريوس','MBA','ماجستير','دكتوراه'],subjects:['المحاسبة','التمويل','التسويق','إدارة الأعمال','الاقتصاد','ريادة الأعمال']},
  {id:'science',icon:'⚛',name:'العلوم الأساسية',degrees:['بكالوريوس','ماجستير','دكتوراه'],subjects:['الفيزياء','الكيمياء','الأحياء','الرياضيات','علوم الأرض','العلوم البيئية']},
  {id:'humanities',icon:'◇',name:'الآداب والعلوم الإنسانية',degrees:['بكالوريوس','ماجستير','دكتوراه'],subjects:['اللغات','التاريخ','الفلسفة','علم النفس','علم الاجتماع','الإعلام']},
  {id:'law',icon:'§',name:'القانون والسياسات',degrees:['بكالوريوس','ماجستير','دكتوراه'],subjects:['القانون العام','القانون الخاص','القانون الدولي','العلوم السياسية','العلاقات الدولية']},
  {id:'education',icon:'◎',name:'التربية والتعليم',degrees:['دبلوم','بكالوريوس','ماجستير','دكتوراه'],subjects:['المناهج والتدريس','التربية الخاصة','علم النفس التربوي','القيادة التربوية','تكنولوجيا التعليم']},
  {id:'creative',icon:'✦',name:'الفنون والتصميم',degrees:['دبلوم','بكالوريوس','ماجستير'],subjects:['التصميم الجرافيكي','العمارة الداخلية','الفنون البصرية','الموسيقى','الإنتاج الإعلامي','تصميم الألعاب']}
];

const isoLanguageCodes='aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' ');
const rtlLanguages=new Set(['ar','dv','fa','he','ku','ps','sd','ug','ur','yi']);
const languageNames=new Intl.DisplayNames(['en'],{type:'language'});
export const launchLanguages=isoLanguageCodes.map(code=>[code,languageNames.of(code)||code,rtlLanguages.has(code)?'RTL':'LTR',code==='ar'||code==='en'?'متاح':'ترجمة تلقائية • مراجعة مطلوبة']);

export const productionStages = [
  ['01','فحص الملكية والحقوق','لا يبدأ الذكاء قبل تحديد المالك والترخيص.'],
  ['02','قراءة وفهرسة المصدر','تقسيم الملف إلى وحدات ومفاهيم ومتطلبات سابقة.'],
  ['03','خريطة المنهج','نتائج تعلم وتسلسل دروس وربط بالنظام والجامعة.'],
  ['04','إنتاج تعليمي','ملخص وسيناريو فيديو وأمثلة وأسئلة وتدريب.'],
  ['05','مراجعة بشرية','معلم ومدير أكاديمي يعتمد الدقة واللغة والحقوق.'],
  ['06','نشر وقياس','إضافة المسار للطالب وقياس الفهم والتحديث المستمر.']
];

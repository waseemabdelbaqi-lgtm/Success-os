// Human-editable launch registry. It never treats institutional recognition as a guarantee
// that a specific programme, branch, delivery mode or foreign qualification will be accepted.

import { ADMISSION_COUNTRIES, ADMISSION_REGIONS, countriesForRegion, regionForCountry } from './admissions-regions';

export { ADMISSION_COUNTRIES, ADMISSION_REGIONS, countriesForRegion, regionForCountry };

export const qualificationSystems = [
  {id:'ib',label:'البكالوريا الدولية IB',credential:'IB Diploma',route:'إدخال مجموع IB والمواد بمستوى HL/SL. التخصصات التنافسية تشترط عادة مواد HL محددة.'},
  {id:'alevel',label:'Cambridge / Pearson A Level',credential:'A Levels',route:'إدخال مواد ودرجات A Level. IGCSE وحده لا يكفي عادة للدخول المباشر إلى البكالوريوس.'},
  {id:'american',label:'النظام الأمريكي + AP/SAT',credential:'High School Diploma',route:'إدخال GPA ومواد AP وSAT/ACT إن طلبتها الجامعة. سياسة الاختبارات تختلف حسب المؤسسة والبرنامج.'},
  {id:'jordan',label:'الثانوية الأردنية (التوجيهي)',credential:'شهادة الدراسة الثانوية العامة',route:'يُفحص الفرع والمعدل والحدود الدنيا للتخصص، وتلزم معادلة عند الدراسة خارج الأردن.'},
  {id:'uae',label:'الثانوية الإماراتية',credential:'UAE Secondary School Certificate',route:'يُفحص المسار ونسبة الثانوية والمواد العلمية وEmSAT أو البديل إذا كان مطلوباً.'},
  {id:'saudi',label:'الثانوية السعودية',credential:'شهادة الثانوية العامة',route:'قد تدخل القدرات والتحصيلي في القبول المحلي؛ وخارج المملكة يلزم تقييم المؤهل حسب الجامعة.'},
  {id:'egypt',label:'الثانوية العامة المصرية',credential:'Thanaweya Amma',route:'يُفحص القسم والمجموع والتنسيق محلياً، أو تقييم المؤهل ومتطلبات المواد خارج مصر.'},
  {id:'algeria',label:'البكالوريا الجزائرية',credential:'Baccalauréat algérien',route:'يُفحص المسار والمعدل والتخصص، مع ترجمة أو معادلة عند التقديم خارج الجزائر.'},
  {id:'morocco',label:'البكالوريا المغربية',credential:'Baccalauréat marocain',route:'يُفحص المسلك والمعدل والمواد المطلوبة، مع تقييم المؤهل خارج المغرب.'},
  {id:'french',label:'البكالوريا الفرنسية',credential:'Baccalauréat général/technologique',route:'إدخال التخصصات والنتيجة النهائية؛ قد تُطلب مواد محددة أو سنة تحضيرية.'},
  {id:'turkey',label:'الثانوية التركية',credential:'Lise Diploması',route:'قد يلزم YKS محلياً، أو تقييم الشهادة ومتطلبات إضافية للطالب الدولي.'},
  {id:'india',label:'CBSE / ISC / State Boards',credential:'Class XII',route:'إدخال المجلس والمواد والنسب. الهندسة والطب قد ترتبط باختبارات وطنية أو مواد إلزامية.'},
  {id:'national',label:'شهادة وطنية أخرى',credential:'National secondary qualification',route:'يُطلب اسم الشهادة والدولة وكشف العلامات، ثم تُراجع قاعدة الجامعة أو جهة المعادلة.'}
];

export const countryAuthorities = {
  'الأردن':{authority:'وزارة التعليم العالي والبحث العلمي الأردنية',url:'https://mohe.gov.jo/',note:'تحقق من الجامعات المعترف بها ومن شروط معادلة الشهادات، خصوصاً الدراسة عن بعد.'},
  'الإمارات':{authority:'وزارة التربية والتعليم – الاعتراف بالشهادات',url:'https://www.moe.gov.ae/',note:'الاعتراف قد يتغير حسب المؤسسة والبرنامج والحرم ونمط الدراسة.'},
  'السعودية':{authority:'وزارة التعليم – الجامعات الموصى بها',url:'https://ru.moe.gov.sa/',note:'استخدم خدمة الجامعات الموصى بها ثم تحقق من البرنامج والدرجة ونمط الدراسة.'},
  'قطر':{authority:'وزارة التربية والتعليم والتعليم العالي',url:'https://www.edu.gov.qa/',note:'يجب الرجوع إلى خدمة معادلة الشهادات والجهة المهنية عند الحاجة.'},
  'مصر':{authority:'المجلس الأعلى للجامعات',url:'https://scu.eg/',note:'المعادلة والقبول يختلفان حسب الدرجة والبرنامج والجامعة.'},
  'الجزائر':{authority:'وزارة التعليم العالي والبحث العلمي',url:'https://www.mesrs.dz/',note:'تُراجع معادلة الشهادة والبرنامج والوثائق المطلوبة رسمياً.'},
  'المغرب':{authority:'وزارة التعليم العالي والبحث العلمي والابتكار',url:'https://www.enssup.gov.ma/',note:'افحص الاعتراف بالمؤسسة ومعادلة الشهادة، خاصة للمؤسسات الخاصة أو التعليم عن بعد.'},
  'تركيا':{authority:'مجلس التعليم العالي YÖK',url:'https://www.yok.gov.tr/',note:'استخدم الاعتراف والمعادلة لدى YÖK وتحقق من البرنامج والحرم.'},
  'الولايات المتحدة':{authority:'U.S. Department of Education – DAPIP',url:'https://ope.ed.gov/dapip/#/home',note:'الاعتماد مؤسسي وبرامجي؛ لا توجد وزارة اتحادية تعادل كل شهادة أجنبية تلقائياً.'},
  'المملكة المتحدة':{authority:'Office for Students / Recognised Bodies',url:'https://www.gov.uk/check-university-award-degree',note:'تحقق من صلاحية منح الدرجة ومن مقدم البرنامج، وليس من الاسم التجاري فقط.'},
  'كندا':{authority:'CICIC – Directory of Educational Institutions',url:'https://www.cicic.ca/869/search_the_directory_of_educational_institutions_in_canada.canada',note:'الاختصاص إقليمي؛ تحقق من المقاطعة والبرنامج والجهة المنظمة للمهنة.'},
  'أستراليا':{authority:'TEQSA National Register',url:'https://www.teqsa.gov.au/national-register',note:'افحص مقدم التعليم والبرنامج، وCRICOS أيضاً للطالب الدولي داخل أستراليا.'},
  'ألمانيا':{authority:'Hochschulkompass / anabin',url:'https://www.hochschulkompass.de/en/higher-education-institutions.html',note:'تحقق من المؤسسة في Hochschulkompass ومن تقييم الشهادة الأجنبية في anabin.'},
  'فرنسا':{authority:'وزارة التعليم العالي والبحث',url:'https://www.enseignementsup-recherche.gouv.fr/',note:'تحقق من صفة المؤسسة والدرجة الوطنية أو الاعتراف الرسمي بالبرنامج.'},
  'هولندا':{authority:'NVAO – Accreditation Organisation',url:'https://www.nvao.net/en',note:'التحقق يكون من البرنامج المعتمد ومن المؤسسة وطريقة تقديمه.'},
  'أيرلندا':{authority:'QQI / Irish Register of Qualifications',url:'https://irq.ie/',note:'تحقق من الجهة المانحة والبرنامج ومستوى NFQ.'},
  'سويسرا':{authority:'swissuniversities',url:'https://www.swissuniversities.ch/en/',note:'تحقق من المؤسسة والبرنامج ومتطلبات اللغة والإقامة للدراسة.'},
  'نيوزيلندا':{authority:'NZQA – Education providers',url:'https://www.nzqa.govt.nz/providers/index.do',note:'تحقق من مقدم التعليم والبرنامج وحالة تسجيله.'},
  'ماليزيا':{authority:'Malaysian Qualifications Register',url:'https://www2.mqa.gov.my/mqr/',note:'ابحث عن البرنامج نفسه في MQR وليس المؤسسة فقط.'},
  'سنغافورة':{authority:'Ministry of Education Singapore',url:'https://www.moe.gov.sg/post-secondary/overview',note:'تحقق من نوع المؤسسة والدرجة والجهة المانحة.'},
  'الهند':{authority:'University Grants Commission',url:'https://www.ugc.gov.in/universitydetails/university?type=ddmcmQ==',note:'تحقق من الجامعة ومن اعتماد البرنامج لدى المجلس المهني المختص.'},
  'اليابان':{authority:'MEXT – Universities and Colleges',url:'https://www.mext.go.jp/en/',note:'تحقق من المؤسسة والبرنامج ومتطلبات الطالب الدولي.'},
  'كوريا الجنوبية':{authority:'Study in Korea / Ministry of Education',url:'https://www.studyinkorea.go.kr/',note:'تحقق من المؤسسة والبرنامج ومتطلبات اللغة والتأشيرة.'},
  'الصين':{authority:'Ministry of Education of China',url:'http://en.moe.gov.cn/',note:'تحقق من المؤسسة والبرنامج ومسار قبول الطالب الدولي.'},
  'جنوب أفريقيا':{authority:'Department of Higher Education and Training',url:'https://www.dhet.gov.za/',note:'تحقق من المؤسسة ونقاط APS ومتطلبات التأشيرة للطالب الدولي.'},
  'نيجيريا':{authority:'National Universities Commission',url:'https://www.nuc.edu.ng/',note:'تحقق من اعتماد الجامعة لدى NUC ومسار JAMB المحلي أو Foreign centres.'},
  'كينيا':{authority:'Commission for University Education',url:'https://www.cue.or.ke/',note:'تحقق من اعتماد المؤسسة؛ KUCCPS للدرجات يشترط مواطنة كينية غالباً.'},
  'البرازيل':{authority:'Ministério da Educação (MEC)',url:'https://www.gov.br/mec/pt-br',note:'ENEM/SiSU للمواطنين؛ PEC-G للأجانب المؤهلين عبر السفارة — مساران منفصلان بالجنسية.'},
  'السويد':{authority:'Swedish Council for Higher Education (UHR)',url:'https://www.uhr.se/en/',note:'الرسوم الدراسية مرتبطة بجنسية EU/EEA/سويسرا مقابل الدول الثالثة عبر universityadmissions.se.'},
};

const allSystems = qualificationSystems.map(x=>x.id);

function countryRegion(country){
  return ADMISSION_COUNTRIES[country]?.region || 'mena';
}

function countryLocalDocs(country){
  return ADMISSION_COUNTRIES[country]?.localDocs || ['شهادة ثانوية وطنية','طلب القبول المحلي','متطلبات البرنامج'];
}

function countryIntlDocs(country){
  return ADMISSION_COUNTRIES[country]?.internationalDocs || ['جواز سفر','شهادة وكشف علامات رسميان','ترجمة معتمدة عند الحاجة','إثبات لغة','متطلبات التأشيرة والتمويل'];
}

const U=(id,country,city,name,type,modes,fields,admission,opts={})=>({
  id,country,city,name,type,modes,fields,admission,
  region:opts.region||countryRegion(country),
  systems:opts.systems||allSystems,
  degree:opts.degree||'بكالوريوس ودراسات عليا',
  language:opts.language||'لغة البرنامج + إثبات لغة عند الطلب',
  entry:opts.entry||'تقييم الشهادة والدرجات والمواد المطلوبة حسب البرنامج',
  local:opts.local||countryLocalDocs(country),
  international:opts.international||countryIntlDocs(country),
  localNote:opts.localNote||ADMISSION_COUNTRIES[country]?.localSummaryAr||'مسار الطالب المحلي حسب النظام الوطني للدولة.',
  internationalNote:opts.internationalNote||ADMISSION_COUNTRIES[country]?.internationalSummaryAr||'مسار الطالب الدولي يتطلب عادة معادلة ولغة وتمويلاً وتأشيرة.',
  applyLocal:opts.applyLocal||ADMISSION_COUNTRIES[country]?.applyChannelLocal||'تطبيق الجامعة',
  applyInternational:opts.applyInternational||ADMISSION_COUNTRIES[country]?.applyChannelInternational||'تطبيق دولي + تأشيرة',
  updated:opts.updated||'2026-07-25',
});

export const globalInstitutions = [
 // Americas
 U('asu','الولايات المتحدة','Tempe','Arizona State University','جامعة',['وجاهي','أونلاين'],['هندسة','حوسبة','أعمال','علوم'],'https://admission.asu.edu/apply/international/first-year',{
   entry:'شهادة ثانوية مكتملة؛ GPA حوالي 3.0 كحد أدنى عام، وقد ترتفع متطلبات الهندسة والتمريض.',
   local:['High School Diploma أمريكي','GPA تنافسي','مواد أساسية (رياضيات وعلوم)','Common App أو تطبيق ASU','SAT/ACT اختيارية غالباً'],
   international:['شهادة ثانوية + ترجمة إنجليزية','GPA ≈ 3.0+','TOEFL/IELTS/Duolingo/PTE حسب الكلية','رسوم تقديم دولية','طلب I-20 + SEVIS + تأشيرة F-1','إثبات تمويل'],
   localNote:'الطالب المحلي/المقيم داخل الولايات المتحدة يتقدم كـ domestic first-year عبر تطبيق ASU أو Common App.',
   internationalNote:'الطالب الدولي: GPA ومواد كفاءة + إثبات إنجليزي؛ الهندسة غالباً IELTS 6.5 / TOEFL 79 كحد أدنى حسب الكلية.',
 }),
 U('mit','الولايات المتحدة','Cambridge','Massachusetts Institute of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','اقتصاد'],'https://mitadmissions.org/apply/firstyear/',{
   local:['ثانوية أمريكية قوية','مواد متقدمة STEM','مقالات وتوصيات','اختبارات حسب سياسة السنة'],
   international:['شهادة ثانوية معادلة ممتازة','إثبات إنجليزي','تمويل وتأشيرة F-1','ملف أكاديمي تنافسي عالمياً'],
 }),
 U('stanford','الولايات المتحدة','Stanford','Stanford University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','آداب'],'https://admission.stanford.edu/apply/first-year/'),
 U('toronto','كندا','تورونتو','University of Toronto','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://future.utoronto.ca/apply/requirements/'),
 U('ubc','كندا','فانكوفر','University of British Columbia','جامعة',['وجاهي'],['هندسة','علوم','أعمال','آداب'],'https://you.ubc.ca/applying-ubc/requirements/'),
 U('mcgill','كندا','مونتريال','McGill University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.mcgill.ca/undergraduate-admissions/apply'),

 // Europe
 U('manchester','المملكة المتحدة','مانشستر','The University of Manchester','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.manchester.ac.uk/study/international/admissions/undergraduate-application-process/',{
   local:['A Levels أو ما يعادلها','طلب UCAS (M20)','Personal statement','مرجع'],
   international:['مؤهل معادل عبر UCAS','IELTS Academic عادة','مواعيد equal consideration','CAS + تمويل + Student visa'],
   internationalNote:'كل المتقدمين عبر UCAS؛ الموعد النهائي الدولي عادة 30 يونيو مع تشجيع على التقديم قبل منتصف يناير.',
 }),
 U('ucl','المملكة المتحدة','لندن','University College London','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ucl.ac.uk/prospective-students/undergraduate/application'),
 U('edinburgh','المملكة المتحدة','إدنبرة','The University of Edinburgh','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ed.ac.uk/studying/undergraduate/applying'),
 U('london','المملكة المتحدة','لندن','University of London','جامعة',['أونلاين','وجاهي'],['حوسبة','أعمال','قانون','علوم اجتماعية'],'https://www.london.ac.uk/study/courses/undergraduate'),
 U('tum','ألمانيا','ميونخ','Technical University of Munich','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','إدارة'],'https://www.tum.de/en/studies/application',{
   local:['Abitur','طلب عبر بوابات TUM/Hochschulstart حسب البرنامج'],
   international:['Hochschulzugangsberechtigung / anabin','uni-assist عند اللزوم','TestDaF/DSH أو إنجليزي حسب البرنامج','تأشيرة وطنية وتمويل'],
 }),
 U('rwth','ألمانيا','آخن','RWTH Aachen University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.rwth-aachen.de/go/id/bqmo/lidx/1'),
 U('heidelberg','ألمانيا','هايدلبرغ','Heidelberg University','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://www.uni-heidelberg.de/en/study/application-enrolment'),
 U('paris-saclay','فرنسا','باريس','Université Paris-Saclay','جامعة',['وجاهي'],['علوم','هندسة','طب وصحة','اقتصاد'],'https://www.universite-paris-saclay.fr/en/admission'),
 U('sorbonne','فرنسا','باريس','Sorbonne University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب'],'https://www.sorbonne-universite.fr/en/education/applying'),
 U('tudelft','هولندا','دلفت','Delft University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','تصميم'],'https://www.tudelft.nl/en/education/admission-and-application'),
 U('uva','هولندا','أمستردام','University of Amsterdam','جامعة',['وجاهي'],['علوم','أعمال','آداب','قانون'],'https://www.uva.nl/en/education/admissions/admissions.html'),
 U('tcd','أيرلندا','دبلن','Trinity College Dublin','كلية جامعية',['وجاهي'],['علوم','هندسة','طب وصحة','آداب'],'https://www.tcd.ie/study/apply/'),

 // Asia
 U('tsinghua','الصين','بكين','Tsinghua University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://international.join-tsinghua.edu.cn/'),
 U('tokyo','اليابان','طوكيو','The University of Tokyo','جامعة',['وجاهي'],['هندسة','علوم','آداب','اقتصاد'],'https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate_english.html'),
 U('snu','كوريا الجنوبية','سيول','Seoul National University','جامعة',['وجاهي'],['هندسة','علوم','أعمال','آداب'],'https://en.snu.ac.kr/admission'),
 U('iitd','الهند','نيودلهي','Indian Institute of Technology Delhi','معهد جامعي',['وجاهي'],['هندسة','حوسبة','علوم'],'https://home.iitd.ac.in/undergraduate.php'),
 U('um','ماليزيا','كوالالمبور','Universiti Malaya','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://study.um.edu.my/how-to-apply'),
 U('nus','سنغافورة','سنغافورة','National University of Singapore','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://nus.edu.sg/oam/admissions'),

 // MENA
 U('uj','الأردن','عمّان','الجامعة الأردنية','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال','آداب'],'https://registration.ju.edu.jo/'),
 U('just','الأردن','إربد','جامعة العلوم والتكنولوجيا الأردنية','جامعة',['وجاهي'],['طب وصحة','هندسة','حوسبة','علوم'],'https://www.just.edu.jo/Admission/'),
 U('gju','الأردن','عمّان','الجامعة الألمانية الأردنية','جامعة',['وجاهي'],['هندسة','حوسبة','أعمال','تصميم'],'https://www.gju.edu.jo/content/admission-77'),
 U('uaeu','الإمارات','العين','جامعة الإمارات العربية المتحدة','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://www.uaeu.ac.ae/en/admission/'),
 U('ku','الإمارات','أبوظبي','جامعة خليفة','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','طب وصحة'],'https://www.ku.ac.ae/undergraduate-admissions'),
 U('aus','الإمارات','الشارقة','الجامعة الأمريكية في الشارقة','جامعة',['وجاهي'],['هندسة','عمارة وتصميم','أعمال','آداب'],'https://www.aus.edu/admissions/bachelors-degrees'),
 U('ksu','السعودية','الرياض','جامعة الملك سعود','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال'],'https://dar.ksu.edu.sa/'),
 U('qu','قطر','الدوحة','جامعة قطر','جامعة',['وجاهي'],['هندسة','طب وصحة','قانون','أعمال'],'https://www.qu.edu.qa/en-us/students/admission/undergraduate/'),
 U('cairo','مصر','القاهرة','جامعة القاهرة','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','آداب'],'https://cu.edu.eg/Home'),
 U('auc','مصر','القاهرة','الجامعة الأمريكية بالقاهرة','جامعة',['وجاهي'],['أعمال','هندسة','علوم','آداب'],'https://www.aucegypt.edu/admissions/undergraduate'),
 U('usthb','الجزائر','الجزائر','جامعة هواري بومدين للعلوم والتكنولوجيا','جامعة',['وجاهي'],['علوم','هندسة','حوسبة'],'https://www.usthb.dz/'),
 U('um5','المغرب','الرباط','جامعة محمد الخامس','جامعة',['وجاهي'],['علوم','قانون','آداب','طب وصحة'],'https://www.um5.ac.ma/um5/'),
 U('metu','تركيا','أنقرة','Middle East Technical University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://iso.metu.edu.tr/en/application-requirements'),
 U('bau','تركيا','إسطنبول','Bahçeşehir University','جامعة',['وجاهي','أونلاين'],['طب وصحة','هندسة','تصميم','أعمال'],'https://int.bau.edu.tr/admission/undergraduate-applicants/'),

 // Africa (launch set)
 U('uct','جنوب أفريقيا','كيب تاون','University of Cape Town','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.uct.ac.za/students/applications-admission/undergraduate-applications',{
   local:['National Senior Certificate','نقاط APS','مواد البرنامج'],
   international:['تقييم مؤهل أجنبي','IELTS إن لزم','تمويل وتأشيرة دراسة'],
 }),
 U('uon','كينيا','نيروبي','University of Nairobi','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.uonbi.ac.ke/admission',{
   local:['KCSE','KUCCPS (مواطن كيني)'],
   international:['تقديم دولي مباشر','معادلة KNQA/KNEC','Student Pass'],
 }),
 U('usp','البرازيل','ساو باولو','Universidade de São Paulo','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.usp.br/',{
   local:['ENEM / Vestibular','SiSU عند الانطباق'],
   international:['PEC-G عبر السفارة أو مسار دولي للمؤسسة','Celpe-Bras غالباً'],
 }),
 U('ki','السويد','ستوكهولم','Karolinska Institutet','جامعة',['وجاهي'],['طب وصحة','علوم'],'https://education.ki.se/bachelors-masters-studies/tuition-fees',{
   local:['universityadmissions.se','إثبات جنسية EU/EEA/سويسرا للإعفاء من الرسوم'],
   international:['universityadmissions.se','رسوم تقديم ودراسية','تصريح إقامة طالب'],
 }),

 // Oceania
 U('melbourne','أستراليا','ملبورن','The University of Melbourne','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','طب وصحة','أعمال'],'https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications'),
 U('unsw','أستراليا','سيدني','UNSW Sydney','جامعة',['وجاهي','أونلاين'],['هندسة','حوسبة','علوم','أعمال'],'https://www.unsw.edu.au/study/how-to-apply/international'),
 U('auckland','نيوزيلندا','أوكلاند','University of Auckland','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','أعمال','آداب'],'https://www.auckland.ac.nz/en/study/applications-and-admissions.html'),

 // Online degree universities & portals
 U('snhu','الولايات المتحدة','Manchester NH','Southern New Hampshire University','جامعة أونلاين',['أونلاين'],['أعمال','حوسبة','علوم اجتماعية','تعليم'],'https://www.snhu.edu/admission',{
   degree:'بكالوريوس وماجستير',
   entry:'قبول مرن للبالغين؛ تحقق من اعتماد البرنامج في دولة استخدام الدرجة.',
 }),
 U('uopeople','الولايات المتحدة','Pasadena','University of the People','جامعة أونلاين',['أونلاين'],['أعمال','حوسبة','تعليم','صحة'],'https://www.uopeople.edu/admission/',{
   degree:'بكالوريوس وماجستير',
   entry:'جامعة معتمدة برسوم امتحانات منخفضة؛ افحص الاعتراف المحلي قبل الاعتماد على الدرجة.',
 }),
 U('ouuk','المملكة المتحدة','ميلتون كينز','The Open University','جامعة أونلاين',['أونلاين'],['علوم','أعمال','تعليم','حوسبة','آداب'],'https://www.open.ac.uk/courses/',{
   degree:'بكالوريوس ودراسات عليا ودبلوم',
 }),
 U('wgu','الولايات المتحدة','Salt Lake City','Western Governors University','جامعة أونلاين',['أونلاين'],['تعليم','أعمال','حوسبة','طب وصحة'],'https://www.wgu.edu/admissions.html',{
   degree:'بكالوريوس وماجستير',
 }),
 U('pennstate-world','الولايات المتحدة','University Park','Penn State World Campus','جامعة أونلاين',['أونلاين'],['هندسة','أعمال','تعليم','علوم'],'https://www.worldcampus.psu.edu/admissions',{
   degree:'بكالوريوس وماجستير ودبلوم',
 }),

 // Community colleges & pathway colleges
 U('bcc','الولايات المتحدة','New York','Borough of Manhattan Community College','كلية مجتمعية',['وجاهي','أونلاين'],['حوسبة','أعمال','علوم','آداب'],'https://www.bmcc.cuny.edu/admissions/',{
   degree:'دبلوم وAssociate',
 }),
 U('deanza','الولايات المتحدة','Cupertino','De Anza College','كلية مجتمعية',['وجاهي','أونلاين'],['حوسبة','هندسة','أعمال','علوم'],'https://www.deanza.edu/admissions/',{
   degree:'دبلوم وAssociate',
 }),
 U('seneca','كندا','تورونتو','Seneca Polytechnic','كلية تقنية',['وجاهي','أونلاين'],['حوسبة','أعمال','تصميم','هندسة'],'https://www.senecapolytechnic.ca/admissions.html',{
   degree:'دبلوم وبكالوريوس تطبيقي',
 }),
 U('centennial','كندا','تورونتو','Centennial College','كلية',['وجاهي','أونلاين'],['هندسة','حوسبة','أعمال','طب وصحة'],'https://www.centennialcollege.ca/admissions/',{
   degree:'دبلوم وبكالوريوس',
 }),
 U('hkcc','الصين','هونغ كونغ','HKU SPACE Community College','كلية مجتمعية',['وجاهي'],['أعمال','علوم','آداب'],'https://hkuspace.hku.hk/cc/',{
   degree:'دبلوم وAssociate',
   region:'asia',
 }),

 // More global research universities
 U('harvard','الولايات المتحدة','Cambridge','Harvard University','جامعة',['وجاهي'],['علوم','أعمال','قانون','طب وصحة','آداب'],'https://college.harvard.edu/admissions'),
 U('nyu','الولايات المتحدة','New York','New York University','جامعة',['وجاهي','أونلاين'],['أعمال','آداب','حوسبة','تصميم'],'https://www.nyu.edu/admissions.html'),
 U('lse','المملكة المتحدة','لندن','London School of Economics','جامعة',['وجاهي'],['اقتصاد','علوم اجتماعية','قانون','أعمال'],'https://www.lse.ac.uk/study-at-lse/Undergraduate/Prospective-Students/How-to-Apply'),
 U('eth','سويسرا','زيورخ','ETH Zurich','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://ethz.ch/en/studies/application.html',{
   region:'europe',
   local:['شهادة ثانوية سويسرية / maturité','طلب ETH'],
   international:['شهادة معادلة','إثبات لغة','تمويل وتأشيرة'],
 }),
 U('epfl','سويسرا','لوزان','EPFL','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.epfl.ch/education/admission/',{region:'europe'}),
 U('anu','أستراليا','كانبرا','Australian National University','جامعة',['وجاهي','أونلاين'],['علوم','هندسة','أعمال','آداب'],'https://www.anu.edu.au/study/apply'),
 U('monash','أستراليا','ملبورن','Monash University','جامعة',['وجاهي','أونلاين'],['طب وصحة','هندسة','أعمال','علوم'],'https://www.monash.edu/study/how-to-apply'),
 U('kaist','كوريا الجنوبية','Daejeon','KAIST','معهد جامعي',['وجاهي'],['هندسة','حوسبة','علوم'],'https://admission.kaist.ac.kr/intl-undergraduate/'),
 U('pku','الصين','بكين','Peking University','جامعة',['وجاهي'],['علوم','آداب','اقتصاد','هندسة'],'https://www.isd.pku.edu.cn/'),
 U('hku','الصين','هونغ كونغ','The University of Hong Kong','جامعة',['وجاهي'],['طب وصحة','هندسة','أعمال','آداب'],'https://admissions.hku.hk/',{region:'asia'}),
 U('psut','الأردن','عمّان','جامعة الأميرة سمية للتكنولوجيا','جامعة',['وجاهي'],['حوسبة','هندسة','أعمال'],'https://www.psut.edu.jo/content/admission'),
 U('bau-jo','الأردن','السلط','جامعة البلقاء التطبيقية','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.bau.edu.jo/'),
 U('ksau-hs','السعودية','الرياض','جامعة الملك سعود بن عبدالعزيز للعلوم الصحية','جامعة',['وجاهي'],['طب وصحة'],'https://www.ksau-hs.edu.sa/English/Admission'),
 U('kfupm','السعودية','الظهران','جامعة الملك فهد للبترول والمعادن','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://www.kfupm.edu.sa/'),
 U('hbku','قطر','الدوحة','جامعة حمد بن خليفة','جامعة',['وجاهي'],['حوسبة','علوم','قانون','علوم اجتماعية'],'https://www.hbku.edu.qa/en/admissions'),
 U('aus-online','الإمارات','الشارقة','Hamdan Bin Mohammed Smart University','جامعة أونلاين',['أونلاين'],['أعمال','تعليم','إدارة'],'https://www.hbmsu.ac.ae/',{
   degree:'بكالوريوس وماجستير ودبلوم',
 }),
 U('amu','مصر','القاهرة','جامعة الأزهر','جامعة',['وجاهي'],['طب وصحة','هندسة','آداب','علوم'],'https://www.azhar.edu.eg/'),
 U('witwatersrand','جنوب أفريقيا','جوهانسبرغ','University of the Witwatersrand','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://www.wits.ac.za/undergraduate/apply-to-wits/'),
 U('ui','نيجيريا','Ibadan','University of Ibadan','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','أعمال'],'https://www.ui.edu.ng/',{
   local:['WAEC/NECO','JAMB UTME','CAPS'],
   international:['Foreign UTME/DE أو قبول دولي','جواز','تمويل'],
 }),
];

export function institutionsForRegion(regionId){
  return globalInstitutions.filter(x=>x.region===regionId);
}

export function institutionsForCountry(country){
  return globalInstitutions.filter(x=>x.country===country);
}

export function requirementsForApplicant(institution, applicantType){
  const isLocal = applicantType === 'local';
  return {
    type: isLocal ? 'طالب محلي' : 'طالب دولي',
    note: isLocal ? institution.localNote : institution.internationalNote,
    docs: isLocal ? (institution.local||[]) : (institution.international||[]),
    channel: isLocal ? institution.applyLocal : institution.applyInternational,
  };
}

export const studentCountries = [...new Set([
  ...Object.keys(countryAuthorities),
  ...Object.keys(ADMISSION_COUNTRIES),
  ...globalInstitutions.map(x=>x.country),
])].sort((a,b)=>a.localeCompare(b,'ar'));

export function recognitionFor(institution,studentCountry){
  const authority=countryAuthorities[studentCountry];
  if(studentCountry===institution.country){return {level:'verified',title:'مؤسسة وطنية مدرجة — افحص البرنامج',text:`المؤسسة تعمل داخل ${studentCountry}. يبقى التحقق من اعتماد البرنامج والحرم ونمط الدراسة إلزامياً.`,authority};}
  if(authority){return {level:'review',title:'الاعتراف الأجنبي غير محسوم تلقائياً',text:`وجود المؤسسة في بلدها لا يضمن معادلة الدرجة في ${studentCountry}. يلزم فحص المؤسسة والبرنامج والحرم ونمط الدراسة لدى ${authority.authority}.`,authority};}
  return {level:'unknown',title:'بحاجة إلى تحقق من دولة الطالب',text:'لم تُربط جهة المعادلة الوطنية لهذه الدولة بعد. لا تعتمد النتيجة قبل الحصول على إفادة رسمية مكتوبة.',authority:null};
}

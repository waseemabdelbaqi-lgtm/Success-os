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
  'إيطاليا':{authority:'MUR / Universitaly',url:'https://www.universitaly.it/studenti-stranieri',note:'غير الأوروبي المقيم خارج إيطاليا يحتاج Universitaly والتأشيرة؛ EU والمقيم القانوني يتقدمان مباشرة.'},
  'النمسا':{authority:'OeAD / Study in Austria',url:'https://studyinaustria.at/',note:'رسوم الجامعات الحكومية تختلف بين EU/EEA والدول الثالثة.'},
  'إسبانيا':{authority:'UNEDasiss / Ministerio de Educación',url:'https://unedasiss.uned.es/',note:'مسارات القبول الدولي تختلف بين أنظمة EU وغير EU؛ المواطن الإسباني عبر PAU/EBAU.'},
  'بلجيكا':{authority:'Flemish / French Community education authorities',url:'https://www.belgium.be/en/education/coming_to_study_in_belgium',note:'الرسوم والتأشيرة تختلف EU مقابل غير EU، وتختلف بين فلاندرز ووالونيا.'},
  'النرويج':{authority:'Study in Norway',url:'https://studyinnorway.no/',note:'منذ 2023 الرسوم الدراسية لغير EU/EEA/سويسرا؛ المواطنون الأوروبيون معفيون في العامة.'},
  'البرتغال':{authority:'DGES',url:'https://www.dges.gov.pt/',note:'Concurso Nacional للمواطنين/EU المؤهلين؛ Concurso Especial للطالب الدولي.'},
  'فنلندا':{authority:'Studyinfo.fi / Study in Finland',url:'https://studyinfo.fi/',note:'EU/EEA/سويسرا بدون رسوم دراسية؛ غير EU يدفعون لبرامج الإنجليزية عبر Studyinfo.'},
  'الدنمارك':{authority:'Study in Denmark / optagelse.dk',url:'https://studyindenmark.dk/',note:'EU/EEA/سويسرا بدون رسوم؛ غير EU برسوم وتصريح إقامة — البكالوريوس عبر optagelse.dk.'},
  'بولندا':{authority:'NAWA / Study in Poland',url:'https://study.gov.pl/',note:'دوام كامل بولندي في الحكومية مجاني لبولندا/EU-EEA وKarta Polaka؛ غيرهم برسوم وتأشيرة حسب الوضع.'},
  'التشيك':{authority:'Study in Czechia',url:'https://www.studyin.cz/',note:'البرامج التشيكية في العامة مجانية لكل الجنسيات؛ الإنجليزية برسوم؛ التأشيرة تختلف EU مقابل غير EU.'},
  'اليونان':{authority:'Study in Greece / European Education Area',url:'https://education.ec.europa.eu/study-in-europe/country-profiles/greece',note:'بكالوريوس يوناني عام غالباً مجاني؛ غير EU يحتاجون تأشيرة D؛ البرامج الإنجليزية برسوم.'},
  'رومانيا':{authority:'Ministry of Education Romania',url:'https://education.ec.europa.eu/study-in-europe/country-profiles/romania',note:'EU/EEA/سويسرا بنفس شروط الرومانيين؛ غير EU برسوم أجنبية وتأشيرة طالب.'},
  'المجر':{authority:'Study in Hungary',url:'https://studyinhungary.hu/',note:'EU بلا تأشيرة مع مسار مقاعد حكومية/ذاتية؛ غير EU تمويل ذاتي أو منحة + إقامة طالب.'},
  'سلوفاكيا':{authority:'Study in Slovakia / Ministry of Education',url:'https://education.ec.europa.eu/study-in-europe/country-profiles/slovakia',note:'سلوفاكية بدوام كامل في العامة غالباً مجانية لكل الجنسيات؛ الإنجليزية برسوم؛ التأشيرة لغير EU.'},
  'كرواتيا':{authority:'Study in Croatia / gov.hr',url:'https://gov.hr/en/international-students-studying-in-croatia/1078',note:'EU بنفس دعم الرسوم كالكرواتيين؛ الدول الثالثة بحصص أجانب ورسوم مؤسسية وتأشيرة.'},
  'بلغاريا':{authority:'Ministry of Education and Science',url:'https://education.ec.europa.eu/study-in-europe/country-profiles/bulgaria',note:'EU/EEA/سويسرا برسوم المواطنين؛ غير EU برسوم أعلى وتأشيرة D.'},
  'سلوفينيا':{authority:'Study in Slovenia',url:'https://studyinslovenia.si/',note:'EU/EEA/سويسرا معفيون من رسوم الدوام الكامل غالباً؛ غير EU يدفعون + إقامة طالب.'},
  'إستونيا':{authority:'Study in Estonia',url:'https://www.studyinestonia.ee/',note:'إستونية بدوام كامل مجانية غالباً لكل الجنسيات؛ الإنجليزية برسوم؛ التأشيرة لغير EU.'},
  'ليتوانيا':{authority:'Study in Lithuania / LAMA BPO',url:'https://studyin.lt/',note:'EU/EEA مؤهلون لمقاعد حكومية؛ غير EU تمويل ذاتي وتأشيرة وطنية عادة.'},
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
  /** Joined SUCCESS OS partner — post-inquiry communication via in-app notifications. */
  platformMember: Boolean(opts.platformMember),
  /** Official admissions inbox for non-member email channel after $5 inquiry fee. */
  contactEmail: opts.contactEmail || '',
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
   platformMember:true,contactEmail:'admissions@asu.edu',
 }),
 U('mit','الولايات المتحدة','Cambridge','Massachusetts Institute of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','اقتصاد'],'https://mitadmissions.org/apply/firstyear/',{
   local:['ثانوية أمريكية قوية','مواد متقدمة STEM','مقالات وتوصيات','اختبارات حسب سياسة السنة'],
   international:['شهادة ثانوية معادلة ممتازة','إثبات إنجليزي','تمويل وتأشيرة F-1','ملف أكاديمي تنافسي عالمياً'],
   contactEmail:'admissions@mit.edu',
 }),
 U('stanford','الولايات المتحدة','Stanford','Stanford University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','آداب'],'https://admission.stanford.edu/apply/first-year/',{
   contactEmail:'admission@stanford.edu',
 }),
 U('toronto','كندا','تورونتو','University of Toronto','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://future.utoronto.ca/apply/requirements/',{
   platformMember:true,contactEmail:'admissions.help@utoronto.ca',
 }),
 U('ubc','كندا','فانكوفر','University of British Columbia','جامعة',['وجاهي'],['هندسة','علوم','أعمال','آداب'],'https://you.ubc.ca/applying-ubc/requirements/',{
   contactEmail:'international.students@ubc.ca',
 }),
 U('mcgill','كندا','مونتريال','McGill University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.mcgill.ca/undergraduate-admissions/apply',{
   contactEmail:'admissions@mcgill.ca',
 }),

 // Europe
 U('manchester','المملكة المتحدة','مانشستر','The University of Manchester','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.manchester.ac.uk/study/international/admissions/undergraduate-application-process/',{
   local:['A Levels أو ما يعادلها','طلب UCAS (M20)','Personal statement','مرجع'],
   international:['مؤهل معادل عبر UCAS','IELTS Academic عادة','مواعيد equal consideration','CAS + تمويل + Student visa'],
   internationalNote:'كل المتقدمين عبر UCAS؛ الموعد النهائي الدولي عادة 30 يونيو مع تشجيع على التقديم قبل منتصف يناير.',
   platformMember:true,contactEmail:'international@manchester.ac.uk',
 }),
 U('ucl','المملكة المتحدة','لندن','University College London','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ucl.ac.uk/prospective-students/undergraduate/application',{
   contactEmail:'undergraduate-admissions@ucl.ac.uk',
 }),
 U('edinburgh','المملكة المتحدة','إدنبرة','The University of Edinburgh','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ed.ac.uk/studying/undergraduate/applying',{
   contactEmail:'futurestudents@ed.ac.uk',
 }),
 U('london','المملكة المتحدة','لندن','University of London','جامعة',['أونلاين','وجاهي'],['حوسبة','أعمال','قانون','علوم اجتماعية'],'https://www.london.ac.uk/study/courses/undergraduate',{
   contactEmail:'studentadvice@london.ac.uk',
 }),
 U('tum','ألمانيا','ميونخ','Technical University of Munich','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','إدارة'],'https://www.tum.de/en/studies/application',{
   local:['Abitur','طلب عبر بوابات TUM/Hochschulstart حسب البرنامج'],
   international:['Hochschulzugangsberechtigung / anabin','uni-assist عند اللزوم','TestDaF/DSH أو إنجليزي حسب البرنامج','تأشيرة وطنية وتمويل'],
   platformMember:true,contactEmail:'studium@tum.de',
 }),
 U('rwth','ألمانيا','آخن','RWTH Aachen University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.rwth-aachen.de/go/id/bqmo/lidx/1',{
   contactEmail:'international@rwth-aachen.de',
 }),
 U('heidelberg','ألمانيا','هايدلبرغ','Heidelberg University','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://www.uni-heidelberg.de/en/study/application-enrolment',{
   contactEmail:'studium@uni-heidelberg.de',
 }),
 U('paris-saclay','فرنسا','باريس','Université Paris-Saclay','جامعة',['وجاهي'],['علوم','هندسة','طب وصحة','اقتصاد'],'https://www.universite-paris-saclay.fr/en/admission',{
   platformMember:true,contactEmail:'admissions@universite-paris-saclay.fr',
 }),
 U('sorbonne','فرنسا','باريس','Sorbonne University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب'],'https://www.sorbonne-universite.fr/en/education/applying',{
   contactEmail:'admissions@sorbonne-universite.fr',
 }),
 U('sciencespo','فرنسا','باريس','Sciences Po','جامعة',['وجاهي'],['علوم اجتماعية','قانون','أعمال','علاقات دولية'],'https://www.sciencespo.fr/admissions/en/',{
   platformMember:true,contactEmail:'admissions@sciencespo.fr',
 }),
 U('lyon1','فرنسا','ليون','Université Claude Bernard Lyon 1','جامعة',['وجاهي'],['طب وصحة','علوم','هندسة'],'https://www.univ-lyon1.fr/',{
   contactEmail:'international@univ-lyon1.fr',
 }),
 U('tudelft','هولندا','دلفت','Delft University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','تصميم'],'https://www.tudelft.nl/en/education/admission-and-application',{
   platformMember:true,contactEmail:'contactcentre-esa@tudelft.nl',
 }),
 U('uva','هولندا','أمستردام','University of Amsterdam','جامعة',['وجاهي'],['علوم','أعمال','آداب','قانون'],'https://www.uva.nl/en/education/admissions/admissions.html',{
   contactEmail:'info@uva.nl',
 }),
 U('eur','هولندا','روتردام','Erasmus University Rotterdam','جامعة',['وجاهي'],['أعمال','اقتصاد','طب وصحة','قانون'],'https://www.eur.nl/en/education/practical-matters/admission',{
   platformMember:true,contactEmail:'admissions@eur.nl',
 }),
 U('fontys','هولندا','آيندهوفن','Fontys University of Applied Sciences','كلية',['وجاهي'],['هندسة','حوسبة','أعمال','تصميم'],'https://fontys.edu/study-at-fontys/application-and-admission.htm',{
   degree:'بكالوريوس تطبيقي وماجستير',contactEmail:'international@fontys.nl',
 }),
 U('tcd','أيرلندا','دبلن','Trinity College Dublin','كلية جامعية',['وجاهي'],['علوم','هندسة','طب وصحة','آداب'],'https://www.tcd.ie/study/apply/',{
   platformMember:true,contactEmail:'academic.registry@tcd.ie',
 }),
 U('ucd','أيرلندا','دبلن','University College Dublin','جامعة',['وجاهي'],['علوم','هندسة','أعمال','طب وصحة'],'https://www.ucd.ie/registry/admissions/',{
   contactEmail:'admissions@ucd.ie',
 }),
 U('galway','أيرلندا','غالواي','University of Galway','جامعة',['وجاهي'],['علوم','هندسة','طب وصحة','آداب'],'https://www.universityofgalway.ie/courses/how-to-apply/',{
   platformMember:true,contactEmail:'admissions@universityofgalway.ie',
 }),
 U('dcu','أيرلندا','دبلن','Dublin City University','جامعة',['وجاهي'],['حوسبة','أعمال','هندسة','تعليم'],'https://www.dcu.ie/registry/undergraduate-admissions',{
   contactEmail:'registry@dcu.ie',
 }),
 U('uw','بولندا','وارسو','University of Warsaw','جامعة',['وجاهي'],['علوم','قانون','آداب','اقتصاد'],'https://irk.uw.edu.pl/',{
   local:['شهادة ثانوية','IRK','لغة بولندية للبرامج البولندية'],
   international:['تقديم دولي','إثبات لغة','تمويل وتأشيرة لغير EU'],
   platformMember:true,contactEmail:'admission@uw.edu.pl',
 }),
 U('jagiellonian','بولندا','كراكوف','Jagiellonian University','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://welcome.uj.edu.pl/en_GB/admissions',{
   contactEmail:'admissions@uj.edu.pl',
 }),
 U('pw','بولندا','وارسو','Warsaw University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.pw.edu.pl/engpw/Candidates',{
   platformMember:true,contactEmail:'students@pw.edu.pl',
 }),
 U('agh','بولندا','كراكوف','AGH University of Krakow','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.agh.edu.pl/en/admissions',{
   contactEmail:'international.students@agh.edu.pl',
 }),
 U('cuni','التشيك','براغ','Charles University','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://cuni.cz/UKEN-145.html',{
   local:['برامج تشيكية مجانية في العامة','طلب الجامعة'],
   international:['برامج تشيكية مجانية أو إنجليزية برسوم','nostrification إن لزم','تأشيرة لغير EU'],
   platformMember:true,contactEmail:'admissions@cuni.cz',
 }),
 U('cvut','التشيك','براغ','Czech Technical University in Prague','جامعة',['وجاهي'],['هندسة','حوسبة','عمارة وتصميم'],'https://www.cvut.cz/en/admissions',{
   contactEmail:'study@cvut.cz',
 }),
 U('muni','التشيك','برنو','Masaryk University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','أعمال'],'https://www.muni.cz/en/admissions',{
   platformMember:true,contactEmail:'admission@muni.cz',
 }),
 U('vut','التشيك','برنو','Brno University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.vut.cz/en/students/admissions',{
   contactEmail:'admissions@vut.cz',
 }),
 U('nkua','اليونان','أثينا','National and Kapodistrian University of Athens','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://en.uoa.gr/admissions/',{
   local:['بكالوريوس يوناني عام غالباً مجاني لـ EU','تقديم الجامعة'],
   international:['برامج إنجليزية برسوم','تأشيرة D لغير EU'],
   platformMember:true,contactEmail:'protocol@uoa.gr',
 }),
 U('auth','اليونان','ثيسالونيكي','Aristotle University of Thessaloniki','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','آداب'],'https://www.auth.gr/en/admission',{
   contactEmail:'admissions@auth.gr',
 }),
 U('ntua','اليونان','أثينا','National Technical University of Athens','جامعة',['وجاهي'],['هندسة','حوسبة','عمارة وتصميم'],'https://www.ntua.gr/en/studies/admission',{
   platformMember:true,contactEmail:'central@ntua.gr',
 }),
 U('upatras','اليونان','باتراس','University of Patras','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','أعمال'],'https://www.upatras.gr/en/admission/',{
   contactEmail:'intrel@upatras.gr',
 }),
 U('acs-athens','اليونان','أثينا','American Community Schools of Athens','مدرسة',['وجاهي'],['American Curriculum','IB','ابتدائي','ثانوي'],'https://www.acs.gr/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@acs.gr',
 }),
 U('unibuc','رومانيا','بوخارست','University of Bucharest','جامعة',['وجاهي'],['علوم','آداب','قانون','اقتصاد'],'https://unibuc.ro/en/admitere/',{
   local:['نفس شروط المواطنين لـ EU/EEA/سويسرا','مقاعد مدعومة أو برسوم'],
   international:['رسوم بالعملة الأجنبية','تأشيرة طالب لغير EU'],
   platformMember:true,contactEmail:'admitere@unibuc.ro',
 }),
 U('ubb','رومانيا','كلوج','Babeș-Bolyai University','جامعة',['وجاهي'],['علوم','آداب','أعمال','قانون'],'https://www.ubbcluj.ro/en/prospective-students/',{
   contactEmail:'admit@ubbcluj.ro',
 }),
 U('upb','رومانيا','بوخارست','Politehnica University of Bucharest','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://upb.ro/en/admission/',{
   platformMember:true,contactEmail:'international@upb.ro',
 }),
 U('uaic','رومانيا','ياش','Alexandru Ioan Cuza University','جامعة',['وجاهي'],['علوم','آداب','اقتصاد','قانون'],'https://www.uaic.ro/en/studies/admission/',{
   contactEmail:'admission@uaic.ro',
 }),
 U('aisb-ro','رومانيا','بوخارست','American International School of Bucharest','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://www.aisb.ro/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@aisb.ro',
 }),
 U('elte','المجر','بودابست','Eötvös Loránd University (ELTE)','جامعة',['وجاهي'],['علوم','آداب','قانون','تعليم'],'https://www.elte.hu/en/content/admission.t.66',{
   local:['مقاعد حكومية أو ذاتية لـ EU','felvi / تقديم الجامعة'],
   international:['تمويل ذاتي أو Stipendium Hungaricum','تصريح إقامة'],
   platformMember:true,contactEmail:'admissions@elte.hu',
 }),
 U('semmelweis','المجر','بودابست','Semmelweis University','جامعة',['وجاهي'],['طب وصحة'],'https://semmelweis.hu/english/education/admission/',{
   contactEmail:'admission@semmelweis.hu',
 }),
 U('unideb','المجر','دبرتسن','University of Debrecen','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال'],'https://edu.unideb.hu/p/how-to-apply',{
   platformMember:true,contactEmail:'info@edu.unideb.hu',
 }),
 U('bme','المجر','بودابست','Budapest University of Technology and Economics','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.bme.hu/en/education/admission',{
   contactEmail:'admission@bme.hu',
 }),
 U('aisb-hu','المجر','بودابست','American International School of Budapest','مدرسة',['وجاهي'],['American Curriculum','IB','ابتدائي','ثانوي'],'https://www.aisb.hu/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@aisb.hu',
 }),
 U('uniba','سلوفاكيا','براتيسلافا','Comenius University Bratislava','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://uniba.sk/en/admissions/',{
   local:['سلوفاكية بدوام كامل غالباً مجانية','تقديم الكلية'],
   international:['سلوفاكية مجانية أو إنجليزية برسوم','تأشيرة لغير EU'],
   platformMember:true,contactEmail:'admissions@uniba.sk',
 }),
 U('stuba','سلوفاكيا','براتيسلافا','Slovak University of Technology in Bratislava','جامعة',['وجاهي'],['هندسة','حوسبة','عمارة وتصميم'],'https://www.stuba.sk/english/degree-students/admission.html',{
   contactEmail:'admission@stuba.sk',
 }),
 U('upjs','سلوفاكيا','كوشيتسه','Pavol Jozef Šafárik University in Košice','جامعة',['وجاهي'],['طب وصحة','علوم','آداب'],'https://www.upjs.sk/en/information/admission/',{
   platformMember:true,contactEmail:'admissions@upjs.sk',
 }),
 U('tuke','سلوفاكيا','كوشيتسه','Technical University of Košice','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.tuke.sk/en/admissions',{
   contactEmail:'international@tuke.sk',
 }),
 U('bisb-sk','سلوفاكيا','براتيسلافا','British International School Bratislava','مدرسة',['وجاهي'],['British Curriculum','IB','ابتدائي','ثانوي'],'https://www.nordangliaeducation.com/bisb-bratislava/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@bisb.sk',
 }),
 U('unizg','كرواتيا','زغرب','University of Zagreb','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','آداب'],'https://www.unizg.hr/homepage/study-at-the-university-of-zagreb/admission-and-enrolment/',{
   local:['studij.hr / دعم رسوم EU','Postani student'],
   international:['حصص أجانب','رسوم مؤسسية','تأشيرة'],
   platformMember:true,contactEmail:'international@unizg.hr',
 }),
 U('unist','كرواتيا','سبليت','University of Split','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال'],'https://www.unist.hr/en/study/admission',{
   contactEmail:'international@unist.hr',
 }),
 U('uniri','كرواتيا','رييكا','University of Rijeka','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','أعمال'],'https://uniri.hr/en/study/admission/',{
   platformMember:true,contactEmail:'international@uniri.hr',
 }),
 U('unios','كرواتيا','أوسييك','University of Osijek','جامعة',['وجاهي'],['زراعة','علوم','آداب','أعمال'],'https://www.unios.hr/en/study/admission/',{
   contactEmail:'international@unios.hr',
 }),
 U('vern','كرواتيا','زغرب','VERN University of Applied Sciences','كلية',['وجاهي'],['أعمال','سياحة','إعلام'],'https://www.vern.hr/en/admissions/',{
   degree:'بكالوريوس تطبيقي وماجستير',contactEmail:'admissions@vern.hr',
 }),
 U('aisz','كرواتيا','زغرب','American International School of Zagreb','مدرسة',['وجاهي'],['American Curriculum','IB','ابتدائي','ثانوي'],'https://www.aisz.hr/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@aisz.hr',
 }),
 U('uni-sofia','بلغاريا','صوفيا','Sofia University St. Kliment Ohridski','جامعة',['وجاهي'],['علوم','آداب','قانون','اقتصاد'],'https://www.uni-sofia.bg/index.php/eng/admission',{
   local:['رسوم مواطنين لـ EU/EEA/سويسرا','تقديم الجامعة'],
   international:['رسوم أجانب أعلى','تأشيرة D'],
   platformMember:true,contactEmail:'admission@uni-sofia.bg',
 }),
 U('tu-sofia','بلغاريا','صوفيا','Technical University of Sofia','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://tu-sofia.bg/en/admissions',{
   contactEmail:'foreign_students@tu-sofia.bg',
 }),
 U('mu-sofia','بلغاريا','صوفيا','Medical University of Sofia','جامعة',['وجاهي'],['طب وصحة'],'https://mu-sofia.bg/en/admission/',{
   platformMember:true,contactEmail:'admission@mu-sofia.bg',
 }),
 U('uni-plovdiv','بلغاريا','بلوفديف','Plovdiv University','جامعة',['وجاهي'],['علوم','آداب','تعليم','اقتصاد'],'https://uni-plovdiv.bg/en/pages/index/160/',{
   contactEmail:'admission@uni-plovdiv.bg',
 }),
 U('acs-sofia','بلغاريا','صوفيا','American College of Sofia','مدرسة',['وجاهي'],['American Curriculum','ثانوي'],'https://www.acs.bg/admissions',{
   degree:'تعليم مدرسي ثانوي',contactEmail:'admissions@acs.bg',
 }),
 U('uni-lj','سلوفينيا','ليوبليانا','University of Ljubljana','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','آداب'],'https://www.uni-lj.si/en/study/application-and-enrolment',{
   local:['eVŠ','إعفاء رسوم دوام كامل لـ EU/EEA'],
   international:['رسوم لغير EU','تصريح إقامة'],
   platformMember:true,contactEmail:'admissions@uni-lj.si',
 }),
 U('uni-mb','سلوفينيا','ماريبور','University of Maribor','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.um.si/en/study/application/',{
   contactEmail:'admissions@um.si',
 }),
 U('upr','سلوفينيا','كوبر','University of Primorska','جامعة',['وجاهي'],['علوم','أعمال','آداب','سياحة'],'https://www.upr.si/en/study/application-and-enrolment/',{
   platformMember:true,contactEmail:'international@upr.si',
 }),
 U('ung','سلوفينيا','نوفا جوريتسا','University of Nova Gorica','جامعة',['وجاهي'],['علوم','هندسة','آداب'],'https://www.ung.si/en/study/application/',{
   contactEmail:'students@ung.si',
 }),
 U('qsi-lj','سلوفينيا','ليوبليانا','QSI International School of Ljubljana','مدرسة',['وجاهي'],['American Curriculum','ابتدائي','ثانوي'],'https://ljubljana.qsischool.org/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'ljubljana@qsi.org',
 }),
 U('ut','إستونيا','تارتو','University of Tartu','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://ut.ee/en/admissions',{
   local:['DreamApply','إستونية مجانية بدوام كامل غالباً'],
   international:['إنجليزية برسوم','تأشيرة D لغير EU'],
   platformMember:true,contactEmail:'admissions@ut.ee',
 }),
 U('taltech','إستونيا','تالين','Tallinn University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://taltech.ee/en/admission',{
   platformMember:true,contactEmail:'admissions@taltech.ee',
 }),
 U('tlu','إستونيا','تالين','Tallinn University','جامعة',['وجاهي'],['تعليم','آداب','علوم اجتماعية','حوسبة'],'https://www.tlu.ee/en/admissions',{
   contactEmail:'admissions@tlu.ee',
 }),
 U('emu','إستونيا','تارتو','Estonian University of Life Sciences','جامعة',['وجاهي'],['زراعة','علوم','طب بيطري','هندسة'],'https://www.emu.ee/en/admissions/',{
   contactEmail:'admissions@emu.ee',
 }),
 U('istes','إستونيا','تالين','International School of Tallinn','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://ist.ee/admissions/',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@ist.ee',
 }),
 U('vu','ليتوانيا','فيلنيوس','Vilnius University','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://www.vu.lt/en/studies/admission',{
   local:['LAMA BPO لمقاعد EU المموّلة','تقديم الجامعة'],
   international:['تمويل ذاتي','تأشيرة وطنية لغير EU'],
   platformMember:true,contactEmail:'admissions@cr.vu.lt',
 }),
 U('ktu','ليتوانيا','كاوناس','Kaunas University of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://admissions.ktu.edu/',{
   platformMember:true,contactEmail:'international@ktu.lt',
 }),
 U('vilniustech','ليتوانيا','فيلنيوس','Vilnius Gediminas Technical University','جامعة',['وجاهي'],['هندسة','عمارة وتصميم','حوسبة'],'https://vilniustech.lt/en/studies/admission/',{
   contactEmail:'admissions@vilniustech.lt',
 }),
 U('vdu','ليتوانيا','كاوناس','Vytautas Magnus University','جامعة',['وجاهي'],['آداب','علوم اجتماعية','أعمال','علوم'],'https://www.vdu.lt/en/studies/admission/',{
   contactEmail:'studies@vdu.lt',
 }),
 U('kolegija','ليتوانيا','فيلنيوس','Vilnius College of Technologies and Design','كلية',['وجاهي'],['تصميم','هندسة','حوسبة'],'https://en.vtdko.lt/admissions',{
   degree:'بكالوريوس تطبيقي',contactEmail:'admissions@vtdko.lt',
 }),
 U('aisv','ليتوانيا','فيلنيوس','American International School of Vilnius','مدرسة',['وجاهي'],['American Curriculum','IB','ابتدائي','ثانوي'],'https://www.aisv.lt/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@aisv.lt',
 }),
 U('sapienza','إيطاليا','روما','Sapienza Università di Roma','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','آداب'],'https://www.uniroma1.it/en/pagina/admission',{
   local:['دبلوم ثانوي إيطالي أو معادل','تسجيل مباشر'],
   international:['قبول البرنامج','Universitaly لغير EU خارج إيطاليا','تأشيرة دراسة'],
   platformMember:true,contactEmail:'settore.internazionale@uniroma1.it',
 }),
 U('polimi','إيطاليا','ميلانو','Politecnico di Milano','جامعة',['وجاهي'],['هندسة','عمارة وتصميم','حوسبة'],'https://www.polimi.it/en/international-prospective-students/',{
   local:['تسجيل محلي/EU'],
   international:['تقديم دولي','Universitaly إن لزم','تأشيرة'],
   contactEmail:'admissions@polimi.it',
 }),
 U('unibo','إيطاليا','بولونيا','Università di Bologna','جامعة',['وجاهي'],['قانون','علوم','هندسة','طب وصحة'],'https://www.unibo.it/en/teaching/enrolment-transfer-and-final-examination',{
   contactEmail:'internationaldesk@unibo.it',
 }),
 U('unimi','إيطاليا','ميلانو','University of Milan','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://www.unimi.it/en/international/coming-abroad/enrol-programme/international-enrolment-degree-programmes',{
   contactEmail:'international.students@unimi.it',
 }),
 U('unipd','إيطاليا','بادوفا','University of Padua','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.unipd.it/en/how-apply',{
   contactEmail:'international.admission@unipd.it',
 }),
 U('univie','النمسا','فيينا','University of Vienna','جامعة',['وجاهي'],['علوم','آداب','قانون','أعمال'],'https://studieren.univie.ac.at/en/admission/',{
   local:['Matura / EU','إعفاء رسوم ضمن المدة النظامية'],
   international:['معادل ثانوي','رسوم دولة ثالثة','تصريح إقامة طالب'],
   contactEmail:'admission@univie.ac.at',
 }),
 U('tuwien','النمسا','فيينا','TU Wien','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.tuwien.at/en/studies/admission',{
   contactEmail:'studienabteilung@tuwien.ac.at',
 }),
 U('uibk','النمسا','إنسبروك','University of Innsbruck','جامعة',['وجاهي'],['علوم','هندسة','آداب','طب وصحة'],'https://www.uibk.ac.at/en/studium/anmeldung-zulassung/',{
   contactEmail:'studienabteilung@uibk.ac.at',
 }),
 U('uni-graz','النمسا','غراتس','Universität Graz','جامعة',['وجاهي'],['علوم','آداب','قانون','أعمال'],'https://www.uni-graz.at/en/studying/',{
   contactEmail:'studienabteilung@uni-graz.at',
 }),
 U('ucm','إسبانيا','مدريد','Universidad Complutense de Madrid','جامعة',['وجاهي'],['طب وصحة','آداب','علوم','قانون'],'https://www.ucm.es/english',{
   local:['Bachillerato','PAU/EBAU'],
   international:['UNEDasiss','معادلة إن لزم','PCE','تأشيرة'],
   contactEmail:'informacion@ucm.es',
 }),
 U('ub','إسبانيا','برشلونة','Universitat de Barcelona','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','أعمال'],'https://www.ub.edu/web/ub/en/estudis/index.html',{
   contactEmail:'sai@ub.edu',
 }),
 U('uam','إسبانيا','مدريد','Universidad Autónoma de Madrid','جامعة',['وجاهي'],['علوم','هندسة','آداب','اقتصاد'],'https://www.uam.es/uam/en/startpage',{
   contactEmail:'informacion.acceso@uam.es',
 }),
 U('uv','إسبانيا','فالنسيا','Universidad de Valencia','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','قانون'],'https://www.uv.es/uvweb/college/en/undergraduate-studies-/admissions/admissions-1285846108890.html',{
   contactEmail:'access@uv.es',
 }),
 U('kuleuven','بلجيكا','لوفان','KU Leuven','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.kuleuven.be/english/application',{
   local:['شهادة ثانوية','رسوم EU'],
   international:['تقديم مبكر','رسوم غير EU','تأشيرة D'],
   platformMember:true,contactEmail:'admissions@kuleuven.be',
 }),
 U('ugent','بلجيكا','Gent','Ghent University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ugent.be/en/admission',{
   contactEmail:'admission@ugent.be',
 }),
 U('uclouvain','بلجيكا','لوفان لا نوف','UCLouvain','جامعة',['وجاهي'],['علوم','هندسة','طب وصحة','آداب'],'https://uclouvain.be/en/study/inscriptions',{
   contactEmail:'info-inscriptions@uclouvain.be',
 }),
 U('ulb','بلجيكا','بروكسل','Université libre de Bruxelles','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://www.ulb.be/en/enrolment',{
   contactEmail:'accueil.etudiants@ulb.be',
 }),
 U('lund','السويد','لوند','Lund University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.lunduniversity.lu.se/admissions',{
   local:['universityadmissions.se','إعفاء رسوم EU/EEA/سويسرا'],
   international:['universityadmissions.se','رسوم تقديم ودراسية','تصريح إقامة'],
   contactEmail:'admissions@lunduniversity.lu.se',
 }),
 U('uppsala','السويد','أوبسالا','Uppsala University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://www.uu.se/en/admissions',{
   contactEmail:'admissions@uu.se',
 }),
 U('kth','السويد','ستوكهولم','KTH Royal Institute of Technology','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.kth.se/en/studies/master/admissions',{
   contactEmail:'info@kth.se',
 }),
 U('aalto','فنلندا','إسبو','Aalto University','جامعة',['وجاهي'],['هندسة','تصميم','أعمال','حوسبة'],'https://www.aalto.fi/en/admission',{
   local:['Studyinfo.fi','بدون رسوم دراسية لـ EU/EEA/سويسرا'],
   international:['Studyinfo.fi','رسوم لبرامج إنجليزية لغير EU','تصريح إقامة'],
   platformMember:true,contactEmail:'admissions@aalto.fi',
 }),
 U('helsinki-uni','فنلندا','هلسنكي','University of Helsinki','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://www.helsinki.fi/en/admissions-and-education',{
   contactEmail:'admissions@helsinki.fi',
 }),
 U('utu','فنلندا','توركو','University of Turku','جامعة',['وجاهي'],['علوم','طب وصحة','آداب'],'https://www.utu.fi/en/study-at-utu',{
   contactEmail:'admissions@utu.fi',
 }),
 U('ku-dk','الدنمارك','كوبنهاغن','University of Copenhagen','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://studies.ku.dk/bachelor/admission/',{
   local:['optagelse.dk','بدون رسوم لـ EU/EEA/سويسرا'],
   international:['تقديم المؤسسة / optagelse','رسوم دراسية','تصريح إقامة'],
   platformMember:true,contactEmail:'bacheloradmission@adm.ku.dk',
 }),
 U('dtu','الدنمارك','كونغنز لينغبي','Technical University of Denmark','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.dtu.dk/english/education/international-student-guide/application',{
   contactEmail:'international@adm.dtu.dk',
 }),
 U('au-dk','الدنمارك','آرهوس','Aarhus University','جامعة',['وجاهي'],['علوم','أعمال','آداب','طب وصحة'],'https://bachelor.au.dk/en/admission',{
   contactEmail:'ba.admission@au.dk',
 }),
 U('uio','النرويج','أوسلو','University of Oslo','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','قانون'],'https://www.uio.no/english/studies/admission/',{
   local:['بدون رسوم دراسية لـ EU/EEA/سويسرا','رسوم فصل طلابية'],
   international:['رسوم دراسية لغير EU/EEA','تصريح إقامة طالب','إثبات تمويل'],
   contactEmail:'admission@uio.no',
 }),
 U('ntnu','النرويج','تروندهايم','NTNU','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.ntnu.edu/studies/admission',{
   contactEmail:'admission@st.ntnu.no',
 }),
 U('uib','النرويج','برجن','University of Bergen','جامعة',['وجاهي'],['علوم','طب وصحة','آداب'],'https://www.uib.no/en/education/admission',{
   contactEmail:'admission@uib.no',
 }),
 U('ulisboa','البرتغال','لشبونة','Universidade de Lisboa','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.ulisboa.pt/en',{
   local:['Concurso Nacional / DGES للمواطنين وEU المؤهلين'],
   international:['Concurso Especial — estudante internacional','تأشيرة إقامة'],
   contactEmail:'relacoes.internacionais@ulisboa.pt',
 }),
 U('uporto','البرتغال','بورتو','Universidade do Porto','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','أعمال'],'https://www.up.pt/portal/en/study/',{
   contactEmail:'international@reit.up.pt',
 }),
 U('ucp','البرتغال','لشبونة','Universidade Católica Portuguesa','جامعة',['وجاهي'],['أعمال','قانون','علوم اجتماعية','طب وصحة'],'https://www.ucp.pt/en/admissions',{
   platformMember:true,contactEmail:'admissions@ucp.pt',
 }),

 // Asia
 U('tsinghua','الصين','بكين','Tsinghua University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://international.join-tsinghua.edu.cn/'),
 U('fudan','الصين','شنغهاي','Fudan University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','اقتصاد'],'https://iso.fudan.edu.cn/'),
 U('tokyo','اليابان','طوكيو','The University of Tokyo','جامعة',['وجاهي'],['هندسة','علوم','آداب','اقتصاد'],'https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate_english.html',{
   platformMember:true,contactEmail:'admission.u@gs.mail.u-tokyo.ac.jp',
 }),
 U('kyoto','اليابان','كيوتو','Kyoto University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.kyoto-u.ac.jp/en/education-campus/education_and_admissions',{
   contactEmail:'admission@mail2.adm.kyoto-u.ac.jp',
 }),
 U('waseda','اليابان','طوكيو','Waseda University','جامعة',['وجاهي'],['علوم','آداب','أعمال','هندسة'],'https://www.waseda.jp/inst/admission/en/',{
   contactEmail:'admission@list.waseda.jp',
 }),
 U('osaka','اليابان','أوساكا','Osaka University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.osaka-u.ac.jp/en/admissions',{
   platformMember:true,contactEmail:'gakusei-nyushi-g30@office.osaka-u.ac.jp',
 }),
 U('snu','كوريا الجنوبية','سيول','Seoul National University','جامعة',['وجاهي'],['هندسة','علوم','أعمال','آداب'],'https://en.snu.ac.kr/admission'),
 U('yonsei','كوريا الجنوبية','سيول','Yonsei University','جامعة',['وجاهي'],['علوم','أعمال','طب وصحة','آداب'],'https://admission.yonsei.ac.kr/'),
 U('korea-u','كوريا الجنوبية','سيول','Korea University','جامعة',['وجاهي'],['هندسة','أعمال','علوم','آداب'],'https://oia.korea.ac.kr/'),
 U('iitd','الهند','نيودلهي','Indian Institute of Technology Delhi','معهد جامعي',['وجاهي'],['هندسة','حوسبة','علوم'],'https://home.iitd.ac.in/undergraduate.php',{
   platformMember:true,contactEmail:'ugadmission@admin.iitd.ac.in',
 }),
 U('iitb','الهند','مومباي','Indian Institute of Technology Bombay','معهد جامعي',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.iitb.ac.in/newacadhome/undergraduate.jsp',{
   contactEmail:'jeeadv@iitb.ac.in',
 }),
 U('du','الهند','نيودلهي','University of Delhi','جامعة',['وجاهي'],['آداب','علوم','أعمال','قانون'],'https://admission.uod.ac.in/',{
   contactEmail:'admission@du.ac.in',
 }),
 U('iisc','الهند','بنغالور','Indian Institute of Science','معهد جامعي',['وجاهي'],['علوم','هندسة','حوسبة'],'https://iisc.ac.in/admissions/',{
   platformMember:true,contactEmail:'admission.acad@iisc.ac.in',
 }),
 U('ashoka','الهند','سونيبات','Ashoka University','جامعة',['وجاهي'],['آداب','علوم','اقتصاد'],'https://www.ashoka.edu.in/admissions/',{
   contactEmail:'ugadmissions@ashoka.edu.in',
 }),
 U('um','ماليزيا','كوالالمبور','Universiti Malaya','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://study.um.edu.my/how-to-apply'),
 U('ukm','ماليزيا','بانغي','Universiti Kebangsaan Malaysia','جامعة',['وجاهي'],['طب وصحة','علوم','هندسة','آداب'],'https://www.ukm.my/portal/'),
 U('utm','ماليزيا','جوهور','Universiti Teknologi Malaysia','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://admission.utm.my/'),
 U('nus','سنغافورة','سنغافورة','National University of Singapore','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://nus.edu.sg/oam/admissions'),
 U('ntu','سنغافورة','سنغافورة','Nanyang Technological University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://www.ntu.edu.sg/admissions/undergraduate'),
 U('smu','سنغافورة','سنغافورة','Singapore Management University','جامعة',['وجاهي'],['أعمال','حوسبة','قانون','علوم اجتماعية'],'https://admissions.smu.edu.sg/'),

 // MENA
 U('uj','الأردن','عمّان','الجامعة الأردنية','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال','آداب'],'https://registration.ju.edu.jo/',{
   platformMember:true,contactEmail:'admission@ju.edu.jo',
 }),
 U('just','الأردن','إربد','جامعة العلوم والتكنولوجيا الأردنية','جامعة',['وجاهي'],['طب وصحة','هندسة','حوسبة','علوم'],'https://www.just.edu.jo/Admission/',{
   platformMember:true,contactEmail:'admission@just.edu.jo',
 }),
 U('gju','الأردن','عمّان','الجامعة الألمانية الأردنية','جامعة',['وجاهي'],['هندسة','حوسبة','أعمال','تصميم'],'https://www.gju.edu.jo/content/admission-77',{
   platformMember:true,contactEmail:'admission@gju.edu.jo',
 }),
 U('uaeu','الإمارات','العين','جامعة الإمارات العربية المتحدة','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://www.uaeu.ac.ae/en/admission/',{
   platformMember:true,contactEmail:'admissions@uaeu.ac.ae',
 }),
 U('ku','الإمارات','أبوظبي','جامعة خليفة','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','طب وصحة'],'https://www.ku.ac.ae/undergraduate-admissions',{
   contactEmail:'admissions@ku.ac.ae',
 }),
 U('aus','الإمارات','الشارقة','الجامعة الأمريكية في الشارقة','جامعة',['وجاهي'],['هندسة','عمارة وتصميم','أعمال','آداب'],'https://www.aus.edu/admissions/bachelors-degrees',{
   contactEmail:'admissions@aus.edu',
 }),
 U('ksu','السعودية','الرياض','جامعة الملك سعود','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال'],'https://dar.ksu.edu.sa/',{
   platformMember:true,contactEmail:'admission@ksu.edu.sa',
 }),
 U('qu','قطر','الدوحة','جامعة قطر','جامعة',['وجاهي'],['هندسة','طب وصحة','قانون','أعمال'],'https://www.qu.edu.qa/en-us/students/admission/undergraduate/',{
   platformMember:true,contactEmail:'admission@qu.edu.qa',
 }),
 U('cairo','مصر','القاهرة','جامعة القاهرة','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','آداب'],'https://cu.edu.eg/Home',{
   platformMember:true,contactEmail:'admission@cu.edu.eg',
 }),
 U('auc','مصر','القاهرة','الجامعة الأمريكية بالقاهرة','جامعة',['وجاهي'],['أعمال','هندسة','علوم','آداب'],'https://www.aucegypt.edu/admissions/undergraduate',{
   contactEmail:'admissions@aucegypt.edu',
 }),
 U('usthb','الجزائر','الجزائر','جامعة هواري بومدين للعلوم والتكنولوجيا','جامعة',['وجاهي'],['علوم','هندسة','حوسبة'],'https://www.usthb.dz/',{
   platformMember:true,contactEmail:'contact@usthb.dz',
 }),
 U('univ-alger','الجزائر','الجزائر','جامعة الجزائر 1 بن يوسف بن خدة','جامعة',['وجاهي'],['طب وصحة','قانون','آداب','علوم'],'https://www.univ-alger.dz/',{
   contactEmail:'contact@univ-alger.dz',
 }),
 U('univ-oran','الجزائر','وهران','جامعة وهران 1 أحمد بن بلة','جامعة',['وجاهي'],['علوم','طب وصحة','آداب'],'https://www.univ-oran1.dz/',{
   contactEmail:'contact@univ-oran1.dz',
 }),
 U('univ-constantine','الجزائر','قسنطينة','جامعة الإخوة منتوري قسنطينة 1','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','هندسة'],'https://www.umc.edu.dz/',{
   platformMember:true,contactEmail:'contact@umc.edu.dz',
 }),
 U('um5','المغرب','الرباط','جامعة محمد الخامس','جامعة',['وجاهي'],['علوم','قانون','آداب','طب وصحة'],'https://www.um5.ac.ma/um5/',{
   platformMember:true,contactEmail:'contact@um5.ac.ma',
 }),
 U('uh2c','المغرب','الدار البيضاء','جامعة الحسن الثاني','جامعة',['وجاهي'],['علوم','هندسة','طب وصحة','آداب'],'https://www.univh2c.ma/',{
   contactEmail:'contact@univh2c.ma',
 }),
 U('uca','المغرب','مراكش','جامعة القاضي عياض','جامعة',['وجاهي'],['علوم','هندسة','آداب','طب وصحة'],'https://www.uca.ma/',{
   contactEmail:'contact@uca.ma',
 }),
 U('um6p','المغرب','بن جرير','جامعة محمد السادس متعددة التخصصات التقنية','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://www.um6p.ma/',{
   platformMember:true,contactEmail:'admissions@um6p.ma',
 }),
 U('metu','تركيا','أنقرة','Middle East Technical University','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://iso.metu.edu.tr/en/application-requirements'),
 U('bau','تركيا','إسطنبول','Bahçeşehir University','جامعة',['وجاهي','أونلاين'],['طب وصحة','هندسة','تصميم','أعمال'],'https://int.bau.edu.tr/admission/undergraduate-applicants/'),
 U('boun','تركيا','إسطنبول','Boğaziçi University','جامعة',['وجاهي'],['هندسة','علوم','آداب','اقتصاد'],'https://www.boun.edu.tr/en-US/Content/Academic/Prospective_Students'),
 U('ku-tr','تركيا','إسطنبول','Koç University','جامعة',['وجاهي'],['هندسة','أعمال','علوم','طب وصحة'],'https://international.ku.edu.tr/'),

 // Africa (launch set)
 U('uct','جنوب أفريقيا','كيب تاون','University of Cape Town','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.uct.ac.za/students/applications-admission/undergraduate-applications',{
   local:['National Senior Certificate','نقاط APS','مواد البرنامج'],
   international:['تقييم مؤهل أجنبي','IELTS إن لزم','تمويل وتأشيرة دراسة'],
 }),
 U('stellenbosch','جنوب أفريقيا','ستيلينبوش','Stellenbosch University','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.sun.ac.za/english/maties/apply'),
 U('up-za','جنوب أفريقيا','بريتوريا','University of Pretoria','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://www.up.ac.za/online-application'),
 U('uon','كينيا','نيروبي','University of Nairobi','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.uonbi.ac.ke/admission',{
   local:['KCSE','KUCCPS (مواطن كيني)'],
   international:['تقديم دولي مباشر','معادلة KNQA/KNEC','Student Pass'],
   platformMember:true,contactEmail:'admissions@uonbi.ac.ke',
 }),
 U('ku-ke','كينيا','نيروبي','Kenyatta University','جامعة',['وجاهي'],['تربية','علوم','أعمال','طب وصحة'],'https://international.ku.ac.ke/international-student-admissions/'),
 U('strathmore','كينيا','نيروبي','Strathmore University','جامعة',['وجاهي'],['أعمال','حوسبة','قانون','علوم'],'https://strathmore.edu/admissions/'),
 U('usp','البرازيل','ساو باولو','Universidade de São Paulo','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.usp.br/',{
   local:['ENEM / Vestibular','SiSU عند الانطباق'],
   international:['PEC-G عبر السفارة أو مسار دولي للمؤسسة','Celpe-Bras غالباً'],
   contactEmail:'international@usp.br',
 }),
 U('unicamp','البرازيل','كامبيناس','Universidade Estadual de Campinas','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://www.unicamp.br/'),
 U('ufrj','البرازيل','ريو دي جانيرو','Universidade Federal do Rio de Janeiro','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://ufrj.br/'),
 U('ki','السويد','ستوكهولم','Karolinska Institutet','جامعة',['وجاهي'],['طب وصحة','علوم'],'https://education.ki.se/bachelors-masters-studies/tuition-fees',{
   local:['universityadmissions.se','إثبات جنسية EU/EEA/سويسرا للإعفاء من الرسوم'],
   international:['universityadmissions.se','رسوم تقديم ودراسية','تصريح إقامة طالب'],
   platformMember:true,contactEmail:'admissions@ki.se',
 }),

 // Oceania
 U('melbourne','أستراليا','ملبورن','The University of Melbourne','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','طب وصحة','أعمال'],'https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications'),
 U('unsw','أستراليا','سيدني','UNSW Sydney','جامعة',['وجاهي','أونلاين'],['هندسة','حوسبة','علوم','أعمال'],'https://www.unsw.edu.au/study/how-to-apply/international'),
 U('auckland','نيوزيلندا','أوكلاند','University of Auckland','جامعة',['وجاهي','أونلاين'],['هندسة','علوم','أعمال','آداب'],'https://www.auckland.ac.nz/en/study/applications-and-admissions.html',{
   local:['University Entrance / NCEA','رسوم domestic لنيوزيلندا وأستراليا المقيمين في NZ'],
   international:['مسار دولي','IELTS','تمويل','Student Visa'],
   platformMember:true,contactEmail:'int-questions@auckland.ac.nz',
 }),
 U('otago','نيوزيلندا','دنيدن','University of Otago','جامعة',['وجاهي'],['طب وصحة','علوم','آداب','أعمال'],'https://www.otago.ac.nz/study/entrance',{
   contactEmail:'university@otago.ac.nz',
 }),
 U('vuw','نيوزيلندا','ويلينغتون','Victoria University of Wellington','جامعة',['وجاهي'],['قانون','علوم','أعمال','آداب'],'https://www.wgtn.ac.nz/study/apply',{
   platformMember:true,contactEmail:'course-advice@vuw.ac.nz',
 }),
 U('canterbury','نيوزيلندا','كرايستشيرش','University of Canterbury','جامعة',['وجاهي'],['هندسة','علوم','أعمال','تعليم'],'https://www.canterbury.ac.nz/study/getting-started/admission-and-enrolment',{
   contactEmail:'enrol@canterbury.ac.nz',
 }),

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
   platformMember:true,contactEmail:'admissions@bmcc.cuny.edu',
 }),
 U('deanza','الولايات المتحدة','Cupertino','De Anza College','كلية مجتمعية',['وجاهي','أونلاين'],['حوسبة','هندسة','أعمال','علوم'],'https://www.deanza.edu/admissions/',{
   degree:'دبلوم وAssociate',
   contactEmail:'admissions@deanza.edu',
 }),
 U('seneca','كندا','تورونتو','Seneca Polytechnic','كلية تقنية',['وجاهي','أونلاين'],['حوسبة','أعمال','تصميم','هندسة'],'https://www.senecapolytechnic.ca/admissions.html',{
   degree:'دبلوم وبكالوريوس تطبيقي',
   platformMember:true,contactEmail:'internationaladmissions@senecacollege.ca',
 }),
 U('centennial','كندا','تورونتو','Centennial College','كلية',['وجاهي','أونلاين'],['هندسة','حوسبة','أعمال','طب وصحة'],'https://www.centennialcollege.ca/admissions/',{
   degree:'دبلوم وبكالوريوس',
   contactEmail:'international@centennialcollege.ca',
 }),
 U('hkcc','الصين','هونغ كونغ','HKU SPACE Community College','كلية مجتمعية',['وجاهي'],['أعمال','علوم','آداب'],'https://hkuspace.hku.hk/cc/',{
   degree:'دبلوم وAssociate',
   region:'asia',
   contactEmail:'ccadmissions@hkuspace.hku.hk',
 }),
 U('luminus','الأردن','عمّان','Luminus Technical University College','كلية تقنية',['وجاهي'],['حوسبة','هندسة','أعمال','تصميم'],'https://www.luminus.edu.jo/',{
   degree:'دبلوم وبكالوريوس تطبيقي',
   platformMember:true,contactEmail:'admissions@luminus.edu.jo',
 }),
 U('htmi','الإمارات','دبي','HTMi Hotel and Tourism Management Institute Dubai','كلية',['وجاهي'],['ضيافة','أعمال','سياحة'],'https://www.htmi.ch/',{
   degree:'دبلوم وبكالوريوس',
   contactEmail:'dubai@htmi.ch',
 }),

 // Named schools (K-12) — same $5 contact channel as universities/colleges
 U('abs-jo','الأردن','عمّان','Amman Baccalaureate School','مدرسة',['وجاهي'],['IB','ابتدائي','متوسط','ثانوي'],'https://www.abs.edu.jo/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@abs.edu.jo',
   local:['هوية أردنية / إقامة','سجل أكاديمي','مقابلة/اختبار قبول حسب المرحلة'],
   international:['جواز','سجل أكاديمي مترجم','إثبات لغة إن لزم','رسوم غير مواطنين قد تختلف'],
 }),
 U('kings-jo','الأردن','مادبا','King\'s Academy','مدرسة',['وجاهي'],['American Curriculum','ثانوي'],'https://www.kingsacademy.edu.jo/admissions',{
   degree:'تعليم مدرسي ثانوي',
   contactEmail:'admissions@kingsacademy.edu.jo',
 }),
 U('ics-jo','الأردن','عمّان','International Community School Amman','مدرسة',['وجاهي'],['British Curriculum','ابتدائي','ثانوي'],'https://www.ics.edu.jo/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@ics.edu.jo',
 }),
 U('gems-wellington-ae','الإمارات','دبي','GEMS Wellington International School','مدرسة',['وجاهي'],['British Curriculum','IB','ابتدائي','ثانوي'],'https://www.gemswellingtoninternationalschool.com/admissions',{
   degree:'تعليم مدرسي K-12',
   contactEmail:'admissions_wis@gemsedu.com',
 }),
 U('dubai-college','الإمارات','دبي','Dubai College','مدرسة',['وجاهي'],['British Curriculum','ثانوي'],'https://www.dubaicollege.org/admissions',{
   degree:'تعليم مدرسي ثانوي',
   platformMember:true,contactEmail:'admissions@dubaicollege.org',
 }),
 U('repton-dubai','الإمارات','دبي','Repton School Dubai','مدرسة',['وجاهي'],['British Curriculum','ابتدائي','ثانوي'],'https://www.reptondubai.org/admissions',{
   degree:'تعليم مدرسي K-12',
   contactEmail:'admissions@reptondubai.org',
 }),
 U('ais-riyadh','السعودية','الرياض','American International School Riyadh','مدرسة',['وجاهي'],['American Curriculum','ابتدائي','ثانوي'],'https://www.aisr.org/admissions',{
   degree:'تعليم مدرسي K-12',
   contactEmail:'admissions@aisr.org',
 }),
 U('cac-egypt','مصر','القاهرة','Cairo American College','مدرسة',['وجاهي'],['American Curriculum','ابتدائي','ثانوي'],'https://www.cacegypt.org/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@cacegypt.org',
 }),
 U('acs-eg','مصر','القاهرة','American College of Cairo (school track)','مدرسة',['وجاهي'],['American Curriculum','ثانوي'],'https://www.aucegypt.edu/',{
   degree:'تعليم مدرسي ثانوي',
   contactEmail:'admissions@aucegypt.edu',
 }),
 U('helsinki-intl','فنلندا','هلسنكي','International School of Helsinki','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://www.ishelsinki.fi/admissions',{
   degree:'تعليم مدرسي K-12',
   contactEmail:'admissions@ishelsinki.fi',
 }),
 U('copenhagen-intl','الدنمارك','كوبنهاغن','Copenhagen International School','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://www.cis.dk/admissions',{
   degree:'تعليم مدرسي K-12',
   contactEmail:'admissions@cis.dk',
 }),
 U('paris-intl-school','فرنسا','باريس','International School of Paris','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://www.isparis.edu/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@isparis.edu',
 }),
 U('ams-intl','هولندا','أمستردام','Amsterdam International Community School','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://aics.espritscholen.nl/home/admissions/',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'info@aics.espritscholen.nl',
 }),
 U('st-clares-ie','أيرلندا','دبلن','St Clare\'s College','مدرسة',['وجاهي'],['Irish Curriculum','ثانوي'],'https://www.stclares.ie/',{
   degree:'تعليم مدرسي ثانوي',contactEmail:'info@stclares.ie',
 }),
 U('aszs-pl','بولندا','وارسو','American School of Warsaw','مدرسة',['وجاهي'],['American Curriculum','IB','ابتدائي','ثانوي'],'https://asw.school/admissions',{
   degree:'تعليم مدرسي K-12',
   platformMember:true,contactEmail:'admissions@asw.school',
 }),
 U('pis-cz','التشيك','براغ','Prague British International School','مدرسة',['وجاهي'],['British Curriculum','IB','ابتدائي','ثانوي'],'https://www.nordangliaeducation.com/pbis-prague/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@pbis.cz',
 }),
 U('akis-nz','نيوزيلندا','أوكلاند','ACG Parnell College','مدرسة',['وجاهي'],['Cambridge','IB','ثانوي'],'https://www.acgedu.com/parnell/admissions',{
   degree:'تعليم مدرسي ثانوي',
   platformMember:true,contactEmail:'parnell@acgedu.com',
 }),
 U('iszh','سويسرا','زيورخ','International School of Zurich North','مدرسة',['وجاهي'],['IB','ابتدائي','ثانوي'],'https://www.iszn.ch/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@iszn.ch',
 }),

 // More global research universities
 U('harvard','الولايات المتحدة','Cambridge','Harvard University','جامعة',['وجاهي'],['علوم','أعمال','قانون','طب وصحة','آداب'],'https://college.harvard.edu/admissions'),
 U('nyu','الولايات المتحدة','New York','New York University','جامعة',['وجاهي','أونلاين'],['أعمال','آداب','حوسبة','تصميم'],'https://www.nyu.edu/admissions.html'),
 U('lse','المملكة المتحدة','لندن','London School of Economics','جامعة',['وجاهي'],['اقتصاد','علوم اجتماعية','قانون','أعمال'],'https://www.lse.ac.uk/study-at-lse/Undergraduate/Prospective-Students/How-to-Apply'),
 U('eth','سويسرا','زيورخ','ETH Zurich','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://ethz.ch/en/studies/application.html',{
   region:'europe',
   local:['شهادة ثانوية سويسرية / maturité','طلب ETH'],
   international:['شهادة معادلة','إثبات لغة','تمويل وتأشيرة'],
   platformMember:true,contactEmail:'admissions@ethz.ch',
 }),
 U('epfl','سويسرا','لوزان','EPFL','جامعة',['وجاهي'],['هندسة','حوسبة','علوم'],'https://www.epfl.ch/education/admission/',{
   region:'europe',contactEmail:'bachelor@epfl.ch',
 }),
 U('uzh','سويسرا','زيورخ','University of Zurich','جامعة',['وجاهي'],['طب وصحة','علوم','قانون','آداب'],'https://www.uzh.ch/en/studies/application.html',{
   region:'europe',
   platformMember:true,contactEmail:'admission@uzh.ch',
 }),
 U('unige','سويسرا','جنيف','University of Geneva','جامعة',['وجاهي'],['علوم','قانون','طب وصحة','آداب'],'https://www.unige.ch/en/university/admission/',{
   region:'europe',contactEmail:'admission@unige.ch',
 }),
 U('anu','أستراليا','كانبرا','Australian National University','جامعة',['وجاهي','أونلاين'],['علوم','هندسة','أعمال','آداب'],'https://www.anu.edu.au/study/apply'),
 U('monash','أستراليا','ملبورن','Monash University','جامعة',['وجاهي','أونلاين'],['طب وصحة','هندسة','أعمال','علوم'],'https://www.monash.edu/study/how-to-apply'),
 U('kaist','كوريا الجنوبية','Daejeon','KAIST','معهد جامعي',['وجاهي'],['هندسة','حوسبة','علوم'],'https://admission.kaist.ac.kr/intl-undergraduate/'),
 U('pku','الصين','بكين','Peking University','جامعة',['وجاهي'],['علوم','آداب','اقتصاد','هندسة'],'https://www.isd.pku.edu.cn/'),
 U('hku','الصين','هونغ كونغ','The University of Hong Kong','جامعة',['وجاهي'],['طب وصحة','هندسة','أعمال','آداب'],'https://admissions.hku.hk/',{region:'asia'}),
 U('psut','الأردن','عمّان','جامعة الأميرة سمية للتكنولوجيا','جامعة',['وجاهي'],['حوسبة','هندسة','أعمال'],'https://www.psut.edu.jo/content/admission'),
 U('bau-jo','الأردن','السلط','جامعة البلقاء التطبيقية','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://www.bau.edu.jo/'),
 U('ksau-hs','السعودية','الرياض','جامعة الملك سعود بن عبدالعزيز للعلوم الصحية','جامعة',['وجاهي'],['طب وصحة'],'https://www.ksau-hs.edu.sa/English/Admission'),
 U('kfupm','السعودية','الظهران','جامعة الملك فهد للبترول والمعادن','جامعة',['وجاهي'],['هندسة','حوسبة','علوم','أعمال'],'https://www.kfupm.edu.sa/'),
 U('hbku','قطر','الدوحة','جامعة حمد بن خليفة','جامعة',['وجاهي'],['حوسبة','علوم','قانون','علوم اجتماعية'],'https://www.hbku.edu.qa/en/admissions',{
   contactEmail:'admissions@hbku.edu.qa',
 }),
 U('cmuq','قطر','الدوحة','Carnegie Mellon University in Qatar','جامعة',['وجاهي'],['حوسبة','أعمال','علوم'],'https://www.qatar.cmu.edu/admissions/',{
   platformMember:true,contactEmail:'undergraduate-admissions@qatar.cmu.edu',
 }),
 U('asf-qatar','قطر','الدوحة','American School of Doha','مدرسة',['وجاهي'],['American Curriculum','ابتدائي','ثانوي'],'https://www.asd.edu.qa/admissions',{
   degree:'تعليم مدرسي K-12',contactEmail:'admissions@asd.edu.qa',
 }),
 U('aus-online','الإمارات','الشارقة','Hamdan Bin Mohammed Smart University','جامعة أونلاين',['أونلاين'],['أعمال','تعليم','إدارة'],'https://www.hbmsu.ac.ae/',{
   degree:'بكالوريوس وماجستير ودبلوم',
 }),
 U('amu','مصر','القاهرة','جامعة الأزهر','جامعة',['وجاهي'],['طب وصحة','هندسة','آداب','علوم'],'https://www.azhar.edu.eg/'),
 U('witwatersrand','جنوب أفريقيا','جوهانسبرغ','University of the Witwatersrand','جامعة',['وجاهي'],['هندسة','طب وصحة','علوم','أعمال'],'https://www.wits.ac.za/undergraduate/apply-to-wits/'),
 U('ui','نيجيريا','Ibadan','University of Ibadan','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','أعمال'],'https://www.ui.edu.ng/',{
   local:['WAEC/NECO','JAMB UTME','CAPS'],
   international:['Foreign UTME/DE أو قبول دولي','جواز','تمويل'],
   platformMember:true,contactEmail:'admissions@ui.edu.ng',
 }),
 U('unilag','نيجيريا','Lagos','University of Lagos','جامعة',['وجاهي'],['هندسة','علوم','أعمال','طب وصحة'],'https://unilag.edu.ng/',{
   local:['WAEC/NECO','JAMB UTME','CAPS'],
   international:['Foreign UTME/DE أو قبول دولي','جواز','تمويل'],
 }),
 U('abu','نيجيريا','Zaria','Ahmadu Bello University','جامعة',['وجاهي'],['هندسة','علوم','طب وصحة','آداب'],'https://abu.edu.ng/'),
 U('oau','نيجيريا','Ile-Ife','Obafemi Awolowo University','جامعة',['وجاهي'],['علوم','طب وصحة','آداب','هندسة'],'https://oauife.edu.ng/'),
 U('ainshams','مصر','القاهرة','جامعة عين شمس','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','آداب'],'https://www.asu.edu.eg/'),
 U('alexu','مصر','الإسكندرية','جامعة الإسكندرية','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','آداب'],'https://alexu.edu.eg/'),
 U('ksau','السعودية','جدة','جامعة الملك عبدالعزيز','جامعة',['وجاهي'],['طب وصحة','هندسة','علوم','أعمال'],'https://www.kau.edu.sa/'),
 U('nyuad','الإمارات','أبوظبي','NYU Abu Dhabi','جامعة',['وجاهي'],['علوم','هندسة','آداب','أعمال'],'https://nyuad.nyu.edu/en/admissions.html'),
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

const ISO_CODES=`AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW`.split(' ');
const regionNames=new Intl.DisplayNames(['ar'],{type:'region'});
export const countries=ISO_CODES.map(code=>({code,name:regionNames.of(code)||code})).sort((a,b)=>a.name.localeCompare(b.name,'ar'));

import {nationalGrades,nationalProfile,nationalSemesters,nationalStages,nationalStatus,nationalSubjects} from './national-curricula.js';
const primary=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','الحاسوب','الفنون','التربية الرياضية'];
const lower=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الأحياء','التاريخ','الجغرافيا','الحاسوب'];
const upper=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الأحياء','علوم الأرض والبيئة','التاريخ','الجغرافيا','الاقتصاد','الحاسوب'];
const profiles={
 'النظام الوطني':{
  'التعليم قبل الابتدائي (ISCED 0)':{grades:['روضة أولى','روضة ثانية'],subjects:['اللغة والتواصل','مفاهيم الرياضيات','اكتشاف العلوم','المهارات الحياتية']},
  'التعليم الابتدائي (ISCED 1)':{grades:['الصف 1','الصف 2','الصف 3','الصف 4','الصف 5','الصف 6'],subjects:primary},
  'التعليم الثانوي الأدنى (ISCED 2)':{grades:['الصف 7','الصف 8','الصف 9','الصف 10'],subjects:lower},
  'التعليم الثانوي الأعلى (ISCED 3)':{grades:['الصف 11','الصف 12'],subjects:upper}},
 'American Curriculum / High School Diploma':{
  'Elementary School':{grades:['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5'],subjects:['English Language Arts','Mathematics','Science','Social Studies','Computer Science']},
  'Middle School':{grades:['Grade 6','Grade 7','Grade 8'],subjects:['English Language Arts','Pre-Algebra','Algebra I','General Science','Biology','US History','World History','Computer Science']},
  'High School':{grades:['Grade 9','Grade 10','Grade 11','Grade 12'],subjects:['English Language Arts','Algebra I','Geometry','Algebra II','Precalculus','Calculus','Statistics','Biology','Chemistry','Physics','Environmental Science','US History','World History','Economics','Computer Science']},
  'Advanced Placement (AP)':{grades:['Grade 10','Grade 11','Grade 12'],subjects:['AP Calculus AB','AP Calculus BC','AP Statistics','AP Biology','AP Chemistry','AP Physics 1','AP Physics 2','AP Physics C','AP Environmental Science','AP Computer Science A','AP English Language','AP English Literature','AP Macroeconomics','AP Microeconomics','AP Psychology']}},
 'Cambridge International':{
  'Cambridge Primary':{grades:['Stage 1','Stage 2','Stage 3','Stage 4','Stage 5','Stage 6'],subjects:['English','English as a Second Language','Mathematics','Science','Computing','Global Perspectives']},
  'Cambridge Lower Secondary':{grades:['Stage 7','Stage 8','Stage 9'],subjects:['English','English as a Second Language','Mathematics','Science','Computing','Global Perspectives']},
  'Cambridge IGCSE / O Level':{grades:['Year 10','Year 11'],subjects:['First Language English','English as a Second Language','Mathematics','Additional Mathematics','Biology','Chemistry','Physics','Combined Science','Computer Science','Business Studies','Economics','Accounting','History','Geography','Global Perspectives','Arabic','French','Spanish']},
  'Cambridge AS & A Level':{grades:['Year 12 (AS)','Year 13 (A Level)'],subjects:['Mathematics','Further Mathematics','Biology','Chemistry','Physics','Computer Science','Business','Economics','Accounting','Psychology','Sociology','History','Geography','English Language','English Literature']}},
 'Pearson Edexcel International':{
  'iPrimary':{grades:['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6'],subjects:['English','Mathematics','Science','Computing']},
  'iLowerSecondary':{grades:['Year 7','Year 8','Year 9'],subjects:['English','Mathematics','Science','Computing']},
  'International GCSE':{grades:['Year 10','Year 11'],subjects:['English Language A','English Language B','English Literature','Mathematics A','Mathematics B','Further Pure Mathematics','Biology','Chemistry','Physics','Science Double Award','Computer Science','Business','Economics','Accounting','History','Geography','Arabic','French','German','Spanish']},
  'International Advanced Level (IAL)':{grades:['AS','A2'],subjects:['Mathematics','Further Mathematics','Pure Mathematics','Biology','Chemistry','Physics','Business','Economics','Accounting','Psychology','Information Technology']}},
 'International Baccalaureate (IB)':{
  'Primary Years Programme (PYP)':{grades:['PYP Year 1','PYP Year 2','PYP Year 3','PYP Year 4','PYP Year 5'],subjects:['Language','Mathematics','Science','Social Studies','Arts','Physical Education']},
  'Middle Years Programme (MYP)':{grades:['MYP Year 1','MYP Year 2','MYP Year 3','MYP Year 4','MYP Year 5'],subjects:['Language and Literature','Language Acquisition','Individuals and Societies','Sciences','Mathematics','Arts','Design','Physical and Health Education']},
  'Diploma Programme (DP)':{grades:['DP Year 1','DP Year 2'],subjects:['Language A: Literature','Language A: Language and Literature','Business Management','Economics','Geography','Global Politics','History','Psychology','Biology','Chemistry','Computer Science','Physics','Environmental Systems and Societies','Mathematics: Analysis and Approaches','Mathematics: Applications and Interpretation','Visual Arts','Theory of Knowledge','Extended Essay']}},
 'BTEC / المسارات المهنية':{
  'BTEC Level 1':{grades:['Level 1'],subjects:['Business','Engineering','Information Technology','Applied Science','Health and Social Care','Sport','Art and Design']},
  'BTEC Level 2':{grades:['Level 2'],subjects:['Business','Engineering','Information Technology','Applied Science','Health and Social Care','Sport','Creative Media']},
  'BTEC Level 3':{grades:['Foundation Diploma','Diploma','Extended Diploma'],subjects:['Business','Engineering','Computing','Information Technology','Applied Science','Health and Social Care','Sport','Creative Media','Hospitality','Travel and Tourism']}}
};
const international=['American Curriculum / High School Diploma','Cambridge International','Pearson Edexcel International','International Baccalaureate (IB)','BTEC / المسارات المهنية'];
const localNames={JO:'النظام الوطني الأردني',AE:'منهاج وزارة التربية والتعليم الإماراتي',SA:'النظام التعليمي السعودي',EG:'النظام التعليمي المصري',GB:'المنهج الوطني في إنجلترا',US:'النظام المحلي الأمريكي (حسب الولاية)',CA:'النظام الكندي (حسب المقاطعة)',AU:'النظام الأسترالي (حسب الولاية)',FR:'النظام التعليمي الفرنسي',DE:'النظام الألماني (حسب الولاية)',TR:'النظام التعليمي التركي'};
export function systemsForCountry(code){return [{value:'النظام الوطني',label:localNames[code]||'النظام الوطني للدولة (وفق وزارة التعليم)'},...international.map(value=>({value,label:value}))]}
export function stagesForSystem(system,country){return system==='النظام الوطني'?nationalStages(country):Object.keys(profiles[system]||{})}
export function gradesForSystem(system,stage,country){return system==='النظام الوطني'?nationalGrades(country,stage):profiles[system]?.[stage]?.grades||[]}
export function subjectsForSystem(system,stage,country){return system==='النظام الوطني'?nationalSubjects(country,stage):profiles[system]?.[stage]?.subjects||[]}
export function semestersForSystem(system,stage,country){return system==='النظام الوطني'?nationalSemesters(country,stage):['الفصل الأول','الفصل الثاني']}
export function curriculumStatus(country,system){return system==='النظام الوطني'?nationalStatus(country):{ready:true,label:system,authority:'الجهة الدولية المانحة',source:null,lastReviewed:'2026-07-16',jurisdictionRequired:false}}
export function curriculumProfile(country,system){return system==='النظام الوطني'?nationalProfile(country):profiles[system]||null}
export const serviceTypes=['حصص مسجلة','حصص مباشرة فردي وجاهي','حصص مباشرة مجموعة وجاهي','حصص مباشرة فردي أونلاين','حصص مباشرة مجموعة أونلاين'];
export const deliveryMethods=['داخل المنصة','في موقع المعلم أو المركز','في مركز النجاح الأكيد','في منزل الطالب'];
export const currencies=['JOD — دينار أردني','USD — دولار أمريكي','AED — درهم إماراتي','SAR — ريال سعودي','EGP — جنيه مصري','GBP — جنيه إسترليني','EUR — يورو'];
export const ratingOptions=['3+ نجوم','4+ نجوم','4.5+ نجوم','4.8+ نجوم'];

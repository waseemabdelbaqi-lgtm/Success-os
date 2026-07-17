// National curriculum registry. Verified profiles are exposed to learners; every
// other ISO country remains in the registry as a review queue and never receives
// invented grades or subjects.
const corePrimary=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','التربية الدينية أو الأخلاقية','المهارات الرقمية','الفنون','التربية الرياضية'];
const coreLower=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','التاريخ','الجغرافيا','التربية الدينية أو الأخلاقية','المهارات الرقمية','التربية المهنية','الفنون','التربية الرياضية'];
const coreUpper=['اللغة الرسمية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','الأحياء','التاريخ','الجغرافيا','المهارات الرقمية'];

const profile=(label,authority,source,stages,extra={})=>({label,authority,source,status:'verified-structure',lastReviewed:'2026-07-16',stages,...extra});
const stages12=(names={})=>({
 [names.primary||'التعليم الأساسي — المرحلة الابتدائية']:{grades:['الصف 1','الصف 2','الصف 3','الصف 4','الصف 5','الصف 6'],semesters:['الفصل الأول','الفصل الثاني'],subjects:corePrimary},
 [names.lower||'التعليم الأساسي — المرحلة المتوسطة']:{grades:['الصف 7','الصف 8','الصف 9','الصف 10'],semesters:['الفصل الأول','الفصل الثاني'],subjects:coreLower},
 [names.upper||'التعليم الثانوي']:{grades:['الصف 11','الصف 12'],semesters:['الفصل الأول','الفصل الثاني'],subjects:coreUpper}
});

export const nationalCurricula={
 JO:profile('المنهاج الوطني الأردني','المركز الوطني لتطوير المناهج ووزارة التربية والتعليم','https://www.nccd.gov.jo/Ar/Pages/textbooks',{
  'رياض الأطفال':{grades:['رياض الأطفال'],semesters:['الفصل الأول','الفصل الثاني'],subjects:['اللغة والتواصل','الرياضيات المبكرة','العلوم والاستكشاف','المهارات الحياتية']},
  'التعليم الأساسي':{grades:['الصف 1','الصف 2','الصف 3','الصف 4','الصف 5','الصف 6','الصف 7','الصف 8','الصف 9','الصف 10'],semesters:['الفصل الأول','الفصل الثاني'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','التربية الوطنية والمدنية','التاريخ','الجغرافيا','المهارات الرقمية','التربية المهنية','الثقافة المالية','الفنون','التربية الرياضية']},
  'التعليم الثانوي — المسار الأكاديمي':{grades:['الصف 11','الصف 12'],semesters:['الفصل الأول','الفصل الثاني'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','تاريخ الأردن','الجغرافيا','الحاسوب','الثقافة المالية','الفلسفة','علم النفس والاجتماع']},
  'التعليم الثانوي — المسار المهني BTEC':{grades:['الصف 11','الصف 12'],semesters:['الفصل الأول','الفصل الثاني'],subjects:['الأعمال','الهندسة','تكنولوجيا المعلومات','الضيافة','السفر والسياحة','الفنون والتصميم','الزراعة','البناء والإنشاءات']}
 }),
 EG:profile('المنهج الوطني المصري','وزارة التربية والتعليم والتعليم الفني','https://studentbooks.moe.gov.eg/',{
  'رياض الأطفال':{grades:['KG1','KG2'],semesters:['الترم الأول','الترم الثاني'],subjects:['اكتشف','اللغة العربية','Connect English','الرياضيات المبكرة']},
  'المرحلة الابتدائية':{grades:['الصف الأول الابتدائي','الصف الثاني الابتدائي','الصف الثالث الابتدائي','الصف الرابع الابتدائي','الصف الخامس الابتدائي','الصف السادس الابتدائي'],semesters:['الترم الأول','الترم الثاني'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','التربية الدينية الإسلامية','التربية الدينية المسيحية','تكنولوجيا المعلومات والاتصالات','المهارات المهنية','القيم واحترام الآخر']},
  'المرحلة الإعدادية':{grades:['الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي'],semesters:['الترم الأول','الترم الثاني'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','الحاسب الآلي وتكنولوجيا المعلومات','التربية الدينية الإسلامية','التربية الدينية المسيحية']},
  'الثانوي العام':{grades:['الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي'],semesters:['الترم الأول','الترم الثاني'],subjects:['اللغة العربية','اللغة الأجنبية الأولى','اللغة الأجنبية الثانية','الرياضيات','الفيزياء','الكيمياء','الأحياء','الجيولوجيا وعلوم البيئة','التاريخ','الجغرافيا','الفلسفة والمنطق','علم النفس والاجتماع']}
 }),
 SA:profile('المنهج الوطني السعودي','وزارة التعليم والمركز الوطني للمناهج','https://www.moe.gov.sa/ar/education/generaleducation/StudyPlans/Pages/default.aspx',{
  'المرحلة الابتدائية':{grades:['الصف الأول الابتدائي','الصف الثاني الابتدائي','الصف الثالث الابتدائي','الصف الرابع الابتدائي','الصف الخامس الابتدائي','الصف السادس الابتدائي'],semesters:['الفصل الدراسي الأول','الفصل الدراسي الثاني','الفصل الدراسي الثالث'],subjects:['القرآن الكريم والدراسات الإسلامية','اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','المهارات الرقمية','المهارات الحياتية والأسرية','التربية الفنية','التربية البدنية والدفاع عن النفس']},
  'المرحلة المتوسطة':{grades:['الصف الأول المتوسط','الصف الثاني المتوسط','الصف الثالث المتوسط'],semesters:['الفصل الدراسي الأول','الفصل الدراسي الثاني','الفصل الدراسي الثالث'],subjects:['القرآن الكريم والدراسات الإسلامية','لغتي الخالدة','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية','المهارات الرقمية','التفكير الناقد','المهارات الحياتية والأسرية','التربية الفنية','التربية البدنية والدفاع عن النفس']},
  'المرحلة الثانوية — السنة الأولى المشتركة':{grades:['السنة الأولى المشتركة'],semesters:['الفصل الدراسي الأول','الفصل الدراسي الثاني','الفصل الدراسي الثالث'],subjects:['الدراسات الإسلامية','اللغة العربية','اللغة الإنجليزية','الرياضيات','الأحياء','الكيمياء','الفيزياء','التقنية الرقمية','التفكير الناقد','المعرفة المالية']},
  'المرحلة الثانوية — نظام المسارات':{grades:['السنة الثانية','السنة الثالثة'],semesters:['الفصل الدراسي الأول','الفصل الدراسي الثاني','الفصل الدراسي الثالث'],subjects:['المسار العام','مسار علوم الحاسب والهندسة','مسار الصحة والحياة','مسار إدارة الأعمال','المسار الشرعي']}
 }),
 AE:profile('منهاج وزارة التربية والتعليم الإماراتي','وزارة التربية والتعليم في دولة الإمارات','https://www.moe.gov.ae/en/pages/home.aspx',{
  'رياض الأطفال':{grades:['KG1','KG2'],semesters:['الفصل الأول','الفصل الثاني','الفصل الثالث'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات المبكرة','العلوم والاستكشاف','الهوية الوطنية']},
  'الحلقة الأولى':{grades:['الصف 1','الصف 2','الصف 3','الصف 4'],semesters:['الفصل الأول','الفصل الثاني','الفصل الثالث'],subjects:corePrimary},
  'الحلقة الثانية':{grades:['الصف 5','الصف 6','الصف 7','الصف 8'],semesters:['الفصل الأول','الفصل الثاني','الفصل الثالث'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','الدراسات الاجتماعية والتربية الوطنية','التربية الإسلامية','التصميم والتكنولوجيا','الحوسبة والتصميم الإبداعي والابتكار','الفنون','التربية الصحية والبدنية']},
  'الحلقة الثالثة — المسار العام':{grades:['الصف 9 عام','الصف 10 عام','الصف 11 عام','الصف 12 عام'],semesters:['الفصل الأول','الفصل الثاني','الفصل الثالث'],subjects:coreUpper},
  'الحلقة الثالثة — المسار المتقدم':{grades:['الصف 9 متقدم','الصف 10 متقدم','الصف 11 متقدم','الصف 12 متقدم'],semesters:['الفصل الأول','الفصل الثاني','الفصل الثالث'],subjects:['اللغة العربية','اللغة الإنجليزية','الرياضيات المتقدمة','الفيزياء','الكيمياء','الأحياء','الدراسات الاجتماعية والتربية الوطنية','علوم الحاسوب']}
 }),
 QA:profile('المنهاج الوطني القطري','وزارة التربية والتعليم والتعليم العالي','https://www.edu.gov.qa/',stages12()),
 KW:profile('المنهج الوطني الكويتي','وزارة التربية','https://www.moe.edu.kw/',stages12({lower:'المرحلة المتوسطة',upper:'المرحلة الثانوية'})),
 OM:profile('المنهج الوطني العُماني','وزارة التربية والتعليم','https://home.moe.gov.om/',stages12({primary:'التعليم الأساسي — الحلقة الأولى',lower:'التعليم الأساسي — الحلقة الثانية',upper:'التعليم ما بعد الأساسي'})),
 BH:profile('المنهج الوطني البحريني','وزارة التربية والتعليم','https://www.moe.gov.bh/',stages12()),
 PS:profile('المنهاج الوطني الفلسطيني','وزارة التربية والتعليم العالي','https://www.moe.edu.ps/',stages12()),
 IQ:profile('المنهج الوطني العراقي','وزارة التربية العراقية','https://epedu.gov.iq/',stages12({primary:'المرحلة الابتدائية',lower:'المرحلة المتوسطة',upper:'المرحلة الإعدادية'})),
 SY:profile('المنهج الوطني السوري','وزارة التربية والتعليم السورية','https://moed.gov.sy/',stages12({primary:'الحلقة الأولى',lower:'الحلقة الثانية',upper:'المرحلة الثانوية'})),
 LB:profile('المنهج الرسمي اللبناني','المركز التربوي للبحوث والإنماء','https://www.crdp.org/',stages12({primary:'التعليم الأساسي — الحلقة الأولى والثانية',lower:'التعليم الأساسي — الحلقة الثالثة',upper:'التعليم الثانوي'})),
 TR:profile('المنهج الوطني التركي','وزارة التربية الوطنية التركية','https://mufredat.meb.gov.tr/',stages12()),
 GB:profile('United Kingdom curricula','Department for Education and devolved administrations','https://www.gov.uk/national-curriculum',{
  'England — Primary':{grades:['Year 1','Year 2','Year 3','Year 4','Year 5','Year 6'],semesters:['Autumn','Spring','Summer'],subjects:['English','Mathematics','Science','Computing','History','Geography','Art and Design','Design and Technology','Music','Physical Education','Languages']},
  'England — Secondary':{grades:['Year 7','Year 8','Year 9','Year 10','Year 11'],semesters:['Autumn','Spring','Summer'],subjects:['English','Mathematics','Science','Computing','History','Geography','Citizenship','Languages','Art and Design','Music','Physical Education']},
  'Scotland — Curriculum for Excellence':{grades:['P1','P2','P3','P4','P5','P6','P7','S1','S2','S3','S4','S5','S6'],semesters:['School year'],subjects:['Literacy and English','Numeracy and Mathematics','Sciences','Social Studies','Technologies','Expressive Arts','Health and Wellbeing','Religious and Moral Education']},
  'Wales — Curriculum for Wales':{grades:['Progression Step 1','Progression Step 2','Progression Step 3','Progression Step 4','Progression Step 5'],semesters:['School year'],subjects:['Languages Literacy and Communication','Mathematics and Numeracy','Science and Technology','Humanities','Health and Well-being','Expressive Arts']}
 }),
 US:profile('United States — state standards','State education agencies','https://www.ed.gov/',{
  'Elementary School':{grades:['Kindergarten','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5'],semesters:['Semester 1','Semester 2'],subjects:['English Language Arts','Mathematics','Science','Social Studies','Computer Science','Arts','Physical Education']},
  'Middle School':{grades:['Grade 6','Grade 7','Grade 8'],semesters:['Semester 1','Semester 2'],subjects:['English Language Arts','Mathematics','Life Science','Physical Science','Earth and Space Science','US History','World History','Computer Science']},
  'High School':{grades:['Grade 9','Grade 10','Grade 11','Grade 12'],semesters:['Semester 1','Semester 2'],subjects:['English Language Arts','Algebra I','Geometry','Algebra II','Biology','Chemistry','Physics','US History','World History','Government','Economics','Computer Science']}
 },{jurisdictionRequired:true}),
 CA:profile('Canadian provincial and territorial curricula','Provincial and territorial ministries of education','https://www.cmec.ca/',stages12(),{jurisdictionRequired:true}),
 AU:profile('Australian Curriculum and state implementations','Australian Curriculum, Assessment and Reporting Authority','https://www.australiancurriculum.edu.au/',{
  'Foundation–Year 6':{grades:['Foundation','Year 1','Year 2','Year 3','Year 4','Year 5','Year 6'],semesters:['Semester 1','Semester 2'],subjects:['English','Mathematics','Science','Humanities and Social Sciences','Technologies','The Arts','Health and Physical Education','Languages']},
  'Years 7–10':{grades:['Year 7','Year 8','Year 9','Year 10'],semesters:['Semester 1','Semester 2'],subjects:['English','Mathematics','Science','Humanities and Social Sciences','Technologies','The Arts','Health and Physical Education','Languages']},
  'Senior Secondary':{grades:['Year 11','Year 12'],semesters:['Semester 1','Semester 2'],subjects:['English','Mathematics','Biology','Chemistry','Physics','Earth and Environmental Science','History','Geography','Digital Technologies']}
 },{jurisdictionRequired:true}),
 NZ:profile('New Zealand Curriculum','Ministry of Education New Zealand','https://newzealandcurriculum.tahurangi.education.govt.nz/',stages12()),
 SG:profile('Singapore National Curriculum','Ministry of Education Singapore','https://www.moe.gov.sg/education-in-sg',stages12({primary:'Primary',lower:'Secondary',upper:'Post-secondary'})),
 IN:profile('Indian national and state curricula','Ministry of Education / CBSE / CISCE / State Boards','https://www.education.gov.in/',stages12(),{jurisdictionRequired:true}),
 ZA:profile('South African National Curriculum Statement','Department of Basic Education','https://www.education.gov.za/Curriculum/CurriculumAssessmentPolicyStatements(CAPS).aspx',stages12({primary:'Foundation and Intermediate Phases',lower:'Senior Phase',upper:'FET Phase'}))
};

export function nationalProfile(code){return nationalCurricula[code]||null}
export function nationalStages(code){return Object.keys(nationalProfile(code)?.stages||{})}
export function nationalGrades(code,stage){return nationalProfile(code)?.stages?.[stage]?.grades||[]}
export function nationalSemesters(code,stage){return nationalProfile(code)?.stages?.[stage]?.semesters||[]}
export function nationalSubjects(code,stage){return nationalProfile(code)?.stages?.[stage]?.subjects||[]}
export function nationalStatus(code){const p=nationalProfile(code);return p?{ready:true,label:p.label,authority:p.authority,source:p.source,lastReviewed:p.lastReviewed,jurisdictionRequired:!!p.jurisdictionRequired}:{ready:false,label:'المنهاج الوطني — قيد المطابقة الرسمية',authority:'وزارة التعليم في الدولة',source:null,lastReviewed:null,jurisdictionRequired:false}}

// Jordan-only discovery registry. A grade being listed here does not mean its
// units, lessons or outcomes are verified. Those remain blocked until an
// official baseline is captured and reviewed.
export const jordanAuthority={
 country:'Jordan',countryAr:'الأردن',curriculum:'Jordan National Curriculum',curriculumAr:'المنهاج الوطني الأردني',
 ministry:'Jordan Ministry of Education',ministryAr:'وزارة التربية والتعليم الأردنية',
 curriculumCenter:'National Center for Curriculum Development',curriculumCenterAr:'المركز الوطني لتطوير المناهج',
 sources:[
  {name:'NCCD official portal',url:'https://www.nccd.gov.jo/Default/AR#carouselContainer',authorityType:'official-authority',usage:'official-discovery-and-indexing-only',license:'official-framework-reference'},
  {name:'NCCD textbook catalogue',url:'https://www.nccd.gov.jo/Ar/Pages/textbooks',authorityType:'official-authority',usage:'structure-and-outcomes-only',license:'official-framework-reference'},
  {name:'Darsak Platform',url:'https://darsak.gov.jo/',authorityType:'official-digital-platform',usage:'digital-lesson-structure-reference-never-copy',license:'official-framework-reference'},
  {name:'MOE curricula and textbooks administration',url:'https://moe.gov.jo/ar/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D9%85%D9%86%D8%A7%D9%87%D8%AC-%D9%88%D8%A7%D9%84%D9%83%D8%AA%D8%A8-%D8%A7%D9%84%D9%85%D8%AF%D8%B1%D8%B3%D9%8A%D8%A9',authorityType:'ministry',usage:'structure-and-outcomes-only',license:'official-framework-reference'},
  {name:'MOE approved textbook editions 2025–2026',url:'https://moe.gov.jo/ar/node/79818',authorityType:'ministry',usage:'edition-verification-only',license:'official-framework-reference'}
 ],lastReviewed:'2026-07-18'
};

const grades=[
 ['التعليم الأساسي','الصف 1','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68'],['التعليم الأساسي','الصف 2','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69'],
 ['التعليم الأساسي','الصف 3','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70'],['التعليم الأساسي','الصف 4','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71'],
 ['التعليم الأساسي','الصف 5','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72'],['التعليم الأساسي','الصف 6','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73'],['التعليم الأساسي','الصف 7','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74'],
 ['التعليم الأساسي','الصف 8','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75'],['التعليم الأساسي','الصف 9','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76'],['التعليم الأساسي','الصف 10','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77'],
 ['التعليم الثانوي — المسار الأكاديمي','الصف 11','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117'],
 ['التعليم الثانوي — المسار الأكاديمي','الصف 12','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83']
];

/** NCCD-reviewed subject list (Grade 1 catalogue). */
const gradeOne=['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'];
/** Lower basic (2–4): same core set as Grade 1 until per-grade NCCD subject review lands. */
const lowerBasic=gradeOne;
/** Mid basic (5–7): national-profile band — adds civics, vocational, finance; arts as الفنون. */
const midBasic=['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','التربية الوطنية والمدنية','المهارات الرقمية','التربية المهنية','الثقافة المالية','الفنون','التربية الرياضية'];
/** Upper basic (8–10): adds history + geography as distinct subjects. */
const upperBasic=['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','التربية الوطنية والمدنية','التاريخ','الجغرافيا','المهارات الرقمية','التربية المهنية','الثقافة المالية','الفنون','التربية الرياضية'];
/** NCCD-reviewed subject list (Grade 11 academic track). Grade 12 uses the same academic core. */
const gradeEleven=['اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','المهارات الرقمية','التربية الإسلامية','تاريخ الأردن'];
const secondaryAcademic=gradeEleven;

function gradeNumber(grade){
 const m=String(grade||'').match(/(\d+)/);
 return m?Number(m[1]):0;
}

/** Band-aware subject list for academic Jordan grades 1–12. */
export function jordanSubjectsForGrade(grade){
 const n=gradeNumber(grade);
 if(n>=1&&n<=4)return [...lowerBasic];
 if(n>=5&&n<=7)return [...midBasic];
 if(n>=8&&n<=10)return [...upperBasic];
 if(n>=11&&n<=12)return [...secondaryAcademic];
 return [];
}

function catalogueStatusFor(grade){
 if(grade==='الصف 1'||grade==='الصف 11')return 'subject-list-verified';
 if(grade==='الصف 12')return 'subject-list-aligned-to-g11-verified';
 if(gradeNumber(grade)>=2&&gradeNumber(grade)<=10)return 'official-nccd-url-national-profile-aligned';
 return 'official-page-identified-pending-subject-review';
}

export const jordanGradeRegistry=grades.map(([stage,grade,source])=>({
 stage,grade,semesters:['الفصل الدراسي الأول','الفصل الدراسي الثاني'],officialCatalogUrl:source,
 subjects:jordanSubjectsForGrade(grade),
 catalogueStatus:catalogueStatusFor(grade),
 baselineStatus:grade==='الصف 1'?'reference-sample':'framework-scaffold',
 booksCreated:0,coveragePercentage:0,
 verificationStatus:grade==='الصف 1'?'g1-reference-verified':grade==='الصف 11'?'subject-list-verified':'framework-aligned-pending-baseline'
}));

export function jordanGrade(grade){return jordanGradeRegistry.find(item=>item.grade===grade)||null}
export function jordanVerifiedSubjects(grade){const record=jordanGrade(grade);return record?.catalogueStatus==='subject-list-verified'?record.subjects:[]}

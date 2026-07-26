// Jordan-only discovery registry. A grade being listed here does not mean its
// units, lessons or outcomes are verified. Those remain blocked until an
// official baseline is captured and reviewed.
//
// Subject lists for grades beyond 1 & 11 are indexed from Minhaji structure
// companion (titles only) and marked pending NCCD human review.

export const jordanAuthority={
 country:'Jordan',countryAr:'الأردن',curriculum:'Jordan National Curriculum',curriculumAr:'المنهاج الوطني الأردني',
 ministry:'Jordan Ministry of Education',ministryAr:'وزارة التربية والتعليم الأردنية',
 curriculumCenter:'National Center for Curriculum Development',curriculumCenterAr:'المركز الوطني لتطوير المناهج',
 sources:[
  {name:'NCCD official portal',url:'https://www.nccd.gov.jo/Default/AR',authorityType:'official-authority',usage:'official-discovery-and-indexing-only',license:'official-framework-reference'},
  {name:'NCCD textbook catalogue',url:'https://nccd.gov.jo/Ar/Pages/textbooks',authorityType:'official-authority',usage:'structure-and-outcomes-only',license:'official-framework-reference'},
  {name:'NCCD textbook catalogue (www)',url:'https://www.nccd.gov.jo/Ar/Pages/textbooks',authorityType:'official-authority',usage:'structure-and-outcomes-only',license:'official-framework-reference'},
  {name:'Minhaji structure index',url:'https://minhaji.net/',authorityType:'structure-index-companion',usage:'grade-subject-title-index-never-copy-prose',license:'companion-index-only'},
  {name:'JoAcademy courses',url:'https://www.joacademy.com/user/courses',authorityType:'market-delivery-companion',usage:'program-taxonomy-and-delivery-patterns-never-copy',license:'companion-index-only'},
  {name:'Darsak Platform',url:'https://darsak.gov.jo/',authorityType:'official-digital-platform',usage:'digital-lesson-structure-reference-never-copy',license:'official-framework-reference'},
  {name:'MOE curricula and textbooks administration',url:'https://moe.gov.jo/ar/%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D9%85%D9%86%D8%A7%D9%87%D8%AC-%D9%88%D8%A7%D9%84%D9%83%D8%AA%D8%A8-%D8%A7%D9%84%D9%85%D8%AF%D8%B1%D8%B3%D9%8A%D8%A9',authorityType:'ministry',usage:'structure-and-outcomes-only',license:'official-framework-reference'},
  {name:'MOE approved textbook editions 2025–2026',url:'https://moe.gov.jo/ar/node/79818',authorityType:'ministry',usage:'edition-verification-only',license:'official-framework-reference'}
 ],lastReviewed:'2026-07-26'
};

const grades=[
 ['رياض الأطفال','رياض الأطفال','https://minhaji.net/lesson/1'],
 ['التعليم الأساسي','الصف 1','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/68'],
 ['التعليم الأساسي','الصف 2','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/69'],
 ['التعليم الأساسي','الصف 3','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/70'],
 ['التعليم الأساسي','الصف 4','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/71'],
 ['التعليم الأساسي','الصف 5','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/72'],
 ['التعليم الأساسي','الصف 6','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/73'],
 ['التعليم الأساسي','الصف 7','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/74'],
 ['التعليم الأساسي','الصف 8','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/75'],
 ['التعليم الأساسي','الصف 9','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/76'],
 ['التعليم الأساسي','الصف 10','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/77'],
 ['التعليم الثانوي — المسار الأكاديمي','الصف 11','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/117'],
 ['التعليم الثانوي — المسار الأكاديمي','الصف 12','https://www.nccd.gov.jo/ar/pages/TextBooksGrade/83']
];

/** Canonical Arabic grade labels used by Wave 1 / Minhaji harvest */
const GRADE_LABEL={
 'رياض الأطفال':'رياض الأطفال',
 'الصف 1':'الصف الأول','الصف 2':'الصف الثاني','الصف 3':'الصف الثالث','الصف 4':'الصف الرابع',
 'الصف 5':'الصف الخامس','الصف 6':'الصف السادس','الصف 7':'الصف السابع','الصف 8':'الصف الثامن',
 'الصف 9':'الصف التاسع','الصف 10':'الصف العاشر','الصف 11':'الصف الحادي عشر','الصف 12':'الصف الثاني عشر'
};

const SUBJECTS={
 'رياض الأطفال':['اللغة العربية','الرياضيات','العلوم','المنهاج التطوري'],
 'الصف 1':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 2':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 3':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 4':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 5':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 6':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 7':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','الثقافة المالية','المهارات الرقمية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 8':['اللغة العربية','اللغة الإنجليزية','الرياضيات','العلوم','التربية الإسلامية','الدراسات الاجتماعية','المهارات الرقمية','الثقافة المالية','التربية المهنية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 9':['اللغة العربية','اللغة الإنجليزية','الرياضيات','التربية الإسلامية','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','التربية الوطنية والمدنية','التاريخ','الجغرافيا','المهارات الرقمية','الثقافة المالية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 10':['اللغة العربية','اللغة الإنجليزية','الرياضيات','التربية الإسلامية','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','التاريخ','الجغرافيا','التربية الوطنية والمدنية','المهارات الرقمية','الثقافة المالية','التربية المهنية','التربية الرياضية','التربية الفنية والموسيقية والمسرحية'],
 'الصف 11':['اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','المهارات الرقمية','التربية الإسلامية','تاريخ الأردن','الثقافة المالية'],
 'الصف 12':['اللغة العربية','اللغة الإنجليزية','الرياضيات','الفيزياء','الكيمياء','العلوم الحياتية','علوم الأرض والبيئة','المهارات الرقمية','التربية الإسلامية','الثقافة المالية','علوم النفس والاجتماع','الفلسفة','الجغرافيا','التاريخ']
};

const VERIFIED_OFFICIAL=new Set(['الصف 1','الصف 11']);

export const jordanGradeRegistry=grades.map(([stage,grade,source])=>{
 const subjects=SUBJECTS[grade]||[];
 const officialVerified=VERIFIED_OFFICIAL.has(grade);
 return {
  stage,
  grade,
  gradeAr:GRADE_LABEL[grade]||grade,
  semesters:grade==='رياض الأطفال'?['عام دراسي']:['الفصل الدراسي الأول','الفصل الدراسي الثاني'],
  officialCatalogUrl:source,
  subjects,
  catalogueStatus:officialVerified
   ?'subject-list-verified'
   :subjects.length
    ?'subject-list-indexed-minhaji-pending-nccd-review'
    :'official-page-identified-pending-subject-review',
  baselineStatus:'missing',
  booksCreated:0,
  coveragePercentage:0,
  verificationStatus:'missing-content',
  wave1Ready:subjects.length>0
 };
});

export function jordanGrade(grade){
 return jordanGradeRegistry.find(item=>item.grade===grade||item.gradeAr===grade)||null
}
/** Official-verified subject lists only (safe for publication gates). */
export function jordanVerifiedSubjects(grade){
 const record=jordanGrade(grade);
 return record?.catalogueStatus==='subject-list-verified'?record.subjects:[]
}
/** Wave-1 indexed subjects (Minhaji/NCCD pending review) — reformulation only, not book publish. */
export function jordanIndexedSubjects(grade){
 const record=jordanGrade(grade);
 return record?.subjects||[]
}

export const educationSources=[
 {name:'OpenStax',url:'https://openstax.org',use:'مراجع كتب جامعية ومدرسية مفتوحة',access:'open',license:'CC BY 4.0 غالبًا — يتحقق لكل كتاب',subjects:['physics','chemistry','biology','mathematics']},
 {name:'MIT OpenCourseWare',url:'https://ocw.mit.edu',use:'هياكل المساقات والمحاضرات الجامعية المفتوحة',access:'open',license:'Creative Commons BY-NC-SA — مرجع غير تجاري ما لم يسمح الترخيص',subjects:['physics','chemistry','mathematics','computer']},
 {name:'CK-12',url:'https://www.ck12.org',use:'مفاهيم وتمارين مدرسية مرنة',access:'verify',license:'يُتحقق من شروط كل مورد قبل إعادة الاستخدام',subjects:['physics','chemistry','biology','mathematics']},
 {name:'LibreTexts',url:'https://libretexts.org',use:'مراجع علوم ورياضيات مفتوحة',access:'open',license:'ترخيص كل صفحة يظهر في المصدر',subjects:['physics','chemistry','biology','mathematics']},
 {name:'PhET',url:'https://phet.colorado.edu',use:'محاكاة علمية تفاعلية',access:'open',license:'يُتحقق من صفحة الترخيص والتضمين',subjects:['physics','chemistry','mathematics']},
 {name:'The Physics Classroom',url:'https://www.physicsclassroom.com',use:'ترتيب مفاهيم الفيزياء والتحقق',access:'reference',license:'مرجع فقط؛ لا نسخ تجاري',subjects:['physics']},
 {name:'ChemCollective',url:'https://chemcollective.org',use:'مختبرات كيمياء افتراضية وأنشطة',access:'verify',license:'يُتحقق لكل مورد',subjects:['chemistry']},
 {name:'GeoGebra',url:'https://www.geogebra.org',use:'أنشطة رياضيات تفاعلية',access:'verify',license:'يُتحقق لكل نشاط',subjects:['mathematics']},
 {name:'Desmos',url:'https://www.desmos.com',use:'تمثيل بياني وأنشطة رياضية',access:'reference',license:'استخدام الأدوات وفق الشروط',subjects:['mathematics']},
 {name:'MDN Web Docs',url:'https://developer.mozilla.org',use:'مرجع تقنيات الويب',access:'open',license:'CC BY-SA للمحتوى وفق الصفحة',subjects:['computer']},
 {name:'freeCodeCamp',url:'https://www.freecodecamp.org',use:'مسارات ومشاريع برمجية',access:'reference',license:'مرجع وروابط؛ لا نسخ آلي للمحتوى',subjects:['computer']},
 {name:'College Board',url:'https://apstudents.collegeboard.org/courses',use:'المواصفات الرسمية لمواد AP',access:'official',license:'مواصفات مرجعية؛ لا نسخ لأسئلة محمية',subjects:['physics','chemistry','biology','mathematics','computer']},
 {name:'Cambridge International',url:'https://www.cambridgeinternational.org/programmes-and-qualifications/',use:'المناهج والمواصفات الرسمية',access:'official',license:'مرجع مواصفات فقط',subjects:['physics','chemistry','biology','mathematics','english']},
 {name:'Pearson Qualifications',url:'https://qualifications.pearson.com',use:'مواصفات Edexcel الرسمية',access:'official',license:'مرجع مواصفات فقط',subjects:['physics','chemistry','biology','mathematics','english']},
 {name:'IB',url:'https://www.ibo.org/programmes/',use:'أطر برامج IB الرسمية',access:'official',license:'مرجع رسمي فقط',subjects:['physics','chemistry','biology','mathematics','english']}
];
export function sourcesFor(subject=''){
 const s=subject.toLowerCase(),family=/فيز|physics/.test(s)?'physics':/كيم|chem/.test(s)?'chemistry':/أحيا|bio/.test(s)?'biology':/رياض|math|calculus|algebra/.test(s)?'mathematics':/حاسوب|computer|program|coding/.test(s)?'computer':/english|انجلي|لغة/.test(s)?'english':'';
 return educationSources.filter(x=>!family||x.subjects.includes(family)).slice(0,8);
}

import {learningUnitsFor} from './assessment-profiles';

const systems={
 'American Diploma / AP / SAT / ACT / EST':['Pre-Algebra','Algebra I','Geometry','Algebra II','Precalculus','Calculus','Statistics','AP Calculus AB','AP Calculus BC','AP Statistics','General Science','Biology','Chemistry','Physics','Environmental Science','AP Biology','AP Chemistry','AP Physics','AP Environmental Science','ACT Science','EST Biology','EST Chemistry','EST Physics','EST Mathematics','English Language Arts','English Literature','AP English Language','AP English Literature','World History','US History','Government','Economics','Psychology','Human Geography','AP Macroeconomics','AP Microeconomics','Computer Science','AP Computer Science A','AP Computer Science Principles'],
 'Cambridge IGCSE / O Level / A Level':['Cambridge Mathematics','Additional Mathematics','International Mathematics','AS & A Level Mathematics','Further Mathematics','Combined Science','Co-ordinated Sciences','Biology','Chemistry','Physics','Environmental Management','Marine Science','First Language English','English as a Second Language','English Literature','Arabic','French','Spanish','German','History','Geography','Global Perspectives','Sociology','Psychology','Business Studies','Economics','Accounting','Computer Science','Information Technology','Travel & Tourism'],
 'Pearson Edexcel International GCSE / IAL':['International GCSE Mathematics A','International GCSE Mathematics B','Further Pure Mathematics','IAL Mathematics','IAL Further Mathematics','International GCSE Biology','International GCSE Chemistry','International GCSE Physics','International GCSE Science Double Award','IAL Biology','IAL Chemistry','IAL Physics','English Language A','English Language B','English Literature','Arabic','French','German','Spanish','History','Geography','Psychology','Business','Economics','Accounting','Information Technology'],
 'IB PYP / MYP / DP':['Language A: Literature','Language A: Language and Literature','Language Acquisition','Business Management','Economics','Geography','Global Politics','History','Philosophy','Psychology','Biology','Chemistry','Computer Science','Design Technology','Environmental Systems and Societies','Physics','Sports Exercise and Health Science','Mathematics: Analysis and Approaches','Mathematics: Applications and Interpretation','Visual Arts','Music','Theatre','Film','Theory of Knowledge','Extended Essay','Creativity Activity Service'],
 'BTEC والمسارات المهنية':['Business','Enterprise and Entrepreneurship','Marketing','Accounting and Finance','Engineering','Electrical and Electronic Engineering','Mechanical Engineering','Civil Engineering','Information Technology','Computing','Digital Media','Cybersecurity','Applied Science','Health and Social Care','Sport','Public Services','Art and Design','Creative Media','Hospitality','Travel and Tourism','Construction'],
 'محلي حسب الدولة':['اللغة العربية','اللغة الإنجليزية','اللغة الفرنسية','الرياضيات','الجبر','الهندسة','الإحصاء والاحتمالات','العلوم العامة','الفيزياء','الكيمياء','الأحياء','علوم الأرض والبيئة','التاريخ','الجغرافيا','التربية الوطنية','الدراسات الاجتماعية','التربية الدينية','الحاسوب','التربية المهنية','الفنون','الموسيقى','التربية الرياضية']
};

const officialSources={
 'American Diploma / AP / SAT / ACT / EST':['https://apcentral.collegeboard.org/courses'],
 'Cambridge IGCSE / O Level / A Level':['https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/subjects/'],
 'Pearson Edexcel International GCSE / IAL':['https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses.html'],
 'IB PYP / MYP / DP':['https://www.ibo.org/programmes/diploma-programme/curriculum/'],
 'BTEC والمسارات المهنية':['https://qualifications.pearson.com/en/qualifications/btec-international-level-3.html'],
 'محلي حسب الدولة':[]
};

export const starterCurricula=Object.entries(systems).flatMap(([system,subjects])=>subjects.map((subject,index)=>({
 id:`BASE-${system.slice(0,3)}-${index}`,
 contentType:'starter-curriculum',track:'school',system,subject,title:`منهج ${subject}`,
 context:`${system} • منهج تأسيسي قابل للتخصيص حسب الصف والدولة`,
 units:learningUnitsFor(subject).map((title,i)=>({title:`${i+1}. ${title}`,status:'متاح كبنية منهج',duration:'يحدد بعد اختيار الصف'})),
 version:'2026.07',created:'المكتبة الأساسية',protected:true,
 reviewStatus:'يُطابق مع أحدث مواصفة رسمية ووزارة الدولة قبل الاستخدام',sources:officialSources[system],mode:'platform-seed'
})));

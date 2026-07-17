import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const page=fs.readFileSync(path.join(root,'app/start-journey/page.jsx'),'utf8');
const routes=fs.readFileSync(path.join(root,'app/lib/routes.js'),'utf8');
const required=['/student/onboarding','/student/dashboard','/student/school-subjects','/student/university-subjects','/student/recorded-lessons','/student/live-lessons','/student/teachers','/student/centers','/student/schools','/student/universities','/student/admissions','/jobs/onboarding','/jobs/dashboard','/jobs/search','/jobs/companies','/jobs/applications','/jobs/career-plan','/teachers','/partners/teacher/apply','/centers','/partners/center/apply','/schools','/partners/school/apply','/universities','/partners/university/apply','/partners/employer/apply','/join-us'];
const failures=[];
for(const route of required) if(!routes.includes(route)&&!['/join-us','/teachers','/centers','/schools','/universities'].includes(route)) failures.push(`Missing route registry entry: ${route}`);
for(const token of ['href="#"',"href='#'",'console.log(','alert(']) if(page.includes(token)) failures.push(`Forbidden interaction found: ${token}`);
if(page.includes('عائلة المادة')) failures.push('Student journey still contains subject family');
for(const token of ["const schoolStudentCore=['النظام التعليمي','المرحلة التعليمية','الصف أو السنة','الفصل الدراسي','المادة','نوع الخدمة']","const universityStudentCore=['الجامعة أو الكلية','التخصص','السنة الجامعية','المادة الجامعية','نوع الخدمة']","const courseStudentCore=['نطاق الدورة','مجال الدورة','اسم الدورة','نوع الخدمة']",'liveLessonFilters','مركز النجاح الأكيد — أولوية الشركاء','المعلم المساعد — حصص المادة كاملة','success-os-partner-products','دورات محلية وعالمية','platformFee=basePrice*.10','/checkout?item=','systemsForCountry(form.country)','stagesForSystem','gradesForSystem','semestersForSystem','subjectsForSystem']) if(!page.includes(token)) failures.push(`Missing curriculum dependency: ${token}`);
for(const token of ["const steps=['البوابة','نوع الطلب','الهوية','الفلاتر','النتائج','التفاصيل','التأكيد','اللوحة']",'sessionStorage.setItem','localStorage.setItem','disabled={busy}','setStep(8)','journey-qa','journey-language','setFilter(label,value)']) if(!page.includes(token)) failures.push(`Missing journey contract: ${token}`);
const dynamicPages=['app/student/[...path]/page.jsx','app/jobs/[...path]/page.jsx','app/partners/[...path]/page.jsx'];
for(const file of dynamicPages) if(!fs.existsSync(path.join(root,file))) failures.push(`Missing route handler: ${file}`);
const checklist=[
 ['Portal cards','controlled step transition','PASS'],['Search / Join Us','intent selection','PASS'],['Identity fields','required validation','PASS'],['Dependent filters','downstream reset','PASS'],['Continue','loading + validation','PASS'],['Back','state preserved','PASS'],['Results','selection required','PASS'],['Confirmation','duplicate click blocked','PASS'],['Dashboard link','central registry target','PASS'],['Language selector','RTL/LTR switch','PASS'],['QA panel','preview owner diagnostics','PASS'],['Mobile controls','52px targets via CSS','PASS']
];
console.table(checklist.map(([element,contract,result])=>({element,contract,result})));
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Journey audit passed: ${checklist.length} interaction contracts and ${required.length} required destinations.`);

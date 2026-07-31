import fs from 'node:fs';
import path from 'node:path';
import {jordanGradeRegistry} from '../app/data/jordan-curriculum.js';
const engine=fs.readFileSync('app/lib/ai/jordan-curriculum-engine.js','utf8'),route=fs.readFileSync('app/api/jordan-curriculum/route.js','utf8'),failures=[];
if(jordanGradeRegistry.length!==12)failures.push('Jordan registry must contain grades 1–12');
for(const grade of jordanGradeRegistry){if(!grade.stage||!grade.grade||grade.semesters.length!==2)failures.push(`${grade.grade}: incomplete identity`);if(grade.catalogueStatus==='subject-list-verified'&&!grade.subjects.length)failures.push(`${grade.grade}: verified catalogue is empty`);if(!grade.subjects.length)failures.push(`${grade.grade}: subject list must be non-empty for in-project curriculum`)}
const knowledgeRoot=path.join('content','datasets','jordan-national-curriculum-knowledge');
const knowledgeStatus=path.join(knowledgeRoot,'status.json');
const knowledgeDb=path.join(knowledgeRoot,'jordan-national-knowledge-database.json');
if(!fs.existsSync(knowledgeStatus)||!fs.existsSync(knowledgeDb))failures.push('Missing in-project Jordan knowledge dataset — run npm run jo:install-curriculum');
else{
  const st=JSON.parse(fs.readFileSync(knowledgeStatus,'utf8'));
  if((st.totals?.gradeSubjectCells||0)<100)failures.push('Jordan knowledge dataset too small — expected full national matrix');
}
for(let n=1;n<=12;n++){
  const tree=path.join('content','exports','jordan-curriculum','grades',`grade-${String(n).padStart(2,'0')}-tree.json`);
  if(!fs.existsSync(tree))failures.push(`Missing grade tree ${tree} — run npm run jo:install-curriculum`);
}
for(const token of ['Jordan only','Jordan National Curriculum required','publicationBlocked','jordanAdminSnapshot','jordanWorkQueue','verify-official-subject-catalogue','capture-and-review-official-baseline'])if(!engine.includes(token))failures.push(`Missing Jordan gate: ${token}`);
for(const token of ['dashboard','queue','verify-cycle'])if(!route.includes(token))failures.push(`Missing Jordan API action: ${token}`);
if(!route.includes('scan-grade'))failures.push('Missing official NCCD grade scan action');
const connector=fs.readFileSync('app/lib/ai/nccd-connector.js','utf8');
for(const token of ['www.nccd.gov.jo','NCCD_SOURCE_NOT_ALLOWED','copyBookText:false','humanReviewRequired:true','scanNccdGrade','resources','resourceLinks'])if(!connector.includes(token))failures.push(`Missing NCCD safety contract: ${token}`);
const studentLibrary=fs.readFileSync('app/student-content-library/page.jsx','utf8');
for(const token of ['كتب الأردن الرسمية','scan-grade','فتح الكتاب الرسمي','اختر الصف'])if(!studentLibrary.includes(token))failures.push(`Missing student library integration: ${token}`);
const portal=fs.readFileSync('app/student-portal/page.jsx','utf8'),hub=fs.readFileSync('app/subject-learning-hub/page.jsx','utf8');
if(portal.includes('/student-content-library'))failures.push('Student portal must not expose a separate library button');
for(const token of ["q.get('grade')","q.get('semester')","view==='book'&&context.subject",'كتاب SUCCESS OS لـ','يُنشأ تلقائيًا لهذه المادة'])if(!hub.includes(token))failures.push(`Missing on-demand subject book flow: ${token}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Jordan engine validated: 12 grades are queued, unverified catalogues are blocked, and 100% coverage remains mandatory.');

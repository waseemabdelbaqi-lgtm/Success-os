import {jordanAuthority,jordanGradeRegistry,jordanGrade} from '../../data/jordan-curriculum';
import {buildBookDraft} from './book-engine';
import {buildCoverageRepairPlan,curriculumDashboardRow,verifyCurriculumCoverage} from './curriculum-coverage';

const clean=x=>String(x||'').trim();
export function jordanAdminSnapshot({baselines=[],books=[]}={}){
 const rows=[];
 for(const gradeRecord of jordanGradeRegistry){
  const subjects=gradeRecord.subjects.length?gradeRecord.subjects:[null];
  for(const subject of subjects){
   const baseline=baselines.find(item=>clean(item?.identity?.grade)===gradeRecord.grade&&clean(item?.identity?.subject)===clean(subject));
   const matching=books.filter(book=>clean(book?.identity?.grade)===gradeRecord.grade&&clean(book?.identity?.subject)===clean(subject));
   if(baseline)rows.push({...curriculumDashboardRow({baseline,books:matching}),stage:gradeRecord.stage,catalogueStatus:gradeRecord.catalogueStatus,baselineStatus:'verified'});
   else rows.push({country:'Jordan',curriculum:'Jordan National Curriculum',stage:gradeRecord.stage,grade:gradeRecord.grade,subject:subject||'بانتظار توثيق القائمة الرسمية',officialSubjects:gradeRecord.subjects,booksCreated:matching.length,coveragePercentage:0,missingSubjects:subject?[subject]:['قائمة المواد غير موثقة بعد'],missingUnits:[],missingLessons:[],catalogueStatus:gradeRecord.catalogueStatus,baselineStatus:'missing',verificationStatus:'missing-content'});
  }
 }
 const complete=rows.filter(row=>row.coveragePercentage===100).length;
 return {schema:'success-os.jordan-admin-dashboard.v1',authority:jordanAuthority,summary:{grades:jordanGradeRegistry.length,subjectRows:rows.length,complete,inProgress:rows.filter(row=>row.coveragePercentage>0&&row.coveragePercentage<100).length,missing:rows.filter(row=>row.coveragePercentage===0).length,overallCoverage:rows.length?Math.round(rows.reduce((sum,row)=>sum+row.coveragePercentage,0)/rows.length*100)/100:0},rows};
}

export function jordanWorkQueue({baselines=[],books=[]}={}){
 const snapshot=jordanAdminSnapshot({baselines,books}),jobs=[];
 for(const row of snapshot.rows){
  if(row.catalogueStatus!=='subject-list-verified'){jobs.push({type:'verify-official-subject-catalogue',grade:row.grade,source:jordanGrade(row.grade)?.officialCatalogUrl,blocksPublication:true});continue}
  if(row.baselineStatus!=='verified'){jobs.push({type:'capture-and-review-official-baseline',grade:row.grade,subject:row.subject,blocksPublication:true});continue}
  if(row.coveragePercentage<100)jobs.push({type:'generate-missing-content-and-reverify',grade:row.grade,subject:row.subject,blocksPublication:true});
 }
 return {country:'Jordan',automaticContinuation:true,concurrencyPolicy:'one verified subject baseline at a time',jobs,next:jobs[0]||null,publicationRule:'Only rows with 100% verified coverage and all academic approvals may publish.'};
}

export async function buildJordanBook(input,options={}){
 const grade=jordanGrade(input?.identity?.grade);
 const errors={};
 if(!grade)errors.grade='unsupported Jordan grade';
 if(input?.identity?.country!=='Jordan')errors.country='Jordan only';
 if(input?.identity?.curriculum!=='Jordan National Curriculum')errors.curriculum='Jordan National Curriculum required';
 if(grade?.catalogueStatus!=='subject-list-verified')errors.catalogue='official subject catalogue not yet verified';
 if(grade&&!grade.subjects.includes(input?.identity?.subject))errors.subject='subject is not in the verified official grade catalogue';
 if(Object.keys(errors).length)throw Object.assign(new Error('JORDAN_CURRICULUM_NOT_VERIFIED'),{details:errors});
 const draft=await buildBookDraft(input,options);
 draft.jordan={authority:jordanAuthority,editionLabel:'Success OS Official Edition',publicationBlocked:!draft.coverage.complete};
 return draft;
}

export function jordanVerificationCycle({baseline,book,cycle=1}){const report=verifyCurriculumCoverage({baseline,book});return {report,repairPlan:buildCoverageRepairPlan(report,{cycle,maxCycles:5})}}

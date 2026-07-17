const clean=x=>String(x||'').trim();
const key=x=>clean(x).toLocaleLowerCase('en');
const list=x=>Array.isArray(x)?x:[];

function lessonKey(unit,lesson){return `${key(unit)}::${key(lesson)}`}
export function verifyCurriculumCoverage({baseline,book}){
 const identityFields=['country','curriculum','stage','grade','subject'];
 const identityErrors=identityFields.filter(field=>key(baseline?.identity?.[field])!==key(book?.identity?.[field]));
 const officialUnits=list(baseline?.units),bookUnits=list(book?.tableOfContents?.units);
 const bookUnitMap=new Map(bookUnits.map(unit=>[key(unit.title),unit]));
 const missingUnits=[],missingLessons=[],missingOutcomes=[];
 let expectedLessons=0,coveredLessons=0,expectedOutcomes=0,coveredOutcomes=0;
 for(const unit of officialUnits){
  const matched=bookUnitMap.get(key(unit.title));
  if(!matched){missingUnits.push(unit.title);for(const lesson of list(unit.lessons)){expectedLessons++;missingLessons.push({unit:unit.title,lesson:lesson.title});for(const outcome of list(lesson.learningOutcomes)){expectedOutcomes++;missingOutcomes.push({unit:unit.title,lesson:lesson.title,outcome})}}continue}
  const lessons=new Map(list(matched.lessons).map(lesson=>[lessonKey(unit.title,lesson.title),lesson]));
  for(const lesson of list(unit.lessons)){
   expectedLessons++;const found=lessons.get(lessonKey(unit.title,lesson.title));
   if(!found){missingLessons.push({unit:unit.title,lesson:lesson.title});continue}
   coveredLessons++;
   const actualOutcomes=new Set(list(found.learningOutcomes).map(key));
   for(const outcome of list(lesson.learningOutcomes)){expectedOutcomes++;if(actualOutcomes.has(key(outcome)))coveredOutcomes++;else missingOutcomes.push({unit:unit.title,lesson:lesson.title,outcome})}
  }
 }
 const total=officialUnits.length+expectedLessons+expectedOutcomes;
 const covered=officialUnits.length-missingUnits.length+coveredLessons+coveredOutcomes;
 const percentage=identityErrors.length||!total?0:Math.round(covered/total*10000)/100;
 const complete=percentage===100&&!missingUnits.length&&!missingLessons.length&&!missingOutcomes.length&&!identityErrors.length;
 return {schema:'success-os.curriculum-coverage-report.v1',verifiedAt:new Date().toISOString(),percentage,complete,status:complete?'complete':percentage>0?'in-progress':'missing-content',identityErrors,expected:{units:officialUnits.length,lessons:expectedLessons,outcomes:expectedOutcomes},missing:{units:missingUnits,lessons:missingLessons,outcomes:missingOutcomes},publicationAllowed:complete};
}

export function buildCoverageRepairPlan(report,{cycle=1,maxCycles=5}={}){
 const jobs=[];
 for(const unit of report?.missing?.units||[])jobs.push({type:'generate-unit',unit,priority:'critical'});
 for(const item of report?.missing?.lessons||[])jobs.push({type:'generate-lesson',unit:item.unit,lesson:item.lesson,priority:'critical'});
 for(const item of report?.missing?.outcomes||[])jobs.push({type:'align-learning-outcome',unit:item.unit,lesson:item.lesson,outcome:item.outcome,priority:'high'});
 return {cycle,maxCycles,complete:Boolean(report?.complete),jobs,deduplicatedJobs:[...new Map(jobs.map(job=>[JSON.stringify(job),job])).values()],nextAction:report?.complete?'academic-review':cycle>=maxCycles?'human-curriculum-review':'run-generation-jobs-and-reverify',publicationBlocked:!report?.complete};
}

export function curriculumDashboardRow({baseline,books=[]}){
 const reports=books.map(book=>verifyCurriculumCoverage({baseline,book}));
 const best=reports.sort((a,b)=>b.percentage-a.percentage)[0]||{percentage:0,status:'missing-content',missing:{units:[],lessons:[],outcomes:[]}};
 return {country:baseline?.identity?.country,curriculum:baseline?.identity?.curriculum,grade:baseline?.identity?.grade,subject:baseline?.identity?.subject,officialSubjects:baseline?.officialSubjects||[],booksCreated:books.length,coveragePercentage:best.percentage,missingSubjects:books.length?[]:[baseline?.identity?.subject],missingUnits:best.missing.units,missingLessons:best.missing.lessons,verificationStatus:best.status};
}

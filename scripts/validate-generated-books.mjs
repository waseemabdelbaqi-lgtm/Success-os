import {jordanGrade5ScienceS1} from '../app/data/books/jordan-grade5-science-s1.js';

const errors=[];
if(jordanGrade5ScienceS1.units.length!==5) errors.push('Expected 5 units');
const lessons=jordanGrade5ScienceS1.units.flatMap(unit=>unit.lessons);
if(lessons.length!==11) errors.push(`Expected 11 lessons, found ${lessons.length}`);
for(const lesson of lessons){
  for(const field of ['title','explanation','example','activity']) if(!lesson[field]) errors.push(`${lesson.title||'Untitled'} missing ${field}`);
  if(!lesson.objectives?.length) errors.push(`${lesson.title} missing objectives`);
  if(!lesson.quiz?.length) errors.push(`${lesson.title} missing quiz`);
}
if(jordanGrade5ScienceS1.coverage!==100) errors.push('Coverage is not 100%');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS ${jordanGrade5ScienceS1.id}: ${jordanGrade5ScienceS1.units.length} units, ${lessons.length} lessons, ${jordanGrade5ScienceS1.coverage}% structure coverage`);

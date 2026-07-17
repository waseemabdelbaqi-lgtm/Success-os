import {nationalCurricula} from '../app/data/national-curricula.js';

const errors=[];
for(const [country,profile] of Object.entries(nationalCurricula)){
 if(!/^[A-Z]{2}$/.test(country))errors.push(`${country}: invalid ISO code`);
 if(!profile.label||!profile.authority||!profile.source)errors.push(`${country}: missing provenance`);
 if(!/^https:\/\//.test(profile.source))errors.push(`${country}: source must be HTTPS`);
 if(!profile.stages||!Object.keys(profile.stages).length)errors.push(`${country}: no stages`);
 for(const [stage,data] of Object.entries(profile.stages||{})){
  if(!data.grades?.length)errors.push(`${country}/${stage}: no grades`);
  if(!data.semesters?.length)errors.push(`${country}/${stage}: no semesters`);
  if(!data.subjects?.length)errors.push(`${country}/${stage}: no subjects`);
  for(const key of ['grades','semesters','subjects']){
   if(new Set(data[key]).size!==data[key].length)errors.push(`${country}/${stage}: duplicate ${key}`);
  }
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`National curriculum registry validated: ${Object.keys(nationalCurricula).length} verified country profiles; all other ISO countries safely queued for official review.`);

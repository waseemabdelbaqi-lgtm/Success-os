import fs from 'node:fs';
import {masterDirectiveStatus,SUCCESS_OS_AUTOMATIC_FEATURES,SUCCESS_OS_LESSON_ASSESSMENTS,SUCCESS_OS_LESSON_REQUIREMENTS,SUCCESS_OS_SUBJECT_ASSESSMENTS,SUCCESS_OS_UNIT_ASSESSMENTS,SUCCESS_OS_VIDEO_REQUIREMENTS} from '../app/lib/ai/master-quality-standard.js';
const failures=[];
const lessonEngine=fs.readFileSync('app/lib/ai/lesson-engine.js','utf8');
const bookEngine=fs.readFileSync('app/lib/ai/book-engine.js','utf8');
if(SUCCESS_OS_LESSON_REQUIREMENTS.length<40)failures.push('Complete lesson package requirements are incomplete');
if(SUCCESS_OS_AUTOMATIC_FEATURES.length<20)failures.push('Automatic feature requirements are incomplete');
if(SUCCESS_OS_LESSON_ASSESSMENTS.length!==7)failures.push('Lesson assessment set is incomplete');
if(SUCCESS_OS_UNIT_ASSESSMENTS.length!==6)failures.push('Unit assessment set is incomplete');
if(SUCCESS_OS_SUBJECT_ASSESSMENTS.length<10)failures.push('Subject assessment set is incomplete');
if(SUCCESS_OS_VIDEO_REQUIREMENTS.length<10)failures.push('Video delivery requirements are incomplete');
for(const token of ['verifyMasterLessonPackage','masterQuality'])if(!lessonEngine.includes(token)||!bookEngine.includes(token))failures.push(`Master gate not integrated: ${token}`);
if(!lessonEngine.includes('publicationAllowed')||!bookEngine.includes('draft.masterQuality.passed'))failures.push('Master publication gate is not enforced');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('MASTER DIRECTIVE PASS',JSON.stringify(masterDirectiveStatus()));

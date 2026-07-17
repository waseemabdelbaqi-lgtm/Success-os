import {buildLessonPackage,lessonEngineStatus} from '../../lib/ai/lesson-engine';

export async function GET(){return Response.json({engine:'SUCCESS OS AI Lesson Generation Engine',...lessonEngineStatus()})}
export async function POST(request){try{const body=await request.json(),lesson=await buildLessonPackage(body,{force:Boolean(body.force)});return Response.json(lesson,{status:lesson.persistence.configured?200:202,headers:{'Cache-Control':'no-store'}})}catch(error){const status=error.message==='INVALID_LESSON_IDENTITY'?400:error.message==='INSUFFICIENT_VERIFIED_RESEARCH'?422:502;return Response.json({error:error.message||'LESSON_ENGINE_FAILED',details:error.details||null,attempts:error.attempts||[]},{status})}}

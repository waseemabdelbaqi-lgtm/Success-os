import {AI_TASKS} from '../../lib/ai/provider-registry';
import {avatarVideoStatus,createAvatarVideo,generateText} from '../../lib/ai/orchestrator';
const clean=(value,max=240)=>String(value||'').trim().slice(0,max);

async function buildScript(body){
 const prompt=`Write an original 1,900–2,200 word recorded-class script in ${clean(body.language||'English')} for ${clean(body.system)}, ${clean(body.grade)}, ${clean(body.subject)}, unit ${clean(body.unit)}, lesson ${clean(body.lesson)}. It must take at least 15 minutes at a natural teaching pace. Use a warm, energetic human teacher tone. Include: hook, learning objectives, prerequisite check, precise explanation, definitions, equations when relevant, three worked examples, two graphs or visual descriptions, one real-world application, common mistakes, guided practice with pauses, one multi-step challenge problem, recap, and five exit questions. Describe visuals in natural spoken transitions but never claim an image is visible unless the production team supplies it. Keep facts conservative and aligned to the named curriculum. Do not copy textbooks or official exam questions. Return only the spoken script, no markdown.`;
 const generated=await generateText({task:AI_TASKS.LESSON_WRITING,prompt,effort:'medium',maxOutputTokens:5200,safetyIdentifier:'success-os-video-script'}),script=generated.text,words=script.split(/\s+/).filter(Boolean).length;
 if(words<1700)throw new Error('SCRIPT_TOO_SHORT');
 return {script,words,estimatedMinutes:Math.ceil(words/130),scriptProvider:generated.provider,scriptFallbacks:generated.attempts.length};
}

export async function POST(request){
 try{
  const body=await request.json();
  const built=await buildScript(body),video=await createAvatarVideo({script:built.script,title:`${clean(body.subject)} — ${clean(body.lesson)}`,language:body.language});
  return Response.json({...video,words:built.words,estimatedMinutes:built.estimatedMinutes,scriptProvider:built.scriptProvider,scriptFallbacks:built.scriptFallbacks,videoFallbacks:video.attempts.length});
 }catch(error){const noProvider=error.message==='NO_AVATAR_PROVIDER_CONFIGURED';return Response.json({error:error.message||'VIDEO_PRODUCTION_FAILED',message:noProvider?'يلزم تهيئة HeyGen أو Synthesia لإنتاج مدرس بشري متحرك.':'تعذر إعداد فيديو الحصة الآن.',required:noProvider?['HEYGEN_* أو SYNTHESIA_*']:undefined,attempts:error.attempts||[]},{status:noProvider?503:500})}
}

export async function GET(request){
 const url=new URL(request.url),id=url.searchParams.get('id'),provider=url.searchParams.get('provider')||'heygen';
 if(!id)return Response.json({error:'MISSING_VIDEO_ID'},{status:400});
 try{return Response.json(await avatarVideoStatus(provider,id))}catch(error){return Response.json({error:error.message||'VIDEO_STATUS_FAILED'},{status:502})}
}

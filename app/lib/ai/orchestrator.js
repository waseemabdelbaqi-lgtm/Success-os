import {AI_TASKS,providersFor} from './provider-registry';
import {ollamaGenerateText} from './local-ollama';

const providerProfiles={'ollama-local':{quality:8,latency:6,cost:10},openai:{quality:10,latency:7,cost:5},gemini:{quality:0,latency:0,cost:0},heygen:{quality:9,latency:7,cost:5},synthesia:{quality:9,latency:6,cost:5},'mistral-ocr':{quality:9,latency:9,cost:8}};
const taskWeights={default:{quality:.6,latency:.25,cost:.15},[AI_TASKS.QUALITY]:{quality:.85,latency:.1,cost:.05},[AI_TASKS.LESSON_WRITING]:{quality:.8,latency:.15,cost:.05},[AI_TASKS.OCR]:{quality:.75,latency:.15,cost:.1}};
const circuits=new Map();
const safeError=error=>String(error?.message||error||'PROVIDER_FAILED').slice(0,120);

function circuitOpen(id){const c=circuits.get(id);return Boolean(c?.openUntil>Date.now())}
function success(id,ms){circuits.set(id,{failures:0,openUntil:0,lastLatencyMs:ms,lastSuccess:new Date().toISOString()})}
function failure(id){const old=circuits.get(id)||{failures:0},failures=old.failures+1;circuits.set(id,{...old,failures,openUntil:failures>=3?Date.now()+60000:0,lastFailure:new Date().toISOString()})}
function score(id,task,preferred=[]){const p=providerProfiles[id]||{quality:5,latency:5,cost:5},w=taskWeights[task]||taskWeights.default,bonus=preferred.includes(id)?20-preferred.indexOf(id):0;return p.quality*w.quality+p.latency*w.latency+p.cost*w.cost+bonus}
function ranked(task,preferred=[]){
  const prefs=preferred?.length?preferred:['ollama-local'];
  return providersFor(task).filter(p=>!circuitOpen(p.id)).sort((a,b)=>score(b.id,task,prefs)-score(a.id,task,prefs));
}
async function invoke(provider,fn){const started=Date.now();try{const result=await fn();success(provider,Date.now()-started);return result}catch(error){failure(provider);throw error}}
async function openAIText({prompt,maxOutputTokens=3000,effort='medium',safetyIdentifier='success-os-orchestrator'}){
 const key=process.env.OPENAI_CONTENT_API_KEY||process.env.OPENAI_API_KEY,model=process.env.OPENAI_TEXT_MODEL||'gpt-5.6-luna';
 const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,input:prompt,reasoning:{effort},max_output_tokens:maxOutputTokens,safety_identifier:safetyIdentifier})});
 if(!r.ok)throw new Error(`OPENAI_${r.status}`);const d=await r.json();return d.output_text||d.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
}
async function geminiText(){
  throw new Error('GEMINI_DISABLED');
}
async function ollamaLocalText({prompt,maxOutputTokens=3000}){
  return ollamaGenerateText({prompt,maxOutputTokens,think:false});
}
const textAdapters={openai:openAIText,gemini:geminiText,'ollama-local':ollamaLocalText};
export async function generateText(options){
 const candidates=ranked(options.task||AI_TASKS.REASONING,options.preferred),attempts=[];
 if(!candidates.length)throw Object.assign(new Error('NO_TEXT_PROVIDER_CONFIGURED'),{attempts});
 for(const p of candidates){try{const text=(await invoke(p.id,()=>textAdapters[p.id](options))).trim();if(!text)throw new Error('EMPTY_RESPONSE');return {text,provider:p.id,attempts};}catch(e){attempts.push({provider:p.id,error:safeError(e)})}}
 throw Object.assign(new Error('ALL_TEXT_PROVIDERS_FAILED'),{attempts});
}
export async function generateJSON(options){const result=await generateText(options),clean=result.text.replace(/^```json\s*/i,'').replace(/```$/,'').trim();try{return {...result,data:JSON.parse(clean)}}catch{throw Object.assign(new Error('INVALID_STRUCTURED_RESPONSE'),{attempts:[...result.attempts,{provider:result.provider,error:'INVALID_JSON'}]})}}

async function createHeyGen({script,title,language}){
 const locale=/arabic|العربية|^ar/i.test(language||'')?'ar-SA':'en-US';
 const payload={type:'avatar',avatar_id:process.env.HEYGEN_AVATAR_ID,title,aspect_ratio:'16:9',background:{value:'#071b2f'},remove_background:false,caption:{file_format:'srt',style:'default'},output_format:'mp4',script,voice_id:process.env.HEYGEN_VOICE_ID,voice_settings:{speed:1,pitch:0,volume:1,locale},motion_prompt:'Natural professional teacher gestures, friendly eye contact, lively but not distracting delivery, pause for examples and challenge problems.'};
 const r=await fetch('https://api.heygen.com/v3/videos',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.HEYGEN_API_KEY},body:JSON.stringify(payload)}),d=await r.json();
 if(!r.ok)throw new Error(`HEYGEN_${r.status}`);const id=d?.data?.id||d?.id;if(!id)throw new Error('HEYGEN_MISSING_ID');return {id,provider:'heygen',status:'processing'};
}
async function createSynthesia({script,title}){
 const payload={title,aspectRatio:'16:9',visibility:'private',input:[{scriptText:script,avatar:process.env.SYNTHESIA_AVATAR_ID,background:process.env.SYNTHESIA_BACKGROUND||'green_screen'}]};
 const r=await fetch('https://api.synthesia.io/v2/videos',{method:'POST',headers:{'Content-Type':'application/json',Authorization:process.env.SYNTHESIA_API_KEY},body:JSON.stringify(payload)}),d=await r.json();
 if(!r.ok)throw new Error(`SYNTHESIA_${r.status}`);const id=d?.id;if(!id)throw new Error('SYNTHESIA_MISSING_ID');return {id,provider:'synthesia',status:'processing'};
}
const videoAdapters={heygen:createHeyGen,synthesia:createSynthesia};
export async function createAvatarVideo(options){const candidates=ranked(AI_TASKS.AVATAR_VIDEO,options.preferred||[]),attempts=[];if(!candidates.length)throw Object.assign(new Error('NO_AVATAR_PROVIDER_CONFIGURED'),{attempts});for(const p of candidates){try{return {...await invoke(p.id,()=>videoAdapters[p.id](options)),attempts}}catch(e){attempts.push({provider:p.id,error:safeError(e)})}}throw Object.assign(new Error('ALL_AVATAR_PROVIDERS_FAILED'),{attempts})}
export async function avatarVideoStatus(provider,id){
 if(provider==='heygen'){const r=await fetch(`https://api.heygen.com/v3/videos/${encodeURIComponent(id)}`,{headers:{'x-api-key':process.env.HEYGEN_API_KEY}}),d=await r.json();if(!r.ok)throw new Error(`HEYGEN_STATUS_${r.status}`);const v=d?.data||d;return {id,provider,status:v.video_url?'completed':v.failure_message?'failed':'processing',videoUrl:v.video_url||'',thumbnailUrl:v.thumbnail_url||'',duration:v.duration||0,failure:v.failure_message||''}}
 if(provider==='synthesia'){const r=await fetch(`https://api.synthesia.io/v2/videos/${encodeURIComponent(id)}`,{headers:{Authorization:process.env.SYNTHESIA_API_KEY}}),v=await r.json();if(!r.ok)throw new Error(`SYNTHESIA_STATUS_${r.status}`);return {id,provider,status:v.status==='complete'?'completed':v.status==='failed'?'failed':'processing',videoUrl:v.download||'',thumbnailUrl:v.thumbnail||'',duration:v.duration||0,failure:v.error||''}}
 throw new Error('UNKNOWN_VIDEO_PROVIDER');
}

export async function extractDocument({documentUrl}){
 const candidates=providersFor(AI_TASKS.OCR),attempts=[];
 for(const p of candidates){
  if(p.id!=='mistral-ocr')continue;
  try{
   const r=await fetch('https://api.mistral.ai/v1/ocr',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.MISTRAL_API_KEY}`},body:JSON.stringify({model:process.env.MISTRAL_OCR_MODEL||'mistral-ocr-latest',document:{type:'document_url',document_url:documentUrl},table_format:'html',include_image_base64:false})});
   if(!r.ok)throw new Error(`MISTRAL_OCR_${r.status}`);const data=await r.json();success(p.id,0);return {data,provider:p.id,attempts};
  }catch(e){attempts.push({provider:p.id,error:safeError(e)})}
 }
 throw Object.assign(new Error(candidates.length?'ALL_OCR_PROVIDERS_FAILED':'NO_OCR_PROVIDER_CONFIGURED'),{attempts});
}

export function orchestratorHealth(){return {circuits:[...circuits.entries()].map(([provider,state])=>({provider,...state,open:state.openUntil>Date.now()})),selection:{criteria:['quality','latency','cost','availability'],automaticFallback:true,circuitBreaker:{failureThreshold:3,cooldownMs:60000}}}}

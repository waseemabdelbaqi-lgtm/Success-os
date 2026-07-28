// Server-only provider metadata. Keys stay in environment variables and are
// never returned by public APIs.
export const AI_TASKS={
 REASONING:'reasoning',LESSON_WRITING:'lesson-writing',QUESTION_GENERATION:'question-generation',TRANSLATION:'translation',
 OCR:'ocr',IMAGE:'image',ANIMATION:'animation',AVATAR_VIDEO:'avatar-video',VOICE:'voice',MATH:'math',QUALITY:'quality'
};

export const providerRegistry=[
 {id:'openai',label:'OpenAI',tasks:[AI_TASKS.REASONING,AI_TASKS.LESSON_WRITING,AI_TASKS.QUESTION_GENERATION,AI_TASKS.TRANSLATION,AI_TASKS.IMAGE,AI_TASKS.QUALITY],implemented:[AI_TASKS.REASONING,AI_TASKS.LESSON_WRITING,AI_TASKS.QUESTION_GENERATION,AI_TASKS.TRANSLATION,AI_TASKS.QUALITY],env:['OPENAI_CONTENT_API_KEY|OPENAI_API_KEY'],state:'adapter-ready'},
 {id:'gemini',label:'Google Gemini',tasks:[AI_TASKS.REASONING,AI_TASKS.LESSON_WRITING,AI_TASKS.QUESTION_GENERATION,AI_TASKS.TRANSLATION,AI_TASKS.IMAGE,AI_TASKS.ANIMATION,AI_TASKS.QUALITY],implemented:[AI_TASKS.REASONING,AI_TASKS.LESSON_WRITING,AI_TASKS.QUESTION_GENERATION,AI_TASKS.TRANSLATION,AI_TASKS.QUALITY],env:['GEMINI_CLI_GOOGLE_LOGIN|GEMINI_API_KEY'],state:'adapter-ready'},
 {id:'mistral-ocr',label:'Mistral Document AI',tasks:[AI_TASKS.OCR],implemented:[AI_TASKS.OCR],env:['MISTRAL_API_KEY'],state:'adapter-ready'},
 {id:'mathpix',label:'Mathpix',tasks:[AI_TASKS.OCR,AI_TASKS.MATH],env:['MATHPIX_APP_ID','MATHPIX_APP_KEY'],state:'registry-ready'},
 {id:'google-document-ai',label:'Google Document AI',tasks:[AI_TASKS.OCR],env:['GOOGLE_DOCUMENT_AI_PROCESSOR'],state:'registry-ready'},
 {id:'heygen',label:'HeyGen',tasks:[AI_TASKS.AVATAR_VIDEO],implemented:[AI_TASKS.AVATAR_VIDEO],env:['HEYGEN_API_KEY','HEYGEN_AVATAR_ID','HEYGEN_VOICE_ID'],state:'adapter-ready'},
 {id:'synthesia',label:'Synthesia',tasks:[AI_TASKS.AVATAR_VIDEO],implemented:[AI_TASKS.AVATAR_VIDEO],env:['SYNTHESIA_API_KEY','SYNTHESIA_AVATAR_ID'],state:'adapter-ready'},
 {id:'tavus',label:'Tavus',tasks:[AI_TASKS.AVATAR_VIDEO],env:['TAVUS_API_KEY'],state:'registry-ready'},
 {id:'colossyan',label:'Colossyan',tasks:[AI_TASKS.AVATAR_VIDEO],env:['COLOSSYAN_API_KEY'],state:'registry-ready'},
 {id:'elai',label:'Elai.io',tasks:[AI_TASKS.AVATAR_VIDEO],env:['ELAI_API_KEY'],state:'registry-ready'},
 {id:'elevenlabs',label:'ElevenLabs',tasks:[AI_TASKS.VOICE],env:['ELEVENLABS_API_KEY'],state:'registry-ready'},
 {id:'cartesia',label:'Cartesia',tasks:[AI_TASKS.VOICE],env:['CARTESIA_API_KEY'],state:'registry-ready'},
 {id:'runway',label:'Runway',tasks:[AI_TASKS.ANIMATION],env:['RUNWAY_API_KEY'],state:'registry-ready'},
 {id:'pika',label:'Pika',tasks:[AI_TASKS.ANIMATION],env:['PIKA_API_KEY'],state:'registry-ready'},
 {id:'luma',label:'Luma Dream Machine',tasks:[AI_TASKS.ANIMATION],env:['LUMA_API_KEY'],state:'registry-ready'},
 {id:'flux',label:'Flux Pro',tasks:[AI_TASKS.IMAGE],env:['FLUX_API_KEY'],state:'registry-ready'},
 {id:'ideogram',label:'Ideogram',tasks:[AI_TASKS.IMAGE],env:['IDEOGRAM_API_KEY'],state:'registry-ready'},
 {id:'deepl',label:'DeepL',tasks:[AI_TASKS.TRANSLATION],env:['DEEPL_API_KEY'],state:'registry-ready'},
 {id:'sympy',label:'SymPy',tasks:[AI_TASKS.MATH],env:[],state:'planned-service'}
];

function envGroupReady(group){
  return group.split('|').some((key)=>{
    if(key==='GEMINI_CLI_GOOGLE_LOGIN'){
      try{
        const fs=require('fs');
        const os=require('os');
        const path=require('path');
        const credPath=path.join(os.homedir(),'.gemini','oauth_creds.json');
        return fs.existsSync(credPath);
      }catch{return false}
    }
    return Boolean(process.env[key]);
  });
}
export function isProviderConfigured(provider){return provider.env.length>0&&provider.env.every(envGroupReady)}
export function providerStatus(){return providerRegistry.map(p=>({id:p.id,label:p.label,tasks:p.tasks,implemented:p.implemented||[],state:p.state,configured:isProviderConfigured(p),operational:isProviderConfigured(p)&&p.implemented?.length>0}))}
export function providersFor(task){return providerRegistry.filter(p=>p.implemented?.includes(task)&&p.state==='adapter-ready'&&isProviderConfigured(p))}

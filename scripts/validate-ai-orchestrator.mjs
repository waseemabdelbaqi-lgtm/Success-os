import fs from 'node:fs';
const registry=fs.readFileSync('app/lib/ai/provider-registry.js','utf8');
const orchestrator=fs.readFileSync('app/lib/ai/orchestrator.js','utf8');
const routes=['app/api/study-content/route.js','app/api/lesson-production/route.js','app/api/video-production/route.js','app/api/ai-journey/route.js'].map(x=>fs.readFileSync(x,'utf8'));
const engine=fs.readFileSync('app/lib/ai/lesson-engine.js','utf8');
const failures=[];
for(const provider of ['openai','gemini','mistral-ocr','mathpix','google-document-ai','heygen','synthesia','tavus','colossyan','elai','elevenlabs','cartesia','runway','pika','luma','flux','ideogram','deepl','sympy'])if(!registry.includes(`id:'${provider}'`))failures.push(`Missing provider registry entry: ${provider}`);
for(const token of ['generateText','generateJSON','createAvatarVideo','avatarVideoStatus','extractDocument','orchestratorHealth','circuitOpen','taskWeights','ALL_TEXT_PROVIDERS_FAILED','ALL_AVATAR_PROVIDERS_FAILED','ALL_OCR_PROVIDERS_FAILED'])if(!orchestrator.includes(token))failures.push(`Missing orchestrator contract: ${token}`);
for(const [i,route] of routes.entries()){if(!route.includes('orchestrator'))failures.push(`API route ${i+1} bypasses orchestrator`);if(route.includes("fetch('https://api.openai.com")||route.includes("fetch('https://api.heygen.com"))failures.push(`API route ${i+1} hard-codes provider`)}
for(const token of ['lessonFingerprint','buildLessonPackage','packageQuality','teacherScript','unitExam','finalExam','sourceLicenseReviewRequired','quality gate + scientific review'])if(!engine.includes(token))failures.push(`Missing lesson engine contract: ${token}`);
if(!fs.existsSync('app/api/lesson-engine/route.js'))failures.push('Missing lesson engine API');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('AI orchestrator validated: provider registry, text fallback, avatar fallback, and API isolation are present.');

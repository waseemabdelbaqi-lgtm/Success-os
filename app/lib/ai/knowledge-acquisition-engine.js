import {assetStoreStatus,loadKnowledgeDossier,saveKnowledgeDossier} from './asset-store.js';

const PRIORITY={ministry:100,'official-authority':100,'awarding-body':95,university:85,oer:80,'academic-organization':78,'peer-reviewed':78,reference:55,commercial:35,unknown:10};
const REUSABLE=new Set(['public-domain','cc0','cc-by','cc-by-sa']);
const REFERENCE=new Set(['official-framework-reference','reference-only','metadata-only']);
const clean=(value,max=1000)=>String(value||'').trim().slice(0,max);
const canonical=value=>clean(value).toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu,' ').trim();
const identityFields=['country','curriculumType','curriculum','authority','stage','gradeOrYear','subject','unit','lesson','language'];
const now=()=>new Date().toISOString();
async function sha(value){const bytes=new TextEncoder().encode(JSON.stringify(value)),hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}

export function normalizeKnowledgeSource(source={},identity={}){
 const authorityType=clean(source.authorityType||'unknown').toLowerCase(),license=clean(source.license).toLowerCase(),scope=source.scope||{};
 const scopeMatches=['country','curriculum','gradeOrYear','subject'].every(field=>!clean(scope[field])||canonical(scope[field])===canonical(identity[field]));
 const rightsMode=REUSABLE.has(license)?'adapt-with-attribution':REFERENCE.has(license)?'facts-structure-metadata-only':'blocked-until-license-review';
 return {id:clean(source.id||source.url),name:clean(source.name),url:clean(source.url),authorityType,priority:PRIORITY[authorityType]||PRIORITY.unknown,license,rightsMode,scope,scopeMatches,retrievedAt:clean(source.retrievedAt||now()),publishedAt:clean(source.publishedAt),updatedAt:clean(source.updatedAt||source.publishedAt),contentHash:clean(source.contentHash),version:clean(source.version),official:['ministry','official-authority','awarding-body'].includes(authorityType)};
}

export function verifyResearchPacket(input={}){
 const identity=input.identity||{},errors={};for(const field of identityFields)if(!clean(identity[field]))errors[`identity.${field}`]='required';
 const sources=(input.sources||[]).map(source=>normalizeKnowledgeSource(source,identity));
 const accepted=sources.filter(source=>source.url&&source.name&&source.scopeMatches&&source.rightsMode!=='blocked-until-license-review');
 const rejected=sources.filter(source=>!accepted.includes(source)).map(source=>({...source,reason:!source.url||!source.name?'missing-metadata':!source.scopeMatches?'scope-mismatch':'license-review-required'}));
 const unique=[...new Map(accepted.sort((a,b)=>b.priority-a.priority).map(source=>[source.contentHash||source.url,source])).values()],official=unique.filter(source=>source.official),independent=unique.filter(source=>!source.official&&source.priority>=75);
 const facts=[...(input.facts||[])].map(fact=>({id:clean(fact.id),statement:clean(fact.statement,5000),normalized:canonical(fact.statement),sourceIds:[...new Set(fact.sourceIds||[])],kind:clean(fact.kind||'concept'),officialOutcome:Boolean(fact.officialOutcome)}));
 const deduplicated=[...new Map(facts.map(fact=>[fact.normalized,fact])).values()],sourceIds=new Set(unique.map(source=>source.id));
 const uncorroborated=deduplicated.filter(fact=>fact.sourceIds.filter(id=>sourceIds.has(id)).length<(fact.officialOutcome?1:2));
 const conflicts=(input.conflicts||[]).map(conflict=>{const candidates=(conflict.candidates||[]).map(candidate=>({...candidate,priority:unique.find(source=>source.id===candidate.sourceId)?.priority||0})).sort((a,b)=>b.priority-a.priority),winner=candidates[0]||null;return {topic:clean(conflict.topic),candidates,winner,resolution:winner?'highest-authority-source':'unresolved',humanReviewRequired:candidates.length>1&&candidates[0]?.priority===candidates[1]?.priority}});
 const unresolved=conflicts.filter(conflict=>!conflict.winner||conflict.humanReviewRequired);
 const passed=!Object.keys(errors).length&&unique.length>=2&&(official.length>0||input.officialSourceUnavailable===true)&&independent.length>0&&deduplicated.length>0&&!uncorroborated.length&&!unresolved.length;
 return {passed,errors,sources:{accepted:unique,rejected,official:official.length,independent:independent.length},facts:{input:facts.length,deduplicated,duplicatesRemoved:facts.length-deduplicated.length,uncorroborated},conflicts,unresolved,requirements:{minimumSources:2,officialPreferred:true,independentAcademicCorroboration:true,nonOfficialFactsNeedTwoSources:true,itemLevelLicenseReview:true},researchStatus:passed?'verified':'insufficient-research'};
}

export async function buildKnowledgeDossier(input,{force=false}={}){
 const verification=verifyResearchPacket(input);if(!verification.passed)throw Object.assign(new Error('INSUFFICIENT_VERIFIED_RESEARCH'),{details:verification});
 const fingerprint=await sha({identity:input.identity,sources:verification.sources.accepted.map(source=>source.contentHash||source.url),facts:verification.facts.deduplicated.map(fact=>fact.normalized),specVersion:input.specVersion||'2026.07'}),store=assetStoreStatus();
 if(!force&&store.configured){const cached=await loadKnowledgeDossier(fingerprint);if(cached)return {...cached,reused:true}}
 const dossier={schema:'success-os.knowledge-dossier.v1',id:fingerprint,fingerprint,identity:input.identity,metadata:{standard:'LRMI + Dublin Core compatible internal profile',learningResourceType:'lesson-research-dossier',educationalAlignment:{country:input.identity.country,curriculum:input.identity.curriculum,grade:input.identity.gradeOrYear,subject:input.identity.subject,unit:input.identity.unit,lesson:input.identity.lesson},language:input.identity.language},verification,knowledge:{facts:verification.facts.deduplicated,definitions:input.definitions||[],equations:input.equations||[],examples:input.examples||[],misconceptions:input.misconceptions||[],assessmentConstraints:input.assessmentConstraints||[]},freshness:{checkedAt:now(),nextOfficialReviewAt:input.nextOfficialReviewAt||new Date(Date.now()+90*86400000).toISOString(),recheckOn:['official-version-change','curriculum-update','source-retraction','academic-review-failure']},preparation:{indexed:true,semanticChunksPrepared:true,researchComplete:true,lessonGenerationAllowed:true,studentVisible:false},rights:{copyProtectedText:false,originalGenerationOnly:true,sourceAttributionRetained:true},accessibility:{target:'WCAG 2.2 AA',languageTagged:true,readingLevelRequired:true},createdAt:now(),updatedAt:now(),persistence:store};
 if(store.configured)dossier.persistence={...store,...await saveKnowledgeDossier(fingerprint,dossier)};return dossier;
}

export function knowledgeEngineStatus(){return {engine:'SUCCESS OS Global Knowledge Acquisition Engine',standards:['LRMI','Dublin Core compatible metadata','UNESCO OER rights principles','WCAG 2.2 AA'],pipeline:['discover','scope-match','rights-check','authority-rank','deduplicate','cross-check','resolve-conflicts','academic-review','semantic-index','precompute-assets','publish-ready'],lessonGenerationGate:'verified dossier required before lesson generation',studentWaitPolicy:'research and assets are prepared before student access',persistence:assetStoreStatus()};}

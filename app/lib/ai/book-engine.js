import {AI_TASKS} from './provider-registry';
import {generateJSON} from './orchestrator';
import {assetStoreStatus,loadBookPackage,saveBookPackage} from './asset-store';
import {verifyCurriculumCoverage} from './curriculum-coverage';
import {verifyMasterLessonPackage} from './master-quality-standard';

const clean=(x,n=300)=>String(x||'').trim().slice(0,n);
const allowedLicenses=new Set(['public-domain','cc0','cc-by','cc-by-sa','official-framework-reference']);
const requiredIdentity=['country','curriculumType','curriculum','authority','stage','grade','subject','language'];
const canonical=value=>{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value};
async function sha(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value))),hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}

export function verifyBookSources(input){
 const unique=new Map(),rejected=[];
 for(const source of Array.isArray(input.sources)?input.sources:[]){
  const normalized={name:clean(source.name),url:clean(source.url,1000),authorityType:clean(source.authorityType),license:clean(source.license).toLowerCase(),usage:clean(source.usage),contentHash:clean(source.contentHash),scope:source.scope||{}};
  const scopeMatches=['country','curriculum','grade','subject'].every(field=>clean(normalized.scope[field]).toLowerCase()===clean(input.identity?.[field]).toLowerCase());
  const licenseAllowed=allowedLicenses.has(normalized.license);
  const referenceOnly=normalized.license==='official-framework-reference'&&normalized.usage==='structure-and-outcomes-only';
  const reason=!normalized.url?'missing-url':!scopeMatches?'scope-mismatch':!licenseAllowed?'license-not-approved':normalized.license==='official-framework-reference'&&!referenceOnly?'official-framework-must-be-reference-only':null;
  if(reason)rejected.push({...normalized,reason});else unique.set(normalized.contentHash||normalized.url,normalized);
 }
 const accepted=[...unique.values()],hasOfficial=accepted.some(x=>['ministry','official-authority','awarding-body'].includes(x.authorityType)),hasCorroboration=accepted.some(x=>['oer','university','academic-organization'].includes(x.authorityType));
 return {accepted,rejected,passed:accepted.length>=2&&hasOfficial&&hasCorroboration,requirements:{minimumSources:2,officialFramework:hasOfficial,independentOERCorroboration:hasCorroboration},policy:'Sources establish scope and facts; generated prose must be original. Protected textbooks are never copied.'};
}

function validate(input){const errors={};for(const field of requiredIdentity)if(!clean(input.identity?.[field]))errors[`identity.${field}`]='required';if(!Array.isArray(input.baseline?.units)||!input.baseline.units.length)errors.baseline='verified official curriculum baseline required';const sourceReport=verifyBookSources(input);if(!sourceReport.passed)errors.sources='at least one official framework and one matching licensed OER/academic corroborating source are required';return {errors,sourceReport}}

export async function bookFingerprint(input,sourceReport){return sha({identity:input.identity,baseline:input.baseline,sourceHashes:sourceReport.accepted.map(x=>x.contentHash||x.url).sort(),specVersion:input.specVersion||'2026.07'})}

export async function buildBookDraft(input,{force=false}={}){
 const {errors,sourceReport}=validate(input);if(Object.keys(errors).length)throw Object.assign(new Error('BOOK_PREREQUISITES_NOT_VERIFIED'),{details:errors,sourceReport});
 const fingerprint=await bookFingerprint(input,sourceReport),store=assetStoreStatus();
 if(!force&&store.configured){const cached=await loadBookPackage(fingerprint);if(cached)return {...cached,reused:true}}
 const identity={...input.identity,id:fingerprint,fingerprint,specVersion:input.specVersion||'2026.07'};
 const prompt=`Build an ORIGINAL Success OS textbook blueprint as JSON for ${JSON.stringify(identity)}. Official verified curriculum baseline: ${JSON.stringify(input.baseline)}. Trusted source notes: ${JSON.stringify(sourceReport.accepted.map(({name,authorityType,license,usage,scope})=>({name,authorityType,license,usage,scope})))}. Match the baseline exactly without adding official claims. Do not quote or imitate textbook wording. Create age-appropriate original explanations. Return JSON only: {title,subtitle,description,tableOfContents:{units:[{title,learningOutcomes,lessons:[{title,learningOutcomes,topics,estimatedPages}]}]},frontMatter,glossaryPlan,indexPlan,teacherGuidePlan,accessibilityPlan,productionJobs:[{unit,lesson,status,requiredAssets}],qualityRisks}. Every official unit, lesson and learning outcome in the baseline must be represented verbatim only as identifiers/outcome labels where legally permitted; all teaching prose will be newly written in per-lesson jobs.`;
 const generated=await generateJSON({task:AI_TASKS.LESSON_WRITING,prompt,effort:'high',maxOutputTokens:10000,safetyIdentifier:'success-os-book-engine'});
 const draft={schema:'success-os.official-textbook.v1',designation:'Official Success OS Textbook',governmentApprovalClaim:false,identity,version:{number:'0.1.0',status:'draft',previousVersionId:input.previousVersionId||null,changeLog:input.changeLog||'Initial curriculum-aligned blueprint'},sources:sourceReport,baseline:input.baseline,tableOfContents:generated.data.tableOfContents,bookBlueprint:generated.data,lessonPackages:[],protection:{authenticatedStreaming:true,downloadDisabledByDefault:true,watermarkRequired:true,copyControls:true,policyEnforcementRequired:true},approval:{sourceRights:true,scientific:false,curriculum:false,readability:false,accessibility:false,humanAcademic:false,owner:false},publication:{eligible:false,published:false,studentPortalVisible:false,reason:'Coverage and approvals are incomplete'},generation:{provider:generated.provider,attempts:generated.attempts},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),persistence:store};
 draft.coverage=verifyCurriculumCoverage({baseline:{identity:input.identity,...input.baseline},book:draft});
 draft.masterQuality={lessonPackages:draft.lessonPackages.map(verifyMasterLessonPackage),passed:draft.lessonPackages.length>0&&draft.lessonPackages.every(item=>verifyMasterLessonPackage(item).passed)};
 draft.publication.eligible=draft.coverage.complete&&draft.masterQuality.passed&&Object.values(draft.approval).every(Boolean)&&store.configured;
 if(!draft.masterQuality.passed)draft.publication.reason='One or more complete lesson ecosystems are missing or unapproved';
 if(store.configured){const saved=await saveBookPackage(fingerprint,draft);draft.persistence={...store,...saved}}
 return draft;
}

export function bookEngineStatus(){return {engine:'SUCCESS OS Official Book Generation Engine',designationRule:'Official means approved by SUCCESS OS, not a government-issued textbook.',pipeline:['curriculum-baseline','source-rights-verification','multi-source-cross-check','book-blueprint','lesson-production-jobs','coverage-verification','academic-review','protected-publication'],licenses:[...allowedLicenses],coverageRequired:100,publicationRequires:['100% curriculum coverage','scientific approval','curriculum approval','readability approval','accessibility approval','human academic approval','owner approval','permanent asset store'],persistence:assetStoreStatus()}}

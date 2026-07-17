import fs from 'node:fs';
import {knowledgeEngineStatus,verifyResearchPacket} from '../app/lib/ai/knowledge-acquisition-engine.js';
const identity={country:'Jordan',curriculumType:'national',curriculum:'Jordan National Curriculum',authority:'NCCD',stage:'Basic',gradeOrYear:'Grade 5',subject:'Science',unit:'Environment',lesson:'Ecosystems',language:'ar'},scope={country:'Jordan',curriculum:'Jordan National Curriculum',gradeOrYear:'Grade 5',subject:'Science'};
const packet={identity,sources:[{id:'official',name:'NCCD',url:'https://www.nccd.gov.jo',authorityType:'official-authority',license:'official-framework-reference',scope},{id:'oer',name:'OpenStax',url:'https://openstax.org',authorityType:'oer',license:'cc-by',scope}],facts:[{id:'f1',statement:'An ecosystem contains interacting living and non-living components.',sourceIds:['official'],officialOutcome:true},{id:'f2',statement:'Energy and matter move through ecosystems.',sourceIds:['official','oer']}],conflicts:[]},failures=[];
if(!verifyResearchPacket(packet).passed)failures.push('Valid multi-source packet was rejected');
if(verifyResearchPacket({...packet,sources:packet.sources.slice(0,1)}).passed)failures.push('Single-source packet was accepted');
if(verifyResearchPacket({...packet,facts:[{id:'x',statement:'Unsupported claim',sourceIds:['oer']}]}).passed)failures.push('Uncorroborated claim was accepted');
const lessonEngine=fs.readFileSync('app/lib/ai/lesson-engine.js','utf8');
for(const token of ['INSUFFICIENT_VERIFIED_RESEARCH','verifyResearchPacket','researchVerified:true','verifiedResearchFacts'])if(!lessonEngine.includes(token))failures.push(`Lesson gate missing ${token}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('KNOWLEDGE ENGINE PASS',JSON.stringify(knowledgeEngineStatus()));

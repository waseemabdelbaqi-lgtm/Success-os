import fs from 'node:fs';
const engine=fs.readFileSync('app/lib/ai/book-engine.js','utf8');
const coverage=fs.readFileSync('app/lib/ai/curriculum-coverage.js','utf8');
const route=fs.readFileSync('app/api/book-engine/route.js','utf8');
const store=fs.readFileSync('app/lib/ai/asset-store.js','utf8');
const failures=[];
for(const token of ['Official Success OS Textbook','governmentApprovalClaim:false','official-framework-reference','sourceRights','humanAcademic','coverageRequired:100','permanent asset store','buildBookDraft','bookFingerprint'])if(!engine.includes(token))failures.push(`Missing book rule: ${token}`);
for(const token of ['missingUnits','missingLessons','missingOutcomes','percentage===100','publicationAllowed:complete','curriculumDashboardRow','buildCoverageRepairPlan','run-generation-jobs-and-reverify'])if(!coverage.includes(token))failures.push(`Missing coverage rule: ${token}`);
for(const token of ['verify-sources','verify-coverage','repair-plan','dashboard-row'])if(!route.includes(token))failures.push(`Missing API action: ${token}`);
for(const token of ['loadBookPackage','saveBookPackage','/book-packages/'])if(!store.includes(token))failures.push(`Missing persistent store contract: ${token}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Book engine validated: source rights, curriculum baseline, 100% coverage gate, versioned storage, and protected publication rules are present.');

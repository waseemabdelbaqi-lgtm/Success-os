/* eslint-disable no-console -- CLI */
/**
 * PHASE JO-01.4 — Educational Knowledge Graph CLI
 *
 *   node scripts/run-jordan-grade1-knowledge-graph.mjs
 *   node scripts/run-jordan-grade1-knowledge-graph.mjs --dashboard
 *   node scripts/run-jordan-grade1-knowledge-graph.mjs --search="عدد"
 *   node scripts/run-jordan-grade1-knowledge-graph.mjs --query=prerequisites --lessonId=...
 */
import {
  buildJordanKnowledgeGraphDashboard,
  queryJordanKnowledgeGraph,
  runJordanGrade1KnowledgeGraph,
} from '../app/lib/ai/jordan-grade1-knowledge-graph-engine.js';
import { KG_VERSION, KG_AI_SERVICES } from '../app/data/educational-knowledge-graph.js';

const args = process.argv.slice(2);
const get = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

console.log('PHASE JO-01.4 — SUCCESS OS EDUCATIONAL KNOWLEDGE GRAPH');
console.log(`KG v${KG_VERSION} · AI services bound: ${KG_AI_SERVICES.length}`);
console.log('Prerequisite: JO-01.2 Grade 1 ecosystem complete.');
console.log('');

if (args.includes('--dashboard')) {
  console.log(JSON.stringify(buildJordanKnowledgeGraphDashboard(), null, 2));
  process.exit(0);
}

const searchQ = get('search');
if (searchQ != null) {
  console.log(JSON.stringify(queryJordanKnowledgeGraph('search', { query: searchQ, facet: get('facet') }), null, 2));
  process.exit(0);
}

const query = get('query');
if (query) {
  const result = queryJordanKnowledgeGraph(query, {
    lessonId: get('lessonId'),
    unitId: get('unitId'),
    concept: get('concept'),
    skill: get('skill'),
    masteredConceptIds: get('mastered') ? get('mastered').split(',') : [],
    currentLessonId: get('lessonId'),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok === false ? 2 : 0);
}

try {
  const result = runJordanGrade1KnowledgeGraph();
  console.log('──────── KNOWLEDGE GRAPH ────────');
  console.log(`Nodes: ${result.totals?.nodes}`);
  console.log(`Edges: ${result.totals?.edges}`);
  console.log(`Lessons: ${result.totals?.byKind?.lesson}`);
  console.log(`Concepts: ${result.totals?.byKind?.concept}`);
  console.log(`Questions: ${result.totals?.byKind?.question}`);
  console.log(`Cross-subject links: ${result.dashboard?.crossSubjectLinks}`);
  console.log('');
  console.log('By kind (non-zero):');
  for (const [k, v] of Object.entries(result.totals?.byKind || {})) {
    if (v) console.log(`  ${k}: ${v}`);
  }
  console.log('');
  console.log(result.rule);
  process.exit(0);
} catch (e) {
  console.error(e.message);
  if (e.details) console.error(JSON.stringify(e.details, null, 2));
  process.exit(2);
}

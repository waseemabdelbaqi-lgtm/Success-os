/**
 * Educational Knowledge Graph Engine — portable graph-database core.
 *
 * Property-graph store designed for millions of educational relationships.
 * Nodes + directed edges + adjacency indexes + search + traversal queries.
 * Architecture unchanged when adding countries/curricula.
 *
 * No AI recommendation without graph consultation (assertGraphConsulted).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  KG_SCHEMA,
  KG_VERSION,
  KG_NODE_KINDS,
  KG_EDGE_TYPES,
  KG_SEARCH_FACETS,
  KG_AI_SERVICES,
  KG_CROSS_SUBJECT_AFFINITIES,
  kgSlug,
  createKgMetadata,
  validateKgMetadata,
  assertGraphConsulted,
} from '../../data/educational-knowledge-graph.js';

function list(v) {
  return Array.isArray(v) ? v : [];
}

function text(v) {
  return String(v || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function _appendJsonl(file, row) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(row)}\n`, 'utf8');
}

function ensureDirs(root) {
  for (const dir of [
    root,
    path.join(root, 'nodes'),
    ...KG_NODE_KINDS.map((k) => path.join(root, 'nodes', k)),
    path.join(root, 'edges'),
    path.join(root, 'adjacency', 'out'),
    path.join(root, 'adjacency', 'in'),
    path.join(root, 'indexes'),
    path.join(root, 'search'),
    path.join(root, 'queries'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
    path.join(root, 'visual'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function edgeId(from, type, to) {
  return `kg:edge:${kgSlug(from)}:${kgSlug(type)}:${kgSlug(to)}`.slice(0, 200);
}

function _safeFile(id) {
  return String(id || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .slice(0, 160);
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.rootDir
 * @param {() => object} config.buildGraphPayload — country/grade extract
 */
export function createEducationalKnowledgeGraph(config) {
  const { countryCode, country, rootDir, buildGraphPayload } = config;
  const phase = `${countryCode}-EDUCATIONAL-KNOWLEDGE-GRAPH`;

  function root() {
    return rootDir;
  }

  function manifestPath() {
    return path.join(root(), 'knowledge-graph.json');
  }

  function emptyGraph() {
    return {
      nodes: {},
      edges: {},
      out: {},
      in: {},
    };
  }

  function upsertNode(graph, node) {
    const id = node.globalId;
    if (!id) throw new Error('KG_NODE_MISSING_ID');
    const existing = graph.nodes[id];
    if (existing) {
      graph.nodes[id] = {
        ...existing,
        ...node,
        createdAt: existing.createdAt || node.createdAt,
        updatedAt: nowIso(),
      };
      return { id, created: false };
    }
    graph.nodes[id] = node;
    if (!graph.out[id]) graph.out[id] = [];
    if (!graph.in[id]) graph.in[id] = [];
    return { id, created: true };
  }

  function upsertEdge(graph, edge) {
    const id = edge.globalId || edgeId(edge.from, edge.type, edge.to);
    if (graph.edges[id]) return { id, created: false };
    if (!graph.nodes[edge.from] || !graph.nodes[edge.to]) {
      return { id, created: false, skipped: true, reason: 'MISSING_ENDPOINT' };
    }
    const full = { ...edge, globalId: id };
    graph.edges[id] = full;
    graph.out[edge.from] = [...list(graph.out[edge.from]), id];
    graph.in[edge.to] = [...list(graph.in[edge.to]), id];
    return { id, created: true };
  }

  function link(graph, from, type, to, meta = {}) {
    if (!KG_EDGE_TYPES.includes(type)) {
      throw new Error(`UNKNOWN_EDGE_TYPE:${type}`);
    }
    return upsertEdge(
      graph,
      createKgMetadata({
        globalId: edgeId(from, type, to),
        officialSource: meta.officialSource || null,
        verificationStatus: meta.verificationStatus || 'verified',
        confidenceScore: meta.confidenceScore ?? 0.9,
        extra: {
          kind: 'edge',
          type,
          from,
          to,
          label: meta.label || type,
          ...meta.extra,
        },
      }),
    );
  }

  function node(graph, kind, globalId, label, meta = {}) {
    if (!KG_NODE_KINDS.includes(kind)) {
      throw new Error(`UNKNOWN_NODE_KIND:${kind}`);
    }
    return upsertNode(
      graph,
      createKgMetadata({
        globalId,
        officialSource: meta.officialSource || null,
        verificationStatus: meta.verificationStatus || 'verified',
        confidenceScore: meta.confidenceScore ?? 0.92,
        extra: {
          kind: 'node',
          nodeKind: kind,
          label,
          countryCode,
          country,
          language: meta.language || 'ar',
          properties: meta.properties || {},
          searchText: [label, ...(meta.keywords || [])].filter(Boolean).join(' '),
        },
      }),
    );
  }

  /**
   * Build graph from a normalized payload.
   */
  function buildFromPayload(payload, _options = {}) {
    ensureDirs(root());
    const graph = emptyGraph();
    const stats = {
      nodesCreated: 0,
      nodesReused: 0,
      edgesCreated: 0,
      edgesSkipped: 0,
    };
    const trackN = (r) => {
      if (r.created) stats.nodesCreated += 1;
      else stats.nodesReused += 1;
    };
    const trackE = (r) => {
      if (r.skipped) stats.edgesSkipped += 1;
      else if (r.created) stats.edgesCreated += 1;
    };

    const source = payload.officialSource;
    const lang = payload.language || 'ar';

    const countryId = payload.countryId || `kg:${kgSlug(countryCode)}:country`;
    trackN(node(graph, 'country', countryId, country, { officialSource: source, language: lang }));

    const systemId = payload.systemId || `kg:${kgSlug(countryCode)}:system:national`;
    trackN(
      node(graph, 'educationalSystem', systemId, payload.educationalSystem, {
        officialSource: source,
        language: lang,
      }),
    );
    trackE(link(graph, systemId, 'belongs_to', countryId, { officialSource: source }));

    for (const grade of list(payload.grades)) {
      trackN(
        node(graph, 'grade', grade.id, grade.label, {
          officialSource: source,
          language: lang,
          properties: { gradeCode: grade.code },
        }),
      );
      trackE(link(graph, grade.id, 'belongs_to', systemId, { officialSource: source }));
      trackE(link(graph, systemId, 'contains', grade.id, { officialSource: source }));

      for (const sem of list(grade.semesters)) {
        trackN(
          node(graph, 'semester', sem.id, sem.label, {
            officialSource: source,
            language: lang,
          }),
        );
        trackE(link(graph, sem.id, 'belongs_to', grade.id, { officialSource: source }));
      }

      for (const subject of list(grade.subjects)) {
        trackN(
          node(graph, 'subject', subject.id, subject.label, {
            officialSource: source,
            language: lang,
            keywords: [subject.label],
          }),
        );
        trackE(link(graph, subject.id, 'belongs_to', grade.id, { officialSource: source }));
        trackE(link(graph, grade.id, 'contains', subject.id, { officialSource: source }));

        const conceptIndex = new Map(); // label -> id within subject for sequencing
        let prevLessonId = null;

        for (const book of list(subject.books)) {
          trackN(
            node(graph, 'book', book.id, book.label, {
              officialSource: source,
              language: lang,
              properties: { legacyBookId: book.legacyBookId || null },
            }),
          );
          trackE(link(graph, book.id, 'belongs_to', subject.id, { officialSource: source }));
          trackE(link(graph, subject.id, 'contains', book.id, { officialSource: source }));

          for (const unit of list(book.units)) {
            trackN(
              node(graph, 'unit', unit.id, unit.label, {
                officialSource: source,
                language: lang,
              }),
            );
            trackE(link(graph, unit.id, 'belongs_to', book.id, { officialSource: source }));
            trackE(link(graph, book.id, 'contains', unit.id, { officialSource: source }));

            const unitConceptIds = [];
            const unitVocabIds = [];

            for (const lesson of list(unit.lessons)) {
              trackN(
                node(graph, 'lesson', lesson.id, lesson.label, {
                  officialSource: source,
                  language: lang,
                  keywords: [lesson.label, ...(lesson.concepts || [])],
                  properties: {
                    sequence: lesson.sequence,
                    ecosystemPath: lesson.ecosystemPath || null,
                  },
                }),
              );
              trackE(link(graph, lesson.id, 'belongs_to', unit.id, { officialSource: source }));
              trackE(link(graph, unit.id, 'contains', lesson.id, { officialSource: source }));

              if (prevLessonId) {
                trackE(
                  link(graph, prevLessonId, 'next_lesson', lesson.id, {
                    officialSource: source,
                    confidenceScore: 0.95,
                  }),
                );
                trackE(
                  link(graph, lesson.id, 'previous_lesson', prevLessonId, {
                    officialSource: source,
                    confidenceScore: 0.95,
                  }),
                );
                trackE(
                  link(graph, lesson.id, 'depends_on', prevLessonId, {
                    officialSource: source,
                    confidenceScore: 0.85,
                  }),
                );
                trackE(
                  link(graph, prevLessonId, 'prerequisite_of', lesson.id, {
                    officialSource: source,
                    confidenceScore: 0.85,
                  }),
                );
              }
              prevLessonId = lesson.id;

              // Topic / subtopic
              const topicId = `${lesson.id}:topic`;
              trackN(
                node(graph, 'topic', topicId, lesson.label, {
                  officialSource: source,
                  language: lang,
                }),
              );
              trackE(link(graph, topicId, 'belongs_to', lesson.id, { officialSource: source }));

              list(lesson.subtopics || lesson.concepts?.slice(0, 3)).forEach((st, _i) => {
                const label = typeof st === 'string' ? st : st.label;
                if (!text(label)) return;
                const sid = `${topicId}:sub:${kgSlug(label)}`;
                trackN(
                  node(graph, 'subtopic', sid, label, {
                    officialSource: source,
                    language: lang,
                  }),
                );
                trackE(link(graph, sid, 'belongs_to', topicId, { officialSource: source }));
              });

              // Concepts with prerequisite chains
              const lessonConceptIds = [];
              list(lesson.concepts).forEach((c, ci) => {
                const cLabel = typeof c === 'string' ? c : c.label;
                if (!text(cLabel)) return;
                const cid =
                  conceptIndex.get(kgSlug(cLabel)) ||
                  `kg:${kgSlug(countryCode)}:concept:${kgSlug(cLabel)}`;
                if (!conceptIndex.has(kgSlug(cLabel))) {
                  trackN(
                    node(graph, 'concept', cid, cLabel, {
                      officialSource: source,
                      language: lang,
                      keywords: [cLabel],
                    }),
                  );
                  conceptIndex.set(kgSlug(cLabel), cid);
                } else {
                  trackN(
                    node(graph, 'concept', cid, cLabel, {
                      officialSource: source,
                      language: lang,
                    }),
                  );
                }
                lessonConceptIds.push(cid);
                unitConceptIds.push(cid);
                trackE(link(graph, lesson.id, 'teaches', cid, { officialSource: source }));
                trackE(link(graph, cid, 'appears_in', lesson.id, { officialSource: source }));

                // requires previous / supports future within subject order
                if (ci > 0) {
                  const prevC = lessonConceptIds[ci - 1];
                  trackE(
                    link(graph, cid, 'requires_previous', prevC, {
                      officialSource: source,
                      confidenceScore: 0.8,
                    }),
                  );
                  trackE(
                    link(graph, prevC, 'supports_future', cid, {
                      officialSource: source,
                      confidenceScore: 0.8,
                    }),
                  );
                }
              });

              // Learning outcomes
              list(lesson.learningOutcomes).forEach((o, oi) => {
                const oText = typeof o === 'string' ? o : o.text;
                if (!text(oText)) return;
                const oid = `${lesson.id}:outcome:${oi + 1}`;
                trackN(
                  node(graph, 'learningOutcome', oid, oText.slice(0, 160), {
                    officialSource: source,
                    language: lang,
                    keywords: [oText],
                    properties: { text: oText },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_outcome', oid, { officialSource: source }));
                trackE(link(graph, oid, 'belongs_to', lesson.id, { officialSource: source }));
              });

              // Skills → competency
              list(lesson.skills).forEach((s) => {
                const sLabel = typeof s === 'string' ? s : s.label;
                if (!text(sLabel)) return;
                const sid = `kg:${kgSlug(countryCode)}:skill:${kgSlug(sLabel)}`;
                trackN(
                  node(graph, 'skill', sid, sLabel, {
                    officialSource: source,
                    language: lang,
                    keywords: [sLabel],
                  }),
                );
                trackE(link(graph, lesson.id, 'has_skill', sid, { officialSource: source }));
                trackE(link(graph, sid, 'appears_in', lesson.id, { officialSource: source }));
                const compId = `kg:${kgSlug(countryCode)}:competency:${kgSlug(sLabel)}`;
                trackN(
                  node(graph, 'competency', compId, `كفاية: ${sLabel}`, {
                    officialSource: source,
                    language: lang,
                  }),
                );
                trackE(link(graph, sid, 'develops', compId, { officialSource: source }));
              });

              // Vocabulary
              list(lesson.vocabulary).forEach((v) => {
                const term = v.term || v.label || v;
                if (!text(term)) return;
                const vid = `kg:${kgSlug(countryCode)}:vocab:${kgSlug(term)}`;
                trackN(
                  node(graph, 'vocabulary', vid, text(term), {
                    officialSource: source,
                    language: lang,
                    keywords: [term],
                    properties: { definition: v.definition || v.meaning || null },
                  }),
                );
                unitVocabIds.push(vid);
                trackE(link(graph, lesson.id, 'has_vocabulary', vid, { officialSource: source }));
                trackE(link(graph, vid, 'appears_in', lesson.id, { officialSource: source }));
              });

              // Formulas / rules
              list(lesson.formulas).forEach((f, fi) => {
                const fText = typeof f === 'string' ? f : f.label || f.formula;
                if (!text(fText)) return;
                const fid = `${lesson.id}:formula:${fi + 1}`;
                trackN(
                  node(graph, 'formula', fid, text(fText).slice(0, 160), {
                    officialSource: source,
                    language: lang,
                    keywords: [fText],
                  }),
                );
                trackE(link(graph, lesson.id, 'has_formula', fid, { officialSource: source }));
              });

              list(lesson.rules).forEach((r, ri) => {
                const rText = typeof r === 'string' ? r : r.label || r.text;
                if (!text(rText)) return;
                const rid = `${lesson.id}:rule:${ri + 1}`;
                trackN(
                  node(graph, 'rule', rid, text(rText).slice(0, 160), {
                    officialSource: source,
                    language: lang,
                  }),
                );
                trackE(link(graph, lesson.id, 'has_rule', rid, { officialSource: source }));
              });

              // Experiments / activities
              list(lesson.experiments).forEach((ex, ei) => {
                const label = typeof ex === 'string' ? ex : ex.title || ex.label;
                if (!text(label)) return;
                const eid = `${lesson.id}:experiment:${ei + 1}`;
                trackN(
                  node(graph, 'experiment', eid, label, {
                    officialSource: source,
                    language: lang,
                  }),
                );
                trackE(link(graph, lesson.id, 'has_experiment', eid, { officialSource: source }));
                for (const cid of lessonConceptIds.slice(0, 2)) {
                  trackE(link(graph, eid, 'explains', cid, { officialSource: source }));
                  trackE(link(graph, eid, 'reinforces', topicId, { officialSource: source }));
                }
              });

              list(lesson.activities).forEach((act, ai) => {
                const label = typeof act === 'string' ? act : act.title || act.label;
                if (!text(label)) return;
                const aid = `${lesson.id}:activity:${ai + 1}`;
                trackN(
                  node(graph, 'activity', aid, label, {
                    officialSource: source,
                    language: lang,
                  }),
                );
                trackE(link(graph, lesson.id, 'has_activity', aid, { officialSource: source }));
              });

              // Assessments
              list(lesson.assessments).forEach((a, ai) => {
                const label = typeof a === 'string' ? a : a.title || a.label;
                if (!text(label)) return;
                const aid = `${lesson.id}:assessment:${ai + 1}`;
                trackN(
                  node(graph, 'assessment', aid, label, {
                    officialSource: source,
                    language: lang,
                    properties: { assessmentType: a.type || 'quiz' },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_assessment', aid, { officialSource: source }));
                trackE(link(graph, lesson.id, 'assessed_by', aid, { officialSource: source }));
              });

              // References
              list(lesson.references).forEach((ref, ri) => {
                const label = ref.title || ref.name || ref.url || `ref-${ri + 1}`;
                const rid = `kg:${kgSlug(countryCode)}:ref:${kgSlug(label)}`;
                trackN(
                  node(graph, 'reference', rid, text(label).slice(0, 120), {
                    officialSource: ref.url || source,
                    language: lang,
                    properties: { url: ref.url || null },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_reference', rid, { officialSource: source }));
              });

              // Teacher notes / AI video
              if (lesson.teacherNote) {
                const tid = `${lesson.id}:teacher-note`;
                trackN(
                  node(graph, 'teacherNote', tid, 'AI Teacher Notes', {
                    officialSource: source,
                    language: lang,
                    properties: { text: lesson.teacherNote },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_teacher_note', tid, { officialSource: source }));
              }

              if (lesson.aiVideo) {
                const vid = `${lesson.id}:ai-video`;
                trackN(
                  node(graph, 'aiVideo', vid, lesson.aiVideo.title || 'AI Video Lesson', {
                    officialSource: source,
                    language: lang,
                    properties: lesson.aiVideo,
                  }),
                );
                trackE(link(graph, lesson.id, 'has_ai_video', vid, { officialSource: source }));
              }

              // Misconceptions
              list(lesson.misconceptions).forEach((m, mi) => {
                const label =
                  typeof m === 'string' ? m : m.misconception || m.label || `misconception-${mi + 1}`;
                const mid = `${lesson.id}:misconception:${mi + 1}`;
                trackN(
                  node(graph, 'misconception', mid, text(label).slice(0, 160), {
                    officialSource: source,
                    language: lang,
                    properties: {
                      correction: m.correction || null,
                    },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_misconception', mid, { officialSource: source }));
              });

              // Questions + explanations
              list(lesson.questions).forEach((q, qi) => {
                const qid = q.id || `${lesson.id}:q:${qi + 1}`;
                trackN(
                  node(graph, 'question', qid, text(q.prompt || q.label).slice(0, 160), {
                    officialSource: source,
                    language: lang,
                    keywords: [q.prompt, q.concept, q.type].filter(Boolean),
                    properties: {
                      type: q.type,
                      difficulty: q.difficulty,
                      concept: q.concept || null,
                    },
                  }),
                );
                trackE(link(graph, lesson.id, 'has_question', qid, { officialSource: source }));
                trackE(link(graph, lesson.id, 'assessed_by', qid, { officialSource: source }));

                // Question measures first outcome
                const outcomes = list(lesson.learningOutcomes);
                if (outcomes.length) {
                  const oid = `${lesson.id}:outcome:1`;
                  if (graph.nodes[oid]) {
                    trackE(link(graph, qid, 'measures', oid, { officialSource: source }));
                  }
                }

                // Formula used in questions (once per lesson formulas → this question)
                if (qi < 3) {
                  for (const edgeIdKey of list(graph.out[lesson.id])) {
                    const e = graph.edges[edgeIdKey];
                    if (e?.type === 'has_formula') {
                      trackE(
                        link(graph, e.to, 'used_in', qid, {
                          officialSource: source,
                          confidenceScore: 0.75,
                        }),
                      );
                    }
                  }
                }

                if (q.explanations?.correct) {
                  const eid = `${qid}:expl:correct`;
                  trackN(
                    node(graph, 'questionExplanation', eid, 'Correct explanation', {
                      officialSource: source,
                      language: lang,
                      properties: { text: q.explanations.correct, polarity: 'correct' },
                    }),
                  );
                  trackE(link(graph, qid, 'has_explanation', eid, { officialSource: source }));
                }
                for (const [opt, expl] of Object.entries(q.explanations?.incorrect || {})) {
                  const eid = `${qid}:expl:${kgSlug(opt)}`;
                  trackN(
                    node(graph, 'questionExplanation', eid, `Incorrect: ${opt}`, {
                      officialSource: source,
                      language: lang,
                      properties: { text: expl, polarity: 'incorrect', option: opt },
                    }),
                  );
                  trackE(link(graph, qid, 'has_explanation', eid, { officialSource: source }));
                }
              });
            }

            // Unit vocabulary aggregation already via appears_in
            void unitConceptIds;
            void unitVocabIds;
          }
        }
      }
    }

    // Cross-subject connections
    const subjects = Object.values(graph.nodes).filter((n) => n.nodeKind === 'subject');
    for (const [a, b] of KG_CROSS_SUBJECT_AFFINITIES) {
      const sa = subjects.find((s) => s.label === a);
      const sb = subjects.find((s) => s.label === b);
      if (!sa || !sb) continue;
      trackE(
        link(graph, sa.globalId, 'cross_subject_related', sb.globalId, {
          officialSource: source,
          confidenceScore: 0.7,
          label: `${a} ↔ ${b}`,
        }),
      );
      trackE(
        link(graph, sb.globalId, 'cross_subject_related', sa.globalId, {
          officialSource: source,
          confidenceScore: 0.7,
          label: `${b} ↔ ${a}`,
        }),
      );

      // Share concepts / vocabulary by label overlap
      const conceptsA = neighbors(graph, sa.globalId, 'contains')
        .flatMap((bookId) => neighbors(graph, bookId, 'contains'))
        .flatMap((unitId) => neighbors(graph, unitId, 'contains'))
        .flatMap((lessonId) => neighbors(graph, lessonId, 'teaches'));
      const conceptsB = neighbors(graph, sb.globalId, 'contains')
        .flatMap((bookId) => neighbors(graph, bookId, 'contains'))
        .flatMap((unitId) => neighbors(graph, unitId, 'contains'))
        .flatMap((lessonId) => neighbors(graph, lessonId, 'teaches'));

      const labelsB = new Map(
        conceptsB.map((id) => [kgSlug(graph.nodes[id]?.label), id]).filter(([k]) => k),
      );
      for (const idA of conceptsA) {
        const key = kgSlug(graph.nodes[idA]?.label);
        const idB = labelsB.get(key);
        if (idB && idA !== idB) {
          trackE(
            link(graph, idA, 'shares_concept', idB, {
              officialSource: source,
              confidenceScore: 0.88,
            }),
          );
        } else if (idB && idA === idB) {
          // same global concept node already shared
        }
      }
    }

    return { graph, stats };
  }

  function neighbors(graph, nodeId, edgeType = null, direction = 'out') {
    const ids = direction === 'out' ? list(graph.out[nodeId]) : list(graph.in[nodeId]);
    const result = [];
    for (const eid of ids) {
      const e = graph.edges[eid];
      if (!e) continue;
      if (edgeType && e.type !== edgeType) continue;
      result.push(direction === 'out' ? e.to : e.from);
    }
    return [...new Set(result)];
  }

  function traverse(graph, startId, edgeType, { direction = 'out', depth = 8 } = {}) {
    const seen = new Set();
    const ordered = [];
    let frontier = [startId];
    for (let d = 0; d < depth && frontier.length; d += 1) {
      const next = [];
      for (const id of frontier) {
        for (const n of neighbors(graph, id, edgeType, direction)) {
          if (seen.has(n) || n === startId) continue;
          seen.add(n);
          ordered.push(n);
          next.push(n);
        }
      }
      frontier = next;
    }
    return ordered;
  }

  function persist(graph, meta) {
    ensureDirs(root());
    const builtAt = nowIso();

    // Nodes indexed by kind (compact — not one file per node at million scale)
    for (const kind of KG_NODE_KINDS) {
      const kindNodes = Object.values(graph.nodes).filter((n) => n.nodeKind === kind);
      writeJson(path.join(root(), 'nodes', kind, '_all.json'), {
        kind,
        count: kindNodes.length,
        nodes: kindNodes,
        updatedAt: builtAt,
      });
      writeJson(path.join(root(), 'indexes', `${kind}.json`), {
        kind,
        ids: kindNodes.map((n) => n.globalId),
        count: kindNodes.length,
      });
    }

    // Edges as JSONL for millions of relationships
    const edgesFile = path.join(root(), 'edges', 'edges.jsonl');
    const edgeLines = Object.values(graph.edges).map((e) => JSON.stringify(e));
    fs.writeFileSync(edgesFile, `${edgeLines.join('\n')}${edgeLines.length ? '\n' : ''}`, 'utf8');

    // Compact adjacency (single files — suitable for large graphs)
    writeJson(path.join(root(), 'adjacency', 'out.json'), graph.out);
    writeJson(path.join(root(), 'adjacency', 'in.json'), graph.in);

    const byKind = {};
    for (const kind of KG_NODE_KINDS) {
      byKind[kind] = Object.values(graph.nodes).filter((n) => n.nodeKind === kind).length;
    }

    const searchDocs = Object.values(graph.nodes).map((n) => ({
      globalId: n.globalId,
      nodeKind: n.nodeKind,
      label: n.label,
      searchText: n.searchText || n.label,
      subjectHint: null,
    }));
    writeJson(path.join(root(), 'search', 'index.json'), {
      schema: 'success-os.kg-search.v1',
      facets: KG_SEARCH_FACETS,
      documents: searchDocs,
      documentCount: searchDocs.length,
      builtAt,
    });

    const visual = buildVisualPayload(graph);
    writeJson(path.join(root(), 'visual', 'graph-view.json'), visual);

    const manifest = {
      schema: KG_SCHEMA,
      kgVersion: KG_VERSION,
      phase,
      countryCode,
      country,
      nodeKinds: KG_NODE_KINDS,
      edgeTypes: KG_EDGE_TYPES,
      aiServices: KG_AI_SERVICES,
      totals: {
        nodes: Object.keys(graph.nodes).length,
        edges: Object.keys(graph.edges).length,
        byKind,
      },
      build: meta,
      storage: {
        nodes: 'nodes/<kind>/_all.json',
        edges: 'edges/edges.jsonl',
        adjacency: 'adjacency/{out,in}.json',
        runtime: 'runtime-graph.json',
        note: 'Property-graph layout ready for millions of relationships.',
      },
      rule: 'No AI feature may generate recommendations without consulting this graph.',
      expansion: {
        unlimitedCountries: true,
        note: 'Add curricula/countries/universities/certifications as nodes — architecture unchanged.',
      },
      builtAt,
    };

    writeJson(path.join(root(), 'runtime-graph.json'), {
      nodes: graph.nodes,
      edges: graph.edges,
      out: graph.out,
      in: graph.in,
    });
    writeJson(manifestPath(), manifest);
    writeJson(path.join(root(), 'reports', `kg-${countryCode}-${Date.now()}.json`), {
      totals: manifest.totals,
      build: meta,
    });
    writeJson(path.join(root(), 'dashboards', 'latest.json'), buildDashboard(manifest, graph));

    return manifest;
  }

  function loadRuntime() {
    return readJson(path.join(root(), 'runtime-graph.json'));
  }

  function buildVisualPayload(graph) {
    // Focused visual: subjects, units, lessons, concepts (sampled for UI)
    const subjects = Object.values(graph.nodes).filter((n) => n.nodeKind === 'subject');
    const lessons = Object.values(graph.nodes).filter((n) => n.nodeKind === 'lesson');
    const concepts = Object.values(graph.nodes).filter((n) => n.nodeKind === 'concept');
    const cross = Object.values(graph.edges).filter((e) => e.type === 'cross_subject_related');

    const nodes = [
      ...subjects.map((n) => ({ id: n.globalId, label: n.label, group: 'subject' })),
      ...lessons.slice(0, 80).map((n) => ({
        id: n.globalId,
        label: n.label,
        group: 'lesson',
      })),
      ...concepts.slice(0, 40).map((n) => ({
        id: n.globalId,
        label: n.label,
        group: 'concept',
      })),
    ];
    const nodeSet = new Set(nodes.map((n) => n.id));
    const links = Object.values(graph.edges)
      .filter(
        (e) =>
          nodeSet.has(e.from) &&
          nodeSet.has(e.to) &&
          ['belongs_to', 'teaches', 'next_lesson', 'cross_subject_related', 'requires_previous'].includes(
            e.type,
          ),
      )
      .slice(0, 400)
      .map((e) => ({ source: e.from, target: e.to, type: e.type }));

    return {
      schema: 'success-os.kg-visual.v1',
      nodes,
      links,
      crossSubjectEdges: cross.length,
      note: 'Admin visualization subset — full graph in runtime-graph.json',
      builtAt: nowIso(),
    };
  }

  function buildDashboard(manifest = null, graph = null) {
    const man = manifest || readJson(manifestPath()) || { totals: { byKind: {} } };
    const g = graph || loadRuntime();
    const byKind = man.totals?.byKind || {};
    return {
      schema: 'success-os.kg-dashboard.v1',
      kgVersion: KG_VERSION,
      phase,
      countryCode,
      country,
      totalNodes: man.totals?.nodes || 0,
      totalEdges: man.totals?.edges || 0,
      lessons: byKind.lesson || 0,
      concepts: byKind.concept || 0,
      skills: byKind.skill || 0,
      questions: byKind.question || 0,
      subjects: byKind.subject || 0,
      crossSubjectLinks: g
        ? Object.values(g.edges).filter((e) => e.type === 'cross_subject_related').length
        : 0,
      aiServicesBound: KG_AI_SERVICES.length,
      rule: 'No AI recommendations without graph consultation.',
      updatedAt: nowIso(),
    };
  }

  function consultation(queryName, result) {
    const queryId = crypto.randomBytes(8).toString('hex');
    const token = {
      graphConsulted: true,
      queryId,
      queryName,
      at: nowIso(),
      kgVersion: KG_VERSION,
    };
    writeJson(path.join(root(), 'queries', `${queryId}.json`), {
      token,
      resultSummary: {
        keys: Object.keys(result || {}),
      },
    });
    return { ...result, consultation: token };
  }

  /** AI understanding queries */
  function prerequisitesForLesson(lessonId) {
    const g = loadRuntime();
    if (!g?.nodes?.[lessonId]) return consultation('prerequisitesForLesson', { ok: false, error: 'NOT_FOUND' });
    const prevLessons = traverse(g, lessonId, 'depends_on', { depth: 12 });
    const concepts = neighbors(g, lessonId, 'teaches');
    const requiredConcepts = concepts.flatMap((c) =>
      neighbors(g, c, 'requires_previous'),
    );
    return consultation('prerequisitesForLesson', {
      ok: true,
      lessonId,
      prerequisiteLessons: prevLessons.map((id) => ({ id, label: g.nodes[id]?.label })),
      requiredConcepts: [...new Set(requiredConcepts)].map((id) => ({
        id,
        label: g.nodes[id]?.label,
      })),
    });
  }

  function futureDependents(lessonId) {
    const g = loadRuntime();
    if (!g?.nodes?.[lessonId]) return consultation('futureDependents', { ok: false, error: 'NOT_FOUND' });
    const future = traverse(g, lessonId, 'prerequisite_of', { depth: 12 });
    return consultation('futureDependents', {
      ok: true,
      lessonId,
      dependentLessons: future.map((id) => ({ id, label: g.nodes[id]?.label })),
    });
  }

  function questionsForConcept(conceptIdOrLabel) {
    const g = loadRuntime();
    let conceptId = conceptIdOrLabel;
    if (!g?.nodes?.[conceptId]) {
      const hit = Object.values(g?.nodes || {}).find(
        (n) => n.nodeKind === 'concept' && kgSlug(n.label) === kgSlug(conceptIdOrLabel),
      );
      conceptId = hit?.globalId;
    }
    if (!conceptId || !g.nodes[conceptId]) {
      return consultation('questionsForConcept', { ok: false, error: 'NOT_FOUND' });
    }
    const lessons = neighbors(g, conceptId, 'appears_in');
    const questions = lessons.flatMap((lid) => neighbors(g, lid, 'has_question'));
    return consultation('questionsForConcept', {
      ok: true,
      conceptId,
      questions: [...new Set(questions)].map((id) => ({
        id,
        label: g.nodes[id]?.label,
        difficulty: g.nodes[id]?.properties?.difficulty,
      })),
    });
  }

  function vocabularyForUnit(unitId) {
    const g = loadRuntime();
    if (!g?.nodes?.[unitId]) return consultation('vocabularyForUnit', { ok: false, error: 'NOT_FOUND' });
    const lessons = neighbors(g, unitId, 'contains');
    const vocab = lessons.flatMap((lid) => neighbors(g, lid, 'has_vocabulary'));
    return consultation('vocabularyForUnit', {
      ok: true,
      unitId,
      vocabulary: [...new Set(vocab)].map((id) => ({ id, label: g.nodes[id]?.label })),
    });
  }

  function lessonsForSkill(skillIdOrLabel) {
    const g = loadRuntime();
    let skillId = skillIdOrLabel;
    if (!g?.nodes?.[skillId]) {
      const hit = Object.values(g?.nodes || {}).find(
        (n) => n.nodeKind === 'skill' && kgSlug(n.label) === kgSlug(skillIdOrLabel),
      );
      skillId = hit?.globalId;
    }
    if (!skillId) return consultation('lessonsForSkill', { ok: false, error: 'NOT_FOUND' });
    const lessons = neighbors(g, skillId, 'appears_in');
    return consultation('lessonsForSkill', {
      ok: true,
      skillId,
      lessons: lessons.map((id) => ({ id, label: g.nodes[id]?.label })),
    });
  }

  function experimentsForTopic(topicIdOrLessonId) {
    const g = loadRuntime();
    const start = g?.nodes?.[topicIdOrLessonId] ? topicIdOrLessonId : null;
    if (!start) return consultation('experimentsForTopic', { ok: false, error: 'NOT_FOUND' });
    const lessonId =
      g.nodes[start].nodeKind === 'lesson'
        ? start
        : neighbors(g, start, 'belongs_to')[0] || start;
    const experiments = neighbors(g, lessonId, 'has_experiment');
    return consultation('experimentsForTopic', {
      ok: true,
      lessonId,
      experiments: experiments.map((id) => ({ id, label: g.nodes[id]?.label })),
    });
  }

  function misconceptionsForLesson(lessonId) {
    const g = loadRuntime();
    if (!g?.nodes?.[lessonId]) return consultation('misconceptionsForLesson', { ok: false, error: 'NOT_FOUND' });
    const ids = neighbors(g, lessonId, 'has_misconception');
    return consultation('misconceptionsForLesson', {
      ok: true,
      lessonId,
      misconceptions: ids.map((id) => ({
        id,
        label: g.nodes[id]?.label,
        correction: g.nodes[id]?.properties?.correction,
      })),
    });
  }

  /** Student intelligence */
  function analyzeStudentState(masteredConceptIds = [], currentLessonId = null) {
    const g = loadRuntime();
    const mastered = new Set(masteredConceptIds);
    const missing = [];
    const weakChains = [];

    if (currentLessonId && g?.nodes?.[currentLessonId]) {
      const required = neighbors(g, currentLessonId, 'teaches').flatMap((c) =>
        neighbors(g, c, 'requires_previous'),
      );
      for (const id of required) {
        if (!mastered.has(id)) missing.push({ id, label: g.nodes[id]?.label });
      }
      const prereqLessons = neighbors(g, currentLessonId, 'depends_on');
      for (const lid of prereqLessons) {
        const concepts = neighbors(g, lid, 'teaches');
        const unmastered = concepts.filter((c) => !mastered.has(c));
        if (unmastered.length) {
          weakChains.push({
            lessonId: lid,
            label: g.nodes[lid]?.label,
            unmasteredConcepts: unmastered.map((c) => ({ id: c, label: g.nodes[c]?.label })),
          });
        }
      }
    }

    const revisionPath = missing.slice(0, 8).map((m) => ({
      conceptId: m.id,
      label: m.label,
      viaLessons: neighbors(g, m.id, 'appears_in').slice(0, 3),
    }));

    let recommendedNext = null;
    if (currentLessonId) {
      const next = neighbors(g, currentLessonId, 'next_lesson')[0];
      if (next && missing.length === 0) {
        recommendedNext = { id: next, label: g.nodes[next]?.label };
      } else if (missing.length) {
        const repairLesson = neighbors(g, missing[0].id, 'appears_in')[0];
        recommendedNext = repairLesson
          ? { id: repairLesson, label: g.nodes[repairLesson]?.label, reason: 'fill-gap' }
          : null;
      }
    }

    return consultation('analyzeStudentState', {
      ok: true,
      missingPrerequisiteConcepts: missing,
      weakKnowledgeChains: weakChains,
      learningGaps: missing,
      fastestRevisionPath: revisionPath,
      alternativeLearningPath: revisionPath.map((r) => r.viaLessons[0]).filter(Boolean),
      recommendedNextLesson: recommendedNext,
    });
  }

  function search(query, options = {}) {
    const index = readJson(path.join(root(), 'search', 'index.json'));
    if (!index) return consultation('search', { ok: false, error: 'INDEX_MISSING', results: [] });
    const q = text(query).toLowerCase();
    const facet = options.facet || null;
    const limit = Math.min(options.limit || 40, 200);
    const results = list(index.documents)
      .filter((d) => {
        if (facet && d.nodeKind !== facet && !(facet === 'keyword')) return false;
        if (facet && facet !== 'keyword' && d.nodeKind !== facet) {
          // map facet names
          const map = {
            learningOutcome: 'learningOutcome',
            concept: 'concept',
            skill: 'skill',
            question: 'question',
            formula: 'formula',
            vocabulary: 'vocabulary',
            unit: 'unit',
            lesson: 'lesson',
            book: 'book',
            subject: 'subject',
            grade: 'grade',
          };
          if (map[facet] && d.nodeKind !== map[facet]) return false;
        }
        if (!q) return true;
        return `${d.label} ${d.searchText} ${d.globalId}`.toLowerCase().includes(q);
      })
      .slice(0, limit);
    return consultation('search', { ok: true, query: q, facet, count: results.length, results });
  }

  /**
   * Gate for AI recommendation engines.
   */
  function recommendWithGraph(fnName, fn) {
    const result = fn();
    const gate = assertGraphConsulted(result.consultation);
    if (!gate.ok) return gate;
    return result;
  }

  function runBuild(options = {}) {
    if (options.dashboardOnly) {
      return { dashboard: buildDashboard() };
    }
    const payload = buildGraphPayload(options);
    const { graph, stats } = buildFromPayload(payload, options);
    const meta = {
      status: 'built',
      stats,
      source: payload.meta || {},
    };
    // Validate sample metadata
    let metaIssues = 0;
    for (const n of Object.values(graph.nodes).slice(0, 50)) {
      if (!validateKgMetadata(n).ok) metaIssues += 1;
    }
    meta.metadataSampleIssues = metaIssues;
    const manifest = persist(graph, meta);
    return {
      manifest,
      dashboard: buildDashboard(manifest, graph),
      stats,
      visual: readJson(path.join(root(), 'visual', 'graph-view.json')),
    };
  }

  return {
    countryCode,
    country,
    phase,
    root,
    KG_NODE_KINDS,
    KG_EDGE_TYPES,
    KG_AI_SERVICES,
    runBuild,
    buildDashboard,
    loadRuntime,
    search,
    prerequisitesForLesson,
    futureDependents,
    questionsForConcept,
    vocabularyForUnit,
    lessonsForSkill,
    experimentsForTopic,
    misconceptionsForLesson,
    analyzeStudentState,
    recommendWithGraph,
    assertGraphConsulted,
    readManifest: () => readJson(manifestPath()),
    readVisual: () => readJson(path.join(root(), 'visual', 'graph-view.json')),
  };
}

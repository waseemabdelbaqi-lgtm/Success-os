/**
 * National Education Registry Engine — portable master-database core.
 *
 * Registers educational entities with immutable Global IDs.
 * Does NOT generate educational content.
 * Architecture supports unlimited countries without schema redesign.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  REGISTRY_SCHEMA,
  REGISTRY_VERSION,
  REGISTRY_ENTITY_KINDS,
  REGISTRY_SEARCH_FACETS,
  REGISTRY_PARENT_RULES,
  SEQUENTIAL_ID_KINDS,
  registrySlug,
  registryCountryPrefix,
  gradeCodeFromLabel,
  subjectCodeFromLabel,
  padSeq,
  buildStructuralId,
  createRegistryMetadata,
  validateRegistryMetadata,
} from '../../data/national-education-registry.js';

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

function ensureDirs(root) {
  for (const dir of [
    root,
    path.join(root, 'entities'),
    ...REGISTRY_ENTITY_KINDS.map((k) => path.join(root, 'entities', k)),
    path.join(root, 'indexes'),
    path.join(root, 'search'),
    path.join(root, 'validation'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
    path.join(root, 'id-maps'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function hasContent(value) {
  if (value == null) return false;
  if (typeof value === 'string') return text(value).length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.rootDir — shared registry root (all countries)
 * @param {() => object} config.buildCountryPayload
 */
export function createNationalEducationRegistry(config) {
  const { countryCode, country, rootDir, buildCountryPayload } = config;
  const prefix = registryCountryPrefix(countryCode);
  const phase = `${prefix}-NATIONAL-EDUCATION-REGISTRY`;

  function root() {
    return rootDir;
  }

  function registryPath() {
    return path.join(root(), 'national-education-registry.json');
  }

  function idMapPath() {
    return path.join(root(), 'id-maps', `${prefix}.json`);
  }

  function readIdMap() {
    return (
      readJson(idMapPath()) || {
        prefix,
        counters: {},
        keyToId: {},
        idToKey: {},
        updatedAt: null,
      }
    );
  }

  function writeIdMap(map) {
    map.updatedAt = nowIso();
    writeJson(idMapPath(), map);
  }

  /**
   * Immutable ID allocation.
   * Once a stableKey maps to a Global ID, it never changes.
   * Sequential numbers are never reused.
   */
  function allocateId(idMap, { kind, stableKey, structuralParts = null }) {
    const key = `${kind}::${stableKey}`;
    if (idMap.keyToId[key]) {
      return { globalId: idMap.keyToId[key], created: false };
    }

    let globalId;
    if (structuralParts) {
      globalId = buildStructuralId(prefix, structuralParts);
    } else {
      const token = SEQUENTIAL_ID_KINDS[kind] || kind.toUpperCase();
      const next = (idMap.counters[token] || 0) + 1;
      // Never reuse: counters only increase
      idMap.counters[token] = next;
      globalId = `${prefix}-${token}-${padSeq(next)}`;
    }

    // Collision guard — IDs can never be reused for a different key
    if (idMap.idToKey[globalId] && idMap.idToKey[globalId] !== key) {
      throw new Error(`ID_COLLISION:${globalId}`);
    }

    idMap.keyToId[key] = globalId;
    idMap.idToKey[globalId] = key;
    return { globalId, created: true };
  }

  function emptyStores() {
    const stores = {};
    for (const kind of REGISTRY_ENTITY_KINDS) stores[kind] = {};
    return stores;
  }

  function upsert(stores, entity) {
    const id = entity.globalId;
    if (!id) throw new Error(`REGISTRY_MISSING_ID:${entity.kind}`);
    const existing = stores[entity.kind][id];
    if (existing) {
      stores[entity.kind][id] = {
        ...existing,
        ...entity,
        createdAt: existing.createdAt || entity.createdAt,
        updatedAt: nowIso(),
        _deduped: true,
      };
      return { id, created: false };
    }
    stores[entity.kind][id] = entity;
    return { id, created: true };
  }

  function registerCountry(stores, idMap, payload) {
    const key = `country::${prefix}`;
    if (!idMap.keyToId[key]) {
      idMap.keyToId[key] = prefix;
      idMap.idToKey[prefix] = key;
    }
    const finalId = idMap.keyToId[key];

    upsert(stores, createRegistryMetadata({
      globalId: finalId,
      kind: 'country',
      countryCode: prefix,
      country,
      label: country,
      language: payload.language || 'ar',
      relationships: { childrenKinds: ['educationalSystem'] },
      extra: {
        nameAr: payload.countryAr || country,
        isoCode: countryCode,
      },
    }));
    return finalId;
  }

  function registerFromPayload(payload, options = {}) {
    ensureDirs(root());
    const idMap = options.resetIds ? {
      prefix,
      counters: {},
      keyToId: {},
      idToKey: {},
      updatedAt: null,
    } : readIdMap();

    const prior = options.merge === false ? null : readJson(registryPath());
    const stores = emptyStores();

    // Preserve other countries' entities
    if (prior?.entities) {
      for (const kind of REGISTRY_ENTITY_KINDS) {
        for (const [id, entity] of Object.entries(prior.entities[kind] || {})) {
          if (entity.countryCode && entity.countryCode !== prefix) {
            stores[kind][id] = entity;
          }
        }
      }
    }

    const stats = {
      created: Object.fromEntries(REGISTRY_ENTITY_KINDS.map((k) => [k, 0])),
      reused: Object.fromEntries(REGISTRY_ENTITY_KINDS.map((k) => [k, 0])),
    };
    const track = (kind, result) => {
      if (result.created) stats.created[kind] += 1;
      else stats.reused[kind] += 1;
    };

    const countryId = registerCountry(stores, idMap, payload);
    track('country', { created: !prior?.entities?.country?.[countryId] });

    const systemLabel = payload.educationalSystem || `${country} National Curriculum`;
    const systemKey = registrySlug(payload.systemKey || 'national');
    const sysAlloc = allocateId(idMap, {
      kind: 'educationalSystem',
      stableKey: systemKey,
    });
    track(
      'educationalSystem',
      upsert(stores, createRegistryMetadata({
        globalId: sysAlloc.globalId,
        kind: 'educationalSystem',
        countryCode: prefix,
        country,
        label: systemLabel,
        language: payload.language || 'ar',
        parentId: countryId,
        relationships: {
          countryId,
          belongsTo: countryId,
        },
        extra: { systemKey, systemType: payload.systemType || 'national' },
      })),
    );

    const yearLabel = payload.academicYear || '2025-2026';
    const yearAlloc = allocateId(idMap, {
      kind: 'academicYear',
      stableKey: registrySlug(yearLabel),
    });
    track(
      'academicYear',
      upsert(stores, createRegistryMetadata({
        globalId: yearAlloc.globalId,
        kind: 'academicYear',
        countryCode: prefix,
        country,
        label: yearLabel,
        language: payload.language || 'ar',
        parentId: sysAlloc.globalId,
        relationships: {
          educationalSystemId: sysAlloc.globalId,
          belongsTo: sysAlloc.globalId,
        },
      })),
    );

    // Dedup helpers for sequential entities
    const conceptIdsByKey = new Map();
    const skillIdsByKey = new Map();
    const vocabIdsByKey = new Map();
    const refIdsByKey = new Map();

    for (const book of list(payload.books)) {
      const gradeLabel = book.grade || book.gradeKey;
      const subjectLabel = book.subject || book.subjectKey;
      const gCode = gradeCodeFromLabel(gradeLabel);
      const sCode = subjectCodeFromLabel(subjectLabel);
      const lang = book.language || payload.language || 'ar';

      const gradeAlloc = allocateId(idMap, {
        kind: 'grade',
        stableKey: gCode,
        structuralParts: [gCode],
      });
      track(
        'grade',
        upsert(stores, createRegistryMetadata({
          globalId: gradeAlloc.globalId,
          kind: 'grade',
          countryCode: prefix,
          country,
          label: gradeLabel,
          language: lang,
          parentId: sysAlloc.globalId,
          relationships: {
            educationalSystemId: sysAlloc.globalId,
            countryId,
            belongsTo: sysAlloc.globalId,
            academicYearId: yearAlloc.globalId,
          },
          extra: { gradeCode: gCode },
        })),
      );

      for (const sem of list(book.semesters).length
        ? book.semesters
        : ['الفصل الأول', 'الفصل الثاني']) {
        const semKey = `${gCode}::${registrySlug(sem)}`;
        const semAlloc = allocateId(idMap, {
          kind: 'semester',
          stableKey: semKey,
        });
        track(
          'semester',
          upsert(stores, createRegistryMetadata({
            globalId: semAlloc.globalId,
            kind: 'semester',
            countryCode: prefix,
            country,
            label: sem,
            language: lang,
            parentId: gradeAlloc.globalId,
            relationships: {
              gradeId: gradeAlloc.globalId,
              belongsTo: gradeAlloc.globalId,
            },
          })),
        );
      }

      const subjectAlloc = allocateId(idMap, {
        kind: 'subject',
        stableKey: `${gCode}::${sCode}`,
        structuralParts: [gCode, sCode],
      });
      track(
        'subject',
        upsert(stores, createRegistryMetadata({
          globalId: subjectAlloc.globalId,
          kind: 'subject',
          countryCode: prefix,
          country,
          label: subjectLabel,
          language: lang,
          parentId: gradeAlloc.globalId,
          relationships: {
            gradeId: gradeAlloc.globalId,
            educationalSystemId: sysAlloc.globalId,
            countryId,
            belongsTo: gradeAlloc.globalId,
          },
          extra: { subjectCode: sCode, gradeCode: gCode },
        })),
      );

      const bookStable = `${gCode}::${sCode}::${lang}::${registrySlug(book.legacyBookId || book.title || 'book')}`;
      const bookAlloc = allocateId(idMap, {
        kind: 'book',
        stableKey: bookStable,
      });
      track(
        'book',
        upsert(stores, createRegistryMetadata({
          globalId: bookAlloc.globalId,
          kind: 'book',
          countryCode: prefix,
          country,
          label: book.title || `Success OS — ${subjectLabel}`,
          language: lang,
          parentId: subjectAlloc.globalId,
          relationships: {
            subjectId: subjectAlloc.globalId,
            gradeId: gradeAlloc.globalId,
            belongsTo: subjectAlloc.globalId,
          },
          extra: {
            legacyBookId: book.legacyBookId || book.bookId || null,
            officialSource: book.officialSource || payload.officialSource || null,
          },
        })),
      );

      list(book.units).forEach((unit, ui) => {
        const uNum = String(ui + 1).padStart(2, '0');
        const unitAlloc = allocateId(idMap, {
          kind: 'unit',
          stableKey: `${gCode}::${sCode}::U${uNum}`,
          structuralParts: [gCode, sCode, `U${uNum}`],
        });
        track(
          'unit',
          upsert(stores, createRegistryMetadata({
            globalId: unitAlloc.globalId,
            kind: 'unit',
            countryCode: prefix,
            country,
            label: unit.title || `Unit ${ui + 1}`,
            language: lang,
            parentId: bookAlloc.globalId,
            relationships: {
              bookId: bookAlloc.globalId,
              subjectId: subjectAlloc.globalId,
              gradeId: gradeAlloc.globalId,
              belongsTo: bookAlloc.globalId,
            },
            extra: {
              unitCode: `U${uNum}`,
              sequence: ui + 1,
              legacyUnitId: unit.unitId || unit.id || null,
            },
          })),
        );

        list(unit.lessons).forEach((lesson, li) => {
          const lNum = String(li + 1).padStart(2, '0');
          const lessonAlloc = allocateId(idMap, {
            kind: 'lesson',
            stableKey: `${gCode}::${sCode}::U${uNum}::L${lNum}`,
            structuralParts: [gCode, sCode, `U${uNum}`, `L${lNum}`],
          });
          const lessonId = lessonAlloc.globalId;
          track(
            'lesson',
            upsert(stores, createRegistryMetadata({
              globalId: lessonId,
              kind: 'lesson',
              countryCode: prefix,
              country,
              label: lesson.title || `Lesson ${li + 1}`,
              language: lang,
              parentId: unitAlloc.globalId,
              relationships: {
                unitId: unitAlloc.globalId,
                bookId: bookAlloc.globalId,
                subjectId: subjectAlloc.globalId,
                gradeId: gradeAlloc.globalId,
                belongsTo: unitAlloc.globalId,
              },
              extra: {
                lessonCode: `L${lNum}`,
                sequence: li + 1,
                legacyLessonId: lesson.lessonId || lesson.id || null,
                keywords: list(lesson.keyConcepts).map(text).filter(Boolean),
              },
            })),
          );

          // Learning outcomes
          const outcomes = list(lesson.learningOutcomes || lesson.outcomes);
          const outcomeIds = [];
          outcomes.forEach((outcome, oi) => {
            const oText = typeof outcome === 'string' ? outcome : outcome.text;
            if (!text(oText)) return;
            const oKey = registrySlug(oText).slice(0, 48);
            const oAlloc = allocateId(idMap, {
              kind: 'learningOutcome',
              stableKey: `${lessonId}::${oKey}`,
            });
            outcomeIds.push(oAlloc.globalId);
            track(
              'learningOutcome',
              upsert(stores, createRegistryMetadata({
                globalId: oAlloc.globalId,
                kind: 'learningOutcome',
                countryCode: prefix,
                country,
                label: oText.slice(0, 200),
                language: lang,
                parentId: lessonId,
                relationships: {
                  lessonId,
                  belongsTo: lessonId,
                },
                extra: { text: oText, sequence: oi + 1 },
              })),
            );
          });

          // Skills — belong to learning outcomes (and lesson)
          const skills = list(lesson.skills || lesson.skillsGained);
          skills.forEach((skill) => {
            const sText = typeof skill === 'string' ? skill : skill.label;
            if (!text(sText)) return;
            const sKey = registrySlug(sText);
            let skillId = skillIdsByKey.get(sKey);
            if (!skillId) {
              const sAlloc = allocateId(idMap, {
                kind: 'skill',
                stableKey: sKey,
              });
              skillId = sAlloc.globalId;
              skillIdsByKey.set(sKey, skillId);
              const primaryOutcome = outcomeIds[0] || null;
              track(
                'skill',
                upsert(stores, createRegistryMetadata({
                  globalId: skillId,
                  kind: 'skill',
                  countryCode: prefix,
                  country,
                  label: sText,
                  language: lang,
                  parentId: primaryOutcome || lessonId,
                  relationships: {
                    learningOutcomeIds: outcomeIds.slice(),
                    lessonIds: [lessonId],
                    belongsTo: primaryOutcome || lessonId,
                  },
                })),
              );
            } else {
              const existing = stores.skill[skillId];
              if (existing) {
                existing.relationships.lessonIds = [
                  ...new Set([...(existing.relationships.lessonIds || []), lessonId]),
                ];
                existing.relationships.learningOutcomeIds = [
                  ...new Set([
                    ...(existing.relationships.learningOutcomeIds || []),
                    ...outcomeIds,
                  ]),
                ];
                existing.updatedAt = nowIso();
                track('skill', { created: false });
              }
            }
          });

          // Concepts
          for (const concept of list(
            lesson.concepts || lesson.keyConcepts || lesson.scientificConcepts,
          )) {
            const cText = typeof concept === 'string' ? concept : concept.term || concept.label;
            if (!text(cText)) continue;
            const cKey = registrySlug(cText);
            let conceptId = conceptIdsByKey.get(cKey);
            if (!conceptId) {
              const cAlloc = allocateId(idMap, {
                kind: 'concept',
                stableKey: cKey,
              });
              conceptId = cAlloc.globalId;
              conceptIdsByKey.set(cKey, conceptId);
              track(
                'concept',
                upsert(stores, createRegistryMetadata({
                  globalId: conceptId,
                  kind: 'concept',
                  countryCode: prefix,
                  country,
                  label: cText,
                  language: lang,
                  parentId: lessonId,
                  relationships: {
                    lessonIds: [lessonId],
                    belongsTo: lessonId,
                  },
                })),
              );
            } else {
              const existing = stores.concept[conceptId];
              if (existing) {
                existing.relationships.lessonIds = [
                  ...new Set([...(existing.relationships.lessonIds || []), lessonId]),
                ];
                existing.updatedAt = nowIso();
                track('concept', { created: false });
              }
            }
          }

          // Vocabulary
          for (const vocab of list(lesson.vocabulary || lesson.definitions)) {
            const term = vocab.term || vocab.label || vocab;
            if (!text(term)) continue;
            const vKey = `${lang}::${registrySlug(term)}`;
            let vocabId = vocabIdsByKey.get(vKey);
            if (!vocabId) {
              const vAlloc = allocateId(idMap, {
                kind: 'vocabulary',
                stableKey: vKey,
              });
              vocabId = vAlloc.globalId;
              vocabIdsByKey.set(vKey, vocabId);
              track(
                'vocabulary',
                upsert(stores, createRegistryMetadata({
                  globalId: vocabId,
                  kind: 'vocabulary',
                  countryCode: prefix,
                  country,
                  label: text(term),
                  language: lang,
                  parentId: lessonId,
                  relationships: {
                    lessonIds: [lessonId],
                    belongsTo: lessonId,
                  },
                  extra: {
                    term: text(term),
                    definition: vocab.definition || vocab.definitionAr || vocab.meaning || null,
                  },
                })),
              );
            } else {
              const existing = stores.vocabulary[vocabId];
              if (existing) {
                existing.relationships.lessonIds = [
                  ...new Set([...(existing.relationships.lessonIds || []), lessonId]),
                ];
                existing.updatedAt = nowIso();
                track('vocabulary', { created: false });
              }
            }
          }

          // Scientific laws (from rulesLawsFormulas that look like laws)
          for (const rule of list(lesson.rulesLawsFormulas || lesson.laws)) {
            const rText = typeof rule === 'string' ? rule : rule.label || rule.text || rule.name;
            if (!text(rText)) continue;
            const isLaw = /قانون|law|مبدأ|principle/i.test(rText) || rule?.type === 'law';
            if (!isLaw) continue;
            const lawAlloc = allocateId(idMap, {
              kind: 'scientificLaw',
              stableKey: `${lessonId}::${registrySlug(rText).slice(0, 40)}`,
            });
            track(
              'scientificLaw',
              upsert(stores, createRegistryMetadata({
                globalId: lawAlloc.globalId,
                kind: 'scientificLaw',
                countryCode: prefix,
                country,
                label: text(rText).slice(0, 200),
                language: lang,
                parentId: lessonId,
                relationships: { lessonId, belongsTo: lessonId },
              })),
            );
          }

          // Mathematical formulas
          for (const formula of list(
            lesson.formulas ||
              lesson.formulasVerified ||
              list(lesson.rulesLawsFormulas).filter((r) => {
                const t = typeof r === 'string' ? r : r?.label || r?.text || '';
                return /=|صيغ|formula|معادل/i.test(t) || r?.type === 'formula';
              }),
          )) {
            const fText = typeof formula === 'string' ? formula : formula.label || formula.text || formula.formula;
            if (!text(fText)) continue;
            const fAlloc = allocateId(idMap, {
              kind: 'mathematicalFormula',
              stableKey: `${lessonId}::${registrySlug(fText).slice(0, 40)}`,
            });
            track(
              'mathematicalFormula',
              upsert(stores, createRegistryMetadata({
                globalId: fAlloc.globalId,
                kind: 'mathematicalFormula',
                countryCode: prefix,
                country,
                label: text(fText).slice(0, 200),
                language: lang,
                parentId: lessonId,
                relationships: { lessonId, belongsTo: lessonId },
                extra: { formula: text(fText) },
              })),
            );
          }

          // Laboratory activities
          for (const lab of list(lesson.laboratoryActivities || lesson.labs || lesson.experiments)) {
            const labText = typeof lab === 'string' ? lab : lab.title || lab.label;
            if (!text(labText)) continue;
            const labAlloc = allocateId(idMap, {
              kind: 'laboratoryActivity',
              stableKey: `${lessonId}::${registrySlug(labText).slice(0, 40)}`,
            });
            track(
              'laboratoryActivity',
              upsert(stores, createRegistryMetadata({
                globalId: labAlloc.globalId,
                kind: 'laboratoryActivity',
                countryCode: prefix,
                country,
                label: text(labText),
                language: lang,
                parentId: lessonId,
                relationships: { lessonId, belongsTo: lessonId },
              })),
            );
          }

          // Educational images
          for (const img of list(lesson.illustrations || lesson.images || lesson.educationalImages)) {
            const imgLabel = typeof img === 'string' ? img : img.title || img.alt || img.src || 'image';
            if (!text(imgLabel)) continue;
            const imgAlloc = allocateId(idMap, {
              kind: 'educationalImage',
              stableKey: `${lessonId}::${registrySlug(imgLabel).slice(0, 40)}`,
            });
            track(
              'educationalImage',
              upsert(stores, createRegistryMetadata({
                globalId: imgAlloc.globalId,
                kind: 'educationalImage',
                countryCode: prefix,
                country,
                label: text(imgLabel).slice(0, 200),
                language: lang,
                parentId: lessonId,
                relationships: { lessonId, belongsTo: lessonId },
                extra: {
                  src: typeof img === 'object' ? img.src || img.url || null : null,
                },
              })),
            );
          }

          // Diagrams
          for (const diagram of list(lesson.diagrams || lesson.visualRecommendations)) {
            const dLabel = typeof diagram === 'string'
              ? diagram
              : diagram.title || diagram.description || diagram.type || 'diagram';
            if (!text(dLabel)) continue;
            const dAlloc = allocateId(idMap, {
              kind: 'diagram',
              stableKey: `${lessonId}::${registrySlug(dLabel).slice(0, 40)}`,
            });
            track(
              'diagram',
              upsert(stores, createRegistryMetadata({
                globalId: dAlloc.globalId,
                kind: 'diagram',
                countryCode: prefix,
                country,
                label: text(dLabel).slice(0, 200),
                language: lang,
                parentId: lessonId,
                relationships: { lessonId, belongsTo: lessonId },
              })),
            );
          }

          // Lesson-level references
          for (const ref of list(lesson.references)) {
            const refKey = ref.url || ref.name || ref.title || ref.sourceId;
            if (!text(refKey)) continue;
            const rStable = registrySlug(refKey);
            let refId = refIdsByKey.get(rStable);
            if (!refId) {
              const rAlloc = allocateId(idMap, {
                kind: 'reference',
                stableKey: rStable,
              });
              refId = rAlloc.globalId;
              refIdsByKey.set(rStable, refId);
              track(
                'reference',
                upsert(stores, createRegistryMetadata({
                  globalId: refId,
                  kind: 'reference',
                  countryCode: prefix,
                  country,
                  label: ref.title || ref.name || text(refKey).slice(0, 120),
                  language: lang,
                  parentId: lessonId,
                  relationships: {
                    lessonIds: [lessonId],
                    belongsTo: lessonId,
                  },
                  extra: {
                    url: ref.url || ref.officialUrl || null,
                    publisher: ref.publisher || null,
                  },
                })),
              );
            } else {
              const existing = stores.reference[refId];
              if (existing) {
                existing.relationships.lessonIds = [
                  ...new Set([...(existing.relationships.lessonIds || []), lessonId]),
                ];
                existing.updatedAt = nowIso();
                track('reference', { created: false });
              }
            }
          }
        });
      });
    }

    // Global / library references (JO-05 etc.)
    for (const ref of list(payload.references)) {
      const refKey = ref.sourceId || ref.url || ref.title;
      if (!text(refKey)) continue;
      const rStable = registrySlug(refKey);
      if (refIdsByKey.has(rStable) || stores.reference[idMap.keyToId[`reference::${rStable}`]]) {
        track('reference', { created: false });
        continue;
      }
      const rAlloc = allocateId(idMap, {
        kind: 'reference',
        stableKey: rStable,
      });
      refIdsByKey.set(rStable, rAlloc.globalId);
      track(
        'reference',
        upsert(stores, createRegistryMetadata({
          globalId: rAlloc.globalId,
          kind: 'reference',
          countryCode: prefix,
          country,
          label: ref.title || ref.name || text(refKey).slice(0, 120),
          language: ref.language || payload.language || 'ar',
          parentId: sysAlloc.globalId,
          relationships: {
            educationalSystemId: sysAlloc.globalId,
            lessonIds: [],
            belongsTo: sysAlloc.globalId,
          },
          extra: {
            url: ref.url || ref.officialUrl || null,
            publisher: ref.publisher || null,
            category: ref.category || null,
            legacySourceId: ref.sourceId || null,
          },
        })),
      );
    }

    writeIdMap(idMap);
    return { stores, stats, idMap, countryId, systemId: sysAlloc.globalId };
  }

  function validateStores(stores) {
    const issues = [];
    const allIds = new Set();
    let checked = 0;

    for (const kind of REGISTRY_ENTITY_KINDS) {
      const labelIndex = new Map();
      for (const entity of Object.values(stores[kind] || {})) {
        if (entity.countryCode && entity.countryCode !== prefix) continue;
        checked += 1;

        if (allIds.has(entity.globalId)) {
          issues.push({ code: 'DUPLICATE_ID', kind, id: entity.globalId });
        }
        allIds.add(entity.globalId);

        const meta = validateRegistryMetadata(entity);
        if (!meta.ok) {
          issues.push({
            code: 'MISSING_METADATA',
            kind,
            id: entity.globalId,
            missing: meta.missing,
          });
        }

        // Duplicate lessons / units by structural path label within parent
        if (kind === 'lesson' || kind === 'unit') {
          const parent = entity.parentId || entity.relationships?.belongsTo;
          const dupKey = `${parent}::${registrySlug(entity.label)}`;
          if (labelIndex.has(dupKey)) {
            issues.push({
              code: kind === 'lesson' ? 'DUPLICATE_LESSON' : 'DUPLICATE_UNIT',
              ids: [labelIndex.get(dupKey), entity.globalId],
              label: entity.label,
            });
          } else labelIndex.set(dupKey, entity.globalId);
        }

        // Broken relationships
        const parentKind = REGISTRY_PARENT_RULES[kind];
        if (parentKind && entity.parentId) {
          const parentExists =
            stores[parentKind]?.[entity.parentId] ||
            // skills may parent to learningOutcome OR lesson
            (kind === 'skill' &&
              (stores.learningOutcome?.[entity.parentId] ||
                stores.lesson?.[entity.parentId])) ||
            (kind === 'reference' &&
              (stores.lesson?.[entity.parentId] ||
                stores.educationalSystem?.[entity.parentId]));
          if (!parentExists) {
            // Also search all kinds for parent id
            const found = REGISTRY_ENTITY_KINDS.some((k) => stores[k]?.[entity.parentId]);
            if (!found) {
              issues.push({
                code: 'BROKEN_RELATIONSHIP',
                kind,
                id: entity.globalId,
                parentId: entity.parentId,
                expectedParentKind: parentKind,
              });
            }
          }
        }

        // Invalid references (missing URL when kind is reference and claimed official)
        if (kind === 'reference') {
          const url = entity.extra?.url || entity.url;
          if (url && !/^https?:\/\//i.test(String(url)) && !String(url).startsWith('/')) {
            issues.push({
              code: 'INVALID_REFERENCE',
              id: entity.globalId,
              url,
            });
          }
        }
      }
    }

    const hard = issues.filter((i) =>
      [
        'DUPLICATE_ID',
        'DUPLICATE_LESSON',
        'DUPLICATE_UNIT',
        'BROKEN_RELATIONSHIP',
        'MISSING_METADATA',
        'INVALID_REFERENCE',
      ].includes(i.code),
    );

    return {
      ok: hard.length === 0,
      checked,
      issueCount: issues.length,
      issues: issues.slice(0, 100),
      missingRelationships: issues.filter((i) => i.code === 'BROKEN_RELATIONSHIP').length,
      validationErrors: hard.length,
    };
  }

  function buildSearchIndex(stores) {
    const docs = [];
    const push = (entity, facets = {}) => {
      docs.push({
        globalId: entity.globalId,
        kind: entity.kind,
        label: entity.label,
        countryCode: entity.countryCode,
        language: entity.language,
        gradeId: entity.relationships?.gradeId || null,
        subjectId: entity.relationships?.subjectId || null,
        lessonId:
          entity.kind === 'lesson'
            ? entity.globalId
            : entity.relationships?.lessonId ||
              list(entity.relationships?.lessonIds)[0] ||
              null,
        keywords: [
          entity.label,
          ...(entity.extra?.keywords || []),
          entity.extra?.term,
          entity.extra?.formula,
          entity.extra?.text,
        ]
          .map(text)
          .filter(Boolean),
        facets,
      });
    };

    for (const entity of Object.values(stores.grade || {})) {
      if (entity.countryCode === prefix) push(entity, { grade: true });
    }
    for (const entity of Object.values(stores.subject || {})) {
      if (entity.countryCode === prefix) push(entity, { subject: true });
    }
    for (const entity of Object.values(stores.lesson || {})) {
      if (entity.countryCode === prefix) push(entity, { lesson: true, keyword: true });
    }
    for (const entity of Object.values(stores.learningOutcome || {})) {
      if (entity.countryCode === prefix) push(entity, { learningOutcome: true, keyword: true });
    }
    for (const entity of Object.values(stores.skill || {})) {
      if (entity.countryCode === prefix) push(entity, { skill: true });
    }
    for (const entity of Object.values(stores.concept || {})) {
      if (entity.countryCode === prefix) push(entity, { concept: true, keyword: true });
    }
    for (const entity of Object.values(stores.vocabulary || {})) {
      if (entity.countryCode === prefix) {
        push(entity, { vocabulary: true, scientificTerm: true, keyword: true });
      }
    }
    for (const entity of Object.values(stores.mathematicalFormula || {})) {
      if (entity.countryCode === prefix) push(entity, { formula: true, keyword: true });
    }
    for (const entity of Object.values(stores.scientificLaw || {})) {
      if (entity.countryCode === prefix) push(entity, { scientificTerm: true, keyword: true });
    }

    return {
      schema: 'success-os.registry-search-index.v1',
      facets: REGISTRY_SEARCH_FACETS,
      documentCount: docs.length,
      documents: docs,
      builtAt: nowIso(),
    };
  }

  function search(query, options = {}) {
    const index = readJson(path.join(root(), 'search', 'index.json'));
    if (!index) return { ok: false, error: 'INDEX_MISSING', results: [] };
    const q = text(query).toLowerCase();
    const facet = options.facet || null;
    const gradeId = options.gradeId || null;
    const subjectId = options.subjectId || null;
    const limit = Math.min(options.limit || 40, 200);

    const results = list(index.documents)
      .filter((doc) => {
        if (doc.countryCode && doc.countryCode !== prefix && options.countryOnly !== false) {
          // allow cross-country if explicitly requested
        }
        if (options.countryOnly !== false && doc.countryCode !== prefix) return false;
        if (facet && !doc.facets?.[facet]) return false;
        if (gradeId && doc.gradeId !== gradeId) return false;
        if (subjectId && doc.subjectId !== subjectId) return false;
        if (!q) return true;
        const hay = [doc.label, doc.globalId, ...(doc.keywords || [])]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, limit);

    return {
      ok: true,
      query: q,
      facet,
      count: results.length,
      results,
    };
  }

  function counts(stores, onlyCountry = true) {
    const out = {};
    for (const kind of REGISTRY_ENTITY_KINDS) {
      const values = Object.values(stores[kind] || {});
      out[kind] = onlyCountry
        ? values.filter((e) => !e.countryCode || e.countryCode === prefix).length
        : values.length;
    }
    return out;
  }

  function persist(stores, meta) {
    ensureDirs(root());
    const builtAt = nowIso();

    for (const kind of REGISTRY_ENTITY_KINDS) {
      for (const entity of Object.values(stores[kind] || {})) {
        const file = path.join(
          root(),
          'entities',
          kind,
          `${String(entity.globalId).replace(/[<>:"/\\|?*]/g, '_').slice(0, 120)}.json`,
        );
        writeJson(file, entity);
      }
      writeJson(path.join(root(), 'indexes', `${kind}.json`), {
        kind,
        ids: Object.keys(stores[kind] || {}),
        count: Object.keys(stores[kind] || {}).length,
        updatedAt: builtAt,
      });
    }

    const searchIndex = buildSearchIndex(stores);
    writeJson(path.join(root(), 'search', 'index.json'), searchIndex);

    const registry = {
      schema: REGISTRY_SCHEMA,
      registryVersion: REGISTRY_VERSION,
      phase,
      entityKinds: REGISTRY_ENTITY_KINDS,
      searchFacets: REGISTRY_SEARCH_FACETS,
      entities: Object.fromEntries(REGISTRY_ENTITY_KINDS.map((k) => [k, stores[k]])),
      countries: [...new Set(Object.values(stores.country || {}).map((c) => c.countryCode))],
      totals: counts(stores, false),
      countryTotals: { [prefix]: counts(stores, true) },
      registration: meta.registration,
      validation: meta.validation,
      searchDocumentCount: searchIndex.documentCount,
      expansion: {
        unlimitedCountries: true,
        note: 'Add countries by registering data only — architecture unchanged.',
        planned: [
          'SAU', 'ARE', 'QAT', 'KWT', 'OMN', 'BHR', 'EGY', 'IRQ', 'SYR', 'LBN',
          'PSE', 'YEM', 'USA', 'GBR', 'CAN', 'AUS',
        ],
      },
      singleSourceOfTruth: true,
      builtAt,
    };

    writeJson(registryPath(), registry);
    writeJson(path.join(root(), 'validation', 'latest.json'), meta.validation);
    writeJson(path.join(root(), 'reports', `registry-${prefix}-${Date.now()}.json`), {
      registration: meta.registration,
      validation: {
        ok: meta.validation.ok,
        checked: meta.validation.checked,
        issueCount: meta.validation.issueCount,
        missingRelationships: meta.validation.missingRelationships,
        validationErrors: meta.validation.validationErrors,
      },
      totals: registry.countryTotals?.[prefix],
    });

    return registry;
  }

  function buildDashboard(registry = null) {
    const reg = registry || readJson(registryPath()) || {
      totals: {},
      countries: [],
      countryTotals: {},
      validation: {},
    };
    const t = reg.countryTotals?.[prefix] || reg.totals || {};
    const validation = reg.validation || {};
    return {
      schema: 'success-os.national-education-registry-dashboard.v1',
      registryVersion: REGISTRY_VERSION,
      phase,
      countryCode: prefix,
      country,
      totalGrades: t.grade || 0,
      totalSubjects: t.subject || 0,
      totalBooks: t.book || 0,
      totalUnits: t.unit || 0,
      totalLessons: t.lesson || 0,
      totalConcepts: t.concept || 0,
      totalSkills: t.skill || 0,
      totalReferences: t.reference || 0,
      totalLearningOutcomes: t.learningOutcome || 0,
      totalVocabulary: t.vocabulary || 0,
      totalFormulas: t.mathematicalFormula || 0,
      totalDiagrams: t.diagram || 0,
      totalLaws: t.scientificLaw || 0,
      totalLabActivities: t.laboratoryActivity || 0,
      totalImages: t.educationalImage || 0,
      countriesRegistered: list(reg.countries).length,
      registryHealth: validation.ok ? 'healthy' : 'errors',
      missingRelationships: validation.missingRelationships || 0,
      validationErrors: validation.validationErrors || 0,
      searchDocuments: reg.searchDocumentCount || 0,
      singleSourceOfTruth: true,
      updatedAt: nowIso(),
    };
  }

  function runRegistration(options = {}) {
    const payload = buildCountryPayload(options);
    const { stores, stats } = registerFromPayload(payload, options);
    const validation = validateStores(stores);
    const registration = {
      status: validation.ok ? 'registered' : 'registered-with-errors',
      countryCode: prefix,
      country,
      stats,
      sourceBooks: list(payload.books).length,
      sourceReferences: list(payload.references).length,
    };
    const registry = persist(stores, { registration, validation });
    const dashboard = buildDashboard(registry);
    writeJson(path.join(root(), 'dashboards', 'latest.json'), dashboard);
    return { registry, dashboard, registration, validation };
  }

  function readRegistry() {
    return readJson(registryPath());
  }

  function getEntity(globalId) {
    const reg = readRegistry();
    if (!reg?.entities) return null;
    for (const kind of REGISTRY_ENTITY_KINDS) {
      if (reg.entities[kind]?.[globalId]) return reg.entities[kind][globalId];
    }
    return null;
  }

  return {
    countryCode: prefix,
    country,
    phase,
    root,
    REGISTRY_ENTITY_KINDS,
    REGISTRY_SEARCH_FACETS,
    readRegistry,
    readIdMap,
    runRegistration,
    buildDashboard,
    search,
    getEntity,
    validateStores,
  };
}

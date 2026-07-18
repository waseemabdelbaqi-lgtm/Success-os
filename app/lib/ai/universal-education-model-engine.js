/**
 * Universal Education Model Engine — portable normalization core.
 *
 * Normalizes any country's curriculum data into the Success OS UEM.
 * Does not generate educational content or create books.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  UEM_SCHEMA,
  UEM_VERSION,
  UEM_ENTITY_KINDS,
  UEM_SYSTEM_TYPES,
  createUemMetadata,
  validateUemMetadata,
  uemId,
  uemSlug,
  uemCountryCode,
} from '../../data/universal-education-model.js';

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
    ...UEM_ENTITY_KINDS.map((k) => path.join(root, 'entities', k)),
    path.join(root, 'indexes'),
    path.join(root, 'validation'),
    path.join(root, 'dashboards'),
    path.join(root, 'reports'),
    path.join(root, 'migrations'),
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function outcomeKey(textValue) {
  return uemSlug(textValue).slice(0, 48) || 'outcome';
}

/**
 * @param {object} config
 * @param {string} config.countryCode
 * @param {string} config.country
 * @param {string} config.rootDir — shared UEM store root (all countries)
 * @param {() => object} config.buildCountryPayload — country-specific extract
 */
export function createNormalizationEngine(config) {
  const { countryCode, country, rootDir, buildCountryPayload } = config;
  const code = uemCountryCode(countryCode);
  const phase = `${code}-CURRICULUM-NORMALIZATION`;

  function root() {
    return rootDir;
  }

  function registryPath() {
    return path.join(root(), 'universal-education-model.json');
  }

  function readRegistry() {
    return readJson(registryPath());
  }

  function emptyStores() {
    const stores = {};
    for (const kind of UEM_ENTITY_KINDS) stores[kind] = {};
    return stores;
  }

  function upsert(stores, kind, entity) {
    const id = entity.universalId;
    if (!id) throw new Error(`UEM_MISSING_ID:${kind}`);
    const existing = stores[kind][id];
    if (existing) {
      stores[kind][id] = {
        ...existing,
        ...entity,
        createdDate: existing.createdDate || entity.createdDate,
        updatedDate: nowIso(),
        _deduped: true,
      };
      return { id, created: false };
    }
    stores[kind][id] = entity;
    return { id, created: true };
  }

  /**
   * Normalize a country payload into UEM entity stores.
   */
  function normalizeCountry(payload, options = {}) {
    ensureDirs(root());
    const prior = options.merge === false ? null : readRegistry();
    const stores = emptyStores();

    // Preserve entities from other countries when merging
    if (prior?.entities) {
      for (const kind of UEM_ENTITY_KINDS) {
        for (const [id, entity] of Object.entries(prior.entities[kind] || {})) {
          if (entity.countryCode && entity.countryCode !== code) {
            stores[kind][id] = entity;
          }
        }
      }
    }

    const stats = {
      created: Object.fromEntries(UEM_ENTITY_KINDS.map((k) => [k, 0])),
      reused: Object.fromEntries(UEM_ENTITY_KINDS.map((k) => [k, 0])),
    };

    const track = (kind, result) => {
      if (result.created) stats.created[kind] += 1;
      else stats.reused[kind] += 1;
    };

    const systemKey = payload.systemKey || 'national';
    const systemType = payload.systemType || 'national';
    const academicYear = payload.academicYear || '2025-2026';
    const language = payload.language || 'ar';
    const officialSource = payload.officialSource || null;

    const countryId = uemId.country(code);
    track(
      'country',
      upsert(stores, 'country', {
        ...createUemMetadata({
          universalId: countryId,
          country,
          countryCode: code,
          educationSystem: 'n/a',
          language,
          academicYear,
          officialSource,
          verificationStatus: 'verified',
          extra: {
            kind: 'country',
            name: country,
            nameAr: payload.countryAr || country,
            isoCode: code,
          },
        }),
      }),
    );

    const systemId = uemId.educationalSystem(code, systemKey);
    track(
      'educationalSystem',
      upsert(stores, 'educationalSystem', {
        ...createUemMetadata({
          universalId: systemId,
          country,
          countryCode: code,
          educationSystem: payload.educationalSystem,
          language,
          academicYear,
          officialSource,
          verificationStatus: 'verified',
          extra: {
            kind: 'educationalSystem',
            systemKey,
            systemType,
            name: payload.educationalSystem,
            parentCountryId: countryId,
            supports: [...UEM_SYSTEM_TYPES],
          },
        }),
      }),
    );

    const yearId = uemId.academicYear(code, systemKey, academicYear);
    track(
      'academicYear',
      upsert(stores, 'academicYear', {
        ...createUemMetadata({
          universalId: yearId,
          country,
          countryCode: code,
          educationSystem: payload.educationalSystem,
          language,
          academicYear,
          officialSource,
          verificationStatus: 'verified',
          extra: {
            kind: 'academicYear',
            label: academicYear,
            parentSystemId: systemId,
          },
        }),
      }),
    );

    for (const book of list(payload.books)) {
      const gradeKey = book.gradeKey || book.grade;
      const subjectKey = book.subjectKey || book.subject;
      const bookLang = book.language || language;
      const gradeId = uemId.grade(code, systemKey, gradeKey);
      const subjectId = uemId.subject(code, systemKey, subjectKey);

      track(
        'grade',
        upsert(stores, 'grade', {
          ...createUemMetadata({
            universalId: gradeId,
            country,
            countryCode: code,
            educationSystem: payload.educationalSystem,
            language: bookLang,
            academicYear,
            officialSource: book.officialSource || officialSource,
            verificationStatus: book.verificationStatus || 'verified',
            extra: {
              kind: 'grade',
              label: book.grade,
              gradeKey: uemSlug(gradeKey),
              parentSystemId: systemId,
              parentYearId: yearId,
            },
          }),
        }),
      );

      for (const sem of list(book.semesters).length
        ? book.semesters
        : ['الفصل الأول', 'الفصل الثاني']) {
        const semesterId = uemId.semester(code, systemKey, gradeKey, sem);
        track(
          'semester',
          upsert(stores, 'semester', {
            ...createUemMetadata({
              universalId: semesterId,
              country,
              countryCode: code,
              educationSystem: payload.educationalSystem,
              language: bookLang,
              academicYear,
              officialSource: book.officialSource || officialSource,
              verificationStatus: 'verified',
              extra: {
                kind: 'semester',
                label: sem,
                parentGradeId: gradeId,
              },
            }),
          }),
        );
      }

      track(
        'subject',
        upsert(stores, 'subject', {
          ...createUemMetadata({
            universalId: subjectId,
            country,
            countryCode: code,
            educationSystem: payload.educationalSystem,
            language: bookLang,
            academicYear,
            officialSource: book.officialSource || officialSource,
            verificationStatus: book.verificationStatus || 'verified',
            extra: {
              kind: 'subject',
              label: book.subject,
              subjectKey: uemSlug(subjectKey),
              parentSystemId: systemId,
            },
          }),
        }),
      );

      const bookUniversalId = uemId.book(code, systemKey, gradeKey, subjectKey, bookLang);
      track(
        'book',
        upsert(stores, 'book', {
          ...createUemMetadata({
            universalId: bookUniversalId,
            country,
            countryCode: code,
            educationSystem: payload.educationalSystem,
            language: bookLang,
            academicYear,
            officialSource: book.officialSource || officialSource,
            verificationStatus: book.verificationStatus || 'verified',
            extra: {
              kind: 'book',
              legacyBookId: book.legacyBookId || book.bookId || null,
              title: book.title || `Success OS — ${book.subject}`,
              parentGradeId: gradeId,
              parentSubjectId: subjectId,
              parentSystemId: systemId,
            },
          }),
        }),
      );

      for (const unit of list(book.units)) {
        const unitKey = unit.unitKey || unit.unitId || unit.id || unit.title;
        const unitId = uemId.unit(bookUniversalId, unitKey);
        track(
          'unit',
          upsert(stores, 'unit', {
            ...createUemMetadata({
              universalId: unitId,
              country,
              countryCode: code,
              educationSystem: payload.educationalSystem,
              language: bookLang,
              academicYear,
              officialSource: book.officialSource || officialSource,
              verificationStatus: 'verified',
              extra: {
                kind: 'unit',
                label: unit.title || unit.titleAr,
                unitKey: uemSlug(unitKey),
                parentBookId: bookUniversalId,
                sequence: unit.sequence ?? null,
              },
            }),
          }),
        );

        for (const lesson of list(unit.lessons)) {
          const lessonKey = lesson.lessonKey || lesson.lessonId || lesson.id || lesson.title;
          const lessonId = uemId.lesson(unitId, lessonKey);
          track(
            'lesson',
            upsert(stores, 'lesson', {
              ...createUemMetadata({
                universalId: lessonId,
                country,
                countryCode: code,
                educationSystem: payload.educationalSystem,
                language: bookLang,
                academicYear,
                officialSource: book.officialSource || officialSource,
                verificationStatus: lesson.verificationStatus || 'verified',
                extra: {
                  kind: 'lesson',
                  label: lesson.title,
                  lessonKey: uemSlug(lessonKey),
                  parentUnitId: unitId,
                  parentBookId: bookUniversalId,
                  sequence: lesson.sequence ?? null,
                },
              }),
            }),
          );

          // Topic / subtopic derived from lesson title structure (no new content)
          const topicLabel = lesson.topic || lesson.title;
          const topicId = uemId.topic(lessonId, topicLabel);
          track(
            'topic',
            upsert(stores, 'topic', {
              ...createUemMetadata({
                universalId: topicId,
                country,
                countryCode: code,
                educationSystem: payload.educationalSystem,
                language: bookLang,
                academicYear,
                officialSource: book.officialSource || officialSource,
                verificationStatus: 'verified',
                extra: {
                  kind: 'topic',
                  label: topicLabel,
                  parentLessonId: lessonId,
                },
              }),
            }),
          );

          for (const sub of list(lesson.subtopics).length
            ? lesson.subtopics
            : list(lesson.requiredConcepts || lesson.keyConcepts).slice(0, 3)) {
            const subLabel = typeof sub === 'string' ? sub : sub.label || sub.term;
            if (!text(subLabel)) continue;
            const subtopicId = uemId.subtopic(topicId, subLabel);
            track(
              'subtopic',
              upsert(stores, 'subtopic', {
                ...createUemMetadata({
                  universalId: subtopicId,
                  country,
                  countryCode: code,
                  educationSystem: payload.educationalSystem,
                  language: bookLang,
                  academicYear,
                  officialSource: book.officialSource || officialSource,
                  verificationStatus: 'verified',
                  extra: {
                    kind: 'subtopic',
                    label: subLabel,
                    parentTopicId: topicId,
                  },
                }),
              }),
            );
          }

          for (const outcome of list(lesson.learningOutcomes || lesson.outcomes)) {
            const oText = typeof outcome === 'string' ? outcome : outcome.text;
            if (!text(oText)) continue;
            const outcomeId = uemId.learningOutcome(lessonId, outcomeKey(oText));
            track(
              'learningOutcome',
              upsert(stores, 'learningOutcome', {
                ...createUemMetadata({
                  universalId: outcomeId,
                  country,
                  countryCode: code,
                  educationSystem: payload.educationalSystem,
                  language: bookLang,
                  academicYear,
                  officialSource: book.officialSource || officialSource,
                  verificationStatus: 'verified',
                  extra: {
                    kind: 'learningOutcome',
                    text: oText,
                    parentLessonId: lessonId,
                  },
                }),
              }),
            );
          }

          for (const concept of list(
            lesson.concepts || lesson.keyConcepts || lesson.scientificConcepts,
          )) {
            const cText = typeof concept === 'string' ? concept : concept.term || concept.label;
            if (!text(cText)) continue;
            const conceptId = uemId.concept(code, cText);
            track(
              'concept',
              upsert(stores, 'concept', {
                ...createUemMetadata({
                  universalId: conceptId,
                  country,
                  countryCode: code,
                  educationSystem: payload.educationalSystem,
                  language: bookLang,
                  academicYear,
                  officialSource: book.officialSource || officialSource,
                  verificationStatus: 'verified',
                  extra: {
                    kind: 'concept',
                    label: cText,
                    usedByLessonIds: [
                      ...new Set([
                        ...(stores.concept[conceptId]?.usedByLessonIds || []),
                        lessonId,
                      ]),
                    ],
                  },
                }),
              }),
            );
          }

          for (const skill of list(lesson.skills || lesson.skillsGained)) {
            const sText = typeof skill === 'string' ? skill : skill.label;
            if (!text(sText)) continue;
            const skillId = uemId.skill(code, sText);
            track(
              'skill',
              upsert(stores, 'skill', {
                ...createUemMetadata({
                  universalId: skillId,
                  country,
                  countryCode: code,
                  educationSystem: payload.educationalSystem,
                  language: bookLang,
                  academicYear,
                  officialSource: book.officialSource || officialSource,
                  verificationStatus: 'verified',
                  extra: {
                    kind: 'skill',
                    label: sText,
                    usedByLessonIds: [
                      ...new Set([
                        ...(stores.skill[skillId]?.usedByLessonIds || []),
                        lessonId,
                      ]),
                    ],
                  },
                }),
              }),
            );
          }

          for (const vocab of list(lesson.vocabulary || lesson.definitions)) {
            const term = vocab.term || vocab.label || vocab;
            const definition = vocab.definition || vocab.definitionAr || vocab.meaning || null;
            if (!text(term)) continue;
            const vocabId = uemId.vocabulary(code, term, bookLang);
            track(
              'vocabulary',
              upsert(stores, 'vocabulary', {
                ...createUemMetadata({
                  universalId: vocabId,
                  country,
                  countryCode: code,
                  educationSystem: payload.educationalSystem,
                  language: bookLang,
                  academicYear,
                  officialSource: book.officialSource || officialSource,
                  verificationStatus: 'verified',
                  extra: {
                    kind: 'vocabulary',
                    term: text(term),
                    definition,
                    usedByLessonIds: [
                      ...new Set([
                        ...(stores.vocabulary[vocabId]?.usedByLessonIds || []),
                        lessonId,
                      ]),
                    ],
                  },
                }),
              }),
            );
          }
        }
      }
    }

    for (const ref of list(payload.references)) {
      const refKey = ref.sourceId || ref.referenceKey || ref.url || ref.title;
      const referenceId = uemId.reference(code, refKey);
      track(
        'reference',
        upsert(stores, 'reference', {
          ...createUemMetadata({
            universalId: referenceId,
            country,
            countryCode: code,
            educationSystem: payload.educationalSystem,
            language: ref.language || language,
            academicYear,
            officialSource: ref.url || ref.officialUrl || officialSource,
            verificationStatus: ref.status === 'verified' ? 'verified' : ref.status || 'verified',
            extra: {
              kind: 'reference',
              title: ref.title || ref.name,
              publisher: ref.publisher || null,
              category: ref.category || null,
              legacySourceId: ref.sourceId || null,
              url: ref.url || ref.officialUrl || null,
            },
          }),
        }),
      );
    }

    return { stores, stats, systemId, countryId };
  }

  function validateStores(stores) {
    const issues = [];
    let checked = 0;
    for (const kind of UEM_ENTITY_KINDS) {
      const ids = new Set();
      for (const entity of Object.values(stores[kind] || {})) {
        checked += 1;
        if (ids.has(entity.universalId)) {
          issues.push({ code: 'DUPLICATE_ID', kind, id: entity.universalId });
        }
        ids.add(entity.universalId);
        const meta = validateUemMetadata(entity);
        if (!meta.ok) {
          issues.push({
            code: 'MISSING_METADATA',
            kind,
            id: entity.universalId,
            missing: meta.missing,
          });
        }
      }
    }

    // Label-level duplicate detection within country+kind (subjects/lessons by label path)
    const subjectLabels = new Map();
    for (const s of Object.values(stores.subject || {})) {
      if (s.countryCode !== code) continue;
      const key = `${s.educationSystem}::${uemSlug(s.label)}`;
      if (subjectLabels.has(key)) {
        issues.push({
          code: 'DUPLICATE_SUBJECT_LABEL',
          ids: [subjectLabels.get(key), s.universalId],
        });
      } else subjectLabels.set(key, s.universalId);
    }

    return {
      ok: issues.filter((i) => i.code !== 'DUPLICATE_SUBJECT_LABEL').length === 0,
      checked,
      issues,
    };
  }

  function counts(stores, onlyCountry = true) {
    const out = {};
    for (const kind of UEM_ENTITY_KINDS) {
      const values = Object.values(stores[kind] || {});
      out[kind] = onlyCountry
        ? values.filter((e) => !e.countryCode || e.countryCode === code).length
        : values.length;
    }
    return out;
  }

  function persist(stores, meta) {
    ensureDirs(root());
    const builtAt = nowIso();

    for (const kind of UEM_ENTITY_KINDS) {
      for (const entity of Object.values(stores[kind] || {})) {
        const file = path.join(
          root(),
          'entities',
          kind,
          `${uemSlug(entity.universalId).slice(0, 120)}.json`,
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

    const registry = {
      schema: UEM_SCHEMA,
      uemVersion: UEM_VERSION,
      phase,
      entityKinds: UEM_ENTITY_KINDS,
      systemTypes: UEM_SYSTEM_TYPES,
      entities: Object.fromEntries(
        UEM_ENTITY_KINDS.map((k) => [k, stores[k]]),
      ),
      countries: [...new Set(
        Object.values(stores.country || {}).map((c) => c.countryCode),
      )],
      totals: counts(stores, false),
      countryTotals: { [code]: counts(stores, true) },
      normalization: meta.normalization,
      validation: meta.validation,
      migrationReadiness: {
        nationalCurricula: true,
        higherEducation: true,
        vocationalEducation: true,
        professionalCertifications: true,
        aiGeneratedContent: true,
        note: 'New countries add data only — schema unchanged.',
      },
      builtAt,
    };

    writeJson(registryPath(), registry);
    writeJson(path.join(root(), 'validation', 'latest.json'), meta.validation);
    writeJson(path.join(root(), 'migrations', `normalize-${code}-${builtAt.slice(0, 10)}.json`), {
      countryCode: code,
      stats: meta.normalization?.stats,
      builtAt,
    });

    return registry;
  }

  function buildDashboard(registry = null) {
    const reg = registry || readRegistry() || { totals: {}, countries: [], countryTotals: {} };
    return {
      schema: 'success-os.uem-dashboard.v1',
      uemVersion: UEM_VERSION,
      phase,
      countriesAdded: list(reg.countries).length,
      educationSystems: reg.totals?.educationalSystem || 0,
      subjects: reg.totals?.subject || 0,
      books: reg.totals?.book || 0,
      units: reg.totals?.unit || 0,
      lessons: reg.totals?.lesson || 0,
      concepts: reg.totals?.concept || 0,
      skills: reg.totals?.skill || 0,
      learningOutcomes: reg.totals?.learningOutcome || 0,
      vocabulary: reg.totals?.vocabulary || 0,
      references: reg.totals?.reference || 0,
      normalizationStatus: reg.normalization?.status || 'unknown',
      validationStatus: reg.validation?.ok ? 'passed' : 'failed',
      countryTotals: reg.countryTotals || {},
      migrationReadiness: reg.migrationReadiness || {},
      updatedAt: nowIso(),
    };
  }

  function runNormalization(options = {}) {
    const payload = buildCountryPayload(options);
    const { stores, stats } = normalizeCountry(payload, options);
    const validation = validateStores(stores);
    const normalization = {
      status: validation.ok ? 'normalized' : 'normalized-with-warnings',
      countryCode: code,
      country,
      stats,
      sourceBooks: list(payload.books).length,
      sourceReferences: list(payload.references).length,
    };
    const registry = persist(stores, { normalization, validation });
    const dashboard = buildDashboard(registry);
    writeJson(path.join(root(), 'dashboards', 'latest.json'), dashboard);
    writeJson(path.join(root(), 'reports', `uem-${code}-${Date.now()}.json`), {
      normalization,
      validation: {
        ok: validation.ok,
        checked: validation.checked,
        issueCount: validation.issues.length,
        issues: validation.issues.slice(0, 40),
      },
      totals: registry.countryTotals?.[code],
    });
    return { registry, dashboard, normalization, validation };
  }

  return {
    countryCode: code,
    country,
    phase,
    root,
    readRegistry,
    runNormalization,
    buildDashboard,
    validateStores,
    UEM_ENTITY_KINDS,
    UEM_SYSTEM_TYPES,
  };
}

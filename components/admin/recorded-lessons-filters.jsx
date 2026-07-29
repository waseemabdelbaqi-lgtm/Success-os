'use client';

import { RECORDED_LESSON_SOURCES } from '@/app/data/recorded-lesson-sources.js';
import { teacherGenderFilterVisible } from '@/app/data/recorded-lesson-filters.js';

const stepStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 160,
  flex: '1 1 160px',
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151' };
const selectStyle = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  background: '#fff',
  fontSize: 13,
};

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={stepStyle}>
      <span style={labelStyle}>{label}</span>
      <select value={value || 'all'} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {(options || [{ id: 'all', label: 'All' }]).map((o) => (
          <option key={o.id || o.value} value={o.id || o.value}>
            {o.label || o.id || o.value}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Cascading recorded-lessons filter stack.
 * Teacher Gender appears only when Lesson Source = Teachers.
 */
export function RecordedLessonsFilters({
  filters,
  facets,
  total = 0,
  onChange,
  lessonSource,
  onLessonSourceChange,
}) {
  function update(partial) {
    const next = { ...filters, ...partial };
    if (Object.prototype.hasOwnProperty.call(partial, 'country')) {
      next.educationalSystem = 'all';
      next.curriculum = 'all';
      next.qualification = 'all';
      next.grade = 'all';
      next.subjectFamily = 'all';
      next.subject = 'all';
    } else if (Object.prototype.hasOwnProperty.call(partial, 'curriculum')) {
      next.grade = 'all';
      next.subjectFamily = 'all';
      next.subject = 'all';
    } else if (Object.prototype.hasOwnProperty.call(partial, 'grade')) {
      next.subjectFamily = 'all';
      next.subject = 'all';
    }
    if (Object.prototype.hasOwnProperty.call(partial, 'lessonSource')) {
      if (partial.lessonSource !== 'TEACHER_RECORDED') {
        next.teacherGender = 'all';
      }
    }
    onChange(next);
  }

  const sourceValue = lessonSource || filters.lessonSource || 'ALL';
  const showGender = teacherGenderFilterVisible({ lessonSource: sourceValue });

  return (
    <div
      data-testid="recorded-lessons-filters"
      style={{
        margin: '16px 0',
        padding: 14,
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: 'linear-gradient(180deg,#fbfbfc 0%,#f3f4f6 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 14 }}>Recorded Lessons Filters</strong>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
            Lesson Source is primary. Teacher Gender appears only for Teachers.
          </p>
        </div>
        <span style={{ fontSize: 12, color: '#374151' }}>{total} results</span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <label style={stepStyle}>
          <span style={labelStyle}>Lesson Source</span>
          <select
            value={sourceValue}
            onChange={(e) => {
              const v = e.target.value;
              if (onLessonSourceChange) onLessonSourceChange(v);
              update({ lessonSource: v });
            }}
            style={selectStyle}
            data-testid="lesson-source-filter"
          >
            {RECORDED_LESSON_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <FilterSelect
          label="Country"
          value={filters.country}
          onChange={(v) => update({ country: v })}
          options={facets?.countries}
        />
        <FilterSelect
          label="Educational System"
          value={filters.educationalSystem}
          onChange={(v) => update({ educationalSystem: v })}
          options={facets?.educationalSystems}
        />
        <FilterSelect
          label="Curriculum"
          value={filters.curriculum}
          onChange={(v) => update({ curriculum: v })}
          options={facets?.curricula}
        />
        <FilterSelect
          label="Qualification"
          value={filters.qualification}
          onChange={(v) => update({ qualification: v })}
          options={facets?.qualifications}
        />
        <FilterSelect
          label="Grade or Year"
          value={filters.grade}
          onChange={(v) => update({ grade: v })}
          options={facets?.grades}
        />
        <FilterSelect
          label="Subject Family"
          value={filters.subjectFamily}
          onChange={(v) => update({ subjectFamily: v })}
          options={facets?.subjectFamilies}
        />
        <FilterSelect
          label="Subject"
          value={filters.subject}
          onChange={(v) => update({ subject: v })}
          options={facets?.subjects}
        />

        {showGender ? (
          <FilterSelect
            label="Teacher Gender"
            value={filters.teacherGender}
            onChange={(v) => update({ teacherGender: v })}
            options={facets?.teacherGenders}
          />
        ) : null}

        <FilterSelect
          label="Language"
          value={filters.language}
          onChange={(v) => update({ language: v })}
          options={facets?.languages}
        />
        <FilterSelect
          label="Subtitle Language"
          value={filters.subtitleLanguage}
          onChange={(v) => update({ subtitleLanguage: v })}
          options={facets?.subtitleLanguages}
        />
        <FilterSelect
          label="Price Range"
          value={filters.price}
          onChange={(v) => update({ price: v })}
          options={facets?.prices}
        />
        <FilterSelect
          label="Rating"
          value={filters.rating}
          onChange={(v) => update({ rating: v })}
          options={facets?.ratings}
        />
        <FilterSelect
          label="Duration"
          value={filters.duration}
          onChange={(v) => update({ duration: v })}
          options={facets?.durations}
        />
        <FilterSelect
          label="Level"
          value={filters.level}
          onChange={(v) => update({ level: v })}
          options={facets?.levels}
        />
        <FilterSelect
          label="Sort"
          value={filters.sort}
          onChange={(v) => update({ sort: v })}
          options={facets?.sorts}
        />
      </div>
    </div>
  );
}

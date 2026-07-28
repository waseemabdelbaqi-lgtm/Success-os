'use client';

import { RECORDED_LESSON_SOURCES } from '@/app/data/recorded-lesson-sources.js';
import { RECORDED_LESSON_FILTER_STEPS } from '@/app/data/recorded-lesson-filters.js';

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
 * Cascading recorded-lessons filter stack:
 * Country → Curriculum → Grade → Subject → Teacher Gender →
 * Language → Price → Rating → Duration → Newest/Popularity → Results
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
    // Cascade clears when upstream changes
    if (Object.prototype.hasOwnProperty.call(partial, 'country')) {
      next.curriculum = 'all';
      next.grade = 'all';
      next.subject = 'all';
    } else if (Object.prototype.hasOwnProperty.call(partial, 'curriculum')) {
      next.grade = 'all';
      next.subject = 'all';
    } else if (Object.prototype.hasOwnProperty.call(partial, 'grade')) {
      next.subject = 'all';
    }
    onChange(next);
  }

  const sortValue = filters.sort === 'popularity' ? 'popularity' : filters.sort || 'newest';

  return (
    <div
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
          <strong style={{ fontSize: 14 }}>Recorded Lessons filters</strong>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {RECORDED_LESSON_FILTER_STEPS.map((s) => s.label).join(' → ')}
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          Results: <span data-testid="recorded-lessons-results-count">{total}</span>
        </div>
      </div>

      <fieldset
        style={{
          marginTop: 12,
          padding: '10px 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          background: '#fff',
        }}
      >
        <legend style={{ padding: '0 6px', fontWeight: 600, fontSize: 13 }}>Lesson Source</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {RECORDED_LESSON_SOURCES.map((source) => (
            <label
              key={source.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="lesson-source"
                value={source.id}
                checked={(lessonSource || 'all') === source.id}
                onChange={() => onLessonSourceChange?.(source.id)}
              />
              <span>{source.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 14,
        }}
      >
        <FilterSelect
          label="Country"
          value={filters.country}
          onChange={(v) => update({ country: v })}
          options={facets?.countries}
        />
        <FilterSelect
          label="Curriculum"
          value={filters.curriculum}
          onChange={(v) => update({ curriculum: v })}
          options={facets?.curricula}
        />
        <FilterSelect
          label="Grade"
          value={filters.grade}
          onChange={(v) => update({ grade: v })}
          options={facets?.grades}
        />
        <FilterSelect
          label="Subject"
          value={filters.subject}
          onChange={(v) => update({ subject: v })}
          options={facets?.subjects}
        />
        <FilterSelect
          label="Teacher Gender"
          value={filters.teacherGender}
          onChange={(v) => update({ teacherGender: v })}
          options={facets?.teacherGenders}
        />
        <FilterSelect
          label="Language"
          value={filters.language}
          onChange={(v) => update({ language: v })}
          options={facets?.languages}
        />
        <FilterSelect
          label="Price"
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
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14, alignItems: 'center' }}>
        <fieldset
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '8px 12px',
            background: '#fff',
            margin: 0,
          }}
        >
          <legend style={{ padding: '0 6px', fontWeight: 600, fontSize: 13 }}>Sort</legend>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <input
                type="radio"
                name="recorded-sort"
                checked={sortValue === 'newest'}
                onChange={() => update({ sort: 'newest' })}
              />
              Newest
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <input
                type="radio"
                name="recorded-sort"
                checked={sortValue === 'popularity'}
                onChange={() => update({ sort: 'popularity' })}
              />
              Popularity
            </label>
          </div>
        </fieldset>

        <FilterSelect
          label="More sort options"
          value={filters.sort}
          onChange={(v) => update({ sort: v })}
          options={facets?.sorts}
        />
      </div>
    </div>
  );
}

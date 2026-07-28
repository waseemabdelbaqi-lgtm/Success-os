'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { STUDENT_ROUTES } from '@/lib/student-portal/constants';

function DependentSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-[#671016]">{label}</span>
      <select
        className="rounded-xl border border-[#d4af37]/35 bg-white px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MiddleEastLiveLibrary() {
  const [index, setIndex] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [countryId, setCountryId] = useState('');
  const [systemId, setSystemId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  useEffect(() => {
    fetch('/api/student-books?view=catalog', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`INDEX_${response.status}`);
        return response.json();
      })
      .then(setIndex)
      .catch((reason) => setError(reason.message));
  }, []);

  const hierarchy = index?.hierarchy;
  const systems = useMemo(
    () =>
      (hierarchy?.systems || []).filter(
        (item) => !countryId || item.countryId === countryId,
      ),
    [hierarchy, countryId],
  );
  const curricula = useMemo(
    () =>
      (hierarchy?.curricula || []).filter(
        (item) =>
          (!systemId || item.systemId === systemId) &&
          systems.some((system) => system.id === item.systemId),
      ),
    [hierarchy, systemId, systems],
  );
  const grades = useMemo(
    () =>
      (hierarchy?.grades || []).filter(
        (item) =>
          (!curriculumId || item.curriculumId === curriculumId) &&
          curricula.some((curriculum) => curriculum.id === item.curriculumId),
      ),
    [hierarchy, curriculumId, curricula],
  );
  const subjects = useMemo(
    () =>
      (hierarchy?.subjects || []).filter(
        (item) =>
          (!gradeId || item.gradeId === gradeId) &&
          grades.some((grade) => grade.id === item.gradeId),
      ),
    [hierarchy, gradeId, grades],
  );

  const books = useMemo(() => {
    const list = index?.books || [];
    return list.filter((book) => {
      if (countryId && book.countryId !== countryId) return false;
      if (systemId && book.systemId !== systemId) return false;
      if (curriculumId && book.curriculumId !== curriculumId) return false;
      if (gradeId && book.gradeId !== gradeId) return false;
      if (subjectId && book.subjectId !== subjectId) return false;
      if (query && !book.searchText.includes(query.toLowerCase())) return false;
      return true;
    });
  }, [index, countryId, systemId, curriculumId, gradeId, subjectId, query]);

  if (error) {
    return <p style={{ color: '#9e1722', padding: 24 }}>{error}</p>;
  }
  if (!index) {
    return <p style={{ padding: 24 }}>Loading Middle East live library…</p>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-7">
      <div className="luxury-card rounded-[1.75rem] p-5">
        <h1 className="text-2xl font-black text-[#671016]">
          Middle East Digital Library
        </h1>
        <p className="mt-2 text-sm text-[#7a655c]">
          Country → Educational System → Curriculum → Grade → Subject → Book
        </p>
        <p className="mt-1 text-xs font-bold text-[#9a711a]">
          Direct Preview Mode · {index.books.length} live books
        </p>
        <div className="mt-4 rounded-xl border border-[#9e1722]/25 bg-[#fff8f1] p-3 text-sm">
          <p className="font-black text-[#671016]">Jordan BOOKS FIRST pilot</p>
          <p className="mt-1 text-[#7a655c]">
            Interactive national curriculum books (not PDF-only). AI video path is paused.
          </p>
          <Link
            href="/jordan-books/jordan/national/grade-1/semester-1/math/student-book/unit-1"
            className="mt-2 inline-block font-black text-[#9e1722] underline"
          >
            Open Grade 1 Math · Unit 1 (الجمع)
          </Link>
        </div>
      </div>

      <div className="luxury-card grid gap-4 rounded-[1.75rem] p-5 md:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm md:col-span-2 xl:col-span-3">
          <span className="font-bold text-[#671016]">Search</span>
          <input
            className="rounded-xl border border-[#d4af37]/35 bg-white px-3 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search country, curriculum, grade, subject"
          />
        </label>
        <DependentSelect
          label="Country"
          value={countryId}
          onChange={(value) => {
            setCountryId(value);
            setSystemId('');
            setCurriculumId('');
            setGradeId('');
            setSubjectId('');
          }}
          options={(hierarchy.countries || []).map((item) => ({
            value: item.id,
            label: `${item.name} / ${item.nameAr}`,
          }))}
        />
        <DependentSelect
          label="Educational System"
          value={systemId}
          onChange={(value) => {
            setSystemId(value);
            setCurriculumId('');
            setGradeId('');
            setSubjectId('');
          }}
          options={systems.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Curriculum"
          value={curriculumId}
          onChange={(value) => {
            setCurriculumId(value);
            setGradeId('');
            setSubjectId('');
          }}
          options={curricula.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Grade / Academic Level"
          value={gradeId}
          onChange={(value) => {
            setGradeId(value);
            setSubjectId('');
          }}
          options={grades.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Subject"
          value={subjectId}
          onChange={setSubjectId}
          options={subjects.map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {books.map((book) => (
          <article
            key={book.bookId}
            className="luxury-card rounded-[1.5rem] p-5"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a711a]">
              {book.country} · {book.grade}
            </p>
            <h2 className="mt-2 text-lg font-black text-[#671016]">
              {book.subject}
            </h2>
            <p className="mt-1 text-sm text-[#7a655c]">{book.curriculum}</p>
            <p className="mt-1 text-xs text-[#9a711a]">
              v{book.version} · {book.bookStatus}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={STUDENT_ROUTES.subject(book.subjectId, book.bookId)}
                className="rounded-xl border border-[#d4af37]/40 px-3 py-2 text-sm font-bold text-[#671016]"
              >
                Open Subject
              </Link>
              <Link
                href={STUDENT_ROUTES.read(book.bookId)}
                className="rounded-xl bg-[#8b1e1e] px-3 py-2 text-sm font-bold text-white"
              >
                📖 Book
              </Link>
            </div>
          </article>
        ))}
      </div>

      {books.length === 0 ? (
        <div className="luxury-card rounded-[1.5rem] p-8 text-center text-sm text-[#8b7770]">
          No books match these filters.
        </div>
      ) : null}

      <p className="text-xs text-[#8b7770]">
        Legacy demo shelf remains at{' '}
        <Link className="underline" href={`${STUDENT_ROUTES.books}?demo=1`}>
          ?demo=1
        </Link>
      </p>
    </div>
  );
}

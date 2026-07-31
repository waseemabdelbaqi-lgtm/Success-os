"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { STUDENT_ROUTES } from "@/lib/student-portal/constants";

type SelectOption = {
  value: string;
  label: string;
};

type HierarchyNode = {
  id: string;
  name: string;
  nameAr?: string;
  countryId?: string;
  systemId?: string;
  curriculumId?: string;
  gradeId?: string;
};

type CatalogBook = {
  bookId: string;
  countryId?: string;
  systemId?: string;
  curriculumId?: string;
  gradeId?: string;
  subjectId: string;
  country?: string;
  grade?: string;
  subject?: string;
  curriculum?: string;
  version?: string;
  bookStatus?: string;
  searchText: string;
};

type CatalogIndex = {
  books: CatalogBook[];
  hierarchy: {
    countries?: HierarchyNode[];
    systems?: HierarchyNode[];
    curricula?: HierarchyNode[];
    grades?: HierarchyNode[];
    subjects?: HierarchyNode[];
  };
};

type DependentSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
};

function DependentSelect({
  label,
  value,
  onChange,
  options,
}: DependentSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-bold text-[#671016]">{label}</span>
      <select
        className="rounded-xl border border-[#d4af37]/35 bg-white px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All</option>
        {options.map((option: SelectOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MiddleEastLiveLibrary() {
  const [index, setIndex] = useState<CatalogIndex | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [countryId, setCountryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  useEffect(() => {
    fetch("/api/student-books?view=catalog", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`INDEX_${response.status}`);
        return response.json();
      })
      .then((payload: CatalogIndex) => setIndex(payload))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "LOAD_FAILED"),
      );
  }, []);

  const hierarchy = index?.hierarchy;
  const systems = useMemo(
    () =>
      (hierarchy?.systems || []).filter(
        (item: HierarchyNode) => !countryId || item.countryId === countryId,
      ),
    [hierarchy, countryId],
  );
  const curricula = useMemo(
    () =>
      (hierarchy?.curricula || []).filter(
        (item: HierarchyNode) =>
          (!systemId || item.systemId === systemId) &&
          systems.some((system: HierarchyNode) => system.id === item.systemId),
      ),
    [hierarchy, systemId, systems],
  );
  const grades = useMemo(
    () =>
      (hierarchy?.grades || []).filter(
        (item: HierarchyNode) =>
          (!curriculumId || item.curriculumId === curriculumId) &&
          curricula.some(
            (curriculum: HierarchyNode) => curriculum.id === item.curriculumId,
          ),
      ),
    [hierarchy, curriculumId, curricula],
  );
  const subjects = useMemo(
    () =>
      (hierarchy?.subjects || []).filter(
        (item: HierarchyNode) =>
          (!gradeId || item.gradeId === gradeId) &&
          grades.some((grade: HierarchyNode) => grade.id === item.gradeId),
      ),
    [hierarchy, gradeId, grades],
  );

  const books = useMemo(() => {
    const list = index?.books || [];
    return list.filter((book: CatalogBook) => {
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
    return <p style={{ color: "#9e1722", padding: 24 }}>{error}</p>;
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
          onChange={(value: string) => {
            setCountryId(value);
            setSystemId("");
            setCurriculumId("");
            setGradeId("");
            setSubjectId("");
          }}
          options={(hierarchy?.countries || []).map((item: HierarchyNode) => ({
            value: item.id,
            label: `${item.name} / ${item.nameAr || item.name}`,
          }))}
        />
        <DependentSelect
          label="Educational System"
          value={systemId}
          onChange={(value: string) => {
            setSystemId(value);
            setCurriculumId("");
            setGradeId("");
            setSubjectId("");
          }}
          options={systems.map((item: HierarchyNode) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Curriculum"
          value={curriculumId}
          onChange={(value: string) => {
            setCurriculumId(value);
            setGradeId("");
            setSubjectId("");
          }}
          options={curricula.map((item: HierarchyNode) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Grade / Academic Level"
          value={gradeId}
          onChange={(value: string) => {
            setGradeId(value);
            setSubjectId("");
          }}
          options={grades.map((item: HierarchyNode) => ({
            value: item.id,
            label: item.name,
          }))}
        />
        <DependentSelect
          label="Subject"
          value={subjectId}
          onChange={setSubjectId}
          options={subjects.map((item: HierarchyNode) => ({
            value: item.id,
            label: item.name,
          }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {books.map((book: CatalogBook) => (
          <article
            key={book.bookId}
            className="luxury-card rounded-[1.5rem] p-5"
          >
            <p className="text-[10px] font-black tracking-[0.18em] text-[#9a711a] uppercase">
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
        Legacy demo shelf remains at{" "}
        <Link className="underline" href={`${STUDENT_ROUTES.books}?demo=1`}>
          ?demo=1
        </Link>
      </p>
    </div>
  );
}

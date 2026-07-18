"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DEMO_COUNTRIES,
  DEMO_CURRICULA,
  DEMO_GRADES,
  DEMO_SUBJECTS,
  DEMO_SYSTEMS,
  getAllDemoVersions,
  getLocalizedText,
} from "@/content/demo/catalog";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { BookFilters, BookType, SystemType } from "@/types/student-portal";

type BookFiltersPanelProps = {
  filters: BookFilters;
  onChange: (filters: BookFilters) => void;
};

export function BookFiltersPanel({
  filters,
  onChange,
}: BookFiltersPanelProps): ReactNode {
  const { locale, t } = useStudentPortal();

  const systems = useMemo(
    () =>
      DEMO_SYSTEMS.filter(
        (system) =>
          (!filters.countryId || system.countryId === filters.countryId) &&
          (!filters.systemType || system.type === filters.systemType),
      ),
    [filters.countryId, filters.systemType],
  );

  const curricula = useMemo(
    () => {
      const availableSystemIds = new Set(systems.map((system) => system.id));
      return DEMO_CURRICULA.filter(
        (curriculum) =>
          (!filters.systemId || curriculum.systemId === filters.systemId) &&
          availableSystemIds.has(curriculum.systemId),
      );
    },
    [filters.systemId, systems],
  );

  const grades = useMemo(
    () => {
      const availableCurriculumIds = new Set(
        curricula.map((curriculum) => curriculum.id),
      );
      return DEMO_GRADES.filter(
        (grade) =>
          (!filters.curriculumId ||
            grade.curriculumId === filters.curriculumId) &&
          availableCurriculumIds.has(grade.curriculumId),
      );
    },
    [curricula, filters.curriculumId],
  );

  const versions = getAllDemoVersions();

  function update(partial: Partial<BookFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="luxury-card grid gap-4 rounded-[1.75rem] p-5 md:grid-cols-2 xl:grid-cols-4">
      <Input
        label={t("search")}
        value={filters.query ?? ""}
        onChange={(e) => update({ query: e.target.value })}
        placeholder={t("search")}
      />

      <Select
        label={t("country")}
        value={filters.countryId ?? ""}
        onChange={(e) =>
          update({
            countryId: e.target.value || undefined,
            systemId: undefined,
            curriculumId: undefined,
            gradeId: undefined,
          })
        }
        options={[
          { value: "", label: t("allBooks") },
          ...DEMO_COUNTRIES.map((c) => ({
            value: c.id,
            label: getLocalizedText(c.name, locale),
          })),
        ]}
      />

      <Select
        label={locale === "ar" ? "نوع النظام" : "System type"}
        value={filters.systemType ?? ""}
        onChange={(e) =>
          update({
            systemType: (e.target.value as SystemType) || undefined,
            systemId: undefined,
            curriculumId: undefined,
            gradeId: undefined,
          })
        }
        options={[
          { value: "", label: t("allBooks") },
          {
            value: "national",
            label: locale === "ar" ? "وطني" : "National",
          },
          {
            value: "international",
            label: locale === "ar" ? "دولي" : "International",
          },
        ]}
      />

      <Select
        label={t("system")}
        value={filters.systemId ?? ""}
        onChange={(e) =>
          update({
            systemId: e.target.value || undefined,
            curriculumId: undefined,
            gradeId: undefined,
          })
        }
        options={[
          { value: "", label: t("allBooks") },
          ...systems.map((system) => ({
            value: system.id,
            label: getLocalizedText(system.name, locale),
          })),
        ]}
      />

      <Select
        label={t("curriculum")}
        value={filters.curriculumId ?? ""}
        onChange={(e) =>
          update({
            curriculumId: e.target.value || undefined,
            gradeId: undefined,
          })
        }
        options={[
          { value: "", label: t("allBooks") },
          ...curricula.map((c) => ({
            value: c.id,
            label: getLocalizedText(c.name, locale),
          })),
        ]}
      />

      <Select
        label={t("grade")}
        value={filters.gradeId ?? ""}
        onChange={(e) => update({ gradeId: e.target.value || undefined })}
        options={[
          { value: "", label: t("allBooks") },
          ...grades.map((g) => ({
            value: g.id,
            label: getLocalizedText(g.name, locale),
          })),
        ]}
      />

      <Select
        label={t("subject")}
        value={filters.subjectId ?? ""}
        onChange={(e) => update({ subjectId: e.target.value || undefined })}
        options={[
          { value: "", label: t("allBooks") },
          ...DEMO_SUBJECTS.map((s) => ({
            value: s.id,
            label: getLocalizedText(s.name, locale),
          })),
        ]}
      />

      <Select
        label={t("language")}
        value={filters.language ?? ""}
        onChange={(e) =>
          update({
            language: (e.target.value as "en" | "ar") || undefined,
          })
        }
        options={[
          { value: "", label: t("allBooks") },
          { value: "en", label: "English" },
          { value: "ar", label: "العربية" },
        ]}
      />

      <Select
        label={t("bookType")}
        value={filters.bookType ?? ""}
        onChange={(e) =>
          update({ bookType: (e.target.value as BookType) || undefined })
        }
        options={[
          { value: "", label: t("allBooks") },
          { value: "textbook", label: "Textbook" },
          { value: "workbook", label: "Workbook" },
          { value: "reference", label: "Reference" },
          { value: "supplementary", label: "Supplementary" },
        ]}
      />

      <Select
        label={t("version")}
        value={filters.version ?? ""}
        onChange={(e) => update({ version: e.target.value || undefined })}
        options={[
          { value: "", label: t("allBooks") },
          ...versions.map((v) => ({ value: v, label: v })),
        ]}
      />
    </div>
  );
}

export function useBookFiltersState() {
  const [filters, setFilters] = useState<BookFilters>({});
  return { filters, setFilters };
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEMO_COUNTRIES,
  DEMO_CURRICULA,
  DEMO_GRADES,
  DEMO_SUBJECTS,
  DEMO_SYSTEMS,
  getLocalizedText,
} from "@/content/demo/catalog";
import { useStudentPortal } from "@/components/student-portal/providers/student-portal-provider";
import { useStudentData } from "@/hooks/use-student-data";
import { StudentTopBar } from "@/components/student-portal/layout/student-top-bar";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { StudentProfile } from "@/types/student-portal";

export function StudentProfilePage(): ReactNode {
  const { locale, t } = useStudentPortal();
  const { profile, saveProfile } = useStudentData();
  const [draft, setDraft] = useState<StudentProfile | null>(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setDraft(profile);
    }
  }, [profile]);

  const systems = useMemo(
    () =>
      draft?.countryId
        ? DEMO_SYSTEMS.filter((s) => s.countryId === draft.countryId)
        : DEMO_SYSTEMS,
    [draft?.countryId],
  );

  const curricula = useMemo(
    () =>
      draft?.systemId
        ? DEMO_CURRICULA.filter((c) => c.systemId === draft.systemId)
        : DEMO_CURRICULA,
    [draft?.systemId],
  );

  const grades = useMemo(
    () =>
      draft?.curriculumId
        ? DEMO_GRADES.filter((g) => g.curriculumId === draft.curriculumId)
        : DEMO_GRADES,
    [draft?.curriculumId],
  );

  if (!draft) {
    return <p className="p-6 text-sm text-zinc-500">Loading...</p>;
  }

  const profileDraft = draft;

  function update(partial: Partial<StudentProfile>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
    setSaved(false);
  }

  function toggleSubject(subjectId: string) {
    const exists = profileDraft.subjectIds.includes(subjectId);
    update({
      subjectIds: exists
        ? profileDraft.subjectIds.filter((id) => id !== subjectId)
        : [...profileDraft.subjectIds, subjectId],
    });
  }

  function handleSave() {
    saveProfile(profileDraft);
    setSaved(true);
  }

  return (
    <div>
      <StudentTopBar title={t("profile")} subtitle={t("currentCurriculum")} />
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-7">
        <section className="luxury-card grid gap-4 rounded-[2rem] p-6 md:grid-cols-2">
          <Select
            label={t("country")}
            value={draft.countryId}
            onChange={(e) =>
              update({
                countryId: e.target.value,
                systemId: "",
                curriculumId: "",
                gradeId: "",
              })
            }
            options={DEMO_COUNTRIES.map((c) => ({
              value: c.id,
              label: getLocalizedText(c.name, locale),
            }))}
          />
          <Select
            label={t("system")}
            value={draft.systemId}
            onChange={(e) =>
              update({
                systemId: e.target.value,
                curriculumId: "",
                gradeId: "",
              })
            }
            options={systems.map((s) => ({
              value: s.id,
              label: getLocalizedText(s.name, locale),
            }))}
          />
          <Select
            label={t("curriculum")}
            value={draft.curriculumId}
            onChange={(e) =>
              update({ curriculumId: e.target.value, gradeId: "" })
            }
            options={curricula.map((c) => ({
              value: c.id,
              label: getLocalizedText(c.name, locale),
            }))}
          />
          <Select
            label={t("grade")}
            value={draft.gradeId}
            onChange={(e) => update({ gradeId: e.target.value })}
            options={grades.map((g) => ({
              value: g.id,
              label: getLocalizedText(g.name, locale),
            }))}
          />
        </section>

        <section className="luxury-card rounded-[2rem] p-6">
          <h2 className="font-black text-[#671016]">{t("currentSubjects")}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {DEMO_SUBJECTS.map((subject) => {
              const active = draft.subjectIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={
                    active
                      ? "rounded-full bg-[#8b1e1e] px-4 py-2 text-sm font-bold text-white shadow-lg"
                      : "rounded-full border border-[#d4af37]/40 bg-white px-4 py-2 text-sm font-bold text-[#6f1117]"
                  }
                >
                  {subject.icon} {getLocalizedText(subject.name, locale)}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSave}>
            Save profile
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Profile saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}

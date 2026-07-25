"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { Institution } from "@/src/types/admission";

type Props = {
  institution: Institution;
  onApply: (institution: Institution) => void;
};

export function InstitutionCard({ institution, onApply }: Props) {
  const criteria = institution.criteria;
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{institution.type}</Badge>
          <Badge variant={institution.is_partner ? "partner" : "email"}>
            {institution.is_partner ? "Partner · in-app route" : "Non-partner · email route"}
          </Badge>
        </div>
        <CardTitle className="mt-2">{institution.name}</CardTitle>
        <p className="text-sm text-[#73636a]">
          {institution.country || "International"}
          {criteria ? ` · min GPA ${criteria.min_gpa}` : ""}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        {criteria ? (
          <div className="rounded-xl bg-[#fff8f8] p-3">
            <p className="font-bold text-[#9e1722]">
              Criteria for {criteria.nationality === "All" ? "all nationalities" : criteria.nationality}
            </p>
            <p className="mt-2 leading-relaxed text-[#4d3439]">{criteria.requirements_text}</p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onApply(institution)}>
          Apply Now · $5
        </Button>
      </CardFooter>
    </Card>
  );
}

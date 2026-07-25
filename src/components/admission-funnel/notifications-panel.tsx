"use client";

import { useAdmissionNotifications } from "@/src/hooks/use-admission-notifications";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export function NotificationsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const { items, pending, live } = useAdmissionNotifications(refreshKey);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">In-app notifications</CardTitle>
        <Badge variant={live ? "partner" : "muted"}>{live ? "Live" : "Synced"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending && items.length === 0 ? (
          <p className="text-sm text-[#73636a]">Loading…</p>
        ) : null}
        {items.length === 0 && !pending ? (
          <p className="text-sm text-[#73636a]">
            Partner applications appear here via Supabase Realtime after submission.
          </p>
        ) : null}
        {items.map((n) => (
          <article key={n.id} className="rounded-xl border border-[#ead9db] bg-[#fffdfd] p-3">
            <h4 className="text-sm font-bold text-[#301218]">{n.title}</h4>
            <p className="mt-1 text-sm text-[#4d3439]">{n.body}</p>
            <time className="mt-2 block text-[11px] text-[#9a8589]">
              {new Date(n.created_at).toLocaleString()}
            </time>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

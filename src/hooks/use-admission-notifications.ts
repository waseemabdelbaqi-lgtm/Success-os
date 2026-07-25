"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { listStudentNotifications } from "@/src/actions/admission";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";

export type AdmissionNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

/**
 * Loads student admission notifications and, when Supabase is configured,
 * subscribes to realtime INSERTs on `public.notifications`.
 */
export function useAdmissionNotifications(refreshKey = 0) {
  const [items, setItems] = useState<AdmissionNotification[]>([]);
  const [live, setLive] = useState(false);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const res = await listStudentNotifications();
      if (res.ok) setItems(res.data);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLive(false);
      return;
    }

    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null =
      null;

    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel("admission-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: "audience=eq.student",
          },
          (payload) => {
            const row = payload.new as AdmissionNotification;
            setItems((prev) => {
              if (prev.some((p) => p.id === row.id)) return prev;
              return [row, ...prev];
            });
          },
        )
        .subscribe((status) => {
          setLive(status === "SUBSCRIBED");
        });
    } catch {
      setLive(false);
    }

    return () => {
      if (channel && isSupabaseConfigured()) {
        void getSupabaseBrowserClient().removeChannel(channel);
      }
    };
  }, []);

  return { items, pending, live, reload };
}

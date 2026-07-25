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
          },
          (payload) => {
            const row = payload.new as {
              id: string;
              title: string;
              message: string;
              created_at: string;
              is_read: boolean;
            };
            const mapped: AdmissionNotification = {
              id: row.id,
              title: row.title,
              body: row.message,
              created_at: row.created_at,
              read: row.is_read,
            };
            setItems((prev) => {
              if (prev.some((p) => p.id === mapped.id)) return prev;
              return [mapped, ...prev];
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

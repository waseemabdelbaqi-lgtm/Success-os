"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "sos_companion_session_id";
const ACTOR_KEY = "sos_companion_actor";

async function ensureSession(): Promise<string> {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY) || "";
  const actor = window.localStorage.getItem(ACTOR_KEY) || "partner";
  const res = await fetch("/api/ai-guide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "ensureSession",
      sessionId: id || undefined,
      actor,
      role: "builder",
      label: "جلسة بناء SUCCESS OS",
    }),
  });
  const json = await res.json();
  if (json?.ok && json.session?.id) {
    window.localStorage.setItem(SESSION_KEY, json.session.id);
    return json.session.id as string;
  }
  return id;
}

export async function companionLog(input: {
  type?: string;
  path?: string;
  title?: string;
  detail?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sessionId = await ensureSession();
    await fetch("/api/ai-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record",
        sessionId,
        actor:
          (typeof window !== "undefined" &&
            window.localStorage.getItem(ACTOR_KEY)) ||
          "partner",
        type: input.type || "note",
        path: input.path || (typeof window !== "undefined" ? window.location.pathname : ""),
        title: input.title,
        detail: input.detail,
        meta: input.meta,
        source: "beacon",
      }),
    });
  } catch {
    /* silent — guide must never break product surfaces */
  }
}

/**
 * Silent OS co-pilot beacon: records page views into the living guide.
 */
export function CompanionGuideBeacon(): null {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    // Avoid noisy self-loops on the guide polling itself too aggressively
    lastPath.current = pathname;
    const title =
      typeof document !== "undefined" ? document.title || pathname : pathname;
    void companionLog({
      type: "page_view",
      path: pathname,
      title: `زيارة: ${title}`,
      detail: "تسجيل تلقائي من دليل الشريك الحي",
    });
  }, [pathname]);

  return null;
}

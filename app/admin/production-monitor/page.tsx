"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductionMonitorPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/curriculum-factory?view=monitor");
      setData(await r.json());
    })();
  }, []);

  const snap = (data?.snapshot || {}) as Record<string, unknown>;

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Production monitoring</h1>
      <p>
        <Link href="/admin/production-factory">Factory</Link>
        {" · "}
        <Link href="/admin/review-workbench">Reviews</Link>
      </p>
      <pre style={{ background: "#f7f3ef", padding: 12, overflow: "auto", maxHeight: "80vh" }}>
        {JSON.stringify(snap, null, 2)}
      </pre>
    </main>
  );
}

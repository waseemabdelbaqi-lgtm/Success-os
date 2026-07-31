"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Review = Record<string, unknown>;

export default function ReviewWorkbenchPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [backlog, setBacklog] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [reviewer, setReviewer] = useState("gate4-human-reviewer");

  async function load() {
    const r = await fetch("/api/curriculum-factory?view=reviews");
    const d = await r.json();
    setReviews(d.reviews || []);
    setBacklog(d.backlog || {});
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, decision: "approve" | "reject" | "corrections") {
    const r = await fetch("/api/curriculum-factory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review_decide", reviewTaskId: id, decision, reviewer }),
    });
    const d = await r.json();
    setMessage(JSON.stringify(d.result || d));
    await load();
  }

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Review workbench</h1>
      <p>Source · Rights · Subject · Language · Technical · Final — AI cannot approve its own educational content.</p>
      <p>
        <Link href="/admin/production-factory">Factory</Link>
      </p>
      <label>
        Reviewer identity <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
      </label>
      <h2>Backlog</h2>
      <pre style={{ background: "#f7f3ef", padding: 12 }}>{JSON.stringify(backlog, null, 2)}</pre>
      <h2>Open tasks</h2>
      <ul>
        {reviews.map((r) => (
          <li key={String(r.id)} style={{ marginBottom: 12 }}>
            <b>{String(r.review_type)}</b> — {String(r.title_ar)} ({String(r.book_id)})
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => void decide(String(r.id), "approve")}>Approve</button>
              <button onClick={() => void decide(String(r.id), "corrections")}>Corrections</button>
              <button onClick={() => void decide(String(r.id), "reject")}>Reject</button>
            </div>
          </li>
        ))}
      </ul>
      {message && <p role="status">{message}</p>}
    </main>
  );
}

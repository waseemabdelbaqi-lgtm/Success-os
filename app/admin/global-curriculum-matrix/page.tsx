"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlobalCurriculumMatrixPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [offset, setOffset] = useState(0);

  async function load(off = 0) {
    const r = await fetch(`/api/global-curriculum?view=matrix&limit=50&offset=${off}`);
    const d = await r.json();
    setRows(d.rows || []);
    setOffset(off);
  }

  useEffect(() => {
    void load(0);
  }, []);

  return (
    <main dir="ltr" style={{ padding: "1.5rem", maxWidth: 1200, margin: "0 auto", fontFamily: "Georgia, serif" }}>
      <h1>Global curriculum matrix (Jordan active)</h1>
      <p>Future countries stay inactive. No fake COMPLETE rows.</p>
      <p>
        <Link href="/admin/jordan-coverage">Jordan coverage</Link>
        {" · "}
        <Link href="/admin/country-wizard">Country wizard</Link>
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {["Grade", "Term", "Pathway", "Subject", "Type", "Status", "Rights", "Edition", "Blocker"].map((h) => (
              <th key={h} style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 4 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)}>
              <td style={{ padding: 4 }}>{String(r.grade_code)}</td>
              <td style={{ padding: 4 }}>{String(r.term_code)}</td>
              <td style={{ padding: 4 }}>{String(r.pathway_code)}</td>
              <td style={{ padding: 4 }}>{String(r.subject_title_ar)}</td>
              <td style={{ padding: 4 }}>{String(r.book_type)}</td>
              <td style={{ padding: 4 }}>{String(r.matrix_status)}</td>
              <td style={{ padding: 4 }}>{String(r.rights_status)}</td>
              <td style={{ padding: 4 }}>{String(r.edition_label)}</td>
              <td style={{ padding: 4, maxWidth: 220 }}>{String(r.blocker || "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button disabled={offset <= 0} onClick={() => void load(Math.max(0, offset - 50))}>
          Prev
        </button>{" "}
        <button onClick={() => void load(offset + 50)}>Next</button>
      </div>
    </main>
  );
}

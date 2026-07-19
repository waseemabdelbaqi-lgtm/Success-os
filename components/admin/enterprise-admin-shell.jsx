"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const FALLBACK_GROUP_ORDER = [
  "overview",
  "people",
  "orgs",
  "academic",
  "admissions",
  "marketing",
  "hr",
  "finance",
  "partners",
  "workflow",
  "system",
  "curriculum",
];

function itemLabel(item, lang) {
  if (lang === "ar" && item.labelAr) return item.labelAr;
  return item.label || item.id;
}

function groupLabel(groupId, labels, labelsAr, lang) {
  if (lang === "ar" && labelsAr?.[groupId]) return labelsAr[groupId];
  return labels?.[groupId] || groupId;
}

export function EnterpriseAdminShell({ children }) {
  const pathname = usePathname();
  const [meta, setMeta] = useState(null);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("ar");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    fetch("/api/enterprise-admin?view=meta", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        setMeta(payload);
        const order = payload.groupOrder || FALLBACK_GROUP_ORDER;
        const initial = {};
        for (const id of order) initial[id] = true;
        setOpenSections(initial);
      })
      .catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.eaTheme = dark ? "dark" : "light";
  }, [dark]);

  const groups = useMemo(() => {
    const nav = meta?.nav || [];
    const order = meta?.groupOrder || FALLBACK_GROUP_ORDER;
    const labels = meta?.navGroups || {};
    const labelsAr = meta?.navGroupsAr || {};
    return order
      .map((id) => ({
        id,
        label: groupLabel(id, labels, labelsAr, lang),
        items: nav.filter((n) => n.group === id),
      }))
      .filter((g) => g.items.length);
  }, [meta, lang]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => {
          const en = String(i.label || "").toLowerCase();
          const ar = String(i.labelAr || "");
          return en.includes(q) || ar.includes(search.trim());
        }),
      }))
      .filter((g) => g.items.length);
  }, [groups, search]);

  function toggleSection(id) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const bg = dark ? "#0b1220" : "#f4f6f8";
  const panel = dark ? "#111827" : "#ffffff";
  const text = dark ? "#e5e7eb" : "#111827";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const border = dark ? "#1f2937" : "#e5e7eb";
  const accent = "#0f766e";
  const sectionBg = dark ? "#0f172a" : "#f8fafc";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: bg,
        color: text,
        fontFamily: "system-ui, sans-serif",
      }}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <aside
        style={{
          width: collapsed ? 72 : 280,
          background: panel,
          borderInlineEnd: `1px solid ${border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width 0.15s ease",
        }}
      >
        <div style={{ padding: "1rem", borderBottom: `1px solid ${border}` }}>
          <Link
            href="/dashboard/admin"
            style={{ color: text, textDecoration: "none", fontWeight: 700 }}
          >
            {collapsed
              ? "EA"
              : lang === "ar"
                ? "لوحة المشرف"
                : "Enterprise Admin"}
          </Link>
          <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
            {collapsed
              ? "v"
              : `ADMIN-01 · v${meta?.version || "—"} · ${filteredGroups.length} ${lang === "ar" ? "أقسام" : "sections"}`}
          </div>
        </div>
        <div style={{ padding: "0.75rem" }}>
          {!collapsed ? (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === "ar" ? "بحث في الأقسام…" : "Search sections…"
              }
              style={{
                width: "100%",
                padding: "0.45rem 0.6rem",
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: dark ? "#0b1220" : "#fff",
                color: text,
              }}
            />
          ) : null}
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "0 0.5rem 1rem" }}>
          {filteredGroups.map((g) => {
            const isOpen = search.trim() ? true : openSections[g.id] !== false;
            return (
              <div
                key={g.id}
                style={{
                  marginBottom: "0.65rem",
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  background: sectionBg,
                  overflow: "hidden",
                }}
              >
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(g.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "0.55rem 0.7rem",
                      border: 0,
                      background: "transparent",
                      color: text,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: "start",
                    }}
                  >
                    <span>
                      {g.label}
                      <span
                        style={{
                          color: muted,
                          fontWeight: 500,
                          marginInlineStart: 6,
                        }}
                      >
                        ({g.items.length})
                      </span>
                    </span>
                    <span style={{ color: muted }}>{isOpen ? "▾" : "▸"}</span>
                  </button>
                ) : null}
                {isOpen || collapsed
                  ? g.items.map((item) => {
                      const label = itemLabel(item, lang);
                      const active =
                        item.href === "/dashboard/admin"
                          ? pathname === "/dashboard/admin"
                          : pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          title={label}
                          style={{
                            display: "block",
                            padding: collapsed ? "0.55rem" : "0.42rem 0.75rem",
                            margin: collapsed ? "0 0 2px" : "0 0.35rem 2px",
                            borderRadius: 8,
                            textDecoration: "none",
                            color: active ? "#fff" : text,
                            background: active ? accent : "transparent",
                            fontSize: 13,
                            textAlign: collapsed ? "center" : "start",
                          }}
                        >
                          {collapsed ? label.slice(0, 1) : label}
                        </Link>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </nav>
        <div
          style={{
            padding: "0.75rem",
            borderTop: `1px solid ${border}`,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            style={btnStyle(border, text)}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            style={btnStyle(border, text)}
          >
            {dark
              ? lang === "ar"
                ? "فاتح"
                : "Light"
              : lang === "ar"
                ? "داكن"
                : "Dark"}
          </button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            borderBottom: `1px solid ${border}`,
            background: panel,
            flexWrap: "wrap",
          }}
        >
          <strong style={{ flex: 1 }}>
            {lang === "ar" ? "SUCCESS OS — لوحة المشرف" : "Success OS Admin"}
          </strong>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              padding: "0.35rem",
              borderRadius: 8,
              border: `1px solid ${border}`,
              background: panel,
              color: text,
            }}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
          <Link href="/admin" style={{ fontSize: 13, color: accent }}>
            {lang === "ar" ? "عمليات الأردن" : "Jordan Ops"}
          </Link>
          <Link href="/" style={{ fontSize: 13, color: muted }}>
            {lang === "ar" ? "الرئيسية" : "Home"}
          </Link>
        </header>
        <main style={{ padding: "1rem", flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

function btnStyle(border, text) {
  return {
    border: `1px solid ${border}`,
    background: "transparent",
    color: text,
    borderRadius: 8,
    padding: "0.35rem 0.55rem",
    cursor: "pointer",
    fontSize: 12,
  };
}

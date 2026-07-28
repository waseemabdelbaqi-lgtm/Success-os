"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Library, Menu, X } from "lucide-react";
import { CURRICULUM_TREE, lessonHref } from "@/src/lib/digital-library/curriculum-map";
import type { CurriculumNode } from "@/src/lib/digital-library/types";

type Props = {
  activePath?: string[];
};

function NodeList({
  nodes,
  trail,
  activePath,
  depth,
}: {
  nodes: CurriculumNode[];
  trail: string[];
  activePath?: string[];
  depth: number;
}) {
  return (
    <ul className="dl-nav-list" data-depth={depth}>
      {nodes.map((node) => {
        const next = [...trail, node.slug];
        const isActive = activePath?.join("/") === next.join("/");
        const isBranchActive = activePath?.slice(0, next.length).join("/") === next.join("/");
        if (node.lessonSlug) {
          return (
            <li key={node.slug}>
              <Link
                href={lessonHref(next)}
                className={isActive ? "leaf active" : "leaf"}
                aria-current={isActive ? "page" : undefined}
              >
                {node.name}
              </Link>
            </li>
          );
        }
        return (
          <li key={node.slug}>
            <details open={isBranchActive || depth < 1}>
              <summary>
                <ChevronRight size={14} />
                {node.name}
              </summary>
              {node.children ? (
                <NodeList
                  nodes={node.children}
                  trail={next}
                  activePath={activePath}
                  depth={depth + 1}
                />
              ) : null}
            </details>
          </li>
        );
      })}
    </ul>
  );
}

export function LibrarySidebar({ activePath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const regions = useMemo(() => CURRICULUM_TREE, []);

  return (
    <>
      <button
        type="button"
        className="dl-sidebar-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open curriculum navigation"
      >
        <Menu size={18} />
        Curriculum
      </button>

      <aside className={`dl-sidebar ${mobileOpen ? "open" : ""}`} aria-label="Global curriculum tree">
        <div className="dl-sidebar-top">
          <Link href="/digital-library" className="dl-brand">
            <Library size={18} />
            <span>Global Digital Library</span>
          </Link>
          <button
            type="button"
            className="dl-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <p className="dl-sidebar-note">Region → country → curriculum → level → subject → chapter → lesson</p>
        <nav className="dl-sidebar-nav">
          <NodeList nodes={regions} trail={[]} activePath={activePath} depth={0} />
        </nav>
      </aside>
      {mobileOpen ? (
        <button
          type="button"
          className="dl-sidebar-backdrop"
          aria-label="Dismiss navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
    </>
  );
}

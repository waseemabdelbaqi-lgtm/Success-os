"use client";

import dynamic from "next/dynamic";

const ThreeDCanvasInner = dynamic(
  () =>
    import("@/src/components/digital-library/ThreeDCanvas").then((m) => m.ThreeDCanvas),
  {
    ssr: false,
    loading: () => (
      <section className="dl-panel">
        <p className="dl-lead">Loading 3D visualizer…</p>
        <div className="dl-canvas-frame" style={{ display: "grid", placeItems: "center" }}>
          <span style={{ color: "#9db0c5" }}>Initializing WebGL…</span>
        </div>
      </section>
    ),
  },
);

export function ThreeDCanvasLazy(props: {
  kind?: "photoelectric" | "orbital" | "wave" | "numberline";
  caption: string;
}) {
  return <ThreeDCanvasInner {...props} />;
}

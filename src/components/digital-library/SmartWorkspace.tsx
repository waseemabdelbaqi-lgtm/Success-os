"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "draw" | "markdown";

type Props = {
  storageKey: string;
};

export function SmartWorkspace({ storageKey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<Mode>("draw");
  const [markdown, setMarkdown] = useState("");
  const [ink, setInk] = useState("#0f2744");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { markdown?: string; image?: string; mode?: Mode };
      if (parsed.markdown) setMarkdown(parsed.markdown);
      if (parsed.mode) setMode(parsed.mode);
      if (parsed.image && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx || !canvasRef.current) return;
          ctx.drawImage(img, 0, 0);
        };
        img.src = parsed.image;
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const ratio = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = Math.max(280, Math.min(420, Math.round(w * 0.55)));
      const prev = canvas.toDataURL();
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = "#f7fafc";
      ctx.fillRect(0, 0, w, h);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = prev;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function persist(nextMarkdown = markdown) {
    const image = canvasRef.current?.toDataURL("image/png") || "";
    localStorage.setItem(
      storageKey,
      JSON.stringify({ markdown: nextMarkdown, image, mode }),
    );
  }

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "draw") return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.strokeStyle = ink;
    ctx.lineWidth = e.pointerType === "pen" ? Math.max(1.5, e.pressure * 4) : 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || mode !== "draw") return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    if (e.pointerType === "pen") {
      ctx.lineWidth = Math.max(1.2, e.pressure * 5);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    persist();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#f7fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    persist();
  }

  return (
    <section id="workspace" className="dl-panel scroll-mt-24" aria-labelledby="ws-heading">
      <header className="dl-panel-head">
        <p className="dl-kicker">Module C</p>
        <h2 id="ws-heading">Cross-platform interactive workspace</h2>
        <p className="dl-lead">
          Free-hand sketching (touch / Apple Pencil via Pointer Events) or Markdown sandbox — auto-saved
          to this device.
        </p>
      </header>

      <div className="dl-toolbar" role="toolbar" aria-label="Workspace modes">
        <button
          type="button"
          className={mode === "draw" ? "active" : ""}
          onClick={() => {
            setMode("draw");
            persist();
          }}
        >
          Draw / Pencil
        </button>
        <button
          type="button"
          className={mode === "markdown" ? "active" : ""}
          onClick={() => {
            setMode("markdown");
            persist();
          }}
        >
          Code / Markdown
        </button>
        <label className="dl-ink">
          Ink
          <input
            type="color"
            value={ink}
            onChange={(e) => setInk(e.target.value)}
            aria-label="Ink color"
          />
        </label>
        <button type="button" onClick={clearCanvas}>
          Clear canvas
        </button>
        <button type="button" onClick={() => persist()}>
          Save now
        </button>
      </div>

      <div className={mode === "draw" ? "dl-ws-stage" : "dl-ws-stage muted"}>
        <canvas
          ref={canvasRef}
          className="dl-draw-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      {mode === "markdown" ? (
        <textarea
          className="dl-md-editor"
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value);
            persist(e.target.value);
          }}
          spellCheck={false}
          placeholder={"# Scratch pad\n\n$\\mathrm{KE}_{max} = hf - \\phi$\n\n- threshold notes\n- experimental reminders"}
          aria-label="Markdown workspace"
        />
      ) : null}
    </section>
  );
}

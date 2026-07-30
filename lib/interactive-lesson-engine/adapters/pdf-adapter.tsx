"use client";

/**
 * PdfAdapter — Mozilla PDF.js for digital book pages inside lessons.
 * Replaceable: commercial PDF SDK via same src/page contract.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

type PdfAdapterProps = {
  src: string;
  page?: number;
  title?: string;
};

export function PdfAdapter({ src, page = 1, title }: PdfAdapterProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const pdfjs = await import("pdfjs-dist");
        // Use CDN worker to avoid bundler path fragility in Next.
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        const doc = await pdfjs.getDocument({ url: src }).promise;
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: 1.15 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await pdfPage.render({
          canvasContext: ctx,
          canvas,
          viewport,
        }).promise;
        if (!cancelled) {
          setStatus("ready");
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(String((err as Error)?.message || err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, page]);

  return (
    <div data-adapter="pdfjs" style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
      {title ? (
        <div style={{ padding: "0.5rem 0.75rem", fontSize: 12, background: "#f8fafc" }}>{title}</div>
      ) : null}
      {status === "loading" ? (
        <div style={{ padding: "1rem", fontSize: 13, color: "#64748b" }}>Loading PDF…</div>
      ) : null}
      {status === "error" ? (
        <div style={{ padding: "0.75rem", fontSize: 12, color: "#b45309" }}>
          PDF unavailable ({error}). Provide a valid `src` or use downloadable attachments.
        </div>
      ) : null}
      <canvas ref={canvasRef} style={{ width: "100%", display: status === "ready" ? "block" : "none" }} />
    </div>
  );
}

export const PDF_ADAPTER_META = {
  id: "pdfjs",
  replaceWith: ["commercial-pdf-sdk"],
  license: "Apache-2.0",
  monthlyCostUsd: 0,
};

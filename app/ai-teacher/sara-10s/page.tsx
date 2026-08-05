import { redirect } from "next/navigation";

/**
 * Mandatory Original Human Teachers Policy public Demo (10s Sara).
 * Canonical static surface lives under /demo/sara-10s/ so it can also be
 * served from a public CDN without localhost.
 */
export default function Sara10sDemoPage() {
  redirect("/demo/sara-10s/");
}

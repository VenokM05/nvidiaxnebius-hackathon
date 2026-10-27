// Browser-side review cache.
//
// Why this exists: the server keeps completed reviews in an in-memory map,
// which is correct on a single long-lived process (`npm run dev`, a normal
// Node host) but not on serverless — on Vercel each request can land on a
// fresh lambda, so a results page rendered a second later finds nothing and
// the demo dead-ends. Caching the payload the browser already received makes
// the run → results flow work end-to-end on the deployed demo without adding
// a database.
//
// Scope limit, stated honestly: this is per-browser. A link opened on another
// device still needs the server store, so shared permalinks are only durable
// where the process is long-lived.

import type { ReviewResult } from "@/lib/types";

const KEY = (id: string) => `referee:review:${id}`;
const INDEX = "referee:index";
const KEEP = 8;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]) {
  try {
    localStorage.setItem(INDEX, JSON.stringify(ids.slice(-KEEP)));
  } catch {
    /* storage full or unavailable — the server store still has this review */
  }
}

/** Best-effort: a failed cache write must never block navigation to results. */
export function cacheReview(review: ReviewResult) {
  try {
    localStorage.setItem(KEY(review.id), JSON.stringify(review));
    const ids = readIndex().filter((x) => x !== review.id);
    ids.push(review.id);
    for (const dropped of ids.slice(0, Math.max(0, ids.length - KEEP))) {
      localStorage.removeItem(KEY(dropped));
    }
    writeIndex(ids.slice(-KEEP));
  } catch {
    /* quota exceeded — fall back to the server-side store */
  }
}

/** Raw value or "" — "" so it can serve as a stable useSyncExternalStore snapshot. */
export function cachedReviewRaw(id: string): string {
  try {
    return localStorage.getItem(KEY(id)) ?? "";
  } catch {
    return "";
  }
}

export function parseCachedReview(raw: string): ReviewResult | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    // Shape check only far enough to render safely.
    return parsed && typeof parsed === "object" && Array.isArray((parsed as ReviewResult).findings)
      ? (parsed as ReviewResult)
      : null;
  } catch {
    return null;
  }
}

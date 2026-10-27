"use client";

import Results from "@/components/results";
import { cachedReviewRaw, parseCachedReview } from "@/lib/review-cache";
import { useMemo, useSyncExternalStore } from "react";

// localStorage never changes underneath this view, so the subscription is a
// no-op; useSyncExternalStore is here for its hydration behaviour — server
// renders the fallback, client re-renders with the cached review.
const noSubscribe = () => () => {};
const emptySnapshot = () => "";

/**
 * Renders a review the server no longer has in memory — i.e. the normal case
 * on serverless, where the results page hits a different lambda than the POST.
 * The payload was already delivered to this browser, so read it from there.
 */
export default function ClientReview({
  id,
  fallback,
}: {
  id: string;
  fallback: React.ReactElement;
}) {
  const raw = useSyncExternalStore(
    noSubscribe,
    () => cachedReviewRaw(id),
    emptySnapshot
  );
  const review = useMemo(() => parseCachedReview(raw), [raw]);

  return review ? <Results review={review} /> : fallback;
}

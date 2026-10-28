import {
  budgetRemaining,
  clientIp,
  declaredBodyTooLarge,
  payloadTooLarge,
  rateLimit,
  recordSpend,
} from "@/lib/guard";
import { hasNebiusKey } from "@/lib/llm";
import { runReview, saveReview } from "@/lib/review";
import type { ReviewRequest } from "@/lib/types";
import { NextResponse } from "next/server";

/**
 * A model review fans out to up to 10 files in parallel, so the platform must
 * not reap the function first. Vercel allows 60s here, and lib/llm.ts aborts
 * each call at 45s — the server always answers before either the platform or the
 * browser (100s, review-form.tsx) gives up.
 */
export const maxDuration = 60;

/** Carries an HTTP status through the single catch below. */
class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  // Declared size first: rejecting a 50 MB paste before parsing it is the
  // difference between a 413 and an out-of-memory cold start.
  if (declaredBodyTooLarge(request)) {
    return NextResponse.json(
      { error: "That diff is too large to review. Trim it to under 1.5 MB." },
      { status: 413 }
    );
  }

  // The endpoint is public and, with a key configured, spends money per hit.
  const limit = rateLimit(clientIp(request));
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: `Too many reviews from this address — try again in ${limit.retryAfterSec}s.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  try {
    const body = (await request.json()) as ReviewRequest;
    if (payloadTooLarge(body))
      throw new HttpError(
        "That diff is too large to review. Trim it to under 1.5 MB.",
        413
      );

    // Out of demo budget → still answer, on the free deterministic analyzer.
    const result = await runReview(body, {
      allowModel: budgetRemaining() > 0,
    });
    saveReview(result);
    recordSpend(result.usage.costUsd);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof HttpError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    const message = err instanceof Error ? err.message : "Review failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Readiness probe. Reports which engine the deployed function would use without
 * revealing anything about the key itself.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: hasNebiusKey() ? "nebius" : "static",
    modelBudgetUsd: Number(budgetRemaining().toFixed(4)),
  });
}

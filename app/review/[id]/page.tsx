import ClientReview from "@/components/client-review";
import Results from "@/components/results";
import { getReview } from "@/lib/review";
import Link from "next/link";
import { Suspense } from "react";

// In-memory store data is request-time by nature — render this route blocking.
export const instant = false;

function LeftStadium() {
  return (
    <div className="mx-auto grid min-h-60 max-w-md place-items-center px-5 text-center">
      <div>
        <p className="text-lg font-medium">This review left the stadium.</p>
        <p className="mt-2 text-sm text-fg-muted">
          Results are kept in memory for the demo session — start a fresh
          review.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary-bright transition-[var(--transition-smooth)]"
        >
          New review
        </Link>
      </div>
    </div>
  );
}

async function ReviewBody({ id }: { id: string }) {
  const review = getReview(id);

  // Server has it (long-lived process) → render it. Server lost it (serverless
  // cold start) → recover from this browser's copy of the same payload.
  if (!review) return <ClientReview id={id} fallback={<LeftStadium />} />;

  return <Results review={review} />;
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-6 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-bright font-mono text-xs font-bold text-black">
          R
        </span>
        <span className="font-semibold tracking-tight">Repo Referee</span>
      </header>
      <Suspense
        fallback={
          <p className="py-16 text-center text-sm text-fg-muted">
            Reviewing the tape…
          </p>
        }
      >
        <ReviewBody id={id} />
      </Suspense>
    </main>
  );
}

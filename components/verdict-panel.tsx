"use client";

import { CLOSED_MODEL_REFERENCE, PRICING_AS_OF, costUsd } from "@/lib/pricing";
import type { ReviewResult } from "@/lib/types";

const VERDICT_META = {
  approve: {
    label: "Green light",
    sub: "No blocking issues — safe to merge",
    color: "text-primary-bright",
    ring: "border-primary/45 bg-primary-dim",
    mark: "✓",
  },
  flag: {
    label: "Yellow card",
    sub: "Fix the flagged issues, then re-run",
    color: "text-medium",
    ring: "border-medium/45 bg-medium/10",
    mark: "▮",
  },
  reject: {
    label: "Red card",
    sub: "Critical issues — merge blocked",
    color: "text-critical",
    ring: "border-critical/45 bg-critical/10",
    mark: "▮",
  },
} as const;

export default function VerdictPanel({ review }: { review: ReviewResult }) {
  const v = VERDICT_META[review.verdict];
  const estInputTokens = Math.round(
    review.files.reduce((s, f) => s + f.raw.length, 0) / 4
  );
  const closedCost = costUsd(
    CLOSED_MODEL_REFERENCE,
    estInputTokens,
    Math.round(estInputTokens * 0.35)
  );
  const openCost = review.usage.costUsd;
  const savings =
    review.provider === "nebius" && closedCost > 0
      ? `${Math.max(0, Math.round((1 - openCost / closedCost) * 100))}% cheaper`
      : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* verdict + risk */}
      <div className={`panel flex min-w-0 items-center gap-5 p-5 ${v.ring}`}>
        <span className={`text-3xl font-bold ${v.color}`}>{v.mark}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-lg font-semibold tracking-tight ${v.color}`}>
            {v.label}
          </p>
          <p className="text-sm text-fg-muted">{v.sub}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-width duration-700 ${
                review.verdict === "reject"
                  ? "bg-critical"
                  : review.verdict === "flag"
                    ? "bg-medium"
                    : "bg-primary"
              }`}
              style={{ width: `${review.riskScore}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-fg-faint">
            risk score {review.riskScore}/100 · {review.findings.length}{" "}
            findings · {review.elapsedMs} ms
          </p>
        </div>
      </div>

      {/* cost scoreboard */}
      <div className="panel min-w-0 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-faint">
          Cost scoreboard
        </p>
        {review.provider === "nebius" ? (
          <>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-primary-bright">
              ${openCost.toFixed(4)}
              {savings && (
                <span className="ml-2 align-middle text-xs font-medium text-fg-muted">
                  {savings}
                </span>
              )}
            </p>
            <dl className="mt-3 space-y-1.5 text-xs text-fg-muted">
              <div className="flex justify-between gap-6">
                <dt>
                  Tokens in / out{" "}
                  <span className="text-fg-faint">· measured</span>
                </dt>
                <dd className="font-mono text-fg">
                  {review.usage.inputTokens.toLocaleString()} /{" "}
                  {review.usage.outputTokens.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Closed-model estimate</dt>
                <dd className="font-mono text-fg">
                  ${closedCost.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt>Model</dt>
                <dd className="max-w-[16rem] truncate font-mono text-fg">
                  {review.model}
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-2 font-mono text-[10px] leading-relaxed text-fg-faint">
              Rates as of {PRICING_AS_OF}. Open cost is measured from the API
              response; the closed-model figure is a same-workload estimate, not
              an invoice.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-fg">
              $0.0000
            </p>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">
              Ran on the deterministic <span className="text-fg">pre-analyzer</span>{" "}
              (zero tokens). Set <span className="font-mono text-fg">NEBIUS_API_KEY</span>{" "}
              to let {review.usage.model} review
              every line — a closed frontier API would cost ≈{" "}
              <span className="font-mono text-fg">${closedCost.toFixed(4)}</span>{" "}
              for this diff.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import type { ReviewResult, Severity } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import DiffViewer from "./diff-viewer";
import FindingCard from "./finding-card";
import { Pill } from "./ui";
import VerdictPanel from "./verdict-panel";

const FILTERS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Red" },
  { key: "medium", label: "Yellow" },
  { key: "low", label: "Low" },
];

export default function Results({ review }: { review: ReviewResult }) {
  const [activeFile, setActiveFile] = useState(review.files[0]?.path ?? "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const byFile = useMemo(() => {
    const m = new Map<string, typeof review.findings>();
    for (const f of review.findings) {
      m.set(f.file, [...(m.get(f.file) ?? []), f]);
    }
    return m;
  }, [review]);

  const shown = (byFile.get(activeFile) ?? []).filter(
    (f) =>
      filter === "all" ||
      (filter === "critical" && (f.severity === "critical" || f.severity === "high")) ||
      (filter === "medium" && f.severity === "medium") ||
      (filter === "low" && (f.severity === "low" || f.severity === "info"))
  );

  const findingsForDiff = byFile.get(activeFile) ?? [];

  return (
    <div className="space-y-5 animate-[var(--animate-fade-up)]">
      {/* PR header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-ring rounded"
          >
            ← new review
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {review.title}
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">
            {review.sourceUrl ? (
              <a
                href={review.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline font-mono text-xs"
              >
                {review.sourceUrl}
              </a>
            ) : (
              <>
                {review.author} · {review.files.length} file
                {review.files.length === 1 ? "" : "s"} ·{" "}
                {review.files.reduce((s, f) => s + f.additions, 0)} added lines
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(review.modelFailures ?? 0) > 0 || (review.droppedFindings ?? 0) > 0 ? (
            <Pill className="text-medium" title="Model coverage was incomplete">
              ⚑ partial review
            </Pill>
          ) : null}
          <Pill className={review.provider === "nebius" ? "text-primary-bright" : ""}>
            {review.provider === "nebius"
              ? "Nebius Token Factory"
              : "static pre-analyzer mode"}
          </Pill>
        </div>
      </div>

      <VerdictPanel review={review} />

      <p className="text-sm text-fg-muted">{review.summary}</p>

      {/* two-pane workspace */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* findings */}
        <section aria-label="Findings" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-faint">
              Findings ({shown.length})
            </h2>
            <div className="flex gap-1 rounded-lg bg-surface p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-[var(--transition-smooth)] ${
                    filter === f.key
                      ? "bg-surface-2 text-fg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="panel grid place-items-center p-10 text-sm text-fg-muted">
              No cards for this file — clean sheet. 🟢
            </div>
          ) : (
            shown.map((f) => (
              <div
                key={f.id}
                onMouseEnter={() => setHighlightLine(f.line)}
                onMouseLeave={() => setHighlightLine(null)}
              >
                <FindingCard finding={f} highlight={highlightLine === f.line} />
              </div>
            ))
          )}
        </section>

        {/* diff */}
        <section aria-label="Diff" className="min-w-0 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {review.files.map((f) => (
              <button
                key={f.path}
                onClick={() => setActiveFile(f.path)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-[var(--transition-smooth)] focus-ring ${
                  activeFile === f.path
                    ? "border-primary/50 bg-primary-dim text-primary-bright"
                    : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                {f.path.split("/").pop()}
                <span className="ml-2 text-diff-add">+{f.additions}</span>
                <span className="ml-1 text-diff-del">−{f.deletions}</span>
                {(byFile.get(f.path)?.length ?? 0) > 0 && (
                  <span className="ml-2 text-medium">
                    ⚑{byFile.get(f.path)!.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <DiffViewer
            raw={review.files.find((f) => f.path === activeFile)?.raw ?? ""}
            findings={findingsForDiff}
            onLineClick={(ln) => setHighlightLine(ln)}
          />
        </section>
      </div>
    </div>
  );
}

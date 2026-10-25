"use client";

import type { Finding } from "@/lib/types";
import { useState } from "react";
import { CategoryTag, SeverityBadge } from "./severity";

export default function FindingCard({
  finding,
  highlight = false,
}: {
  finding: Finding;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const f = finding;
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className={`panel w-full cursor-pointer p-4 text-left transition-[var(--transition-smooth)] hover:border-line-strong ${
        highlight ? "border-primary/60 shadow-[var(--glow-primary)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={f.severity} />
        <CategoryTag category={f.category} />
        {f.source === "static" ? (
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-faint">
            pre-analyzer
          </span>
        ) : (
          <span className="rounded border border-primary/30 bg-primary-dim px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary-bright">
            model
          </span>
        )}
        <span className="ml-auto font-mono text-[11px] text-fg-faint">
          L{f.line}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-fg">{f.title}</p>

      {open && (
        <div className="mt-2 space-y-2 text-[13px] leading-relaxed">
          <p className="text-fg-muted">{f.detail}</p>
          <p className="text-fg">
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary-bright">
              Fix ·{" "}
            </span>
            {f.suggestion}
          </p>
          {f.evidence && (
            <pre className="overflow-x-auto rounded-md border border-line bg-bg px-2.5 py-1.5 font-mono text-[11px] text-fg-muted">
              {f.evidence}
            </pre>
          )}
        </div>
      )}
    </button>
  );
}

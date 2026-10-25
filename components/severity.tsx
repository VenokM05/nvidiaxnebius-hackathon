import type { FindingCategory, Severity } from "@/lib/types";

const SEV: Record<
  Severity,
  { label: string; card: string; dot: string; text: string }
> = {
  critical: {
    label: "Critical",
    card: "bg-critical",
    dot: "bg-critical",
    text: "text-critical",
  },
  high: { label: "High", card: "bg-critical", dot: "bg-critical", text: "text-critical" },
  medium: { label: "Medium", card: "bg-medium", dot: "bg-medium", text: "text-medium" },
  low: { label: "Low", card: "bg-low", dot: "bg-low", text: "text-low" },
  info: { label: "Info", card: "bg-info", dot: "bg-info", text: "text-info" },
};

/** Referee-card chip: red card (critical/high), yellow card (medium), plain dot otherwise. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEV[severity];
  const isCard = severity === "critical" || severity === "high" || severity === "medium";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
      {isCard ? (
        <span
          className={`${s.card} inline-block h-3.5 w-2.5 rounded-[2px] shadow-[0_0_8px_-1px_hsl(var(--primary)/0)]`}
          aria-hidden
        />
      ) : (
        <span className={`${s.dot} inline-block size-1.5 rounded-full`} aria-hidden />
      )}
      <span className={s.text}>{s.label}</span>
    </span>
  );
}

export function CategoryTag({ category }: { category: FindingCategory }) {
  return (
    <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-faint">
      {category}
    </span>
  );
}

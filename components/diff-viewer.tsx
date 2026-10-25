"use client";

import { parseFileLines } from "@/lib/diff";
import type { Finding } from "@/lib/types";
import { useMemo } from "react";

const SEV_BAR: Record<Finding["severity"], string> = {
  critical: "bg-critical",
  high: "bg-critical",
  medium: "bg-medium",
  low: "bg-low",
  info: "bg-info",
};

export default function DiffViewer({
  raw,
  findings,
  onLineClick,
}: {
  raw: string;
  findings: Finding[];
  onLineClick?: (line: number) => void;
}) {
  const parsed = useMemo(() => parseFileLines(raw), [raw]);
  const byLine = useMemo(() => {
    const m = new Map<number, Finding[]>();
    for (const f of findings) {
      const arr = m.get(f.line) ?? [];
      arr.push(f);
      m.set(f.line, arr);
    }
    return m;
  }, [findings]);

  return (
    <div className="overflow-auto rounded-xl border border-line bg-bg font-mono text-[12px] leading-[1.7]">
      <table className="w-full border-collapse">
        <tbody>
          {parsed.map((l, i) => {
            const hits =
              l.newLine !== undefined ? byLine.get(l.newLine) : undefined;
            const sev = hits?.[0]?.severity;
            const bg =
              l.type === "add"
                ? "bg-[hsl(var(--diff-add-bg)/0.55)]"
                : l.type === "del"
                  ? "bg-[hsl(var(--diff-del-bg)/0.55)]"
                  : l.type === "hunk"
                    ? "bg-[hsl(var(--diff-hunk-bg))]"
                    : "";
            return (
              <tr
                key={i}
                className={
                  hits
                    ? "cursor-pointer hover:bg-surface-2/60"
                    : "hover:bg-surface/40"
                }
                onClick={() =>
                  hits && l.newLine !== undefined && onLineClick?.(l.newLine)
                }
              >
                <td className="w-10 select-none border-r border-line/60 px-2 text-right align-top text-[10px] text-fg-faint">
                  {l.oldLine ?? ""}
                </td>
                <td className="w-10 select-none border-r border-line/60 px-2 text-right align-top text-[10px] text-fg-faint">
                  {l.newLine ?? ""}
                </td>
                <td
                  className={`w-1 p-0 ${sev ? SEV_BAR[sev] : ""}`}
                  aria-hidden
                />
                <td
                  className={`w-full whitespace-pre px-3 align-top ${bg} ${
                    l.type === "add"
                      ? "text-diff-add"
                      : l.type === "del"
                        ? "text-diff-del"
                        : l.type === "hunk"
                          ? "text-diff-hunk"
                          : l.type === "meta"
                            ? "text-fg-faint"
                            : "text-fg-muted"
                  }`}
                >
                  {l.text || " "}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import type { DiffFile } from "./types";

export type DiffLineType = "add" | "del" | "ctx" | "hunk" | "meta";

export interface ParsedLine {
  type: DiffLineType;
  text: string;
  oldLine?: number;
  newLine?: number;
}

/** Split a unified diff into per-file chunks. */
export function parseDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: { path: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const raw = current.lines.join("\n");
    let additions = 0;
    let deletions = 0;
    for (const l of current.lines) {
      if (l.startsWith("+") && !l.startsWith("+++")) additions++;
      else if (l.startsWith("-") && !l.startsWith("---")) deletions++;
    }
    files.push({ path: current.path, additions, deletions, raw });
    current = null;
  };

  for (const line of diff.split("\n")) {
    const m = /^diff --git a\/.+ b\/(.+)$/.exec(line);
    if (m) {
      flush();
      current = { path: m[1], lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();
  return files;
}

/** Turn one file's raw diff into rendered lines with new-side line numbers. */
export function parseFileLines(raw: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  let oldNo = 0;
  let newNo = 0;

  for (const line of raw.split("\n")) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      oldNo = parseInt(hunk[1], 10);
      newNo = parseInt(hunk[2], 10);
      out.push({ type: "hunk", text: line });
      continue;
    }
    if (
      line.startsWith("diff --git") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("similarity") ||
      line.startsWith("rename ")
    ) {
      out.push({ type: "meta", text: line });
      continue;
    }
    if (line.startsWith("+")) {
      out.push({ type: "add", text: line.slice(1), newLine: newNo++ });
    } else if (line.startsWith("-")) {
      out.push({ type: "del", text: line.slice(1), oldLine: oldNo++ });
    } else if (line.startsWith("\\")) {
      out.push({ type: "meta", text: line });
    } else {
      out.push({
        type: "ctx",
        text: line.startsWith(" ") ? line.slice(1) : line,
        oldLine: oldNo++,
        newLine: newNo++,
      });
    }
  }
  return out;
}

/** Added lines with their new-side line numbers — the LLM's review surface. */
export function addedLines(
  raw: string
): { line: number; text: string }[] {
  return parseFileLines(raw)
    .filter((l) => l.type === "add" && l.newLine)
    .map((l) => ({ line: l.newLine!, text: l.text }));
}

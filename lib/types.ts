export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "security"
  | "bug"
  | "performance"
  | "reliability"
  | "style";

export interface Finding {
  id: string;
  file: string;
  /** line number in the new version of the file (best effort) */
  line: number;
  severity: Severity;
  category: FindingCategory;
  title: string;
  detail: string;
  suggestion: string;
  /** snippet of the offending added line, for anchoring in the diff view */
  evidence: string;
  /** "static" = deterministic pre-analyzer, "model" = LLM finding */
  source: "static" | "model";
}

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  /** raw unified-diff text for this file, including the +++/--- header */
  raw: string;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export type Verdict = "approve" | "flag" | "reject";

export interface ReviewResult {
  id: string;
  createdAt: number;
  title: string;
  author: string;
  sourceUrl?: string;
  provider: "nebius" | "static";
  model: string;
  /** files whose model call failed — reported, never silently dropped */
  modelFailures?: number;
  /** model findings whose line could not be anchored to the diff, and was cut */
  droppedFindings?: number;
  files: DiffFile[];
  findings: Finding[];
  riskScore: number; // 0–100
  verdict: Verdict;
  summary: string;
  usage: ModelUsage;
  elapsedMs: number;
}

export interface ReviewRequest {
  /** GitHub PR URL — server fetches the public .diff */
  prUrl?: string;
  /** raw unified diff text pasted or uploaded */
  diff?: string;
  title?: string;
  author?: string;
  model?: string;
}

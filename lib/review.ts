import { staticFindings } from "./analyzer";
import { addedLines, parseDiff } from "./diff";
import { chat, hasNebiusKey, parseJsonArray } from "./llm";
import { DEFAULT_MODEL, costUsd, modelSpec } from "./pricing";
import { SYSTEM_PROMPT, userPrompt } from "./prompts";
import type {
  Finding,
  ReviewRequest,
  ReviewResult,
  Severity,
  Verdict,
} from "./types";

const SEV_WEIGHT: Record<Severity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  info: 0,
};

/** Ordering only — used when two cards describe the same line and we must keep
 *  the louder verdict. Money and risk still come from SEV_WEIGHT. */
const SEV_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function fetchPr(
  url: string
): Promise<{ diff: string; title: string; author: string }> {
  const m = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/.exec(url);
  if (!m) throw new Error("Not a GitHub PR URL (owner/repo/pull/N).");
  const [, owner, repo, n] = m;
  const [metaRes, diffRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${n}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(20_000),
    }),
    fetch(`https://github.com/${owner}/${repo}/pull/${n}.diff`, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    }),
  ]);
  if (!diffRes.ok) throw new Error(`Could not fetch PR diff (${diffRes.status}).`);
  const diff = await diffRes.text();
  let title = `${owner}/${repo} #${n}`;
  let author = "unknown";
  if (metaRes.ok) {
    const meta = await metaRes.json();
    title = meta.title ?? title;
    author = meta.user?.login ?? author;
  }
  return { diff, title, author };
}

function modelFindingsFrom(
  path: string,
  items: unknown[],
  lines: Map<number, string>
): { findings: Finding[]; dropped: number } {
  const out: Finding[] = [];
  let dropped = 0;
  for (const it of items) {
    const f = it as Partial<Finding>;
    if (!f || typeof f.title !== "string" || typeof f.line !== "number") continue;
    // The prompt promises the line exists in the diff; models do not always
    // keep that promise. Anchor to a real added line or discard the finding —
    // an unanchorable card is worse than no card, because the diff viewer
    // would highlight a line that was never touched.
    const anchored = anchorTo(lines, f.line);
    if (anchored === null) {
      dropped++;
      continue;
    }
    const sev: Severity = (
      ["critical", "high", "medium", "low", "info"] as Severity[]
    ).includes(f.severity as Severity)
      ? (f.severity as Severity)
      : "medium";
    out.push({
      id: `m-${newId()}`,
      file: path,
      line: anchored,
      severity: sev,
      category: (["security", "bug", "performance", "reliability", "style"] as const).includes(
        f.category as never
      )
        ? (f.category as Finding["category"])
        : "bug",
      title: f.title.slice(0, 90),
      detail: String(f.detail ?? "").slice(0, 600),
      suggestion: String(f.suggestion ?? "").slice(0, 600),
      evidence: (lines.get(anchored) ?? "").trim().slice(0, 200),
      source: "model",
    });
  }
  return { findings: out, dropped };
}

/**
 * Exact line match, else the nearest added line within ±3 (models are usually
 * off by one or two), else null. Only added lines are addressable, since that
 * is the only text the model was shown.
 */
function anchorTo(lines: Map<number, string>, line: number): number | null {
  if (!Number.isFinite(line)) return null;
  if (lines.has(line)) return line;
  for (let d = 1; d <= 3; d++) {
    if (lines.has(line - d)) return line - d;
    if (lines.has(line + d)) return line + d;
  }
  return null;
}

export async function runReview(req: ReviewRequest): Promise<ReviewResult> {
  const t0 = Date.now();

  let diff = req.diff ?? "";
  let title = req.title?.trim() || "Unsaved working diff";
  let author = req.author?.trim() || "you";

  if (req.prUrl) {
    const pr = await fetchPr(req.prUrl);
    diff = pr.diff;
    title = pr.title;
    author = pr.author;
  }
  if (!diff.trim())
    throw new Error("The diff is empty — the PR has no changes or is not public.");

  const files = parseDiff(diff);
  if (files.length === 0) throw new Error("No `diff --git` sections found — is this a unified diff?");

  let findings: Finding[] = files.flatMap((f) => staticFindings(f.path, f.raw));
  let provider: ReviewResult["provider"] = "static";
  const model = req.model && modelSpec(req.model) ? req.model : DEFAULT_MODEL;
  let inputTokens = 0;
  let outputTokens = 0;
  let modelFailures = 0;
  let droppedFindings = 0;

  if (hasNebiusKey()) {
    const targets = files
      .filter((f) => f.additions > 0)
      .slice(0, 10); // cap: 10 files per review keeps demo latency sane
    const results = await Promise.allSettled(
      targets.map(async (f) => {
        const reply = await chat(model, [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(f.path, f.raw, { title, author }) },
        ]);
        inputTokens += reply.inputTokens;
        outputTokens += reply.outputTokens;
        const lines = new Map(addedLines(f.raw).map((l) => [l.line, l.text]));
        return modelFindingsFrom(f.path, parseJsonArray(reply.content), lines);
      })
    );
    let reviewed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        reviewed++;
        findings = findings.concat(r.value.findings);
        droppedFindings += r.value.dropped;
      } else {
        // One bad file must not relabel the whole review as static, and must
        // not be hidden either — the UI reports how many files went unserved.
        modelFailures++;
        console.error("model review failed:", r.reason);
      }
    }
    provider = reviewed > 0 ? "nebius" : "static";
  }

  // Dedupe: a model card and a static card on the same file+line+category are
  // the same issue, so they must not be shown twice. The model keeps the pen
  // (its explanation names the actual code), but a deterministic rule hit can
  // never be *downgraded* by a softer model opinion — severity takes the max.
  const seen = new Map<string, Finding>();
  for (const f of findings) {
    const key = `${f.file}|${f.line}|${f.category}`;
    const prev = seen.get(key);
    if (!prev) {
      seen.set(key, f);
      continue;
    }
    const narrative = prev.source === "model" ? prev : f;
    // Loudness is decided by both cards, not by the one that keeps the pen.
    const loudest =
      SEV_RANK[prev.severity] > SEV_RANK[f.severity] ? prev.severity : f.severity;
    seen.set(key, {
      ...narrative,
      severity: loudest,
      evidence: narrative.evidence || f.evidence,
    });
  }
  findings = [...seen.values()];

  const riskScore = Math.min(
    100,
    findings.reduce((s, f) => s + SEV_WEIGHT[f.severity], 0)
  );
  const verdict: Verdict = findings.some((f) => f.severity === "critical")
    ? "reject"
    : riskScore >= 25 || findings.some((f) => f.severity === "high")
      ? "flag"
      : "approve";

  const spec = modelSpec(model);
  // Tokens spent on a call that later failed still cost money, so bill what
  // was actually consumed rather than keying the cost off the provider label.
  const usageCost =
    inputTokens || outputTokens ? costUsd(spec, inputTokens, outputTokens) : 0;
  const count = (s: Severity) => findings.filter((f) => f.severity === s).length;

  const caveats: string[] = [];
  if (modelFailures > 0)
    caveats.push(`${modelFailures} file(s) could not be reviewed by the model`);
  if (droppedFindings > 0)
    caveats.push(
      `${droppedFindings} model finding(s) pointed outside the diff and were discarded`
    );

  return {
    id: newId(),
    createdAt: Date.now(),
    title,
    author,
    sourceUrl: req.prUrl,
    provider,
    model: provider === "nebius" ? model : "Static Pre-Analyzer + " + model,
    modelFailures,
    droppedFindings,
    files,
    findings,
    riskScore,
    verdict,
    summary:
      `${files.length} file(s), ${files.reduce((s, f) => s + f.additions, 0)} added lines reviewed — ` +
      `${count("critical")} critical, ${count("high")} high, ${count("medium")} medium, ${count("low")} low. ` +
      (verdict === "reject"
        ? "Red card: blocking issues must be fixed before merge."
        : verdict === "flag"
          ? "Yellow card: address the flagged issues, then re-run the referee."
          : "Clean sheet: no blocking issues detected within the reviewed lines.") +
      (caveats.length ? ` Note: ${caveats.join("; ")}.` : ""),
    usage: {
      model,
      inputTokens,
      outputTokens,
      costUsd: usageCost,
    },
    elapsedMs: Date.now() - t0,
  };
}

/* In-memory result store (survives the demo session; restarts clear it). */
const G = globalThis as unknown as { __refereeStore?: Map<string, ReviewResult> };
const store = (G.__refereeStore ??= new Map<string, ReviewResult>());

export function saveReview(r: ReviewResult): void {
  store.set(r.id, r);
}
export function getReview(id: string): ReviewResult | undefined {
  return store.get(id);
}

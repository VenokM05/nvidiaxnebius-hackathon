// Regression eval: two known cases, two known outcomes.
//
//   1. the rigged billing PR  → must draw a red card with critical findings
//   2. the clean refactor      → must NOT draw a critical or high finding
//
// Case 2 is the one that keeps an AI reviewer honest: a tool that alarms on a
// harmless rename is a tool developers switch off. Run against a live server:
//
//   node scripts/eval-cases.mjs              # http://localhost:3000
//   BASE=https://example.vercel.app node scripts/eval-cases.mjs
//
// Works in both engine modes. Without NEBIUS_API_KEY it checks the static
// analyzer only; with a key it checks the model path too, which is the run
// that actually tells you whether the model is misbehaving.

import { readFileSync } from "fs";

const BASE = process.env.BASE ?? "http://localhost:3000";

/** Read a `export const NAME = ...` fixture: either a quoted string or a template literal. */
function fixture(file, name) {
  const src = readFileSync(file, "utf8");
  const quoted = new RegExp('export const ' + name + ' = "([^"]*)"').exec(src);
  if (quoted) return quoted[1];
  // \x60 is a backtick — avoids nesting template literals in this pattern.
  const tpl = new RegExp(
    "export const " + name + " = \\x60([\\s\\S]*?)\\x60;"
  ).exec(src);
  if (!tpl) throw new Error(`${name} not found in ${file}`);
  return tpl[1].replaceAll("\\`", "`").replaceAll("\\$", "$");
}

const CASES = [
  {
    label: "known-bug PR",
    diff: fixture("lib/sample-pr.ts", "SAMPLE_DIFF"),
    title: fixture("lib/sample-pr.ts", "SAMPLE_TITLE"),
    expect: (r) =>
      r.verdict === "reject" &&
      r.findings.some((f) => f.severity === "critical"),
    because: "red card with at least one critical finding",
  },
  {
    label: "clean refactor",
    diff: fixture("lib/sample-clean.ts", "CLEAN_DIFF"),
    title: fixture("lib/sample-clean.ts", "CLEAN_TITLE"),
    expect: (r) =>
      !r.findings.some(
        (f) => f.severity === "critical" || f.severity === "high"
      ),
    because: "no critical or high finding",
  },
];

let failed = 0;

for (const c of CASES) {
  const res = await fetch(`${BASE}/api/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diff: c.diff, title: c.title, author: "eval" }),
  });
  const r = await res.json();

  if (!res.ok) {
    console.log(`FAIL ${c.label}: HTTP ${res.status} — ${r.error}`);
    failed++;
    continue;
  }

  const sev = (s) => r.findings.filter((f) => f.severity === s).length;
  const ok = c.expect(r);
  if (!ok) failed++;

  console.log(
    `${ok ? "PASS" : "FAIL"} ${c.label.padEnd(16)} verdict=${r.verdict.padEnd(8)} ` +
      `crit=${sev("critical")} high=${sev("high")} med=${sev("medium")} low=${sev("low")} ` +
      `provider=${r.provider} tokens=${r.usage.inputTokens}/${r.usage.outputTokens} ` +
      `cost=$${r.usage.costUsd.toFixed(5)} dropped=${r.droppedFindings ?? 0} ` +
      `modelFails=${r.modelFailures ?? 0}`
  );
  if (!ok) console.log(`     expected ${c.because}`);
  for (const f of r.findings)
    console.log(
      `     [${f.severity.toUpperCase().padEnd(8)}] ${f.file.split("/").pop()}:L${f.line} — ${f.title}${
        f.evidence ? `\n                evidence: ${f.evidence.slice(0, 70)}` : ""
      }`
    );
}

console.log(
  `\n${CASES.length - failed}/${CASES.length} cases passed against ${BASE}` +
    (process.env.BASE ? "" : "  (BASE=... to point elsewhere)"),
);
process.exit(failed ? 1 : 0);

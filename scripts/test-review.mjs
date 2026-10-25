// E2E smoke test: extract SAMPLE_DIFF from the TS fixture, POST /api/review,
// print the verdict. Usage: node scripts/test-review.mjs
import { readFileSync } from "fs";

const src = readFileSync("lib/sample-pr.ts", "utf8");
const m = /= `([\s\S]*?)`;\s*$/.exec(src);
if (!m) throw new Error("SAMPLE_DIFF not found");
const diff = m[1].replaceAll("\\`", "`").replaceAll("\\$", "$");

const res = await fetch("http://localhost:3000/api/review", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ diff, title: "feat: usage-based billing v2", author: "dana-dev" }),
});
const r = await res.json();
if (!res.ok) throw new Error(r.error);

console.log("id          :", r.id);
console.log("provider    :", r.provider);
console.log("files       :", r.files.length);
console.log("verdict     :", r.verdict, "(risk", r.riskScore + ")");
console.log("findings    :", r.findings.length);
for (const f of r.findings)
  console.log(`  [${f.severity.toUpperCase().padEnd(8)}] ${f.file.split("/").pop()}:L${f.line} — ${f.title}`);
console.log("summary     :", r.summary);

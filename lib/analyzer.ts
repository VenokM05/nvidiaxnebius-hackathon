import { addedLines } from "./diff";
import type { Finding, FindingCategory, Severity } from "./types";

interface Rule {
  pattern: RegExp;
  severity: Severity;
  category: FindingCategory;
  title: string;
  detail: string;
  suggestion: string;
}

/**
 * Deterministic static pre-analyzer. Runs on every review with zero tokens:
 * - powers the app when NEBIUS_API_KEY is absent (demo-safe),
 * - supplements model findings with high-confidence pattern hits.
 */
const RULES: Rule[] = [
  {
    pattern:
      /(api[_-]?key|secret|passwd|password|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'`][A-Za-z0-9_\-.+]{10,}["'`]/i,
    severity: "critical",
    category: "security",
    title: "Hardcoded credential in source",
    detail:
      "A secret appears committed directly in the diff. Anything in a PR is effectively public history — rotate it and purge it from git objects.",
    suggestion:
      "Move the value to a runtime secret (env var, vault, or Nebius Secrets) and rotate the leaked credential now.",
  },
  {
    pattern: /(select|insert|update|delete)[^;\n]*["'`]\s*\+\s*\w+|["'`][^"'`\n]*\$\{[^}]+\}[^\n]*\b(where|from|set)\b/i,
    severity: "critical",
    category: "security",
    title: "Possible SQL injection via string building",
    detail:
      "Query text is assembled from variables instead of bound parameters, so attacker-controlled input can alter the statement structure.",
    suggestion:
      "Use parameterized queries / an ORM binder ($1, ?, prepared statements) instead of concatenation or interpolation.",
  },
  {
    pattern: /\beval\s*\(/,
    severity: "high",
    category: "security",
    title: "eval() executes arbitrary code",
    detail:
      "eval() turns a string into executable code — if any part of the string is user-controlled, it is remote code execution.",
    suggestion: "Replace with a safe parser (JSON.parse, a math-expression library, or a lookup table).",
  },
  {
    pattern: /(child_process|exec|execSync)\s*\([^)]*[`'"][^)]*\$\{/,
    severity: "high",
    category: "security",
    title: "Command injection via interpolated shell string",
    detail:
      "Shell command is built with interpolation; quoting tricks (`` ; | &&) can smuggle arbitrary commands.",
    suggestion: "Use execFile/spawn with an argument array and never route user input through a shell string.",
  },
  {
    pattern: /\.innerHTML\s*=[^=]*\$\{/,
    severity: "high",
    category: "security",
    title: "Unescaped HTML assignment (XSS)",
    detail:
      "innerHTML with interpolated values skips the browser's escaping; attacker-controlled data runs as markup/script.",
    suggestion: "Render with textContent / a framework's escaping, or sanitize with a vetted policy (DOMPurify, Trusted Types).",
  },
  {
    pattern: /\bcatch\s*(\([^)]*\))?\s*\{\s*\}/,
    severity: "medium",
    category: "reliability",
    title: "Empty catch block swallows failures",
    detail:
      "Errors are silently discarded. In production this hides corruption and makes incidents undiagnosable.",
    suggestion: "Handle, re-throw, or log with context; if ignoring is intentional, name the error and comment why.",
  },
  {
    pattern: /\bmath\.random\s*\(\s*\)/,
    severity: "medium",
    category: "security",
    title: "Math.random() used for security-sensitive values",
    detail:
      "The generator is not cryptographically secure; outputs are predictable from observed values.",
    suggestion: "Use crypto.getRandomValues() (browser) or crypto.randomBytes() (Node) for tokens, OTPs and IDs.",
  },
  {
    pattern: /select\s+\*\s+from/i,
    severity: "low",
    category: "performance",
    title: "SELECT * fetches unused columns",
    detail:
      "Pulling every column widens rows, blocks covering-index use, and breaks silently when the schema changes.",
    suggestion: "Select only the columns the code path actually reads.",
  },
  {
    pattern: /console\.log\s*\(/,
    severity: "low",
    category: "style",
    title: "Debug logging left in the change",
    detail: "console.log calls ship to production output and can leak request data.",
    suggestion: "Remove, or move behind the project's structured logger at debug level.",
  },
  {
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/,
    severity: "info",
    category: "style",
    title: "Unresolved marker comment",
    detail: "The diff introduces a TODO/FIXME, meaning intended work is not in this PR.",
    suggestion: "File a ticket and link it, or include the fix in this change.",
  },
];

export function staticFindings(file: string, raw: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();
  for (const { line, text } of addedLines(raw)) {
    const trimmed = text.trim();
    for (const rule of RULES) {
      if (!rule.pattern.test(text)) continue;
      const key = `${file}:${rule.title}`;
      if (seen.has(key)) continue; // one hit per rule per file keeps noise down
      seen.add(key);
      findings.push({
        id: `s-${findings.length}-${line}`,
        file,
        line,
        severity: rule.severity,
        category: rule.category,
        title: rule.title,
        detail: rule.detail,
        suggestion: rule.suggestion,
        evidence: trimmed.slice(0, 240),
        source: "static",
      });
    }
  }
  return findings;
}

// Baked snapshot of the REAL live review (id d2odc54jmvr8q1x3) so the demo
// reel plays deterministically with zero API dependency during recording.
// Numbers are genuine: Nemotron 3 Nano via Nebius Token Factory, 12.2s, $0.0006.

export const DEMO_META = {
  prTitle: "feat: usage-based billing v2",
  author: "dana-dev",
  files: 3,
  addedLines: 20,
  verdict: "reject" as const,
  riskScore: 100,
  elapsedMs: 12224,
  model: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  modelLabel: "NVIDIA Nemotron 3 Nano 30B",
  inputTokens: 1046,
  outputTokens: 2690,
  costUsd: 0.00059,
  closedEstimateUsd: 0.0032,
  savingsPct: 81,
  totalFindings: 14,
  critical: 7,
  high: 3,
  medium: 1,
  low: 2,
};

export const DEMO_DIFF = [
  { t: "meta", s: "diff --git a/src/server/payments.ts b/src/server/payments.ts" },
  { t: "ctx", s: " export async function chargeUser(userId, amount) {" },
  { t: "del", s: '   const res = await pool.query("... WHERE user_id = $1", [userId]);' },
  { t: "add", s: '   const query = "SELECT * FROM charges WHERE user_id = \'" + userId + "\'";' },
  { t: "add", s: '   const API_KEY = "sk_live_9f2c7Ad3kQ0mZx8PqWtR4vLb";' },
  { t: "add", s: "   const fee = eval(\"amount * 0.029 + 0.30\");" },
  { t: "meta", s: "diff --git a/scripts/deploy.sh b/scripts/deploy.sh" },
  { t: "add", s: '   curl -s $BILLING_SIDECAR_URL | bash' },
] as const;

export interface DemoFinding {
  file: string;
  line: number;
  severity: "critical" | "high";
  category: string;
  title: string;
  detail: string;
  suggestion: string;
}

export const FEATURED: DemoFinding[] = [
  {
    file: "scripts/deploy.sh",
    line: 5,
    severity: "critical",
    category: "security",
    title: "Insecure remote code execution",
    detail:
      "The script pipes curl output directly to bash, executing arbitrary code from $BILLING_SIDECAR_URL without validation or error handling.",
    suggestion:
      "Download first, verify integrity (checksum/signature), then execute — never pipe a remote script into a shell.",
  },
  {
    file: "src/server/payments.ts",
    line: 8,
    severity: "critical",
    category: "bug",
    title: "Unsanitized SQL query",
    detail:
      "User-supplied userId is concatenated directly into the query, allowing injection attacks.",
    suggestion:
      "Use parameterized queries or prepared statements instead of string concatenation.",
  },
  {
    file: "src/web/widgets.ts",
    line: 7,
    severity: "critical",
    category: "security",
    title: "Command injection via execSync",
    detail:
      "execSync interpolates order.note directly into a shell command, enabling arbitrary command execution.",
    suggestion:
      "Use child_process.execFile with an argument array, or escape the value before it reaches a shell.",
  },
  {
    file: "src/server/payments.ts",
    line: 5,
    severity: "high",
    category: "security",
    title: "Hardcoded API key",
    detail:
      "Embedding a secret API key directly in source code exposes it to anyone with repository access.",
    suggestion:
      "Move the key to a secure configuration service or environment variable and remove the literal.",
  },
  {
    file: "src/web/widgets.ts",
    line: 5,
    severity: "high",
    category: "security",
    title: "Potential XSS via innerHTML",
    detail:
      "User-supplied order.ref and order.note are inserted into innerHTML, allowing malicious HTML injection.",
    suggestion:
      "Replace innerHTML with textContent or sanitize the values before insertion.",
  },
];

export const OPEN_MODELS = [
  "NVIDIA Nemotron 3 Nano",
  "NVIDIA Nemotron 3 Super",
  "Kimi K2.7 Code",
  "DeepSeek V4.1 Flash",
];

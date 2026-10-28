/**
 * Abuse guard for the public demo.
 *
 * The deployed site has no login, so `/api/review` is reachable by anyone on the
 * internet — and with `NEBIUS_API_KEY` set, every request spends real credits.
 * These caps make that survivable: a bounded body, a bounded number of requests
 * per visitor, a bounded per-file prompt, and a hard ceiling on total spend.
 * When the spend ceiling is hit the app does not break; it degrades to the
 * deterministic pre-analyzer, which costs nothing.
 *
 * The counters live in module memory, so on serverless they are per-instance and
 * reset on a cold start. That is a speed bump, not a vault: it stops one client
 * from hammering a warm function and it bounds an accidental runaway, but a
 * determined attacker can reset it by forcing new instances. A production
 * deployment would keep the same counters in KV/Upstash. For a 48-hour
 * hackathon demo the trade is worth taking, and the numbers below assume it.
 */

/** Pasted diffs are text; 1.5 MB is already a several-thousand-line PR. */
export const MAX_BODY_BYTES = 1_500_000;

/** Per-file cap for what we actually send the model (~5k tokens of diff). */
export const MAX_FILE_CHARS_FOR_MODEL = 20_000;

const WINDOW_MS = 10 * 60_000;
/** Generous enough that a live demo (sample → sample → real PR) never trips it,
 *  tight enough that a script looping against the URL runs out quickly. */
const MAX_PER_WINDOW = 20;

/** Total model spend allowed per rolling 24h before we fall back to static. */
const BUDGET_USD = Number(process.env.DEMO_BUDGET_USD || 2);
const BUDGET_WINDOW_MS = 24 * 60 * 60_000;

interface GuardState {
  /** ip -> request timestamps inside the sliding window */
  hits: Record<string, number[]>;
  spentUsd: number;
  windowStart: number;
}

const G = globalThis as unknown as { __refereeGuard?: GuardState };
const state = (G.__refereeGuard ??= {
  hits: {},
  spentUsd: 0,
  windowStart: Date.now(),
});

/** Vercel puts the real client address in `x-forwarded-for` (first hop). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Loopback and RFC1918 callers are exempt: this is local development, where the
 * spend is the developer's own and a limit would only get in the way. On Vercel
 * the forwarded address is a public one, so the exemption never applies there.
 */
function isLocalIp(ip: string): boolean {
  // No forwarding headers at all means a direct call to the dev server (curl,
  // the browser on localhost). Vercel always sets them, so this can never
  // exempt a real visitor on the deployed site.
  if (ip === "unknown") return !process.env.VERCEL;
  const v = ip.replace(/^::ffff:/, "");
  return (
    v === "::1" ||
    v === "127.0.0.1" ||
    v === "localhost" ||
    /^10\./.test(v) ||
    /^192\.168\./.test(v) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v)
  );
}

/**
 * Sliding-window limit, per visitor. On rejection it reports how long to wait so
 * the response can carry a real `Retry-After` instead of a bare 429.
 */
export function rateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  if (isLocalIp(ip)) return { ok: true, retryAfterSec: 0 };
  const now = Date.now();
  const buckets = (state.hits[ip] ??= []);
  while (buckets.length && now - buckets[0] > WINDOW_MS) buckets.shift();
  if (buckets.length >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((WINDOW_MS - (now - buckets[0])) / 1000),
    };
  }
  buckets.push(now);
  return { ok: true, retryAfterSec: 0 };
}

/** Cheap pre-check on the declared size, before we spend time parsing JSON. */
export function declaredBodyTooLarge(req: Request): boolean {
  return Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES;
}

/** Real check on the parsed payload — `content-length` is optional and lies. */
export function payloadTooLarge(body: unknown): boolean {
  return JSON.stringify(body ?? {}).length > MAX_BODY_BYTES;
}

/** Remaining model spend for this window, in USD. Rolls the window over. */
export function budgetRemaining(): number {
  const now = Date.now();
  if (now - state.windowStart > BUDGET_WINDOW_MS) {
    state.windowStart = now;
    state.spentUsd = 0;
  }
  return Math.max(0, BUDGET_USD - state.spentUsd);
}

export function recordSpend(usd: number): void {
  budgetRemaining();
  state.spentUsd += Math.max(0, usd);
}

/**
 * Cut a per-file diff down to what we are willing to pay for, on a line
 * boundary so the model never reads a half-line as if it were complete.
 */
export function truncateForModel(raw: string): string {
  if (raw.length <= MAX_FILE_CHARS_FOR_MODEL) return raw;
  const cut = raw.lastIndexOf("\n", MAX_FILE_CHARS_FOR_MODEL);
  const at = cut > 0 ? cut : MAX_FILE_CHARS_FOR_MODEL;
  return `${raw.slice(0, at)}\n[... diff truncated for review ...]`;
}

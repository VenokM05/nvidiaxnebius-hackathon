# Repo Referee

![Repo Referee](public/hero-referee.png)

**Every pull request gets the card it deserves.**

AI code review on open infrastructure: diffs are refereed by open-weights models
(NVIDIA Nemotron 3, Kimi K2.7 Code, DeepSeek V4.1) served through **Nebius Token
Factory**, with a transparent cost scoreboard versus closed frontier APIs.

Built for the Nebius × NVIDIA Global AI Hackathon 2026.

## What it does

- Input: a public GitHub PR URL, a pasted unified diff, or an uploaded `.diff`/`.patch`
- Output: a verdict — **green light / yellow card / red card** — risk score, and
  per-line findings (security, bugs, reliability, performance) anchored in an
  annotated diff viewer
- **Cost scoreboard**: tokens and dollars per review, side-by-side with a
  closed-model estimate
- **Pre-analyzer mode**: a deterministic static analyzer (zero tokens) runs
  always and powers the app when no API key is set — demo-safe by design

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Optional — enable model-powered reviews:

```bash
cp .env.example .env.local   # then paste your Nebius API key
```

```
NEBIUS_API_KEY=...            # Token Factory / service-account key (v1.<blob> format)
NEBIUS_API_BASE=https://api.studio.nebius.ai/v1   # OpenAI-compatible
DEMO_BUDGET_USD=2             # optional: rolling 24h model spend ceiling (default 2)
```

Without the key the app still runs — on the deterministic pre-analyzer, at zero
cost. With the key on a public deployment the endpoint is guarded (see
`lib/guard.ts`): a 1.5 MB body cap, 20 requests per 10 minutes per IP, a 20k-char
per-file prompt cap, and a rolling spend ceiling. Hitting the ceiling degrades to
the free analyzer and says so in the summary rather than failing.

Try the built-in demo: click **“Try a rigged sample PR →”** on the landing page,
then **Run the Referee** — a billing PR with 10 planted issues earns a red card.

Or open **`/demo`** for a self-playing 13-scene reel (~2:10) built from a real
Nemotron-3 Nano review — verbatim findings, token counts and cost, no API key
and no clicking. Narration script: `docs/DEMO-NARRATION.md`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · TypeScript.
No database; reviews live in memory for the demo session.

## Layout

```
app/                    routes: landing, results, /api/review
components/             design-system UI, diff viewer, finding cards
lib/review.ts           orchestrator: fetch → parse → analyze → verdict
lib/llm.ts              Token Factory client (OpenAI-compatible)
lib/analyzer.ts         deterministic pre-analyzer rules
lib/pricing.ts          model catalog + cost math
lib/sample-pr.ts        rigged demo PR fixture (must draw a red card)
lib/sample-clean.ts     behaviour-preserving refactor (must draw a green light)
lib/demo-data.ts        baked snapshot of a real review (powers /demo)
app/demo/               self-playing demo reel — see docs/DEMO-NARRATION.md
scripts/test-review.mjs end-to-end smoke test (node scripts/test-review.mjs)
scripts/eval-cases.mjs  two-case accuracy eval (node scripts/eval-cases.mjs)
```

## Architecture notes

- **Swappable engine**: `runReview()` composes static pre-analysis and (when
  `NEBIUS_API_KEY` exists) one parallel model call per changed file (capped at
  10). Model findings are validated, deduped against static hits, and weighted
  into the risk score → verdict.
- **Severity weights**: critical 25 · high 12 · medium 5 · low 2; any critical
  finding is an automatic red card.
- Pricing figures in `lib/pricing.ts` are approximate and are the single source
  of truth for the cost panel — update there when Token Factory pricing changes,
  and bump `PRICING_AS_OF`, which the scoreboard prints so a judge knows how old
  the rates are.
- **Evidence anchoring**: a model finding is only kept if its line can be
  matched to a real added line in that file's diff (exact, else within ±3), and
  the matched source text is displayed as the evidence. A finding that points
  nowhere is dropped and counted — the results page reports how many, because an
  unanchorable card destroys trust in the ones that are real.
- **Restraint is a tested property**: the review prompt forbids raising issues
  that depend on context the model was never given (unseen types, callers,
  schema) and pushes such concerns down to `low`. `scripts/eval-cases.mjs`
  asserts it on a behaviour-preserving refactor, so a regression toward
  alarm-on-everything shows up as a failing test rather than a judge's opinion.
- **Public endpoint, bounded spend**: `lib/guard.ts` caps body size, requests
  per IP, per-file prompt length and total model spend, falling back to the
  static analyzer instead of erroring when the budget is gone. Timeouts are
  nested deliberately — 12s GitHub fetch, 45s per model call, 60s platform
  `maxDuration`, 65s browser give-up — so the server always answers before
  anything above it hangs up.

## License

MIT — see [LICENSE](LICENSE).


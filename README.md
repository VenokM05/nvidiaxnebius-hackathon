# Repo Referee

**Every pull request gets the card it deserves.**

AI code review on open infrastructure: diffs are refereed by open-weights models
(NVIDIA Nemotron, DeepSeek, Qwen, Kimi) served through **Nebius Token Factory**,
with a transparent cost scoreboard versus closed frontier APIs.

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
NEBIUS_API_KEY=nk-...
NEBIUS_API_BASE=https://api.studio.nebius.ai/v1   # OpenAI-compatible
```

Try the built-in demo: click **“Try a rigged sample PR →”** on the landing page,
then **Run the Referee** — a billing PR with 10 planted issues earns a red card.

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
lib/sample-pr.ts        rigged demo PR fixture
scripts/test-review.mjs end-to-end smoke test (node scripts/test-review.mjs)
```

## Architecture notes

- **Swappable engine**: `runReview()` composes static pre-analysis and (when
  `NEBIUS_API_KEY` exists) one parallel model call per changed file (capped at
  10). Model findings are validated, deduped against static hits, and weighted
  into the risk score → verdict.
- **Severity weights**: critical 25 · high 12 · medium 5 · low 2; any critical
  finding is an automatic red card.
- Pricing figures in `lib/pricing.ts` are approximate and are the single source
  of truth for the cost panel — update there when Token Factory pricing changes.

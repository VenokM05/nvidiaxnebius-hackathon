# Submission Pack — Repo Referee (Nebius × NVIDIA Global AI Hackathon)

Track: **Coding** · Deadline: **Fri 30 Oct 2026, 17:00 UTC** · Judging: Technology, Design, Impact, Idea

---

## 1. Devpost fields (paste-ready, edit freely)

**Project name**
Repo Referee — every pull request gets the card it deserves

**One-liner**
Open-weights models on Nebius Token Factory referee your diffs: red card, yellow
card, or green light — with a transparent cost scoreboard versus closed APIs.

**Description**

Code review is where senior-engineer judgment lives, and it doesn't scale. Teams
either pay frontier-API prices per review, or skip reviews under deadline
pressure. Meanwhile the open model ecosystem — NVIDIA Nemotron, DeepSeek, Qwen,
Kimi — is now strong enough to referee real pull requests, and Nebius Token
Factory makes running them a single API key away.

Repo Referee takes a GitHub PR URL, a pasted diff, or an uploaded patch file.
It parses the unified diff, sends each changed file to an open model served on
Nebius Token Factory under a strict review contract (JSON findings only, line
numbers validated), and always runs a deterministic static pre-analyzer in
parallel — catching leaked secrets, SQL string-building, eval, XSS, command
injection, swallowed errors and more with zero tokens.

Findings arrive as referee decisions: critical issue = **red card**, merge
blocked; accumulated risk = **yellow card**; clean sheet = **green light**. The
results screen is a two-pane workspace — severity-filtered finding cards
cross-linked to an annotated diff viewer — plus a cost scoreboard showing exact
tokens and dollars next to a closed-model estimate, so teams can see what
reviewing their codebase on open infrastructure would actually cost.

The whole engine is provider-swappable by design: without an API key the app
still ships a complete, honest static review. With one, the open models take
over the whistle.

**How it's built**
Next.js 16 (App Router, server route handlers) · React 19 · Tailwind v4 design
system · Nebius Token Factory (OpenAI-compatible `/chat/completions`, one
parallel call per changed file, capped at 10) · NVIDIA Nemotron Nano 9B v2 by
default, with DeepSeek V3 / Qwen3 32B / Kimi K2 selectable · deterministic
rule engine in TypeScript · in-memory result store for the demo.

**What's next**
GitHub App auth for private repos · review comments posted back to the PR ·
historical leaderboard of which open model catches what (the referee arena) ·
team budgets: dollars-per-PR statistics · fine-tuned Nemotron reviewer on
Nebius training endpoints.

---

## 2. Two-minute demo script (record in this order)

| Time | Beat | What you do / say |
|---|---|---|
| 0:00–0:15 | Hook | Screen on landing page. "Code review doesn't scale — and closed models price most teams out. Repo Referee referees pull requests using open models on Nebius." |
| 0:15–0:45 | Killer demo | Click **Try a rigged sample PR** → **Run the Referee**. Results appear: "This billing PR has ten planted problems. Verdict: red card, risk 100. Leaked payment key, SQL injection, eval, XSS — each one anchored to the exact line." |
| 0:45–1:10 | Walk the workspace | Hover a finding → the diff line highlights. Switch file tabs. Filter Red/Yellow. "Findings are cross-linked to the annotated diff; the card system keeps severity legible to non-experts." |
| 1:10–1:35 | Real PR + scoreboard | (With key set) paste a real open-source PR URL, run it. Land on cost panel: "N tokens, $0.000X on Token Factory vs ≈$0.003 on a closed frontier API — a 90%-plus delta, per review, forever." |
| 1:35–1:50 | Infrastructure honesty | Show provider badge / model selector: Nemotron Nano, DeepSeek, Qwen, Kimi — "one OpenAI-compatible endpoint, four open referees, switch by dropdown." |
| 1:50–2:00 | Close | "Open models. Open infrastructure. Open verdict. Repo Referee — give every PR the card it deserves." |

Fallback if a live PR fetch misbehaves mid-recording: the sample PR flow never
fails (static engine), and pre-generate one model-powered results page to show
the scoreboard with real token numbers.

## 3. Nebius onboarding (do this first, today)

1. Create an account at nebius.com; claim hackathon participant credits if
   offered on the Devpost page ("Requirements/Prizes" section).
2. Generate an API key (AI Studio / Token Factory console).
3. `cp .env.example .env.local`, paste key, restart `npm run dev`.
4. Verify: run the sample PR — provider pill must read **Nebius Token Factory**,
   cost scoreboard shows non-zero tokens.
5. **Confirm the base URL + exact model IDs** against your console's model
   catalog; adjust `NEBIUS_API_BASE` in `.env.local` and `lib/pricing.ts` if
   they differ from the defaults (IDs and prices there are best-known values,
   not verified against your account).

## 4. Pre-submit checklist

- [ ] Model mode works end-to-end with your key (non-zero token counts on screen)
- [ ] Demo video ≤2 min recorded, audio checked, results readable at 1080p
- [ ] GitHub repo committed + pushed; README shows screenshots of verdict screen
- [ ] Optional: live URL (deploy on Vercel/Netlify with env var set) for Impact points
- [ ] Devpost fields pasted, track = Coding, team name correct
- [ ] Pricing figures re-verified from Token Factory catalog before you claim savings numbers

## 5. Known limits (be honest in Devpost Q&A)

- Reviews are session-scoped in memory (demo choice, not a bug)
- GitHub rate limits on unauthenticated PR fetches (~60/hr)
- Line anchoring counts added lines only
- Closed-model cost figure is a stated estimate, not an API quote

## 6. Demo URL — Vercel deploy (exact steps, ~10 min, solo)

Deliberate choice: deploy **without** `NEBIUS_API_KEY`. Judges get a fully
working demo (static pre-analyzer mode, same UI, real verdicts), and the key
never sits on a public server — model mode is shown in the video from the
local machine instead.

1. Push `main` to GitHub and confirm the repo is **public** (required by the checklist).
2. vercel.com → sign up with the same GitHub account → **Add New → Project → Import** `VenokM05/nvidiaxnebius-hackathon`.
3. Framework auto-detected: **Next.js**. Leave build defaults; add env var `NEXT_TELEMETRY_DISABLED=1` if you like. **Add no other env vars.**
4. Deploy → open `https://<project>.vercel.app` → click **Try a rigged sample PR → Run the Referee** → red card must appear.
5. Put the URL in the Devpost form **and** at the top of the README.

## 7. Tool feedback draft (checklist item 6 — edit into your own voice)

Specific, hands-on observations from building Repo Referee:

**Nebius Token Factory**
- OpenAI-compatible `/v1/chat/completions` on a service-account key worked
  first try for 10 parallel review calls — migration cost from an OpenAI SDK
  was effectively zero.
- Gotcha: reasoning models (Nemotron 3) consume part of `max_tokens` on hidden
  reasoning. With a 1400-token cap we got HTTP 200, `finish_reason: "length"`
  and **empty content** — no signal that reasoning ate the budget. Suggest a
  docs callout and/or a distinct `finish_reason` for "reasoning budget
  exhausted".
- The public pricing page linked from Token Factory 404'd when we tried to
  cite exact per-model rates for a cost comparison — pricing transparency
  would directly help builders making open-vs-closed arguments.
- Model ID casing is inconsistent across surfaces (`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`
  vs `nvidia/nemotron-3-super-120b-a12b`) — easy to fat-finger in configs.

**NVIDIA Nemotron 3 Nano 30B (A3B)**
- Excellent strict-format compliance: with a JSON-array-only contract at
  temperature 0.1, every response parsed; no prose bleed.
- Real security judgment, not just pattern-matching: it flagged `curl | bash`
  remote code execution and a second SQLi site that our 10-rule regex engine
  structurally could not see — while correctly line-anchoring most findings.
- Review of a 3-file PR completed in ~12 s for ~$0.0006, so per-PR review is
  economically trivial at scale.
- Note: reasoning overhead inflated output tokens (438 tokens for a one-line
  trivial prompt) — teams doing high-volume structured extraction should
  budget for this.


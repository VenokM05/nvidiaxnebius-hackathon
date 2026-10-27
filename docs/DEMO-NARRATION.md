# Demo Narration Script + Recording Guideline

Companion to `docs/SUBMISSION.md` §2b. This is the exact thing to say while the
`/demo` reel plays. Scene timings below **match the durations in
`components/demo-scenes.tsx`**, so if you read at a normal pace the reel turns
pages for you.

Total runtime: **2:10** reel, or **~2:35** with the optional live take. The
limit is 3:00.

---

## 1. Before you press record (10 minutes)

1. Close Slack, Discord, Teams, mail — anything that toasts. Turn on Windows
   focus assist. Notifications in a submission video are the cheapest points
   you will ever lose.
2. `npm run build && npm run start` — production serving. This removes the
   Next.js dev-tools badge from the bottom-left of the frame.
3. Open `http://localhost:3000/demo` in Chrome or Edge, **F11** for fullscreen,
   then press **F** on the page for true fullscreen.
4. **Win + G** opens Xbox Game Bar. Check the mic icon is your real microphone
   (not the webcam's), and set capture to your main monitor.
5. Say the first two lines out loud once. Then record.
6. Start recording with **Win + Alt + R**. Wait two seconds of silence. Press
   **R** on the page. Talk.

Controls while recording: **Space** pause · **← / →** step a scene · **R**
restart · **F** fullscreen. Pausing to collect yourself is allowed — you trim it
afterwards.

---

## 2. The script

Read it as written. It is already conversational; do not "present voice" it.
Lines marked **[MUST]** are what checklist item 3 asks for — Nebius and NVIDIA
usage stated out loud. Drop one and the video technically fails the rule.

| # | Time | On screen | Say this |
|---|---|---|---|
| 1 | 0:00–0:09 | Title card | "This is Repo Referee. It referees pull requests the way a linesman watches the game — using open models running on open infrastructure." |
| 2 | 0:09–0:21 | Closed vs open panels | "Code review doesn't scale. Every PR needs senior eyes, and people are the bottleneck. The closed APIs that automate it are expensive and opaque, so most teams can't afford to run one on every pull request." |
| 3 | 0:21–0:33 | Rigged billing diff | "So paste a GitHub PR URL, or upload a diff. This is a usage-based billing change — three files, twenty new lines. It looks reasonable. It is a disaster." |
| 4 | 0:33–0:41 | VAR check spinner | **[MUST]** "Repo Referee sends every changed file, in parallel, to an NVIDIA Nemotron model served on Nebius Token Factory." |
| 5 | 0:41–0:54 | RED CARD | "Fourteen findings. Seven of them critical. Risk score one hundred — a straight red card, merge blocked. And every finding is anchored to the exact line that caused it." |
| 6 | 0:54–1:04 | curl \| bash finding | "Look at this one. The deploy script pipes a remote file straight into bash. A regex can spot the word *curl* — only a model understands that's remote code execution." |
| 7 | 1:04–1:11 | SQL finding | "SQL injection, straight into the payments path — a user ID concatenated into the query." |
| 8 | 1:11–1:18 | execSync finding | "Command injection in a widget: an order note interpolated into a shell command." |
| 9 | 1:18–1:25 | Hardcoded key | "A live secret key, hardcoded in source. Everyone with repo access owns it now." |
| 10 | 1:25–1:32 | XSS finding | "And XSS through innerHTML. Every finding ships a concrete fix, not just an alarm." |
| 11 | 1:32–1:50 | Cost scoreboard | **[MUST]** "And here's the infrastructure payoff. This entire review cost just under a tenth of a cent — one thousand and forty-six tokens in, twenty-six hundred and ninety out, twelve seconds. The same review on a closed frontier API is estimated at over five times that. Eighty-one percent cheaper, per pull request, forever." |
| 12 | 1:50–2:01 | Four model pills | **[MUST]** "Four open referees behind one OpenAI-compatible endpoint: Nemotron Nano, Nemotron Super, Kimi, and DeepSeek. Switch from a dropdown. No code changes." |
| 13 | 2:01–2:10 | End card | "Open models, open infrastructure, open verdict. Repo Referee — give every pull request the card it deserves. Built for the Nebius and NVIDIA Global AI Hackathon. Thanks for watching." |

Scene 11 is the longest line against an 18-second window. If you speak slowly,
let the last sentence run one or two seconds past the scene change — nobody
will notice, and the end card holds anyway.

---

## 3. Optional live take (recommended, +25 seconds)

The reel proves the reasoning. Fifteen seconds of the real UI proves it's a
working app. Record it as a second clip and splice it in **after scene 4** (the
VAR check), before the red card.

**Record this take locally, not from the Vercel URL.** The deployed demo
deliberately has no API key, so its results page reads **"static pre-analyzer
mode"** and returns 10 findings — naming Nemotron over that footage would be a
false claim. On `localhost` with `.env.local` in place, the same run shows
**"Nebius Token Factory"** and 14 findings, which is what the script says.

If you would rather show the public URL on screen, use this honest line
instead and keep everything else the same:

> "That was the reel. This is the app itself — and on the public demo the key is
> removed on purpose, so it falls back to the deterministic pre-analyzer. Same
> verdict, same UI, no credits needed for a judge to try it. Locally, with a
> Nebius key, it's the Nemotron model that produces these."

Setup: `npm run dev`, homepage, key present in `.env.local` so the run is live.

| Time | Action | Say this |
|---|---|---|
| 0:00 | Landing page, cursor idle | "That was the reel — this is the actual app." |
| 0:04 | Click **Try a rigged sample PR** | "One click loads a real diff." |
| 0:08 | Click **Run the Referee**, model dropdown visible | "Model is NVIDIA Nemotron Nano on Nebius Token Factory. It's now reading each file in parallel." |
| 0:12 | Let the ~12s run happen; keep talking | "While it waits — the engine is swappable. No API key on this machine? It falls back to a deterministic static pre-analyzer and still returns a verdict. That's why the demo never dies mid-judging." |
| 0:25 | Results page loads | "Verdict, findings, annotated diff." |

The 12-second wait is a feature on camera, not a problem: it gives you
something honest to say, and judges see real latency.

---

## 4. Delivery guidelines

**Pace.** Slow down roughly 20% from conversation speed. Nerves make everyone
speed up, and a video that's 2:10 has 50 seconds of slack to spend on pauses.

**Numbers.** Say them round and say them once. "Just under a tenth of a cent"
lands better than "zero point zero zero zero five nine dollars" — the precise
figure is already on screen.

**Point at the screen with your voice.** "Look at this one", "here's the
payoff", "and this is the actual app". Judges often watch at low volume; verbal
signposting is what keeps their eyes in the right place.

**Never say:** "as you can see" (they can't), "basically", "just a quick demo",
"I only had a few days", "sorry about the audio". Confidence costs nothing.

**First take is rarely the last.** Do one full pass to hear the timing, then one
real pass. Two takes is normal. Three is fine. The reel restarts with **R**, so
a flubbed scene 7 means pressing Space, going ← once, and repeating — not
starting over.

**Voice-only fallback.** If your mic is unusable, the reel already carries a
caption on every scene. Record it silent and the captions do the explaining —
worse, but still a valid submission.

---

## 5. After recording

1. Clip is in `Videos\Captures\...mp4`. Rename to `repo-referee-demo.mp4`.
2. Trim head/tail silence. Windows Video Editor or Clipchamp both do this
   without re-encoding pain. No music, no transitions, no intro logo.
3. Check it is **under 3:00** and the audio is audible on laptop speakers, not
   just headphones.
4. Upload to YouTube as **Unlisted** first, watch it once yourself end to end,
   then set to **Public** (the checklist requires a publicly viewable link).
5. Paste the URL into the Devpost field, and tick the video box in
   `docs/SUBMISSION.md` §4.

---

## 6. Pre-flight checklist

- [ ] Notifications off, clean desktop, browser in fullscreen
- [ ] `npm run build && npm run start`, not `dev` (no dev badge in frame)
- [ ] Mic selected and level-checked in Game Bar
- [ ] Reel restarted with **R** before recording starts
- [ ] All three **[MUST]** lines spoken (Nebius Token Factory, NVIDIA Nemotron, model switching)
- [ ] Runtime under 3:00
- [ ] YouTube link is public and opens in an incognito window
- [ ] Video shows the app working *and* explains Nebius + NVIDIA usage

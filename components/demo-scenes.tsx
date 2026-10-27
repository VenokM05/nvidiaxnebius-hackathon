"use client";

import {
  DEMO_DIFF,
  DEMO_META,
  FEATURED,
  OPEN_MODELS,
  type DemoFinding,
} from "@/lib/demo-data";
import { useEffect, useState } from "react";

const sevText = (s: string) =>
  s === "critical" ? "text-critical" : s === "high" ? "text-high" : "text-medium";

function useCycle(items: string[], ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % items.length), ms);
    return () => clearInterval(t);
  }, [items.length, ms]);
  return items[i];
}

function Title() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-bright text-3xl font-black text-black shadow-[var(--glow-primary)]">
        R
      </div>
      <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
        Repo <span className="text-gradient-primary">Referee</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-pretty text-xl text-fg-muted">
        Every pull request gets the card it deserves.
      </p>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-fg-faint">
        AI code review on open infrastructure
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-primary-bright">
        Nebius × NVIDIA Global AI Hackathon
      </p>
    </div>
  );
}

function Problem() {
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-center text-4xl font-semibold tracking-tight">
        Code review doesn&apos;t scale.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="panel p-6 opacity-70">
          <p className="font-mono text-[11px] uppercase tracking-widest text-critical">
            Closed frontier APIs
          </p>
          <p className="mt-3 text-lg text-fg">Expensive &amp; opaque</p>
          <p className="mt-2 text-sm text-fg-muted">
            Per-review pricing most teams can&apos;t run on every PR. You can&apos;t
            see the model, the cost, or the reasoning.
          </p>
        </div>
        <div className="panel border-primary/40 p-6 shadow-[var(--glow-primary)]">
          <p className="font-mono text-[11px] uppercase tracking-widest text-primary-bright">
            Open models on Nebius
          </p>
          <p className="mt-3 text-lg text-fg">Cheap &amp; transparent</p>
          <p className="mt-2 text-sm text-fg-muted">
            Nemotron-class models on Token Factory, one OpenAI-compatible call,
            every token and dollar on the scoreboard.
          </p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{DEMO_META.prTitle}</h2>
        <span className="font-mono text-xs text-fg-faint">{DEMO_META.author}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-bg font-mono text-[13px] leading-relaxed">
        {DEMO_DIFF.map((l, i) => (
          <div
            key={i}
            className={`px-4 py-0.5 whitespace-pre ${
              l.t === "add"
                ? "bg-[hsl(var(--diff-add-bg)/0.5)] text-diff-add"
                : l.t === "del"
                  ? "bg-[hsl(var(--diff-del-bg)/0.5)] text-diff-del"
                  : l.t === "meta"
                    ? "text-fg-faint"
                    : "text-fg-muted"
            }`}
          >
            {l.t === "add" ? "+ " : l.t === "del" ? "- " : "  "}
            {l.s}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center font-mono text-xs text-fg-faint">
        Paste a GitHub PR URL or a diff · {DEMO_META.files} files ·{" "}
        {DEMO_META.addedLines} added lines
      </p>
    </div>
  );
}

function VarCheck() {
  const msg = useCycle(
    ["Checking offsides…", "Consulting the rulebook (Nemotron)…", "Reviewing the tape…", "VAR check in progress…"],
    1500
  );
  return (
    <div className="text-center">
      <div className="mx-auto size-16 animate-[var(--animate-spin-slow)] rounded-full border-4 border-line-strong border-t-primary" />
      <p className="mt-8 text-2xl font-medium text-fg">{msg}</p>
      <p className="mt-4 font-mono text-sm text-primary-bright">
        {DEMO_META.modelLabel} · reviewing each changed file in parallel
      </p>
    </div>
  );
}

function Verdict() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(DEMO_META.riskScore), 200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-6 inline-block h-28 w-20 rounded-lg bg-critical shadow-[0_0_60px_-10px_hsl(var(--sev-critical)/0.7)]" />
      <h2 className="text-5xl font-bold tracking-tight text-critical">RED CARD</h2>
      <p className="mt-3 text-xl text-fg-muted">Critical issues — merge blocked</p>
      <div className="mx-auto mt-8 max-w-md">
        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-critical transition-[width] duration-[1200ms] ease-out"
            style={{ width: `${w}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-sm text-fg-faint">
          risk score {DEMO_META.riskScore}/100 · {DEMO_META.totalFindings} findings
        </p>
      </div>
    </div>
  );
}

function Finding({ f }: { f: DemoFinding }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-block h-6 w-4 rounded-[3px] ${f.severity === "critical" ? "bg-critical" : "bg-high"}`} />
        <span className={`text-sm font-bold uppercase tracking-wider ${sevText(f.severity)}`}>
          {f.severity}
        </span>
        <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
          {f.category}
        </span>
        <span className="rounded border border-primary/30 bg-primary-dim px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-primary-bright">
          model
        </span>
        <span className="ml-auto font-mono text-sm text-fg-faint">
          {f.file.split("/").pop()}:{f.line}
        </span>
      </div>
      <h2 className="mt-5 text-4xl font-semibold tracking-tight">{f.title}</h2>
      <p className="mt-4 text-lg leading-relaxed text-fg-muted">{f.detail}</p>
      <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
        <span className="font-mono text-[11px] uppercase tracking-wider text-primary-bright">
          Fix ·{" "}
        </span>
        <span className="text-fg">{f.suggestion}</span>
      </div>
    </div>
  );
}

function Scoreboard() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 1100);
      setN(DEMO_META.costUsd * p);
      if (p >= 1) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-fg-faint">
        Cost scoreboard · one review
      </p>
      <p className="mt-4 text-7xl font-bold tracking-tight text-primary-bright">
        ${n.toFixed(4)}
      </p>
      <p className="mt-2 text-xl text-fg-muted">
        <span className="font-semibold text-primary-bright">
          {DEMO_META.savingsPct}% cheaper
        </span>{" "}
        than a closed frontier API (≈${DEMO_META.closedEstimateUsd.toFixed(4)})
      </p>
      <div className="mt-8 grid grid-cols-3 gap-3 font-mono text-sm">
        {[
          ["tokens in", DEMO_META.inputTokens.toLocaleString()],
          ["tokens out", DEMO_META.outputTokens.toLocaleString()],
          ["latency", `${(DEMO_META.elapsedMs / 1000).toFixed(1)}s`],
        ].map(([k, v]) => (
          <div key={k} className="panel p-4">
            <p className="text-fg-faint">{k}</p>
            <p className="mt-1 text-lg text-fg">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Models() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-semibold tracking-tight">
        One endpoint. Four open referees.
      </h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {OPEN_MODELS.map((m) => (
          <span
            key={m}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-fg"
          >
            {m}
          </span>
        ))}
      </div>
      <p className="mt-8 font-mono text-sm text-fg-faint">
        OpenAI-compatible /chat/completions on Nebius Token Factory — switch by
        dropdown.
      </p>
    </div>
  );
}

function End() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 grid size-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-bright text-2xl font-black text-black">
        R
      </div>
      <h2 className="text-4xl font-semibold tracking-tight">
        Give every PR the card it deserves.
      </h2>
      <p className="mt-6 font-mono text-sm text-fg-muted">
        github.com/VenokM05/nvidiaxnebius-hackathon
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-primary-bright">
        Open models · Open infrastructure · Open verdict
      </p>
    </div>
  );
}

export interface Scene {
  id: string;
  dur: number;
  caption: string;
  Comp: () => React.ReactElement;
}

export const SCENES: Scene[] = [
  { id: "title", dur: 9000, caption: "Repo Referee — AI code review on open infrastructure.", Comp: Title },
  { id: "problem", dur: 12000, caption: "Closed models price out review. Open models on Nebius don't.", Comp: Problem },
  { id: "input", dur: 12000, caption: "It takes a pull request diff — here, a rigged billing PR.", Comp: Input },
  { id: "var", dur: 8000, caption: "An NVIDIA Nemotron open model referees every changed file.", Comp: VarCheck },
  { id: "verdict", dur: 13000, caption: `Verdict: red card. ${DEMO_META.totalFindings} findings, risk ${DEMO_META.riskScore}. Merge blocked.`, Comp: Verdict },
  ...FEATURED.map((f, i): Scene => ({
    id: `f${i}`,
    dur: i === 0 ? 10000 : 7000,
    caption:
      i === 0
        ? "The model caught this — regex rules structurally cannot."
        : "Every finding is anchored to the exact line in the diff.",
    Comp: () => <Finding f={f} />,
  })),
  { id: "board", dur: 18000, caption: "The whole review cost $0.0006 — 81% under a closed API.", Comp: Scoreboard },
  { id: "models", dur: 11000, caption: "Swap referees from one OpenAI-compatible endpoint.", Comp: Models },
  { id: "end", dur: 9000, caption: "Built for the Nebius × NVIDIA Global AI Hackathon.", Comp: End },
];

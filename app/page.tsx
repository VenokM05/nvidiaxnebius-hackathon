import ReviewForm from "@/components/review-form";
import { Pill } from "@/components/ui";
import Image from "next/image";

const FEATURES = [
  {
    k: "Open models",
    v: "NVIDIA Nemotron 3, Kimi and DeepSeek served through Nebius Token Factory — no closed door.",
  },
  {
    k: "The card system",
    v: "Red card blocks the merge, yellow card sends it back. Severity you can see at a glance.",
  },
  {
    k: "Cost, on the scoreboard",
    v: "Every review reports tokens and dollars, side by side with a closed-model estimate.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
      {/* header */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-bright font-mono text-sm font-bold text-black">
            R
          </span>
          <span className="font-semibold tracking-tight">
            Repo <span className="text-gradient-primary">Referee</span>
          </span>
        </div>
        <Pill>
          <span className="size-1.5 animate-[var(--animate-pulse-glow)] rounded-full bg-primary" />
          Nebius Token Factory · NVIDIA open models
        </Pill>
      </header>

      {/* hero */}
      <section className="grid items-center gap-10 pt-8 pb-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-[var(--animate-fade-up)]">
          <h1 className="max-w-xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Every pull request gets the{" "}
            <span className="text-gradient-primary">card</span> it deserves.
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-fg-muted">
            Repo Referee reviews your diffs with open-weights models running on
            Nebius — security flaws, bugs and reliability traps — and shows the
            whole scoreboard: findings, tokens, and dollars versus closed
            frontier APIs.
          </p>
          <div className="mt-7 max-w-xl">
            <ReviewForm />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-3xl bg-primary opacity-[0.05] blur-3xl" />
          <Image
            src="/hero-referee.png"
            alt="Glowing green penalty card raised beside a code diff silhouette"
            width={1024}
            height={768}
            priority
            className="relative w-full rounded-2xl border border-line shadow-[var(--shadow-panel)]"
          />
        </div>
      </section>

      {/* features */}
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <div
            key={f.k}
            className="panel p-5 transition-[var(--transition-smooth)] hover:border-line-strong"
            style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${0.12 * i}s both` }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary-bright">
              {f.k}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{f.v}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-fg-faint">
        Built for the Nebius × NVIDIA Global AI Hackathon · open infrastructure,
        no vendor lock-in.
      </footer>
    </main>
  );
}

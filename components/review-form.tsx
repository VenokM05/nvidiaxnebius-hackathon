"use client";

import { MODELS } from "@/lib/pricing";
import { cacheReview } from "@/lib/review-cache";
import { CLEAN_AUTHOR, CLEAN_DIFF, CLEAN_TITLE } from "@/lib/sample-clean";
import { SAMPLE_AUTHOR, SAMPLE_DIFF, SAMPLE_TITLE } from "@/lib/sample-pr";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "./ui";

type Mode = "pr" | "diff";

const THINKING_LINES = [
  "Checking offsides…",
  "Consulting the rulebook (Nemotron)…",
  "Reviewing the tape (frame by frame)…",
  "VAR check in progress…",
];

/**
 * The server can legitimately sit here for a while. Its worst case is a 30s
 * GitHub diff fetch plus a 70s model fan-out (lib/llm.ts), so 100s still means
 * "the server gave up before we did" rather than a hung connection — and a hung
 * or dead backend can no longer leave the button spinning forever.
 */
const REVIEW_TIMEOUT_MS = 100_000;

/** Grace period for the client router before we force a full-page load. Long
 *  enough to cover a dev-server route compile, short enough that a stalled
 *  transition is never a dead end. */
const NAVIGATE_GRACE_MS = 8_000;

export default function ReviewForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>("pr");
  const [prUrl, setPrUrl] = useState("");
  const [diff, setDiff] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const cleanupsRef = useRef<Set<() => void>>(new Set());
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest pathname, readable from a timer callback without an effect.
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  // Unmounting (including a successful navigation) tears down every timer and
  // cancels any in-flight request.
  useEffect(
    () => () => {
      if (navTimerRef.current !== null) clearTimeout(navTimerRef.current);
      for (const fn of cleanupsRef.current) fn();
      cleanupsRef.current.clear();
    },
    []
  );

  /** Bring the form back to a usable state and show why the review didn't land. */
  function restoreForm(message: string) {
    if (navTimerRef.current !== null) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    busyRef.current = false;
    setBusy(false);
    setError(message);
  }

  async function submit() {
    if (busyRef.current) return; // double-submit guard: state updates are async
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setTick(0);

    const ctrl = new AbortController();
    let timedOut = false;
    let landed = false;

    const spinner = setInterval(
      () => setTick((t) => (t + 1) % THINKING_LINES.length),
      1600
    );
    const killer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, REVIEW_TIMEOUT_MS);
    cleanupsRef.current.add(() => {
      clearInterval(spinner);
      clearTimeout(killer);
      ctrl.abort();
    });

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify(
          mode === "pr"
            ? { prUrl: prUrl.trim(), model }
            : { diff, title: title.trim(), author: author.trim(), model }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      cacheReview(json);
      landed = true;
      clearInterval(spinner);
      clearTimeout(killer);
      // Release the button the moment we have a report. The router usually
      // unmounts this form, but App Router keeps the outgoing page mounted
      // (hidden) while a transition settles — and a hidden form that still
      // thinks it is busy comes back disabled when the user navigates here
      // again. Clearing busy makes that impossible.
      busyRef.current = false;
      setBusy(false);
      const url = `/review/${json.id}`;
      const origin = pathname;
      router.push(url);
      // If the client router never lands (stalled RSC stream, dev hiccup), a
      // plain document load will — and it only fires while we are still here.
      navTimerRef.current = setTimeout(() => {
        navTimerRef.current = null;
        if (pathRef.current !== origin) return;
        // Deliberate full-page navigation as the last resort.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(url);
      }, NAVIGATE_GRACE_MS);
    } catch (err) {
      restoreForm(
        timedOut
          ? `No answer after ${REVIEW_TIMEOUT_MS / 1000}s — the model or the server is stuck. Try again.`
          : err instanceof TypeError
            ? "Could not reach the review service. Is the server running?"
            : err instanceof Error
              ? err.message
              : "Review failed."
      );
    } finally {
      if (!landed) {
        for (const fn of cleanupsRef.current) fn();
        cleanupsRef.current.clear();
      }
    }
  }

  function loadSample() {
    setMode("diff");
    setDiff(SAMPLE_DIFF);
    setTitle(SAMPLE_TITLE);
    setAuthor(SAMPLE_AUTHOR);
    setError(null);
  }

  function loadCleanSample() {
    setMode("diff");
    setDiff(CLEAN_DIFF);
    setTitle(CLEAN_TITLE);
    setAuthor(CLEAN_AUTHOR);
    setError(null);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDiff(String(reader.result ?? ""));
      setTitle(f.name.replace(/\.(diff|patch|txt)$/i, ""));
    };
    reader.readAsText(f);
  }

  const tabCls = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-[var(--transition-smooth)] ${
      active
        ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_hsl(var(--line))]"
        : "text-fg-muted hover:text-fg"
    }`;

  const inputCls =
    "w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none transition-[var(--transition-smooth)]";

  return (
    <div className="panel overflow-hidden animate-[var(--animate-fade-up)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex gap-1 rounded-lg bg-bg p-1">
          <button className={tabCls(mode === "pr")} onClick={() => setMode("pr")}>
            GitHub PR
          </button>
          <button className={tabCls(mode === "diff")} onClick={() => setMode("diff")}>
            Paste / upload diff
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSample}
            className="text-xs font-medium text-primary-bright hover:underline focus-ring rounded"
          >
            Try a rigged sample PR →
          </button>
          <span className="h-3 w-px bg-line" aria-hidden />
          <button
            onClick={loadCleanSample}
            title="A harmless refactor — the referee should wave it through"
            className="text-xs font-medium text-fg-muted hover:text-fg hover:underline focus-ring rounded"
          >
            Try a clean PR →
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {mode === "pr" ? (
          <input
            className={inputCls}
            placeholder="https://github.com/owner/repo/pull/123"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            aria-label="GitHub pull request URL"
          />
        ) : (
          <>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="PR title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Pull request title"
              />
              <input
                className={`${inputCls} sm:max-w-44`}
                placeholder="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                aria-label="Pull request author"
              />
            </div>
            <textarea
              className={`${inputCls} min-h-40 font-mono text-xs leading-relaxed`}
              placeholder={"Paste a unified diff…\ndiff --git a/src/… b/src/…"}
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              aria-label="Unified diff text"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-ring rounded"
              >
                Upload .diff / .patch file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".diff,.patch,.txt"
                className="hidden"
                onChange={onFile}
              />
              <span className="font-mono text-[11px] text-fg-faint">
                {diff ? `${diff.split("\n").length} lines` : "no diff yet"}
              </span>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-fg-muted">
            Open model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-fg focus:border-primary focus:outline-none"
              aria-label="Review model"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            onClick={submit}
            disabled={busy || (mode === "pr" ? !prUrl.trim() : !diff.trim())}
          >
            {busy ? (
              <>
                <Spinner /> {THINKING_LINES[tick]}
              </>
            ) : (
              "Run the Referee"
            )}
          </Button>
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-critical/40 bg-critical/10 px-3 py-2">
            <p className="text-xs text-critical">{error}</p>
            <button
              onClick={submit}
              className="focus-ring rounded-md border border-critical/40 px-2.5 py-1 text-xs font-medium text-critical hover:bg-critical/10"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

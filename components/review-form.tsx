"use client";

import { MODELS } from "@/lib/pricing";
import { SAMPLE_AUTHOR, SAMPLE_DIFF, SAMPLE_TITLE } from "@/lib/sample-pr";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Spinner } from "./ui";

type Mode = "pr" | "diff";

const THINKING_LINES = [
  "Checking offsides…",
  "Consulting the rulebook (Nemotron)…",
  "Reviewing the tape (frame by frame)…",
  "VAR check in progress…",
];

export default function ReviewForm() {
  const router = useRouter();
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

  async function submit() {
    setBusy(true);
    setError(null);
    const timer = setInterval(
      () => setTick((t) => (t + 1) % THINKING_LINES.length),
      1600
    );
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "pr"
            ? { prUrl: prUrl.trim(), model }
            : { diff, title: title.trim(), author: author.trim(), model }
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      router.push(`/review/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
      setBusy(false);
      clearInterval(timer);
    }
  }

  function loadSample() {
    setMode("diff");
    setDiff(SAMPLE_DIFF);
    setTitle(SAMPLE_TITLE);
    setAuthor(SAMPLE_AUTHOR);
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
        <button
          onClick={loadSample}
          className="text-xs font-medium text-primary-bright hover:underline focus-ring rounded"
        >
          Try a rigged sample PR →
        </button>
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
          <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-xs text-critical">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

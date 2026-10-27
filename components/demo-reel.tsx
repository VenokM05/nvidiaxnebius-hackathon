"use client";

import { SCENES } from "./demo-scenes";
import { useCallback, useEffect, useRef, useState } from "react";

const LAST = SCENES.length - 1;
const TOTAL = SCENES.reduce((s, x) => s + x.dur, 0);

export default function DemoReel() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [prog, setProg] = useState(0);
  const progRef = useRef(0);
  const dur = SCENES[idx].dur;

  const goto = useCallback((n: number) => {
    progRef.current = 0;
    setProg(0);
    setIdx(Math.max(0, Math.min(LAST, n)));
  }, []);

  // scene timer
  useEffect(() => {
    if (!playing) return;
    const remaining = dur * (1 - progRef.current);
    const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, progRef.current + (Date.now() - start) / dur);
      progRef.current = p;
      setProg(p);
      if (p >= 1) clearInterval(iv);
    }, 40);
    const to = setTimeout(() => {
      if (idx >= LAST) setPlaying(false);
      else goto(idx + 1);
    }, remaining);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [idx, playing, dur, goto]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") goto(idx + 1);
      else if (e.key === "ArrowLeft") goto(idx - 1);
      else if (e.key === "r" || e.key === "R") {
        goto(0);
        setPlaying(true);
      } else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, goto]);

  const before = SCENES.slice(0, idx).reduce((s, x) => s + x.dur, 0);
  const overall = ((before + prog * dur) / TOTAL) * 100;
  const { caption, Comp } = SCENES[idx];

  const btn =
    "rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-fg-muted hover:text-fg hover:border-line-strong transition-[var(--transition-smooth)]";

  return (
    <div className="relative flex h-dvh flex-col bg-bg">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-bright font-mono text-xs font-bold text-black">
            R
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-fg-faint">
            Demo Reel
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className={btn} onClick={() => goto(idx - 1)} aria-label="Previous">
            ‹ Prev
          </button>
          <button
            className={btn}
            onClick={() => setPlaying((p) => !p)}
            aria-label="Play or pause"
          >
            {playing ? "❚❚ Pause" : "▶ Play"}
          </button>
          <button className={btn} onClick={() => goto(idx + 1)} aria-label="Next">
            Next ›
          </button>
          <button
            className={btn}
            onClick={() => {
              goto(0);
              setPlaying(true);
            }}
            aria-label="Restart"
          >
            ↻ Restart
          </button>
          <button
            className={btn}
            onClick={() => document.documentElement.requestFullscreen?.()}
            aria-label="Fullscreen"
          >
            ⤢ Full
          </button>
        </div>
      </div>

      {/* stage */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        <div key={idx} className="w-full animate-[var(--animate-fade-up)]">
          <Comp />
        </div>
      </div>

      {/* caption */}
      <div className="px-6 pb-2 text-center">
        <p className="mx-auto max-w-2xl text-pretty text-sm text-fg-muted sm:text-base">
          {caption}
        </p>
      </div>

      {/* progress + counter */}
      <div className="px-5 pb-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-fg-faint">
          <span>
            {String(idx + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
          </span>
          <span className="hidden sm:inline">
            space · pause ← → · step · R · restart · F · fullscreen
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-75 ease-linear"
            style={{ width: `${overall}%` }}
          />
        </div>
      </div>
    </div>
  );
}

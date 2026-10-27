// One-off probe: verify the Nebius key + base URL, list model IDs.
// Reads .env.local directly; never prints the key. Usage: node scripts/probe-nebius.mjs
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.NEBIUS_API_KEY;
const BASE = env.NEBIUS_API_BASE || "https://api.studio.nebius.ai/v1";
const has = (s) => /nemotron|deepseek|qwen|kimi|llama/i.test(s);

try {
  const res = await fetch(`${BASE}/models`, {
    headers: { Authorization: `Bearer ${KEY}` },
    signal: AbortSignal.timeout(30_000),
  });
  console.log("GET /models ->", res.status, res.headers.get("content-type"));
  const text = await res.text();
  if (!res.ok) {
    console.log("body:", text.slice(0, 400));
    process.exit(1);
  }
  let ids = [];
  try {
    const json = JSON.parse(text);
    ids = (json.data || json.models || []).map((m) => m.id || m).filter(Boolean);
  } catch {
    ids = text.split(/[\s",]+/).filter((t) => t.includes("/"));
  }
  console.log(`total models: ${ids.length}`);
  console.log("candidates relevant to us:");
  ids.filter(has).forEach((id) => console.log("  -", id));
} catch (err) {
  console.error("probe failed:", err.message);
  process.exit(1);
}

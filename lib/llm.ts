/**
 * Minimal OpenAI-compatible client for Nebius Token Factory.
 * Config (env):
 *   NEBIUS_API_KEY   — required for model mode; app falls back to the
 *                      deterministic static analyzer when absent.
 *   NEBIUS_API_BASE  — default https://api.studio.nebius.ai/v1
 */

export interface ChatReply {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export function hasNebiusKey(): boolean {
  return Boolean(process.env.NEBIUS_API_KEY);
}

export async function chat(
  model: string,
  messages: { role: string; content: string }[],
  // reasoning models emit hidden thinking tokens before visible content,
  // so the budget must cover both — 1400 caused empty-content replies.
  maxTokens = 4000
): Promise<ChatReply> {
  const base = process.env.NEBIUS_API_BASE ?? "https://api.studio.nebius.ai/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEBIUS_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token Factory ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  return {
    content: json.choices?.[0]?.message?.content ?? "",
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
  };
}

/** Robust JSON extraction — models sometimes wrap output in prose/fences. */
export function parseJsonArray(text: string): unknown[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

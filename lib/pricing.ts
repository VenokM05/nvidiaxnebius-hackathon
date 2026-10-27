/**
 * Model catalog served through Nebius Token Factory (OpenAI-compatible API).
 * These IDs are verified against the live /models endpoint on this account.
 * Prices are ESTIMATES (USD per 1M tokens) — sync exact figures from the
 * Nebius console pricing page before quoting savings publicly. Reference
 * price simulates a mainstream closed frontier model so the cost panel can
 * show the open-infrastructure delta (clearly labeled as an estimate in UI).
 */

/** Date the per-million rates below were last checked. Quote savings with it. */
export const PRICING_AS_OF = "2026-10-25";

export interface ModelSpec {
  id: string;
  label: string;
  inputPerM: number;
  outputPerM: number;
  note?: string;
  /** reasoning models emit hidden thinking tokens before content */
  reasoning?: boolean;
}

export const MODELS: ModelSpec[] = [
  {
    id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    label: "Nemotron 3 Nano 30B (NVIDIA)",
    inputPerM: 0.05,
    outputPerM: 0.2,
    note: "NVIDIA open model — fast default referee",
    reasoning: true,
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    label: "Nemotron 3 Super 120B (NVIDIA)",
    inputPerM: 0.1,
    outputPerM: 0.4,
    note: "NVIDIA open model — stronger reasoning",
    reasoning: true,
  },
  {
    id: "moonshotai/Kimi-K2.7-Code",
    label: "Kimi K2.7 Code",
    inputPerM: 0.6,
    outputPerM: 2.5,
    note: "code-review specialist",
    reasoning: true,
  },
  {
    id: "deepseek-ai/DeepSeek-V4.1-Flash",
    label: "DeepSeek V4.1 Flash",
    inputPerM: 0.2,
    outputPerM: 0.8,
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const CLOSED_MODEL_REFERENCE: ModelSpec = {
  id: "closed-frontier-reference",
  label: "Closed frontier model (estimate)",
  inputPerM: 2.5,
  outputPerM: 10,
};

export function costUsd(
  spec: ModelSpec,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * spec.inputPerM +
    (outputTokens / 1_000_000) * spec.outputPerM
  );
}

export function modelSpec(id: string): ModelSpec {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

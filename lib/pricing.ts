/**
 * Model catalog served through Nebius Token Factory (OpenAI-compatible API).
 * Prices are approximate USD per 1M tokens — single source of truth, edit
 * here when pricing changes. Reference price simulates a mainstream closed
 * frontier model so the cost panel can show the open-infrastructure delta.
 */

export interface ModelSpec {
  id: string;
  label: string;
  inputPerM: number;
  outputPerM: number;
  note?: string;
}

export const MODELS: ModelSpec[] = [
  {
    id: "nvidia/NVIDIA-Nemotron-Nano-9B-v2",
    label: "Nemotron Nano 9B v2",
    inputPerM: 0.02,
    outputPerM: 0.05,
    note: "NVIDIA open model — reasoning tuned",
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    label: "DeepSeek V3",
    inputPerM: 0.22,
    outputPerM: 0.85,
  },
  {
    id: "Qwen/Qwen3-32B",
    label: "Qwen3 32B",
    inputPerM: 0.08,
    outputPerM: 0.3,
  },
  {
    id: "moonshotai/Kimi-K2-Instruct",
    label: "Kimi K2 Instruct",
    inputPerM: 0.6,
    outputPerM: 2.5,
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

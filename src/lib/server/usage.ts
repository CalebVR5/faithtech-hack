import "server-only";

import { ProviderError } from "@/lib/providers/types";

// Per-process spending guard for the free tier. Resets when the server
// restarts, so it is a safety net, not a replacement for a GCP budget alert.
// Defaults sit well under the monthly free allowances.

type Meter = "sttSeconds" | "translateChars" | "ttsChars";

const LIMITS: Record<Meter, number> = {
  sttSeconds: Number(process.env.USAGE_CAP_STT_SECONDS ?? 45 * 60),
  translateChars: Number(process.env.USAGE_CAP_TRANSLATE_CHARS ?? 300_000),
  ttsChars: Number(process.env.USAGE_CAP_TTS_CHARS ?? 500_000),
};

const g = globalThis as unknown as { __usage?: Record<Meter, number> };
const used = (g.__usage ??= { sttSeconds: 0, translateChars: 0, ttsChars: 0 });

/** Reserves usage before a provider call; throws if the cap would be exceeded. */
export function reserve(meter: Meter, amount: number): void {
  if (used[meter] + amount > LIMITS[meter]) {
    throw new ProviderError("The prototype's usage cap has been reached. Restart the server or raise the cap.", 429);
  }
  used[meter] += amount;
}

export function usageSnapshot() {
  return { used: { ...used }, limits: { ...LIMITS } };
}

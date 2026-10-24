// Browser-side calls to the app's own API. Every response is either data or a
// safe error with an optional code the UI translates.

import type { AssetState } from "@/lib/server/guards";
import type { StoryView } from "@/lib/server/store";
import type { Transcript } from "@/lib/domain/types";

export type { AssetState, StoryView };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin" };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Network error. Your draft is safe; please try again.", 0, "network");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "Something went wrong.", res.status, data?.code);
  return data as T;
}

export interface TranscribeResult {
  transcript: Transcript;
  durationMs: number;
  audioRef?: string;
  videoRef?: string;
  media: "audio" | "video";
}

export const api = {
  health: () => request<{ provider: string }>("GET", "/api/health"),
  listStories: () => request<{ stories: StoryView[]; expiresAfterMs?: number }>("GET", "/api/stories"),
  createStory: (body: { ageGate: string; interfaceLanguage: string }) =>
    request<{ story: StoryView }>("POST", "/api/stories", body),
  updateStory: (id: string, body: Record<string, unknown>) =>
    request<{ story: StoryView }>("PATCH", `/api/stories/${id}`, body),
  deleteStory: (id: string) => request<void>("DELETE", `/api/stories/${id}`),
  guardianCapture: (id: string, decision: string) =>
    request<{ story: StoryView }>("POST", `/api/stories/${id}/guardian`, { decision }),
  transcribe: (form: FormData) => request<TranscribeResult>("POST", "/api/transcribe", form),
  render: (body: Record<string, unknown>) => request<AssetState>("POST", "/api/render", body),
  approve: (body: { assetId: string; assetVersion: number; purpose: string; decision: string }) =>
    request<AssetState>("POST", "/api/approve", body),
  guardianAsset: (body: { assetId: string; assetVersion: number; purpose: string; decision: string }) =>
    request<AssetState>("POST", "/api/guardian-simulation", body),
  submitToInbox: (assetId: string, idempotencyKey: string) =>
    request<AssetState>("POST", "/api/mock-submissions", { assetId, idempotencyKey }),
  withdrawSubmission: (id: string) => request<void>("DELETE", `/api/mock-submissions/${id}`),
  assetState: (id: string) => request<AssetState>("GET", `/api/assets/${id}?state=1`),

  /** The only way an output leaves the app; the server checks approval first. */
  async exportAsset(assetId: string): Promise<Blob> {
    const res = await fetch("/api/export", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId }),
    }).catch(() => null);
    if (!res) throw new ApiError("Network error.", 0, "network");
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(data?.error ?? "Export failed.", res.status, data?.code);
    }
    return res.blob();
  },
};

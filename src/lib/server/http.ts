import "server-only";

import { ProviderError } from "@/lib/providers/types";
import { FfmpegError } from "./ffmpeg";

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Maps known failures to safe messages; everything else becomes a generic 500. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof ProviderError) return jsonError(err.status, err.message);
  if (err instanceof FfmpegError) {
    console.error("[ffmpeg]", err.message, err.stderr.slice(-1000));
    return jsonError(422, "We couldn't read that recording. Try recording again or upload a different file.");
  }
  console.error(err);
  return jsonError(500, "Something went wrong. Your draft is safe; please try again.");
}

/**
 * Cloud processing needs an affirmative choice before any upload (plan
 * section 6). Required even in mock mode so the UI is built correctly.
 */
export function hasCloudConsent(value: unknown): boolean {
  return value === true || value === "true";
}

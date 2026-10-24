import "server-only";

import { ProviderError } from "@/lib/providers/types";
import { FfmpegError } from "./ffmpeg";

/**
 * A failure the person can act on. The message is safe to show and never
 * contains story text; `code` lets the browser show it in the interface language.
 */
export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function jsonError(status: number, message: string, code?: string): Response {
  return Response.json({ error: message, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Maps known failures to safe messages; everything else becomes a generic 500. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof RequestError) return jsonError(err.status, err.message, err.code);
  if (err instanceof ProviderError) return jsonError(err.status, err.message, "provider-error");
  if (err instanceof FfmpegError) {
    console.error("[ffmpeg]", err.message, err.stderr.slice(-1000));
    return jsonError(422, "We couldn't process that media. Try recording again or upload a different file.", "media-error");
  }
  console.error(err);
  return jsonError(500, "Something went wrong. Your draft is safe; please try again.", "server-error");
}

/**
 * Cloud processing needs an affirmative choice before any upload (plan
 * section 6). Required even in mock mode so the UI is built correctly.
 */
export function hasCloudConsent(value: unknown): boolean {
  return value === true || value === "true";
}

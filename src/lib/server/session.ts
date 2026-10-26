import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { STORY_TTL_MS } from "@/lib/domain/limits";

const COOKIE = "sid";

/**
 * Anonymous per-browser session used for ownership checks. No account, email
 * or contact details. Call only from Route Handlers or Server Functions, which
 * are allowed to set cookies.
 */
export async function getOrCreateSessionId(request: Request): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;

  const id = randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    // Lasts only as long as a story can (STORY_TTL_MS).
    maxAge: STORY_TTL_MS / 1000,
  });
  return id;
}

/** Reads the session without creating one; for GET handlers that only serve owned data. */
export async function getSessionId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/.test(value) ? value : null;
}

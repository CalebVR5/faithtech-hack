import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./store";

// Protects the operator's demo inbox even though its data is fictional (plan
// section 7): a passcode, then an httpOnly token. Not a production login.

const COOKIE = "inbox";
const g = globalThis as unknown as { __inboxPasscode?: string };

export function inboxPasscode(): string {
  const configured = process.env.INBOX_PASSCODE?.trim();
  if (configured) return configured;
  if (!g.__inboxPasscode) {
    g.__inboxPasscode = randomBytes(4).toString("hex");
    console.log(`[inbox] Demo inbox passcode for this run: ${g.__inboxPasscode} (set INBOX_PASSCODE in .env.local to choose one)`);
  }
  return g.__inboxPasscode;
}

export function passcodeMatches(attempt: unknown): boolean {
  if (typeof attempt !== "string") return false;
  const a = Buffer.from(attempt.trim());
  const b = Buffer.from(inboxPasscode());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startInboxSession(request: Request): Promise<void> {
  const token = randomBytes(24).toString("hex");
  db.inboxTokens.add(token);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function hasInboxSession(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return Boolean(token && db.inboxTokens.has(token));
}

export async function endInboxSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.inboxTokens.delete(token);
  jar.delete(COOKIE);
}

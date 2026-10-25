import { connection } from "next/server";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { endInboxSession, hasInboxSession, inboxPasscode, passcodeMatches, startInboxSession } from "@/lib/server/inbox-auth";
import { db } from "@/lib/server/store";

// The operator's view of the demo inbox. Fictional data, held in memory,
// gone when the server restarts. Not connected to Baptize.

export async function GET() {
  await connection();
  // Make sure a generated passcode is printed to the server log on first visit.
  inboxPasscode();
  if (!(await hasInboxSession())) return jsonError(401, "Enter the inbox passcode.", "inbox-locked");
  const items = [...db.inbox.values()]
    .sort((a, b) => b.submission.createdAt - a.submission.createdAt)
    .map((e) => ({
      ...e.submission,
      kind: e.kind,
      storyType: e.storyType,
      mimeType: e.mimeType,
      assetText: e.assetText,
      language: e.language,
      machineTranslated: e.machineTranslated,
      narration: e.narration,
      guardianRequired: e.guardianRequired,
      fileUrl: e.submission.state === "pending" ? `/api/inbox/${e.submission.id}` : undefined,
    }));
  return json({ items });
}

/** Unlock with the passcode. */
export async function POST(request: Request) {
  try {
    const { passcode } = (await request.json().catch(() => null)) ?? {};
    if (!passcodeMatches(passcode)) return jsonError(401, "That passcode didn't match.", "bad-passcode");
    await startInboxSession(request);
    return json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** ?all=1 resets the inbox (end of event); otherwise just locks this browser. */
export async function DELETE(request: Request) {
  if (!(await hasInboxSession())) return jsonError(401, "Enter the inbox passcode.", "inbox-locked");
  if (new URL(request.url).searchParams.get("all") === "1") db.inbox.clear();
  else await endInboxSession();
  return new Response(null, { status: 204 });
}

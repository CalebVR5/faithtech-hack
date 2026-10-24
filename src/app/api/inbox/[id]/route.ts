import { jsonError } from "@/lib/server/http";
import { hasInboxSession } from "@/lib/server/inbox-auth";
import { db } from "@/lib/server/store";

// Serves a submitted asset to an unlocked inbox only. Withdrawn submissions
// have no file left to serve.
export async function GET(_request: Request, ctx: RouteContext<"/api/inbox/[id]">) {
  if (!(await hasInboxSession())) return jsonError(401, "Enter the inbox passcode.", "inbox-locked");
  const entry = db.inbox.get((await ctx.params).id);
  if (!entry || entry.submission.state !== "pending") return jsonError(404, "Not found.");
  return new Response(new Uint8Array(entry.file), {
    headers: {
      "Content-Type": entry.mimeType,
      "Content-Length": String(entry.file.length),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
